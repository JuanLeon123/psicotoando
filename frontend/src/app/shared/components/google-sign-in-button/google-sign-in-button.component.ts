import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  ElementRef,
  NgZone,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { describeApiError } from '../../../core/auth/api-error';
import { postLoginUrl } from '../../../core/auth/return-url';
import { GoogleIdentityService } from './google-identity.service';

/**
 * "Continuar con Google" button. It only appears when the API reports a
 * Google client ID, and signs the customer in with the returned credential.
 */
@Component({
  selector: 'app-google-sign-in-button',
  template: `
    @if (clientId()) {
      <div class="divider" aria-hidden="true"><span>o</span></div>
      @if (unavailable()) {
        <p class="form-hint google-unavailable">
          El acceso con Google no está disponible en este momento. Puedes usar
          tu correo y contraseña.
        </p>
      } @else {
        <div
          #buttonHost
          class="google-button"
          [attr.aria-busy]="pending() || null"
        ></div>
      }
      <div class="live-region" aria-live="assertive">
        @if (error()) {
          <p class="form-alert form-alert--error">{{ error() }}</p>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
    :host:empty {
      display: none;
    }
    .divider {
      display: flex;
      align-items: center;
      gap: 14px;
      color: var(--color-muted);
      font-size: 14px;
      font-weight: 700;
    }
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-line);
    }
    .google-button {
      display: flex;
      justify-content: center;
      min-height: 44px;
    }
    .google-unavailable {
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleSignInButtonComponent {
  /** Where to go after signing in; validated before navigating. */
  readonly returnUrl = input<string | null>(null);
  readonly text = input<'continue_with' | 'signup_with'>('continue_with');

  private readonly auth = inject(AuthService);
  private readonly identity = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly buttonHost = viewChild<ElementRef<HTMLElement>>('buttonHost');
  private readonly providers = toSignal(this.auth.providers());

  protected readonly clientId = computed(
    () => this.providers()?.google?.clientId ?? null,
  );
  protected readonly unavailable = signal(false);
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const clientId = this.clientId();
      const host = this.buttonHost()?.nativeElement;
      if (clientId && host) void this.render(clientId, host);
    });
  }

  private async render(clientId: string, host: HTMLElement): Promise<void> {
    try {
      const google = await this.identity.load();
      google.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: ({ credential }) =>
          this.zone.run(() => this.signIn(credential)),
      });
      google.renderButton(host, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: this.text(),
        shape: 'pill',
        locale: 'es',
        logo_alignment: 'center',
        width: Math.min(Math.max(host.clientWidth, 200), 400),
      });
    } catch {
      this.unavailable.set(true);
    }
  }

  private signIn(credential: string): void {
    this.pending.set(true);
    this.error.set(null);
    this.auth
      .loginWithGoogle(credential)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) =>
          void this.router.navigateByUrl(postLoginUrl(user, this.returnUrl())),
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(
            describeApiError(
              error,
              'No pudimos iniciar sesión con Google. Inténtalo de nuevo.',
            ),
          );
        },
      });
  }
}
