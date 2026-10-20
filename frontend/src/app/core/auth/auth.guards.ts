import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map, of } from 'rxjs';
import { AuthStatus } from './auth.models';
import { AuthService } from './auth.service';
import { ADMIN_HOME_URL } from './return-url';

function whenResolved(auth: AuthService): Observable<AuthStatus> {
  const status = auth.status();
  return status === 'unknown' ? auth.resolved$ : of(status);
}

/** Lets only signed-in customers through; others go to the login page. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return whenResolved(auth).pipe(
    map(
      (status): boolean | UrlTree =>
        status === 'authenticated' ||
        router.createUrlTree(['/iniciar-sesion'], {
          queryParams: { returnUrl: state.url },
        }),
    ),
  );
};

/** Sends people who are already signed in to their account or the panel. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return whenResolved(auth).pipe(
    map(
      (status): boolean | UrlTree =>
        status !== 'authenticated' ||
        router.createUrlTree([
          auth.user()?.role === 'admin' ? ADMIN_HOME_URL : '/mi-cuenta',
        ]),
    ),
  );
};

/** Only the admin account reaches the panel; customers go back to the home page. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return whenResolved(auth).pipe(
    map((status): boolean | UrlTree => {
      if (status !== 'authenticated') {
        return router.createUrlTree(['/iniciar-sesion'], {
          queryParams: { returnUrl: state.url },
        });
      }
      return auth.user()?.role === 'admin' || router.createUrlTree(['/']);
    }),
  );
};
