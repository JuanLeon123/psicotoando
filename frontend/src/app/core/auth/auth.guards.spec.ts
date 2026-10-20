import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { adminGuard, authGuard, guestGuard } from './auth.guards';
import { AuthService } from './auth.service';
import { TEST_USER, authResponse } from './testing';
import { postLoginUrl, safeReturnUrl } from './return-url';

const ADMIN = { ...TEST_USER, role: 'admin' as const };

describe('auth guards', () => {
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  function run(
    guard: typeof authGuard,
    url = '/mi-cuenta',
  ): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
    return firstValueFrom(result);
  }

  it('waits for the session and redirects anonymous customers to login', async () => {
    const decision = run(authGuard, '/mi-cuenta?tab=datos');
    void auth.restoreSession();
    http
      .expectOne('/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    const tree = (await decision) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(tree)).toBe(
      '/iniciar-sesion?returnUrl=%2Fmi-cuenta%3Ftab%3Ddatos',
    );
  });

  it('lets signed-in customers into their account', async () => {
    void auth.restoreSession();
    http.expectOne('/api/auth/refresh').flush(authResponse());
    expect(await run(authGuard)).toBeTrue();
  });

  it('sends signed-in customers away from the login page', async () => {
    void auth.restoreSession();
    http.expectOne('/api/auth/refresh').flush(authResponse());
    const tree = (await run(guestGuard, '/iniciar-sesion')) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(tree)).toBe('/mi-cuenta');
  });

  it('keeps the panel for the admin account only', async () => {
    const anonymous = run(adminGuard, '/admin/productos');
    void auth.restoreSession();
    http
      .expectOne('/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    const router = TestBed.inject(Router);
    expect(router.serializeUrl((await anonymous) as UrlTree)).toBe(
      '/iniciar-sesion?returnUrl=%2Fadmin%2Fproductos',
    );
  });

  it('sends customers who open the panel back to the home page', async () => {
    void auth.restoreSession();
    http.expectOne('/api/auth/refresh').flush(authResponse());
    const tree = (await run(adminGuard, '/admin')) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(tree)).toBe('/');
  });

  it('lets the admin into the panel and away from the login page', async () => {
    void auth.restoreSession();
    http
      .expectOne('/api/auth/refresh')
      .flush({ accessToken: 'access-1', user: ADMIN });
    expect(await run(adminGuard, '/admin')).toBeTrue();
    const tree = (await run(guestGuard, '/iniciar-sesion')) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(tree)).toBe('/admin');
  });

  it('opens the panel after the admin signs in', () => {
    expect(postLoginUrl(ADMIN, null)).toBe('/admin');
    expect(postLoginUrl(ADMIN, '/mi-cuenta')).toBe('/admin');
    expect(postLoginUrl(ADMIN, '/admin/productos')).toBe('/admin/productos');
    expect(postLoginUrl(TEST_USER, '/tienda')).toBe('/tienda');
    expect(postLoginUrl(TEST_USER, null)).toBe('/mi-cuenta');
  });

  it('only accepts internal return URLs', () => {
    expect(safeReturnUrl('/nuestros-kits')).toBe('/nuestros-kits');
    expect(safeReturnUrl('https://evil.example')).toBe('/mi-cuenta');
    expect(safeReturnUrl('//evil.example')).toBe('/mi-cuenta');
    expect(safeReturnUrl('/\\evil.example')).toBe('/mi-cuenta');
    expect(safeReturnUrl(null)).toBe('/mi-cuenta');
  });
});
