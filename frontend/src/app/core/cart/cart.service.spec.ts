import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TEST_PRODUCTS } from '../../shared/catalog/testing';
import { CartService } from './cart.service';

const KEY = 'pt-cart-v1';
const ID_A = '0a55a76c-3da7-4c36-86a0-9667ecfaa2c8';
const ID_B = '0ddd2319-acef-4712-99cd-935ee3a24172';

describe('CartService', () => {
  function create(): CartService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return TestBed.inject(CartService);
  }

  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => localStorage.removeItem(KEY));

  it('adds, updates and removes items, and keeps them in localStorage', () => {
    const cart = create();
    cart.add(ID_A);
    cart.add(ID_A, 2);
    cart.add(ID_B);
    expect(cart.items()).toEqual([
      { productId: ID_A, quantity: 3 },
      { productId: ID_B, quantity: 1 },
    ]);
    expect(cart.count()).toBe(4);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(cart.items());

    cart.setQuantity(ID_A, 50);
    expect(cart.quantityOf(ID_A)).toBe(20);
    cart.setQuantity(ID_B, 0);
    expect(cart.items()).toEqual([{ productId: ID_A, quantity: 20 }]);
    cart.clear();
    expect(cart.count()).toBe(0);
  });

  it('restores a saved cart and ignores tampered entries', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { productId: ID_A, quantity: 2 },
        { productId: ID_A, quantity: 5 },
        { productId: 'no-es-un-id', quantity: 1 },
        { productId: ID_B, quantity: -3 },
        { productId: ID_B, quantity: 1.5 },
        'basura',
      ]),
    );
    expect(create().items()).toEqual([{ productId: ID_A, quantity: 2 }]);
  });

  it('survives corrupted storage', () => {
    localStorage.setItem(KEY, '{no json');
    expect(create().items()).toEqual([]);
  });

  it('announces added products for the navbar notice', () => {
    const cart = create();
    cart.addProduct(TEST_PRODUCTS[0]);
    expect(cart.notice()).toEqual(
      jasmine.objectContaining({
        productName: 'Kit Desarrollo Sensorial',
        added: true,
      }),
    );
    cart.dismissNotice();
    expect(cart.notice()).toBeNull();
  });

  it('asks the API for prices instead of trusting the browser', () => {
    const cart = create();
    cart.add(ID_A, 2);
    cart.quote().subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne(
      '/api/cart/quote',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      items: [{ productId: ID_A, quantity: 2 }],
    });
  });
});
