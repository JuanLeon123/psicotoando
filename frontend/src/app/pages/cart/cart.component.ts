import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, debounceTime, map, switchMap, tap } from 'rxjs';
import { CartService } from '../../core/cart/cart.service';
import {
  CartItem,
  CartLineIssue,
  CartQuote,
  CartQuoteLine,
} from '../../core/cart/cart.models';
import { formatCop } from '../../core/catalog/format-price';
import { SiteSettingsService } from '../../core/settings/site-settings.service';
import {
  shippingFor,
  whatsappUrl,
} from '../../core/settings/site-settings.models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { OrdersService } from '../../core/orders/orders.service';

type QuoteState = 'loading' | 'ready' | 'error';

const ISSUE_MESSAGES: Record<CartLineIssue, string> = {
  unavailable: 'Este producto ya no está disponible.',
  no_price: 'Este producto aún no tiene precio, así que no se puede comprar.',
  out_of_stock: 'Este producto está agotado.',
  limited_stock: 'Ajustamos la cantidad a las unidades disponibles.',
};

/** Carrito: cantidades en el navegador, precios y disponibilidad desde el backend. */
@Component({
  selector: 'app-cart',
  imports: [RouterLink, IconComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  protected readonly cart = inject(CartService);
  private readonly settings = inject(SiteSettingsService).settings;
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<QuoteState>('loading');
  protected readonly quote = signal<CartQuote | null>(null);
  /** Productos cuya cantidad se recortó por inventario; el aviso queda visible. */
  protected readonly stockAdjustments = signal<
    readonly { name: string; quantity: number }[]
  >([]);
  protected readonly formatCop = formatCop;
  protected readonly issueMessages = ISSUE_MESSAGES;
  /** El pago en línea está activo cuando el backend tiene las llaves de Wompi. */
  protected readonly paymentsEnabled = toSignal(
    inject(OrdersService)
      .paymentsConfig()
      .pipe(map((config) => config.enabled)),
    { initialValue: false },
  );
  /** Envío según los ajustes del panel (mismo cálculo que hace el backend). */
  protected readonly shippingCop = computed(() => {
    const quote = this.quote();
    return quote ? shippingFor(this.settings(), quote.subtotalCop) : 0;
  });

  protected readonly orderUrl = computed(() => {
    const number = this.settings().whatsappNumber;
    const quote = this.quote();
    return number && quote?.purchasable
      ? whatsappUrl(number, orderMessage(quote))
      : null;
  });

  constructor() {
    // Recalcula cada vez que cambian las cantidades (también desde otra pestaña).
    toObservable(this.cart.items)
      .pipe(
        tap(() => {
          if (!this.quote()) this.state.set('loading');
        }),
        debounceTime(200),
        switchMap((items) => this.requestQuote(items)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected retry(): void {
    this.state.set('loading');
    this.requestQuote(this.cart.items()).subscribe();
  }

  protected decrease(line: CartQuoteLine): void {
    this.cart.setQuantity(line.productId, this.cart.quantityOf(line.productId) - 1);
  }

  protected increase(line: CartQuoteLine): void {
    this.cart.setQuantity(line.productId, this.cart.quantityOf(line.productId) + 1);
  }

  protected remove(line: CartQuoteLine): void {
    this.cart.remove(line.productId);
  }

  protected isBlocked(line: CartQuoteLine): boolean {
    return line.issue !== null && line.issue !== 'limited_stock';
  }

  private requestQuote(items: readonly CartItem[]) {
    return this.cart.quote(items).pipe(
      tap((quote) => {
        this.quote.set(quote);
        this.state.set('ready');
        this.applyStockLimits(quote);
      }),
      // Un fallo no corta la escucha de cambios; «Intentar de nuevo» vuelve a pedirlo.
      catchError(() => {
        this.state.set('error');
        return EMPTY;
      }),
    );
  }

  /** Si el servidor recortó una cantidad por inventario, el carrito la adopta. */
  private applyStockLimits(quote: CartQuote): void {
    const limited = quote.lines.filter((l) => l.issue === 'limited_stock');
    if (!limited.length) return;
    this.stockAdjustments.set(
      limited.map((l) => ({
        name: l.product?.name ?? 'Producto',
        quantity: l.quantity,
      })),
    );
    for (const line of limited) {
      this.cart.setQuantity(line.productId, line.quantity);
    }
  }
}

/** Resumen del pedido para enviarlo por WhatsApp mientras no hay pago en línea. */
function orderMessage(quote: CartQuote): string {
  const lines = quote.lines
    .filter((line) => line.product)
    .map(
      (line) =>
        `• ${line.quantity} × ${line.product!.name} (${formatCop(line.lineTotalCop)})`,
    );
  return [
    'Hola, quiero hacer este pedido:',
    ...lines,
    `Subtotal: ${formatCop(quote.subtotalCop)}`,
    '¿Me ayudan con el pago y el envío?',
  ].join('\n');
}
