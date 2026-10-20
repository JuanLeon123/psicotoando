import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const MAX_PRICE_COP = 100_000_000;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_CONTENTS = 12;

/**
 * Convierte lo que escribe el administrador en un entero de pesos:
 * «120.000», «$ 120 000» y «120000» → 120000. Vacío → null.
 * Devuelve NaN si el texto no es un número entero.
 */
export function parseInteger(text: string | null | undefined): number | null {
  const value = (text ?? '').trim();
  if (value === '') return null;
  if (!/^\$?\s*[\d.\s]+$/.test(value)) return Number.NaN;
  const digits = value.replace(/\D/g, '');
  return digits === '' ? Number.NaN : Number(digits);
}

/** Campo de texto que debe contener un entero entre 0 y `max`, o quedar vacío. */
export function integerTextValidator(max: number): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = parseInteger(control.value);
    if (value === null) return null;
    if (Number.isNaN(value)) return { integer: true };
    return value > max ? { maxValue: { max } } : null;
  };
}

/** Valida un archivo de imagen antes de subirlo. Null = válido. */
export function imageFileError(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return 'La imagen debe ser JPG, PNG o WebP.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'La imagen no puede superar los 5 MB.';
  }
  return null;
}
