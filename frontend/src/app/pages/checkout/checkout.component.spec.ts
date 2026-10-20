import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { CartQuote } from '../../core/cart/cart.models';
import { CartService } from '../../core/cart/cart.service';
import {
  CheckoutRequest,
  CheckoutSession,
  PaymentsConfig,
} from '../../core/orders/order.models';
import { OrdersService } from '../../core/orders/orders.service';
import { WompiRedirectService } from '../../core/orders/wompi-redirect.service';
import { SiteSettingsService } from '../../core/settings/site-settings.service';
import { EMPTY_SETTINGS } from '../../core/settings/site-settings.models';
import { TEST_PRODUCTS } from '../../shared/catalog/testing';
import { CheckoutComponent } from './checkout.component';

const PRODUCT_ID = '0a55a76c-3da7-4c36-86a0-9667ecfaa2c8';
const QUOTE: CartQuote = {
  lines: [
    {
      productId: PRODUCT_ID,
      product: { ...TEST_PRODUCTS[0], id: PRODUCT_ID },
      requestedQuantity: 2,
      quantity: 2,
      maxQuantity: 20,
      unitPriceCop: 120000,
      lineTotalCop: 240000,
      issue: null,
    },
  ],
  itemCount: 2,
  subtotalCop: 240000,
  purchasable: true,
};
const SESSION: CheckoutSession = {
  reference: 'PT-20261019-ABCDEFGHJK',
  checkoutUrl: 'https://checkout.wompi.co/p/',
  fields: { reference: 'PT-20261019-ABCDEFGHJK', 'amount-in-cents': '25200000' },
};

describe('CheckoutComponent', () => {
  let fixture: ComponentFixture<CheckoutComponent>;
  let element: HTMLElement;
  let cart: CartService;
  let checkout: jasmine.Spy<(body: CheckoutRequest) => Observable<CheckoutSession>>;
  let redirect: jasmine.Spy<(session: CheckoutSession) => void>;
  let config: PaymentsConfig;

  function setup(items = [{ productId: PRODUCT_ID, quantity: 2 }]) {
    localStorage.setItem('pt-cart-v1', JSON.stringify(items));
    checkout = jasmine.createSpy('checkout').and.returnValue(of(SESSION));
    redirect = jasmine.createSpy('go');
    TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: OrdersService,
          useValue: { paymentsConfig: () => of(config), checkout },
        },
        { provide: WompiRedirectService, useValue: { go: redirect } },
      ],
    });
    cart = TestBed.inject(CartService);
    spyOn(cart, 'quote').and.returnValue(of(QUOTE));
    TestBed.inject(SiteSettingsService).set({
      ...EMPTY_SETTINGS,
      shippingFlatCop: 12000,
      freeShippingFromCop: 300000,
    });
    fixture = TestBed.createComponent(CheckoutComponent);
    element = fixture.nativeElement;
    fixture.detectChanges();
  }

  beforeEach(() => {
    config = { enabled: true, environment: 'sandbox' };
  });
  afterEach(() => localStorage.removeItem('pt-cart-v1'));

  const text = (selector: string) =>
    (element.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();

  function fill(values: Partial<Record<string, string>> = {}) {
    const data: Record<string, string> = {
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      phone: '+57 300 123 4567',
      document: '1.020.304.050',
      department: 'Antioquia',
      city: 'Medellín',
      address: 'Calle 10 # 43-20',
      ...values,
    };
    for (const [name, value] of Object.entries(data)) {
      const field = element.querySelector<HTMLInputElement | HTMLSelectElement>(
        `#checkout-${name}`,
      )!;
      field.value = value;
      field.dispatchEvent(new Event(field.tagName === 'SELECT' ? 'change' : 'input'));
    }
    fixture.detectChanges();
  }

  const pay = () => {
    element.querySelector<HTMLButtonElement>('.pay-button')!.click();
    fixture.detectChanges();
  };

  it('sends people with an empty cart back to the cart', () => {
    TestBed.configureTestingModule({});
    const navigate = spyOn(Router.prototype, 'navigateByUrl').and.resolveTo(true);
    setup([]);
    expect(navigate).toHaveBeenCalledWith('/carrito', { replaceUrl: true });
  });

  it('shows the order with shipping from the site settings', () => {
    setup();
    expect(text('.summary-lines')).toContain('2 × Kit Desarrollo Sensorial');
    expect(text('.summary-totals')).toMatch(/Envío\s*\$\s?12\.000/);
    expect(text('.summary-total')).toMatch(/Total\s*\$\s?252\.000/);
  });

  it('validates the form in Spanish before creating the order', () => {
    setup();
    fill({ phone: '12345', document: 'abc' });
    pay();
    expect(checkout).not.toHaveBeenCalled();
    expect(text('#checkout-phone-error')).toBe(
      'Escribe un celular colombiano de 10 dígitos, por ejemplo 300 123 4567.',
    );
    expect(text('#checkout-document-error')).toBe(
      'La cédula debe tener entre 5 y 15 dígitos.',
    );
    expect(document.activeElement?.id).toBe('checkout-phone');
  });

  it('creates the order with clean data and sends the customer to Wompi', () => {
    setup();
    fill();
    pay();
    expect(checkout).toHaveBeenCalledOnceWith({
      items: [{ productId: PRODUCT_ID, quantity: 2 }],
      customer: {
        fullName: 'Ana Pérez',
        email: 'ana@example.com',
        phone: '3001234567',
        document: '1020304050',
      },
      shipping: {
        department: 'Antioquia',
        city: 'Medellín',
        address: 'Calle 10 # 43-20',
        notes: null,
      },
    });
    expect(redirect).toHaveBeenCalledOnceWith(SESSION);
    expect(text('.pay-button')).toBe('Llevándote a Wompi…');
  });

  it('updates the cart when it changed while paying', () => {
    setup();
    checkout.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              quote: {
                ...QUOTE,
                lines: [{ ...QUOTE.lines[0], quantity: 1, issue: 'limited_stock' }],
              },
            },
          }),
      ),
    );
    fill();
    pay();
    expect(redirect).not.toHaveBeenCalled();
    expect(cart.quantityOf(PRODUCT_ID)).toBe(1);
    expect(text('.form-alert--error')).toContain('Tu carrito cambió');
  });

  it('explains when online payments are not available', () => {
    config = { enabled: false, environment: 'sandbox' };
    setup();
    expect(element.querySelector<HTMLButtonElement>('.pay-button')!.disabled).toBeTrue();
    expect(text('.checkout-summary')).toContain(
      'El pago en línea aún no está disponible',
    );
  });
});
