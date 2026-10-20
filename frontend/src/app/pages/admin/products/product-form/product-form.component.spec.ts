import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AdminProduct } from '../../../../core/catalog/product.models';
import { ProductFormComponent } from './product-form.component';
import { imageFileError, parseInteger } from './product-form.validators';

const CREATED: AdminProduct = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'kit-nuevo',
  name: 'Kit Nuevo',
  summary: 'Un kit nuevo para probar el panel.',
  contents: ['Una línea'],
  activities: null,
  priceCop: 120000,
  inStock: true,
  imageUrl: null,
  imageAlt: '',
  stock: null,
  published: false,
  sortOrder: 0,
  createdAt: '2026-10-19T10:00:00.000Z',
  updatedAt: '2026-10-19T10:00:00.000Z',
};

describe('parseInteger', () => {
  it('reads pesos written with thousand separators or a currency sign', () => {
    expect(parseInteger('120.000')).toBe(120000);
    expect(parseInteger('$ 120 000')).toBe(120000);
    expect(parseInteger('95000')).toBe(95000);
  });

  it('treats an empty field as null and rejects text or decimals', () => {
    expect(parseInteger('   ')).toBeNull();
    expect(parseInteger('doce')).toBeNaN();
    expect(parseInteger('12,5')).toBeNaN();
  });
});

describe('imageFileError', () => {
  it('accepts JPG/PNG/WebP up to 5 MB only', () => {
    expect(imageFileError(new File(['x'], 'a.webp', { type: 'image/webp' }))).toBeNull();
    expect(imageFileError(new File(['x'], 'a.gif', { type: 'image/gif' }))).toContain('JPG');
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' });
    expect(imageFileError(big)).toContain('5 MB');
  });
});

describe('ProductFormComponent (crear)', () => {
  let fixture: ComponentFixture<ProductFormComponent>;
  let element: HTMLElement;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductFormComponent);
    element = fixture.nativeElement;
    document.body.appendChild(element);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    element.remove();
    http.verify();
  });

  function type(id: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
  }

  it('does not call the API and focuses the name when required fields are empty', () => {
    submit();
    expect(document.activeElement?.id).toBe('product-name');
    expect(element.querySelector('#product-name')!.getAttribute('aria-invalid')).toBe('true');
  });

  it('shows an error for a price that is not a whole number', () => {
    type('product-name', 'Kit Nuevo');
    type('product-summary', 'Un kit nuevo para probar el panel.');
    type('product-priceCop', '120,50');
    submit();
    expect(element.textContent).toContain('Escribe solo números enteros');
  });

  it('creates the product, then uploads the image, then opens its edit page', () => {
    type('product-name', '  Kit Nuevo ');
    type('product-summary', 'Un kit nuevo para probar el panel.');
    type('product-priceCop', '120.000');
    type('product-stock', '');
    const file = new File(['img'], 'kit.webp', { type: 'image/webp' });
    const picker = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(picker, 'files', { value: [file] });
    picker.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(element.textContent).toContain('«kit.webp» se subirá al guardar');

    submit();
    const create = http.expectOne('/api/admin/products');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(
      jasmine.objectContaining({
        name: 'Kit Nuevo',
        priceCop: 120000,
        stock: null,
        activities: null,
        sortOrder: 0,
        published: false,
        contents: [],
      }),
    );
    create.flush(CREATED);

    const upload = http.expectOne(`/api/admin/products/${CREATED.id}/image`);
    expect(upload.request.method).toBe('POST');
    expect((upload.request.body as FormData).get('image')).toBe(file);
    upload.flush({ ...CREATED, imageUrl: '/api/uploads/products/x.webp' });

    expect(router.navigate).toHaveBeenCalledWith(
      ['/admin/productos', CREATED.id],
      jasmine.objectContaining({ state: { created: true } }),
    );
  });

  it('shows the server validation message when saving fails', () => {
    type('product-name', 'Kit Nuevo');
    type('product-summary', 'Un kit nuevo para probar el panel.');
    submit();
    http
      .expectOne('/api/admin/products')
      .flush(
        { message: ['Revisa el precio.'] },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();
    expect(element.querySelector('.form-alert--error')!.textContent).toContain(
      'Revisa el precio.',
    );
  });
});
