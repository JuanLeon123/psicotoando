import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AdminApiService } from '../../../core/admin/admin-api.service';
import {
  AdminOrderFilters,
  AdminOrderPage,
  OrderSummary,
} from '../../../core/orders/order.models';
import { OrdersComponent } from './orders.component';

const ORDERS: OrderSummary[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    reference: 'PT-20261019-ABCDEFGHJK',
    status: 'approved',
    fulfillment: 'unfulfilled',
    customerName: 'Ana Pérez',
    customerEmail: 'ana@example.com',
    itemCount: 2,
    totalCop: 252000,
    createdAt: '2026-10-19T15:00:00.000Z',
    paidAt: '2026-10-19T15:02:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    reference: 'PT-20261019-MNPQRSTUVW',
    status: 'pending',
    fulfillment: 'unfulfilled',
    customerName: 'Luis Gómez',
    customerEmail: 'luis@example.com',
    itemCount: 1,
    totalCop: 132000,
    createdAt: '2026-10-19T16:00:00.000Z',
    paidAt: null,
  },
];

describe('OrdersComponent (admin)', () => {
  let fixture: ComponentFixture<OrdersComponent>;
  let element: HTMLElement;
  let orders: jasmine.Spy<(filters?: AdminOrderFilters) => Observable<AdminOrderPage>>;

  function setup(items: OrderSummary[] = ORDERS) {
    orders = jasmine
      .createSpy('orders')
      .and.returnValue(of({ items, total: items.length, page: 1, pageSize: 20 }));
    TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: { orders } }],
    });
    fixture = TestBed.createComponent(OrdersComponent);
    element = fixture.nativeElement;
    fixture.detectChanges();
  }

  const rows = () => Array.from(element.querySelectorAll('tbody tr'));
  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();

  it('lists orders with payment and shipping status', () => {
    setup();
    expect(rows().length).toBe(2);
    expect(text(rows()[0])).toContain('PT-20261019-ABCDEFGHJK');
    expect(text(rows()[0])).toContain('Pagado');
    expect(text(rows()[0])).toContain('Sin preparar');
    expect(text(rows()[0])).toMatch(/\$\s?252\.000/);
    expect(text(rows()[1])).toContain('Pago pendiente');
    expect(rows()[0].querySelector('a')!.getAttribute('href')).toBe(
      '/admin/pedidos/11111111-1111-4111-8111-111111111111',
    );
  });

  it('reloads from the first page when a filter changes', () => {
    setup();
    const select = element.querySelector<HTMLSelectElement>('.filter select')!;
    select.value = 'approved';
    select.dispatchEvent(new Event('change'));
    expect(orders).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'approved', page: 1 }),
    );
  });

  it('shows an empty state before the first sale', () => {
    setup([]);
    expect(text(element.querySelector('.state')!)).toContain('Aún no hay pedidos');
  });
});
