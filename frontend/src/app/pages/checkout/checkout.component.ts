import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { describeApiError } from '../../core/auth/api-error';
import { CartQuote } from '../../core/cart/cart.models';
import { CartService } from '../../core/cart/cart.service';
import { formatCop } from '../../core/catalog/format-price';
import { COLOMBIAN_DEPARTMENTS } from '../../core/orders/order.models';
import { OrdersService } from '../../core/orders/orders.service';
import { WompiRedirectService } from '../../core/orders/wompi-redirect.service';
import { SiteSettingsService } from '../../core/settings/site-settings.service';
import { shippingFor } from '../../core/settings/site-settings.models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  controlErrorMessage,
  focusFirstInvalid,
} from '../../shared/forms/form-errors';
import { emailValidator } from '../../shared/forms/validators';
import {
  colombianPhoneValidator,
  documentValidator,
  phoneDigits,
} from './checkout.validators';

const PAYMENTS_DISABLED =
  'El pago en línea aún no está disponible. Escríbenos y te ayudamos con tu pedido.';
const CART_CHANGED =
  'Tu carrito cambió mientras pagabas. Revisa el resumen actualizado y vuelve a intentarlo.';

type FieldName =
  | 'fullName'
  | 'email'
  | 'phone'
  | 'document'
  | 'department'
  | 'city'
  | 'address'
  | 'notes';

/** Datos de contacto y envío; al enviar, crea el pedido y lleva a Wompi. */
@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private readonly cart = inject(CartService);
  private readonly orders = inject(OrdersService);
  private readonly redirect = inject(WompiRedirectService);
  private readonly settings = inject(SiteSettingsService).settings;
  private readonly destroyRef = inject(DestroyRef);

  protected readonly departments = COLOMBIAN_DEPARTMENTS;
  protected readonly formatCop = formatCop;
  protected readonly quote = signal<CartQuote | null>(null);
  protected readonly quoteError = signal(false);
  protected readonly submitted = signal(false);
  protected readonly pending = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly paymentsEnabled = toSignal(
    this.orders.paymentsConfig().pipe(map((c) => c.enabled)),
  );

  protected readonly shippingCop = computed(() => {
    const quote = this.quote();
    return quote ? shippingFor(this.settings(), quote.subtotalCop) : 0;
  });
  protected readonly totalCop = computed(
    () => (this.quote()?.subtotalCop ?? 0) + this.shippingCop(),
  );
  protected readonly canPay = computed(
    () =>
      this.paymentsEnabled() === true &&
      !!this.quote()?.purchasable &&
      !this.pending(),
  );

  protected readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, emailValidator, Validators.maxLength(254)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, colombianPhoneValidator],
    }),
    document: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, documentValidator],
    }),
    department: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    }),
    address: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(200)],
    }),
    notes: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
  });

  constructor() {
    if (this.cart.items().length === 0) {
      void inject(Router).navigateByUrl('/carrito', { replaceUrl: true });
      return;
    }
    const user = inject(AuthService).user();
    if (user) {
      this.form.patchValue({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? '',
      });
    }
    this.loadQuote();
  }

  protected loadQuote(): void {
    this.quoteError.set(false);
    this.cart
      .quote()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (quote) => this.quote.set(quote),
        error: () => this.quoteError.set(true),
      });
  }

  protected errorFor(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !(control.touched || this.submitted())) return null;
    if (control.errors?.['required'] && name === 'department') {
      return 'Elige un departamento.';
    }
    if (control.errors?.['colombianPhone']) {
      return 'Escribe un celular colombiano de 10 dígitos, por ejemplo 300 123 4567.';
    }
    if (control.errors?.['document']) {
      return 'La cédula debe tener entre 5 y 15 dígitos.';
    }
    return controlErrorMessage(control);
  }

  protected describedBy(name: FieldName, hint?: string): string | null {
    const ids = [hint, this.errorFor(name) ? `checkout-${name}-error` : null];
    return ids.filter(Boolean).join(' ') || null;
  }

  protected submit(): void {
    if (this.pending()) return;
    this.submitted.set(true);
    this.serverError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.form, 'checkout');
      return;
    }
    if (!this.canPay()) return;
    const value = this.form.getRawValue();
    this.pending.set(true);
    this.orders
      .checkout({
        items: this.cart.items(),
        customer: {
          fullName: value.fullName.trim(),
          email: value.email.trim(),
          phone: phoneDigits(value.phone),
          document: value.document.replace(/[\s.-]/g, ''),
        },
        shipping: {
          department: value.department,
          city: value.city.trim(),
          address: value.address.trim(),
          notes: value.notes.trim() || null,
        },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Se queda en «pending» mientras el navegador sale hacia Wompi.
        next: (session) => this.redirect.go(session),
        error: (error: unknown) => {
          this.pending.set(false);
          this.serverError.set(this.describe(error));
        },
      });
  }

  private describe(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        const quote = (error.error as { quote?: CartQuote } | null)?.quote;
        if (quote) this.applyChangedQuote(quote);
        return CART_CHANGED;
      }
      if (error.status === 503) return PAYMENTS_DISABLED;
    }
    return describeApiError(error);
  }

  /** Adopta las cantidades disponibles y quita lo que ya no se puede comprar. */
  private applyChangedQuote(quote: CartQuote): void {
    for (const line of quote.lines) {
      if (line.issue === 'limited_stock') {
        this.cart.setQuantity(line.productId, line.quantity);
      } else if (line.issue) {
        this.cart.remove(line.productId);
      }
    }
    this.loadQuote();
  }
}
