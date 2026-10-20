import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
import { ProductsService } from '../../core/catalog/products.service';
import { CartService } from '../../core/cart/cart.service';
import { SiteSettingsService } from '../../core/settings/site-settings.service';
import { EMPTY_SETTINGS } from '../../core/settings/site-settings.models';
import {
  TEST_PRODUCTS,
  provideTestProducts,
} from '../../shared/catalog/testing';
import { ShopComponent } from './shop.component';

describe('ShopComponent', () => {
  beforeEach(() => localStorage.removeItem('pt-cart-v1'));

  function setup(providers: unknown[] = [provideTestProducts()]) {
    TestBed.configureTestingModule({
      imports: [ShopComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...(providers as never[]),
      ],
    });
    const fixture = TestBed.createComponent(ShopComponent);
    fixture.detectChanges();
    return fixture;
  }

  const text = (el: Element | null) =>
    (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

  it('renders the published products with their prices', () => {
    const element: HTMLElement = setup().nativeElement;
    const cards = element.querySelectorAll('.product-card');
    expect(cards.length).toBe(TEST_PRODUCTS.length);
    expect(text(cards[0].querySelector('h2'))).toBe('Kit Desarrollo Sensorial');
    // es-CO usa punto de miles: 120000 → $ 120.000
    expect(text(cards[0].querySelector('.product-price'))).toMatch(
      /\$\s?120\.000/,
    );
    expect(text(cards[1].querySelector('.product-price'))).toBe(
      'Precio próximamente',
    );
    expect(text(cards[2].querySelector('.badge'))).toBe('Agotado');
  });

  it('adds only products with a price and stock to the cart', () => {
    const fixture = setup();
    const element: HTMLElement = fixture.nativeElement;
    const cards = element.querySelectorAll('.product-card');
    const addButton = (card: Element) =>
      Array.from(card.querySelectorAll('button')).find((b) =>
        text(b).includes('Añadir al carrito'),
      );
    expect(addButton(cards[1])).toBeUndefined(); // sin precio
    expect(addButton(cards[2])).toBeUndefined(); // agotado

    addButton(cards[0])!.click();
    addButton(cards[0])!.click();
    fixture.detectChanges();
    expect(TestBed.inject(CartService).quantityOf('p-1')).toBe(2);
    expect(text(cards[0].querySelector('.in-cart'))).toContain(
      '2 en tu carrito',
    );
  });

  it('offers WhatsApp questions for products that cannot be bought online yet', () => {
    const fixture = setup();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('a[href^="https://wa.me/"]')).toBeNull();

    TestBed.inject(SiteSettingsService).set({
      ...EMPTY_SETTINGS,
      whatsappNumber: '573001234567',
    });
    fixture.detectChanges();
    const links = element.querySelectorAll<HTMLAnchorElement>(
      'a[href^="https://wa.me/573001234567"]',
    );
    // Solo el kit sin precio: el de precio va al carrito y el agotado no se pide.
    expect(links.length).toBe(1);
    expect(decodeURIComponent(links[0].href)).toContain(
      'Kit Motricidad y Coordinación',
    );
  });

  it('shows an empty state when there are no products', () => {
    const element: HTMLElement = setup([provideTestProducts([])])
      .nativeElement;
    expect(element.querySelector('.product-card')).toBeNull();
    expect(text(element.querySelector('.shop-message'))).toContain(
      'Estamos preparando nuevos kits',
    );
  });

  it('shows an error with a retry button when the catalog fails', () => {
    const element: HTMLElement = setup([
      {
        provide: ProductsService,
        useValue: { list: () => throwError(() => new Error('offline')) },
      },
    ]).nativeElement;
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(text(element.querySelector('[role="alert"] button'))).toBe(
      'Intentar de nuevo',
    );
  });
});
