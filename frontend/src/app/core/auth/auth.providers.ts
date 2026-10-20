import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Starts restoring the session without blocking the first render. Guards wait
 * for the result through `AuthService.resolved$`.
 */
export function provideAuthSession(): EnvironmentProviders {
  return provideAppInitializer(() => {
    void inject(AuthService).restoreSession();
  });
}
