import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Solo dígitos: «+57 300 123 4567» → «3001234567». */
export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits;
}

/** Celular (3…) o fijo (60…) colombiano de 10 dígitos, como valida el backend. */
export function colombianPhoneValidator(
  control: AbstractControl<string>,
): ValidationErrors | null {
  const value = control.value?.trim() ?? '';
  if (!value) return null;
  return /^(3\d{9}|60\d{8})$/.test(phoneDigits(value)) ? null : { colombianPhone: true };
}

/** Cédula: entre 5 y 15 dígitos; se aceptan puntos y espacios al escribir. */
export function documentValidator(
  control: AbstractControl<string>,
): ValidationErrors | null {
  const value = control.value?.trim() ?? '';
  if (!value) return null;
  return /^\d{5,15}$/.test(value.replace(/[\s.-]/g, '')) ? null : { document: true };
}
