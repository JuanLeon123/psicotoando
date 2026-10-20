import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Same rule as the API: 8–128 characters with at least one letter and one number. */
export function passwordStrengthValidator(
  control: AbstractControl<string | null>,
): ValidationErrors | null {
  const value = control.value ?? '';
  if (!value) return null;
  const valid =
    value.length >= PASSWORD_MIN_LENGTH &&
    value.length <= PASSWORD_MAX_LENGTH &&
    /\p{L}/u.test(value) &&
    /\d/.test(value);
  return valid ? null : { passwordStrength: true };
}

export function emailValidator(
  control: AbstractControl<string | null>,
): ValidationErrors | null {
  const value = control.value?.trim() ?? '';
  return !value || EMAIL_PATTERN.test(value) ? null : { email: true };
}

/** Group validator that flags the confirmation field when it differs. */
export function matchingPasswordsValidator(
  passwordKey: string,
  confirmationKey: string,
): ValidatorFn {
  return (group) => {
    const confirmation = group.get(confirmationKey);
    if (!confirmation) return null;
    const mismatch =
      !!confirmation.value && group.get(passwordKey)?.value !== confirmation.value;
    const { passwordMismatch: _previous, ...otherErrors } =
      confirmation.errors ?? {};
    const nextErrors = mismatch
      ? { ...otherErrors, passwordMismatch: true }
      : otherErrors;
    confirmation.setErrors(Object.keys(nextErrors).length ? nextErrors : null);
    return mismatch ? { passwordMismatch: true } : null;
  };
}
