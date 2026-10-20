import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminProduct, ProductInput } from '../catalog/product.models';
import { SiteSettings } from '../settings/site-settings.models';
import { AdminSummary } from './admin.models';
import {
  AdminOrderDetail,
  AdminOrderFilters,
  AdminOrderPage,
  FulfillmentStatus,
} from '../orders/order.models';

/** Llamadas del panel de administración. Todas requieren la sesión del administrador. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  summary(): Observable<AdminSummary> {
    return this.http.get<AdminSummary>('/api/admin/summary');
  }

  products(): Observable<AdminProduct[]> {
    return this.http.get<AdminProduct[]>('/api/admin/products');
  }

  product(id: string): Observable<AdminProduct> {
    return this.http.get<AdminProduct>(`/api/admin/products/${id}`);
  }

  createProduct(body: ProductInput): Observable<AdminProduct> {
    return this.http.post<AdminProduct>('/api/admin/products', body);
  }

  updateProduct(
    id: string,
    body: Partial<ProductInput>,
  ): Observable<AdminProduct> {
    return this.http.patch<AdminProduct>(`/api/admin/products/${id}`, body);
  }

  /** JPG, PNG o WebP de hasta 5 MB; reemplaza la imagen anterior. */
  uploadProductImage(id: string, file: File): Observable<AdminProduct> {
    const body = new FormData();
    body.append('image', file);
    return this.http.post<AdminProduct>(
      `/api/admin/products/${id}/image`,
      body,
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/products/${id}`);
  }

  updateSettings(body: Partial<SiteSettings>): Observable<SiteSettings> {
    return this.http.put<SiteSettings>('/api/admin/settings', body);
  }

  orders(filters: AdminOrderFilters = {}): Observable<AdminOrderPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<AdminOrderPage>('/api/admin/orders', { params });
  }

  order(id: string): Observable<AdminOrderDetail> {
    return this.http.get<AdminOrderDetail>(`/api/admin/orders/${id}`);
  }

  updateFulfillment(
    id: string,
    fulfillment: FulfillmentStatus,
  ): Observable<AdminOrderDetail> {
    return this.http.patch<AdminOrderDetail>(`/api/admin/orders/${id}`, {
      fulfillment,
    });
  }
}
