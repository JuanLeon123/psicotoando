import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  ReplaySubject,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  take,
  tap,
  timeout,
} from 'rxjs';
import {
  AuthProviders,
  AuthResponse,
  AuthStatus,
  LoginRequest,
  PasswordChange,
  ProfileUpdate,
  PublicUser,
  RegisterRequest,
} from './auth.models';

interface AuthState {
  readonly user: PublicUser | null;
  readonly accessToken: string | null;
  readonly status: AuthStatus;
}

const RESTORE_TIMEOUT_MS = 8000;

/**
 * Holds the customer session. The access token lives only in memory; the
 * refresh token is an httpOnly cookie managed by the API.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<AuthState>({
    user: null,
    accessToken: null,
    status: 'unknown',
  });
  private readonly resolvedSubject = new ReplaySubject<AuthStatus>(1);
  private refreshInFlight: Observable<AuthResponse> | null = null;
  private providers$: Observable<AuthProviders> | null = null;

  readonly user = computed(() => this.state().user);
  readonly accessToken = computed(() => this.state().accessToken);
  readonly status = computed(() => this.state().status);
  readonly isAuthenticated = computed(
    () => this.state().status === 'authenticated',
  );
  /** Emits once the session state is known (after the first restore attempt). */
  readonly resolved$ = this.resolvedSubject.pipe(take(1));

  register(body: RegisterRequest): Observable<PublicUser> {
    return this.http
      .post<AuthResponse>('/api/auth/register', body)
      .pipe(map((response) => this.setSession(response)));
  }

  login(body: LoginRequest): Observable<PublicUser> {
    return this.http
      .post<AuthResponse>('/api/auth/login', body)
      .pipe(map((response) => this.setSession(response)));
  }

  loginWithGoogle(credential: string): Observable<PublicUser> {
    return this.http
      .post<AuthResponse>('/api/auth/google', { credential })
      .pipe(map((response) => this.setSession(response)));
  }

  /** Rotates the refresh cookie. Concurrent callers share one request. */
  refresh(): Observable<AuthResponse> {
    this.refreshInFlight ??= this.http
      .post<AuthResponse>('/api/auth/refresh', null)
      .pipe(
        tap({
          next: (response) => this.setSession(response),
          error: () => this.clearSession(),
        }),
        finalize(() => (this.refreshInFlight = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refreshInFlight;
  }

  /** Silently restores a previous session; never throws. */
  restoreSession(): Promise<void> {
    return new Promise((resolve) => {
      this.refresh()
        .pipe(
          timeout(RESTORE_TIMEOUT_MS),
          catchError(() => {
            this.clearSession();
            return of(null);
          }),
        )
        .subscribe({ complete: () => resolve() });
    });
  }

  logout(): Observable<void> {
    // The local session ends even if the API cannot be reached.
    return this.http.post<void>('/api/auth/logout', null).pipe(
      catchError(() => of(undefined)),
      map(() => this.clearSession()),
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>('/api/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>('/api/auth/reset-password', {
      token,
      password,
    });
  }

  updateProfile(changes: ProfileUpdate): Observable<PublicUser> {
    return this.http
      .patch<PublicUser>('/api/users/me', changes)
      .pipe(tap((user) => this.patchUser(user)));
  }

  changePassword(body: PasswordChange): Observable<void> {
    return this.http.patch<void>('/api/users/me/password', body).pipe(
      tap(() => {
        const user = this.state().user;
        if (user && !user.hasPassword) {
          this.patchUser({ ...user, hasPassword: true });
        }
      }),
    );
  }

  /** Available sign-in providers, requested once and cached. */
  providers(): Observable<AuthProviders> {
    this.providers$ ??= this.http
      .get<AuthProviders>('/api/auth/providers')
      .pipe(
        catchError(() => of<AuthProviders>({ google: null })),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.providers$;
  }

  clearSession(): void {
    this.state.set({ user: null, accessToken: null, status: 'anonymous' });
    this.resolvedSubject.next('anonymous');
  }

  private setSession(response: AuthResponse): PublicUser {
    this.state.set({
      user: response.user,
      accessToken: response.accessToken,
      status: 'authenticated',
    });
    this.resolvedSubject.next('authenticated');
    return response.user;
  }

  private patchUser(user: PublicUser): void {
    this.state.update((state) => ({ ...state, user }));
  }
}
