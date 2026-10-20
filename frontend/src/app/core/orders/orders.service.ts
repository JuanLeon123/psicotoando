import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import {
  CheckoutRequest,
  CheckoutSession,
  OrderSummary,
  PaymentsConfig,
  PublicOrder,
} from './order.models';

const DISABLED: PaymentsConfig = { enabled: false, environment: 'sandbox' };

/** Checkout, consulta del pago y pedidos del cliente. */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private config$: Observable<PaymentsConfig> | null = null;

  /** Si la tienda cobra en línea. Se pide una vez; si falla, se asume que no. */
  paymentsConfig(): Observable<PaymentsConfig> {
    this.config$ ??= this.http.get<PaymentsConfig>('/api/payments/config').pipe(
      catchError(() => of(DISABLED)),
      shareReplay(1),
    );
    return this.config$;
  }

  checkout(body: CheckoutRequest): Observable<CheckoutSession> {
    return this.http.post<CheckoutSession>('/api/checkout', body);
  }

  verify(transactionId: string): Observable<PublicOrder> {
    return this.http.post<PublicOrder>('/api/checkout/verify', {
      transactionId,
    });
  }

  byReference(reference: string): Observable<PublicOrder> {
    return this.http.get<PublicOrder>(
      `/api/orders/${encodeURIComponent(reference)}`,
    );
  }

  myOrders(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>('/api/users/me/orders');
  }
}
