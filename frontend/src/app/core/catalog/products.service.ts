import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PublicProduct } from './product.models';

/** Catálogo público: los mismos productos que se gestionan en el panel. */
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  list(): Observable<PublicProduct[]> {
    return this.http.get<PublicProduct[]>('/api/products');
  }

  bySlug(slug: string): Observable<PublicProduct> {
    return this.http.get<PublicProduct>(
      `/api/products/${encodeURIComponent(slug)}`,
    );
  }
}
