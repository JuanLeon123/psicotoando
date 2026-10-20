import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideTestProducts } from './shared/catalog/testing';

// These checks exercise the routed page and its interactive controls together.
describe('Site navigation and pages', () => {
  beforeEach(async () => {
    localStorage.removeItem('pt-cart-v1');
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideTestProducts(),
      ],
    }).compileComponents();
  });

  async function renderPage(url = '/') {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    fixture.detectChanges();
    const images = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'img',
    );
    await Promise.all(
      Array.from(images, (image) => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }),
    );
    return fixture;
  }

  it('renders the homepage through the router with one main heading and three kits', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('h1')?.textContent).toContain('Transformamos');
    expect(element.querySelectorAll('app-kit-card').length).toBe(3);
  });

  it('opens the menu and closes it with Escape', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;
    const toggle = element.querySelector<HTMLButtonElement>('.menu-toggle')!;
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the menu when a section link is selected', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;
    const toggle = element.querySelector<HTMLButtonElement>('.menu-toggle')!;
    toggle.click();
    fixture.detectChanges();
    element
      .querySelector<HTMLAnchorElement>(
        '#main-navigation a[href="/nuestros-kits"]',
      )!
      .click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(TestBed.inject(Router).url).toBe('/nuestros-kits');
  });

  it('opens the selected kit details and closes the dialog', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;
    element
      .querySelector<HTMLButtonElement>('app-kit-card:nth-child(2) button')!
      .click();
    fixture.detectChanges();
    await fixture.whenStable();
    const dialog = element.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.open).toBeTrue();
    expect(dialog.querySelector('h2')?.textContent).toBe(
      'Kit Motricidad y Coordinación',
    );
    expect(dialog.textContent).toContain('20 actividades');
    expect(dialog.textContent).toContain('Precio próximamente');
    dialog.querySelector<HTMLButtonElement>('.close-button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dialog.open).toBeFalse();
  });

  it('makes the pending advisory booking channel explicit', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('.hero-actions button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const dialog = element.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.open).toBeTrue();
    expect(dialog.textContent).toContain(
      'El canal de reservas estará disponible próximamente.',
    );
    dialog.querySelector<HTMLButtonElement>('.close-button')!.click();
    fixture.detectChanges();
  });

  it('adds a product from the shop and opens it in the cart', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;
    element
      .querySelector<HTMLAnchorElement>('#main-navigation a[href="/tienda"]')!
      .click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/tienda');
    expect(element.querySelectorAll('.product-card').length).toBe(3);

    element
      .querySelector<HTMLButtonElement>('.product-card .button--primary')!
      .click();
    fixture.detectChanges();
    expect(element.querySelector('.cart-badge')?.textContent?.trim()).toBe('1');
    expect(element.querySelector('.cart-notice')?.textContent).toContain(
      'Kit Desarrollo Sensorial se añadió a tu carrito.',
    );

    element.querySelector<HTMLAnchorElement>('a.shop-link')!.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/carrito');
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 250));
    const request = TestBed.inject(HttpTestingController).expectOne(
      '/api/cart/quote',
    );
    expect(request.request.body).toEqual({
      items: [{ productId: 'p-1', quantity: 1 }],
    });
    request.flush({
      lines: [],
      itemCount: 0,
      subtotalCop: 0,
      purchasable: false,
    });
  });

  it('redirects unavailable pages to the homepage', async () => {
    await renderPage();
    await TestBed.inject(Router).navigateByUrl('/pagina-no-disponible');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('navigates from the menu to About and marks only that page as active', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;
    const toggle = element.querySelector<HTMLButtonElement>('.menu-toggle')!;
    toggle.click();
    fixture.detectChanges();
    const aboutLink = element.querySelector<HTMLAnchorElement>(
      'nav a[href="/sobre-nosotros"]',
    )!;
    aboutLink.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/sobre-nosotros');
    expect(element.querySelector('h1')?.textContent).toContain('nosotros');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(aboutLink.getAttribute('aria-current')).toBe('page');
    expect(element.querySelectorAll('nav [aria-current="page"]').length).toBe(
      1,
    );
    expect(
      element.querySelector<HTMLDialogElement>('dialog')!.open,
    ).toBeFalse();
    await Promise.all(
      Array.from(element.querySelectorAll('img'), (image) => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }),
    );
  });

  it('loads About directly and can return to the homepage kits', async () => {
    const fixture = await renderPage('/sobre-nosotros');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(
      Array.from(
        element.querySelectorAll('main h2'),
        (heading) => heading.textContent,
      ),
    ).toEqual([
      jasmine.stringMatching('Misión'),
      jasmine.stringMatching('Visión'),
      jasmine.stringMatching('Valores de la marca'),
    ]);
    expect(element.querySelectorAll('app-about-values li').length).toBe(4);
    element
      .querySelector<HTMLAnchorElement>('#main-navigation a[href="/"]')!
      .click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(element.querySelectorAll('app-kit-card').length).toBe(3);
    const images = element.querySelectorAll('img');
    await Promise.all(
      Array.from(images, (image) => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }),
    );
  });

  it('opens the advisory page from the menu and keeps booking as a separate action', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;
    const toggle = element.querySelector<HTMLButtonElement>('.menu-toggle')!;
    toggle.click();
    fixture.detectChanges();
    const advisoryLink = element.querySelector<HTMLAnchorElement>(
      'nav a[href="/asesoria-y-seguimiento"]',
    )!;
    advisoryLink.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/asesoria-y-seguimiento');
    expect(advisoryLink.getAttribute('aria-current')).toBe('page');
    expect(element.querySelectorAll('nav [aria-current="page"]').length).toBe(
      1,
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('h1')?.textContent).toContain('Asesoría y');
    expect(element.querySelectorAll('.consultation-steps li').length).toBe(4);
    expect(element.querySelectorAll('.activity-gallery img').length).toBe(4);
    expect(element.querySelector('.family-resources')?.textContent).toContain(
      'Enlaces disponibles próximamente.',
    );
    const dialog = element.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.open).toBeFalse();
    await Promise.all(
      Array.from(element.querySelectorAll('img'), (image) => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }),
    );
    element
      .querySelector<HTMLButtonElement>('app-advisory .mobile-booking')!
      .click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dialog.open).toBeTrue();
    expect(dialog.textContent).toContain(
      'El canal de reservas estará disponible próximamente.',
    );
    dialog.querySelector<HTMLButtonElement>('.close-button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dialog.open).toBeFalse();
  });

  it('opens the family resources page from the menu with the article and five recommendations', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;
    const toggle = element.querySelector<HTMLButtonElement>('.menu-toggle')!;
    toggle.click();
    fixture.detectChanges();
    const resourcesLink = element.querySelector<HTMLAnchorElement>(
      'nav a[href="/recursos-para-familias"]',
    )!;
    resourcesLink.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/recursos-para-familias');
    expect(resourcesLink.getAttribute('aria-current')).toBe('page');
    expect(element.querySelectorAll('nav [aria-current="page"]').length).toBe(
      1,
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('h1')?.textContent).toContain('Recursos');
    expect(
      element.querySelector('app-featured-article h2')?.textContent,
    ).toContain('Cuidar a quien cuida');
    expect(
      element.querySelector<HTMLImageElement>('app-featured-article img')?.alt,
    ).toBeTruthy();
    const recommendations = element.querySelectorAll(
      '.recommendations-list > li',
    );
    expect(recommendations.length).toBe(5);
    expect(recommendations[4].querySelector('h3')?.textContent).toContain(
      'Busca acompañamiento',
    );
    expect(element.querySelector('blockquote')?.textContent).toContain(
      'Cuando cuidamos a quien cuida',
    );
    await Promise.all(
      Array.from(element.querySelectorAll('img'), (image) => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }),
    );
  });

  it('opens the kits page from the menu with the levels and development areas', async () => {
    const fixture = await renderPage();
    const element: HTMLElement = fixture.nativeElement;
    const toggle = element.querySelector<HTMLButtonElement>('.menu-toggle')!;
    toggle.click();
    fixture.detectChanges();
    const kitsLink = element.querySelector<HTMLAnchorElement>(
      'nav a[href="/nuestros-kits"]',
    )!;
    kitsLink.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/nuestros-kits');
    expect(kitsLink.getAttribute('aria-current')).toBe('page');
    expect(element.querySelectorAll('nav [aria-current="page"]').length).toBe(
      1,
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('h1')?.textContent).toContain('Nuestros kits');
    const photos = element.querySelectorAll<HTMLImageElement>(
      'app-kits-gallery img',
    );
    expect(photos.length).toBe(4);
    expect(Array.from(photos).every((photo) => photo.alt)).toBeTrue();
    expect(
      Array.from(
        element.querySelectorAll('app-kit-levels h3'),
        (heading) => heading.textContent?.trim(),
      ),
    ).toEqual(['Nivel Explorador', 'Nivel Experimentador', 'Nivel Experto']);
    const areas = element.querySelectorAll('app-development-areas tbody tr');
    expect(areas.length).toBe(7);
    expect(areas[0].querySelector('th')?.textContent).toContain('Cognitiva');
    expect(areas[6].querySelectorAll('.activity-types li').length).toBe(3);
    await Promise.all(
      Array.from(element.querySelectorAll('img'), (image) => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }),
    );
  });
});
