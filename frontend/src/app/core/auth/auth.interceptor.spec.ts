import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { TEST_USER, authResponse } from './testing';

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    auth.login({ email: TEST_USER.email, password: 'secreto123' }).subscribe();
    http.expectOne('/api/auth/login').flush(authResponse('access-1'));
  });

  afterEach(() => http.verify());

  it('sends cookies to auth endpoints without a bearer token', () => {
    auth.refresh().subscribe();
    const request = http.expectOne('/api/auth/refresh');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush(authResponse('access-2'));
  });

  it('adds the access token only to API requests', () => {
    client.get('/api/users/me').subscribe();
    client.get('/images/brand-logo.svg').subscribe();
    expect(
      http.expectOne('/api/users/me').request.headers.get('Authorization'),
    ).toBe('Bearer access-1');
    expect(
      http.expectOne('/images/brand-logo.svg').request.headers.has(
        'Authorization',
      ),
    ).toBeFalse();
  });

  it('refreshes the session once and retries after a 401', () => {
    let profile: unknown;
    client.get('/api/users/me').subscribe((body) => (profile = body));
    http
      .expectOne('/api/users/me')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/auth/refresh').flush(authResponse('access-2'));
    const retry = http.expectOne('/api/users/me');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer access-2');
    retry.flush(TEST_USER);
    expect(profile).toEqual(TEST_USER);
  });

  it('signs out and goes to the login page when refreshing fails', () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    let status: number | undefined;
    client
      .get('/api/users/me')
      .subscribe({ error: (error) => (status = error.status) });
    http
      .expectOne('/api/users/me')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne('/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(auth.status()).toBe('anonymous');
    expect(navigate).toHaveBeenCalledWith(['/iniciar-sesion'], {
      queryParams: { returnUrl: '/' },
    });
  });
});
