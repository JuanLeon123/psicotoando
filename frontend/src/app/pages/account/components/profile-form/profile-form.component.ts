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
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { PublicUser } from '../../../../core/auth/auth.models';
import { describeApiError } from '../../../../core/auth/api-error';
import {
  controlErrorMessage,
  focusFirstInvalid,
} from '../../../../shared/forms/form-errors';

const PHONE_PATTERN = /^[+()\-\s\d]*$/;

function phoneValidator(control: AbstractControl<string>): ValidationErrors | null {
  return PHONE_PATTERN.test(control.value ?? '') ? null : { phone: true };
}

function pastDateValidator(control: AbstractControl<string>): ValidationErrors | null {
  return control.value && control.value > today() ? { futureDate: true } : null;
}

function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const emptyToNull = (value: string): string | null => value.trim() || null;

@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-form.component.html',
  styleUrl: '../account-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileFormComponent {
  readonly user = input.required<PublicUser>();
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly maxDate = today();
  protected readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(120),
      ],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(30), phoneValidator],
    }),
    childName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    childBirthDate: new FormControl('', {
      nonNullable: true,
      validators: [pastDateValidator],
    }),
  });
  protected readonly submitted = signal(false);
  protected readonly pending = signal(false);
  protected readonly saved = signal(false);
  protected readonly serverError = signal<string | null>(null);

  constructor() {
    // Keeps the form in sync with the session, without overwriting edits.
    effect(() => {
      const user = this.user();
      if (this.form.dirty) return;
      // Not a user edit, so it must not clear the "saved" confirmation.
      this.form.reset(
        {
          fullName: user.fullName,
          phone: user.phone ?? '',
          childName: user.childName ?? '',
          childBirthDate: user.childBirthDate ?? '',
        },
        { emitEvent: false },
      );
    });
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.saved.set(false));
  }

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
    this.saved.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.form, 'profile');
      return;
    }
    const value = this.form.getRawValue();
    this.pending.set(true);
    this.auth
      .updateProfile({
        fullName: value.fullName.trim(),
        phone: emptyToNull(value.phone),
        childName: emptyToNull(value.childName),
        childBirthDate: value.childBirthDate || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.pending.set(false);
          this.submitted.set(false);
          this.form.reset(
            {
              fullName: user.fullName,
              phone: user.phone ?? '',
              childName: user.childName ?? '',
              childBirthDate: user.childBirthDate ?? '',
            },
            { emitEvent: false },
          );
          this.saved.set(true);
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.serverError.set(describeApiError(error));
        },
      });
  }
}
