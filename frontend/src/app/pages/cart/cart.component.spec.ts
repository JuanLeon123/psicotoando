import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { CartService } from '../../core/cart/cart.service';
import { CartItem, CartQuote } from '../../core/cart/cart.models';
import { SiteSettingsService } from '../../core/settings/site-settings.service';
import { EMPTY_SETTINGS } from '../../core/settings/site-settings.models';
import { TEST_PRODUCTS } from '../../shared/catalog/testing';
import { CartComponent } from './cart.component';

const [SENSORIAL, NO_PRICE] = TEST_PRODUCTS;

function quoteFor(items: readonly CartItem[]): CartQuote {
  const lines = items.map((item) =>
    item.productId === SENSORIAL.id
      ? {
          productId: item.productId,
          product: SENSORIAL,
          requestedQuantity: item.quantity,
          quantity: Math.min(item.quantity, 3),
          maxQuantity: 3,
          unitPriceCop: 120000,
          lineTotalCop: 120000 * Math.min(item.quantity, 3),
          issue: item.quantity > 3 ? ('limited_stock' as const) : null,
        }
      : {
          productId: item.productId,
          product: NO_PRICE,
          requestedQuantity: item.quantity,
          quantity: 0,
          maxQuantity: 0,
          unitPriceCop: null,
          lineTotalCop: 0,
          issue: 'no_price' as const,
        },
  );
  const billable = lines.filter((l) => l.issue !== 'no_price');
  return {
    lines,
    itemCount: billable.reduce((s, l) => s + l.quantity, 0),
    subtotalCop: billable.reduce((s, l) => s + l.lineTotalCop, 0),
    purchasable: lines.length > 0 && billable.length === lines.length,
  };
}

describe('CartComponent', () => {
  let fixture: ComponentFixture<CartComponent>;
  let cart: CartService;
  let quote: (items: readonly CartItem[]) => Observable<CartQuote>;

  beforeEach(() => {
    localStorage.removeItem('pt-cart-v1');
    quote = (items) => of(quoteFor(items));
    TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    cart = TestBed.inject(CartService);
    spyOn(cart, 'quote').and.callFake((items = cart.items()) => quote(items));
  });

  afterEach(() => localStorage.removeItem('pt-cart-v1'));

  async function render(): Promise<HTMLElement> {
    fixture = TestBed.createComponent(CartComponent);
    fixture.detectChanges();
    await settle();
    return fixture.nativeElement;
  }

  /** Deja correr el efecto del carrito, el debounce y la respuesta. */
  async function settle(): Promise<void> {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 250));
    fixture.detectChanges();
  }

  const text = (el: Element | null) =>
    (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

  it('shows an empty state with a link to the shop', async () => {
    const element = await render();
    expect(text(element.querySelector('.cart-empty h2'))).toBe(
      'Tu carrito está vacío',
    );
    expect(
      element.querySelector('.cart-empty a')?.getAttribute('href'),
    ).toBe('/tienda');
  });

  it('shows server prices and updates them when quantities change', async () => {
    cart.add(SENSORIAL.id);
    const element = await render();
    expect(text(element.querySelector('.cart-line h2'))).toBe(
      'Kit Desarrollo Sensorial',
    );
    expect(text(element.querySelector('.cart-summary dl'))).toMatch(
      /Subtotal\s*\$\s?120\.000/,
    );

    element
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Añadir una unidad de Kit Desarrollo Sensorial"]',
      )!
      .click();
    await settle();
    expect(cart.quantityOf(SENSORIAL.id)).toBe(2);
    expect(text(element.querySelector('.cart-summary dl'))).toMatch(
      /Subtotal\s*\$\s?240\.000/,
    );
  });

  it('adopts the stock limit and explains it', async () => {
    cart.add(SENSORIAL.id, 5);
    const element = await render();
    expect(cart.quantityOf(SENSORIAL.id)).toBe(3);
    expect(text(element.querySelector('.stock-notice'))).toContain(
      'Solo quedan 3 unidades de Kit Desarrollo Sensorial',
    );
  });

  it('blocks checkout while there are lines that cannot be bought', async () => {
    cart.add(SENSORIAL.id);
    cart.add(NO_PRICE.id);
    const element = await render();
    expect(text(element.querySelector('.checkout-warning'))).toContain(
      'Quita los productos que no están disponibles',
    );
    expect(element.querySelector('.cart-line.is-blocked .line-issue')).not.toBeNull();

    element
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Eliminar Kit Motricidad y Coordinación del carrito"]',
      )!
      .click();
    await settle();
    expect(element.querySelector('.checkout-warning')).toBeNull();
  });

  it('offers a WhatsApp order with the cart summary when configured', async () => {
    TestBed.inject(SiteSettingsService).set({
      ...EMPTY_SETTINGS,
      whatsappNumber: '573001234567',
    });
    cart.add(SENSORIAL.id, 2);
    const element = await render();
    const link = element.querySelector<HTMLAnchorElement>(
      'a[href^="https://wa.me/573001234567"]',
    )!;
    const message = decodeURIComponent(link.href);
    expect(message).toContain('2 × Kit Desarrollo Sensorial');
    expect(message).toMatch(/Subtotal: \$\s?240\.000/);
  });

  it('shows an error with retry when the quote fails', async () => {
    quote = () => throwError(() => new Error('offline'));
    cart.add(SENSORIAL.id);
    const element = await render();
    expect(element.querySelector('[role="alert"]')).not.toBeNull();

    quote = (items) => of(quoteFor(items));
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('.cart-line')).not.toBeNull();
  });
});
