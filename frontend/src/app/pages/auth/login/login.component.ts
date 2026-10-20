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
import { emailValidator } from '../../../shared/forms/validators';
import {
  controlErrorMessage,
  focusFirstInvalid,
} from '../../../shared/forms/form-errors';
import { PasswordFieldComponent } from '../../../shared/components/password-field/password-field.component';
import { GoogleSignInButtonComponent } from '../../../shared/components/google-sign-in-button/google-sign-in-button.component';
import { AuthLayoutComponent } from '../components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    PasswordFieldComponent,
    GoogleSignInButtonComponent,
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly returnUrl =
    inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl');

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, emailValidator, Validators.maxLength(254)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  protected readonly submitted = signal(false);
  protected readonly pending = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected errorFor(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted())
      ? controlErrorMessage(control)
      : null;
  }

  protected submit(): void {
    if (this.pending()) return;
    this.submitted.set(true);
    this.serverError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.form, 'login');
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.pending.set(true);
    this.auth
      .login({ email: email.trim(), password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) =>
          void this.router.navigateByUrl(postLoginUrl(user, this.returnUrl)),
        error: (error: unknown) => {
          this.pending.set(false);
          this.serverError.set(describeApiError(error));
        },
      });
  }
}
