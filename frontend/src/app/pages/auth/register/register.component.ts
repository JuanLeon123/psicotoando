import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { describeApiError } from '../../../core/auth/api-error';
import { postLoginUrl } from '../../../core/auth/return-url';
import {
  emailValidator,
  matchingPasswordsValidator,
  passwordStrengthValidator,
} from '../../../shared/forms/validators';
import {
  controlErrorMessage,
  focusFirstInvalid,
} from '../../../shared/forms/form-errors';
import { PasswordFieldComponent } from '../../../shared/components/password-field/password-field.component';
import { GoogleSignInButtonComponent } from '../../../shared/components/google-sign-in-button/google-sign-in-button.component';
import { AuthLayoutComponent } from '../components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    PasswordFieldComponent,
    GoogleSignInButtonComponent,
  ],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly returnUrl =
    inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl');

  protected readonly form = new FormGroup(
    {
      fullName: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(120),
        ],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          emailValidator,
          Validators.maxLength(254),
        ],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordStrengthValidator],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      acceptPrivacy: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
    },
    { validators: matchingPasswordsValidator('password', 'confirmPassword') },
  );
  protected readonly submitted = signal(false);
  protected readonly pending = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly emailTaken = signal(false);

  protected errorFor(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !(control.touched || this.submitted())) return null;
    if (name === 'acceptPrivacy') {
      return 'Debes aceptar el tratamiento de datos para crear tu cuenta.';
    }
    return controlErrorMessage(control);
  }

  protected describedBy(
    name: keyof typeof this.form.controls,
    hintId?: string,
  ): string | null {
    const ids = [hintId, this.errorFor(name) ? `register-${name}-error` : null]
      .filter(Boolean)
      .join(' ');
    return ids || null;
  }

  protected submit(): void {
    if (this.pending()) return;
    this.submitted.set(true);
    this.serverError.set(null);
    this.emailTaken.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.form, 'register');
      return;
    }
    const { fullName, email, password } = this.form.getRawValue();
    this.pending.set(true);
    this.auth
      .register({ fullName: fullName.trim(), email: email.trim(), password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) =>
          void this.router.navigateByUrl(postLoginUrl(user, this.returnUrl)),
        error: (error: unknown) => {
          this.pending.set(false);
          this.emailTaken.set(
            error instanceof HttpErrorResponse && error.status === 409,
          );
          this.serverError.set(describeApiError(error));
        },
      });
  }
}
