import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../../../core/admin/admin-api.service';
import { describeApiError } from '../../../../core/auth/api-error';
import { formatCop } from '../../../../core/catalog/format-price';
import { formatDateTime } from '../../../../core/orders/format-date';
import {
  AdminOrderDetail,
  FULFILLMENT_LABELS,
  FulfillmentStatus,
  PAYMENT_STATUS_LABELS,
  paymentMethodLabel,
} from '../../../../core/orders/order.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-order-detail',
  imports: [RouterLink, IconComponent],
  templateUrl: './order-detail.component.html',
  styleUrls: [
    '../../_admin-shared.scss',
    '../_orders-shared.scss',
    './order-detail.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailComponent {
  private readonly api = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  protected readonly order = signal<AdminOrderDetail | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly fulfillment = signal<FulfillmentStatus>('unfulfilled');
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);

  protected readonly paymentLabels = PAYMENT_STATUS_LABELS;
  protected readonly fulfillmentLabels = FULFILLMENT_LABELS;
  protected readonly fulfillmentOptions = Object.entries(FULFILLMENT_LABELS) as [
    FulfillmentStatus,
    string,
  ][];
  protected readonly formatCop = formatCop;
  protected readonly formatDateTime = formatDateTime;
  protected readonly paymentMethodLabel = paymentMethodLabel;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loadError.set(null);
    this.api
      .order(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => this.show(order),
        error: (error: unknown) =>
          this.loadError.set(
            describeApiError(error, 'No pudimos cargar el pedido.'),
          ),
      });
  }

  /** Enlace al detalle de la transacción en el panel de comercios de Wompi. */
  protected wompiUrl(transactionId: string): string {
    return `https://comercios.wompi.co/transactions/${encodeURIComponent(transactionId)}`;
  }

  protected saveFulfillment(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.message.set(null);
    this.saveError.set(null);
    this.api
      .updateFulfillment(this.id, this.fulfillment())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.saving.set(false);
          this.show(order);
          this.message.set(
            `Envío actualizado: ${this.fulfillmentLabels[order.fulfillment]}.`,
          );
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.saveError.set(describeApiError(error));
        },
      });
  }

  private show(order: AdminOrderDetail): void {
    this.order.set(order);
    this.fulfillment.set(order.fulfillment);
  }
}
