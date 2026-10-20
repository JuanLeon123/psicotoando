import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { describeApiError } from '../../../core/auth/api-error';
import {
  matchingPasswordsValidator,
  passwordStrengthValidator,
} from '../../../shared/forms/validators';
import {
  controlErrorMessage,
  focusFirstInvalid,
} from '../../../shared/forms/form-errors';
import { PasswordFieldComponent } from '../../../shared/components/password-field/password-field.component';
import { AuthLayoutComponent } from '../components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    PasswordFieldComponent,
  ],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly token =
    inject(ActivatedRoute).snapshot.queryParamMap.get('token');

  constructor() {
    // Keeps the single-use token out of browser history and Referer headers.
    if (this.token) inject(Location).replaceState('/restablecer-contrasena');
  }

  protected readonly form = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordStrengthValidator],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: matchingPasswordsValidator('password', 'confirmPassword') },
  );
  protected readonly submitted = signal(false);
  protected readonly pending = signal(false);
  protected readonly completed = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected errorFor(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted())
      ? controlErrorMessage(control)
      : null;
  }

  protected submit(): void {
    if (this.pending() || !this.token) return;
    this.submitted.set(true);
    this.serverError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.form, 'reset');
      return;
    }
    this.pending.set(true);
    this.auth
      .resetPassword(this.token, this.form.controls.password.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.completed.set(true);
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.serverError.set(describeApiError(error));
        },
      });
  }
}
