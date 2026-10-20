import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { CartService } from '../../../core/cart/cart.service';
import { formatCop } from '../../../core/catalog/format-price';
import {
  PublicOrder,
  paymentMethodLabel,
} from '../../../core/orders/order.models';
import { OrdersService } from '../../../core/orders/orders.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

/** Cada cuánto se vuelve a consultar un pago pendiente, y cuántas veces. */
export const POLL_INTERVAL_MS = 4000;
export const MAX_POLLS = 15;

type ResultState =
  | { readonly kind: 'missing' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'error' }
  | { readonly kind: 'order'; readonly order: PublicOrder };

/** Página a la que Wompi devuelve al cliente: `?id=<transacción>`. */
@Component({
  selector: 'app-payment-result',
  imports: [RouterLink, IconComponent],
  templateUrl: './payment-result.component.html',
  styleUrl: './payment-result.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentResultComponent {
  private readonly orders = inject(OrdersService);
  private readonly cart = inject(CartService);
  private readonly transactionId =
    inject(ActivatedRoute).snapshot.queryParamMap.get('id');
  private polls = 0;
  private pollTimer: Subscription | null = null;

  protected readonly state = signal<ResultState>(
    this.transactionId ? { kind: 'loading' } : { kind: 'missing' },
  );
  /** Ya no se consulta solo: el cliente puede actualizar a mano. */
  protected readonly stoppedPolling = signal(false);
  protected readonly order = computed(() => {
    const state = this.state();
    return state.kind === 'order' ? state.order : null;
  });
  protected readonly formatCop = formatCop;
  protected readonly paymentMethodLabel = paymentMethodLabel;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.pollTimer?.unsubscribe());
    if (this.transactionId) this.check();
  }

  protected refresh(): void {
    this.polls = 0;
    this.stoppedPolling.set(false);
    this.check();
  }

  private check(): void {
    this.orders.verify(this.transactionId!).subscribe({
      next: (order) => {
        this.state.set({ kind: 'order', order });
        if (order.status === 'approved') this.cart.clear();
        if (order.status === 'pending') this.schedulePoll();
      },
      error: () => {
        // Si ya mostrábamos el pedido, un fallo puntual no lo oculta.
        if (this.state().kind !== 'order') this.state.set({ kind: 'error' });
        else this.schedulePoll();
      },
    });
  }

  private schedulePoll(): void {
    if (this.polls >= MAX_POLLS) {
      this.stoppedPolling.set(true);
      return;
    }
    this.polls++;
    this.pollTimer?.unsubscribe();
    this.pollTimer = timer(POLL_INTERVAL_MS).subscribe(() => this.check());
  }
}
