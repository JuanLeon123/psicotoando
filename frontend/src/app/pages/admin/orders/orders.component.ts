import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/admin/admin-api.service';
import { formatCop } from '../../../core/catalog/format-price';
import { formatDateTime } from '../../../core/orders/format-date';
import {
  FULFILLMENT_LABELS,
  FulfillmentStatus,
  OrderSummary,
  PAYMENT_STATUS_LABELS,
  PaymentStatus,
} from '../../../core/orders/order.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-admin-orders',
  imports: [RouterLink, IconComponent],
  templateUrl: './orders.component.html',
  styleUrls: [
    '../_admin-shared.scss',
    './_orders-shared.scss',
    './orders.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent {
  private readonly api = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly orders = signal<readonly OrderSummary[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly status = signal<PaymentStatus | ''>('');
  protected readonly fulfillment = signal<FulfillmentStatus | ''>('');
  protected readonly query = signal('');
  protected readonly pages = computed(() =>
    Math.max(1, Math.ceil(this.total() / PAGE_SIZE)),
  );
  protected readonly filtering = computed(
    () => !!(this.status() || this.fulfillment() || this.query().trim()),
  );

  protected readonly paymentLabels = PAYMENT_STATUS_LABELS;
  protected readonly fulfillmentLabels = FULFILLMENT_LABELS;
  protected readonly paymentOptions = Object.entries(PAYMENT_STATUS_LABELS);
  protected readonly fulfillmentOptions = Object.entries(FULFILLMENT_LABELS);
  protected readonly formatCop = formatCop;
  protected readonly formatDateTime = formatDateTime;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.searchTimer) clearTimeout(this.searchTimer);
    });
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api
      .orders({
        status: this.status(),
        fulfillment: this.fulfillment(),
        q: this.query().trim(),
        page: this.page(),
        pageSize: PAGE_SIZE,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.orders.set(page.items);
          this.total.set(page.total);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected setStatus(value: string): void {
    this.status.set(value as PaymentStatus | '');
    this.page.set(1);
    this.load();
  }

  protected setFulfillment(value: string): void {
    this.fulfillment.set(value as FulfillmentStatus | '');
    this.page.set(1);
    this.load();
  }

  protected search(value: string): void {
    this.query.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, SEARCH_DEBOUNCE_MS);
  }

  protected goTo(page: number): void {
    this.page.set(Math.min(Math.max(page, 1), this.pages()));
    this.load();
  }
}
