import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { formatCop } from '../../../../core/catalog/format-price';
import {
  FULFILLMENT_LABELS,
  OrderSummary,
  PAYMENT_STATUS_LABELS,
} from '../../../../core/orders/order.models';
import { OrdersService } from '../../../../core/orders/orders.service';
import { formatDate } from '../../../../core/orders/format-date';

type MyOrdersState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error' }
  | { readonly kind: 'ready'; readonly orders: readonly OrderSummary[] };

/** «Mis pedidos» en Mi cuenta: los pedidos hechos con la sesión iniciada. */
@Component({
  selector: 'app-my-orders',
  imports: [RouterLink],
  templateUrl: './my-orders.component.html',
  styleUrls: ['../account-card.scss', './my-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyOrdersComponent {
  protected readonly state = toSignal(
    inject(OrdersService)
      .myOrders()
      .pipe(
        map((orders): MyOrdersState => ({ kind: 'ready', orders })),
        catchError(() => of<MyOrdersState>({ kind: 'error' })),
      ),
    { initialValue: { kind: 'loading' } as MyOrdersState },
  );
  protected readonly formatCop = formatCop;
  protected readonly formatDate = formatDate;
  protected readonly paymentLabels = PAYMENT_STATUS_LABELS;
  protected readonly fulfillmentLabels = FULFILLMENT_LABELS;

  /** Para un pedido pagado interesa el envío; si no, el estado del pago. */
  protected statusLabel(order: OrderSummary): string {
    return order.status === 'approved'
      ? this.fulfillmentLabels[order.fulfillment]
      : this.paymentLabels[order.status];
  }
}
