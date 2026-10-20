import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { describeApiError } from '../../../../core/auth/api-error';
import {
  matchingPasswordsValidator,
  passwordStrengthValidator,
} from '../../../../shared/forms/validators';
import {
  controlErrorMessage,
  focusFirstInvalid,
} from '../../../../shared/forms/form-errors';
import { PasswordFieldComponent } from '../../../../shared/components/password-field/password-field.component';

@Component({
  selector: 'app-security-form',
  imports: [ReactiveFormsModule, PasswordFieldComponent],
  templateUrl: './security-form.component.html',
  styleUrl: '../account-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityFormComponent {
  /** Google-only customers can set a first password without the current one. */
  readonly hasPassword = input.required<boolean>();
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', { nonNullable: true }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordStrengthValidator],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    {
      validators: matchingPasswordsValidator('newPassword', 'confirmPassword'),
    },
  );
  protected readonly submitted = signal(false);
  protected readonly pending = signal(false);
  protected readonly saved = signal(false);
  protected readonly serverError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const current = this.form.controls.currentPassword;
      if (this.hasPassword()) current.setValidators(Validators.required);
      else current.clearValidators();
      current.updateValueAndValidity();
    });
  }

  protected errorFor(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted())
      ? controlErrorMessage(control)
      : null;
  }

  protected describedBy(
    name: keyof typeof this.form.controls,
    hintId = '',
  ): string {
    return [hintId, this.errorFor(name) ? `security-${name}-error` : '']
      .filter(Boolean)
      .join(' ');
  }

  protected submit(): void {
    if (this.pending()) return;
    this.submitted.set(true);
    this.serverError.set(null);
    this.saved.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.form, 'security');
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.pending.set(true);
    this.auth
      .changePassword(
        this.hasPassword() ? { currentPassword, newPassword } : { newPassword },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.submitted.set(false);
          this.form.reset();
          this.saved.set(true);
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.serverError.set(describeApiError(error));
        },
      });
  }
}
