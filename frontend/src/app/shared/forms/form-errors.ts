import { AbstractControl, FormGroup } from '@angular/forms';

/** Spanish message for the first error of a control, or null when valid. */
export function controlErrorMessage(control: AbstractControl): string | null {
  const errors = control.errors;
  if (!errors) return null;
  if (errors['required']) return 'Este campo es obligatorio.';
  if (errors['email']) return 'Introduce un correo electrónico válido.';
  if (errors['minlength'])
    return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
  if (errors['maxlength'])
    return `Debe tener como máximo ${errors['maxlength'].requiredLength} caracteres.`;
  if (errors['passwordStrength'])
    return 'Usa entre 8 y 128 caracteres, con al menos una letra y un número.';
  if (errors['passwordMismatch']) return 'Las contraseñas no coinciden.';
  if (errors['phone'])
    return 'Usa solo números, espacios y los símbolos + ( ) -.';
  if (errors['futureDate']) return 'La fecha no puede ser posterior a hoy.';
  return 'Revisa este campo.';
}

/** Moves focus to the first invalid control, in form order. */
export function focusFirstInvalid(form: FormGroup, idPrefix: string): void {
  const name = Object.keys(form.controls).find(
    (key) => form.controls[key].invalid,
  );
  if (name) document.getElementById(`${idPrefix}-${name}`)?.focus();
}
