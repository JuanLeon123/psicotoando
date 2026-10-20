import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of } from 'rxjs';
import { CartService } from '../../../core/cart/cart.service';
import { PaymentStatus, PublicOrder } from '../../../core/orders/order.models';
import { OrdersService } from '../../../core/orders/orders.service';
import {
  POLL_INTERVAL_MS,
  PaymentResultComponent,
} from './payment-result.component';

const ID = '0a55a76c-3da7-4c36-86a0-9667ecfaa2c8';

function order(status: PaymentStatus): PublicOrder {
  return {
    reference: 'PT-20261019-ABCDEFGHJK',
    status,
    fulfillment: 'unfulfilled',
    items: [
      {
        productId: ID,
        name: 'Kit Desarrollo Sensorial',
        quantity: 1,
        unitPriceCop: 120000,
        lineTotalCop: 120000,
      },
    ],
    subtotalCop: 120000,
    shippingCop: 0,
    totalCop: 120000,
    emailMasked: 'an•••@example.com',
    paymentMethod: 'CARD',
    createdAt: '2026-10-19T15:00:00.000Z',
    paidAt: null,
  };
}

describe('PaymentResultComponent', () => {
  let verify: jasmine.Spy<(id: string) => Observable<PublicOrder>>;
  let cart: CartService;

  beforeEach(() => {
    verify = jasmine.createSpy('verify');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'pago/resultado', component: PaymentResultComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrdersService, useValue: { verify } },
      ],
    });
    localStorage.removeItem('pt-cart-v1');
    cart = TestBed.inject(CartService);
    cart.add(ID, 1);
  });
  afterEach(() => localStorage.removeItem('pt-cart-v1'));

  async function open(url: string): Promise<HTMLElement> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    harness.detectChanges();
    return harness.routeNativeElement!;
  }

  const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, ' ');

  it('explains the page when there is no payment to show', async () => {
    const element = await open('/pago/resultado');
    expect(verify).not.toHaveBeenCalled();
    expect(text(element)).toContain('No encontramos un pago para mostrar');
  });

  it('thanks the customer and empties the cart when the payment is approved', async () => {
    verify.and.returnValue(of(order('approved')));
    const element = await open('/pago/resultado?id=tx-1');
    expect(verify).toHaveBeenCalledWith('tx-1');
    expect(text(element)).toContain('¡Gracias por tu compra!');
    expect(text(element)).toContain('an•••@example.com');
    expect(cart.count()).toBe(0);
  });

  it('keeps the cart when the payment is declined', async () => {
    verify.and.returnValue(of(order('declined')));
    const element = await open('/pago/resultado?id=tx-1');
    expect(text(element)).toContain('No se completó el pago');
    expect(element.querySelector('a[href="/carrito"]')).not.toBeNull();
    expect(cart.count()).toBe(1);
  });

  it('keeps checking a pending payment until it is confirmed', fakeAsync(() => {
    verify.and.returnValues(of(order('pending')), of(order('approved')));
    let element!: HTMLElement;
    void RouterTestingHarness.create().then(async (harness) => {
      await harness.navigateByUrl('/pago/resultado?id=tx-1');
      harness.detectChanges();
      element = harness.routeNativeElement!;
    });
    tick();
    expect(text(element)).toContain('Tu pago está en revisión');
    expect(cart.count()).toBe(1);

    tick(POLL_INTERVAL_MS);
    expect(verify).toHaveBeenCalledTimes(2);
    expect(cart.count()).toBe(0);
  }));
});
