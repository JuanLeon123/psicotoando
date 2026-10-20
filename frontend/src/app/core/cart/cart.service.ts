import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { PublicProduct } from '../catalog/product.models';
import {
  CartItem,
  CartQuote,
  MAX_CART_LINES,
  MAX_LINE_QUANTITY,
} from './cart.models';

const STORAGE_KEY = 'pt-cart-v1';

/** Último producto añadido, para el aviso del navbar. `id` cambia en cada añadido. */
export interface CartNotice {
  readonly id: number;
  readonly productName: string;
  readonly added: boolean;
}

/**
 * Carrito del visitante. Vive en el navegador (también sin sesión) y se
 * sincroniza entre pestañas; los precios siempre los calcula el backend.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly current = signal<readonly CartItem[]>(readStorage());
  private readonly lastNotice = signal<CartNotice | null>(null);

  readonly items = this.current.asReadonly();
  readonly notice = this.lastNotice.asReadonly();
  /** Unidades totales, para el contador del navbar. */
  readonly count = computed(() =>
    this.current().reduce((sum, item) => sum + item.quantity, 0),
  );

  constructor() {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) this.current.set(readStorage());
    };
    globalThis.addEventListener?.('storage', onStorage);
    inject(DestroyRef).onDestroy(() =>
      globalThis.removeEventListener?.('storage', onStorage),
    );
  }

  quantityOf(productId: string): number {
    return this.current().find((i) => i.productId === productId)?.quantity ?? 0;
  }

  /** Añade una unidad desde la tienda o la portada y avisa en el navbar. */
  addProduct(product: PublicProduct): boolean {
    const added = this.add(product.id);
    this.lastNotice.set({
      id: (this.lastNotice()?.id ?? 0) + 1,
      productName: product.name,
      added,
    });
    return added;
  }

  dismissNotice(): void {
    this.lastNotice.set(null);
  }

  /** Suma unidades; devuelve false si el carrito ya no admite más productos distintos. */
  add(productId: string, quantity = 1): boolean {
    const items = this.current();
    const existing = items.find((i) => i.productId === productId);
    if (!existing && items.length >= MAX_CART_LINES) return false;
    this.setQuantity(productId, (existing?.quantity ?? 0) + quantity);
    return true;
  }

  /** Cantidad exacta (se limita a 1–20); 0 o menos quita el producto. */
  setQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    const capped = Math.min(Math.floor(quantity), MAX_LINE_QUANTITY);
    const items = this.current();
    const next = items.some((i) => i.productId === productId)
      ? items.map((i) =>
          i.productId === productId ? { productId, quantity: capped } : i,
        )
      : [...items, { productId, quantity: capped }];
    this.save(next);
  }

  remove(productId: string): void {
    this.save(this.current().filter((i) => i.productId !== productId));
  }

  clear(): void {
    this.save([]);
  }

  /** Precios, subtotal e incidencias calculados en el servidor. */
  quote(items: readonly CartItem[] = this.current()): Observable<CartQuote> {
    return this.http.post<CartQuote>('/api/cart/quote', { items });
  }

  private save(items: readonly CartItem[]): void {
    this.current.set(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Navegación privada o almacenamiento bloqueado: el carrito dura la visita.
    }
  }
}

/** Lee el carrito guardado y descarta cualquier dato corrupto o manipulado. */
function readStorage(): readonly CartItem[] {
  let raw: unknown;
  try {
    raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: CartItem[] = [];
  for (const entry of raw as unknown[]) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { productId, quantity } = entry as Record<string, unknown>;
    if (
      typeof productId !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(productId) ||
      seen.has(productId) ||
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      continue;
    }
    seen.add(productId);
    items.push({ productId, quantity: Math.min(quantity, MAX_LINE_QUANTITY) });
    if (items.length === MAX_CART_LINES) break;
  }
  return items;
}
