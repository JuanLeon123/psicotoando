import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TEST_USER, authResponse } from './testing';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts with an unknown session', () => {
    expect(auth.status()).toBe('unknown');
    expect(auth.user()).toBeNull();
  });

  it('keeps the user and access token in memory after logging in', () => {
    let result: unknown;
    auth
      .login({ email: TEST_USER.email, password: 'secreto123' })
      .subscribe((user) => (result = user));
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: TEST_USER.email,
      password: 'secreto123',
    });
    request.flush(authResponse());
    expect(result).toEqual(TEST_USER);
    expect(auth.status()).toBe('authenticated');
    expect(auth.accessToken()).toBe('access-1');
    expect(localStorage.getItem('access-1')).toBeNull();
    expect(JSON.stringify(localStorage)).not.toContain('access-1');
  });

  it('shares one refresh request between concurrent callers', () => {
    const tokens: string[] = [];
    auth.refresh().subscribe((response) => tokens.push(response.accessToken));
    auth.refresh().subscribe((response) => tokens.push(response.accessToken));
    http.expectOne('/api/auth/refresh').flush(authResponse('access-2'));
    expect(tokens).toEqual(['access-2', 'access-2']);

    auth.refresh().subscribe();
    http.expectOne('/api/auth/refresh').flush(authResponse('access-3'));
    expect(auth.accessToken()).toBe('access-3');
  });

  it('marks the session as anonymous when it cannot be restored', async () => {
    const restored = auth.restoreSession();
    http
      .expectOne('/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await restored;
    expect(auth.status()).toBe('anonymous');
    expect(auth.accessToken()).toBeNull();
  });

  it('clears the session on logout, even if the API fails', () => {
    auth.login({ email: TEST_USER.email, password: 'secreto123' }).subscribe();
    http.expectOne('/api/auth/login').flush(authResponse());

    let completed = false;
    auth.logout().subscribe({ complete: () => (completed = true) });
    http
      .expectOne('/api/auth/logout')
      .flush(null, { status: 500, statusText: 'Server Error' });
    expect(completed).toBeTrue();
    expect(auth.status()).toBe('anonymous');
    expect(auth.user()).toBeNull();
    expect(auth.accessToken()).toBeNull();
  });

  it('remembers that a Google-only customer now has a password', () => {
    auth.loginWithGoogle('google-credential').subscribe();
    http.expectOne('/api/auth/google').flush({
      accessToken: 'access-1',
      user: { ...TEST_USER, hasPassword: false, googleLinked: true },
    });
    auth.changePassword({ newPassword: 'nuevaClave9' }).subscribe();
    http.expectOne('/api/users/me/password').flush(null);
    expect(auth.user()?.hasPassword).toBeTrue();
  });

  it('falls back to no providers when the API is unavailable', () => {
    let google: unknown = 'pending';
    auth.providers().subscribe((providers) => (google = providers.google));
    http
      .expectOne('/api/auth/providers')
      .flush(null, { status: 0, statusText: 'Unknown Error' });
    expect(google).toBeNull();
  });
});
