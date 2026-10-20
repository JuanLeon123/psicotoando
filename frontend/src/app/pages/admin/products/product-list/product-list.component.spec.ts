import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminProduct } from '../../../../core/catalog/product.models';
import { ProductListComponent } from './product-list.component';

function product(overrides: Partial<AdminProduct>): AdminProduct {
  return {
    id: 'p1',
    slug: 'kit',
    name: 'Kit',
    summary: 'Resumen del kit para la tienda.',
    contents: [],
    activities: null,
    priceCop: null,
    inStock: true,
    imageUrl: null,
    imageAlt: '',
    stock: null,
    published: true,
    sortOrder: 1,
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-19T10:00:00.000Z',
    ...overrides,
  };
}

const PRODUCTS = [
  product({ id: 'p1', name: 'Kit Desarrollo Sensorial', priceCop: 120000, stock: 4 }),
  product({ id: 'p2', name: 'Kit Motricidad', published: false }),
];

describe('ProductListComponent', () => {
  let fixture: ComponentFixture<ProductListComponent>;
  let element: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductListComponent);
    element = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/admin/products').flush(PRODUCTS);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const rows = () => Array.from(element.querySelectorAll('tr.product-row'));

  it('lists every product with price, stock and state', () => {
    expect(rows().length).toBe(2);
    const [first, second] = rows().map((row) => row.textContent!.replace(/\s+/g, ' '));
    expect(first).toContain('Kit Desarrollo Sensorial');
    expect(first).toMatch(/120\.000/);
    expect(first).toContain('4 unidades');
    expect(first).toContain('Publicado');
    expect(second).toContain('Sin precio');
    expect(second).toContain('Sin control');
    expect(second).toContain('Borrador');
  });

  it('publishes a draft from the list', () => {
    const toggle = rows()[1].querySelector<HTMLButtonElement>('.publish-toggle')!;
    expect(toggle.textContent!.trim()).toBe('Publicar');
    toggle.click();
    const request = http.expectOne('/api/admin/products/p2');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ published: true });
    request.flush({ ...PRODUCTS[1], published: true });
    fixture.detectChanges();
    expect(rows()[1].textContent).toContain('Publicado');
    expect(element.querySelector('.form-alert--success')!.textContent).toContain(
      'ya se ve en la tienda',
    );
  });

  it('filters by name ignoring accents and case', () => {
    const search = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'MOTRICIDAD';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Kit Motricidad');
  });
});
