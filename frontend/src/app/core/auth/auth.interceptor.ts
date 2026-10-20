import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const API_PREFIX = '/api/';
const AUTH_PREFIX = '/api/auth/';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(API_PREFIX)) return next(request);
  // Auth endpoints rely on the httpOnly refresh cookie, not on the bearer token.
  if (request.url.startsWith(AUTH_PREFIX)) {
    return next(request.clone({ withCredentials: true }));
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const authorize = (original: HttpRequest<unknown>) => {
    const token = auth.accessToken();
    return token
      ? original.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : original;
  };

  return next(authorize(request)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        catchError(() => {
          void router.navigate(['/iniciar-sesion'], {
            queryParams: { returnUrl: router.url },
          });
          return throwError(() => error);
        }),
        switchMap(() => next(authorize(request))),
      );
    }),
  );
};
