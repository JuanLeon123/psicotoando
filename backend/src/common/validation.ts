import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/** Trims text and turns empty optional fields into null so they clear the column. */
export const TrimToNull = () =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });

export const NormalizedEmail = (): PropertyDecorator => (target, key) => {
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )(target, key);
  IsEmail({}, { message: 'Introduce un correo electrónico válido.' })(
    target,
    key,
  );
  MaxLength(254, { message: 'El correo es demasiado largo.' })(target, key);
};

export const FullName = (): PropertyDecorator => (target, key) => {
  trim()(target, key);
  IsString({ message: 'El nombre debe ser un texto.' })(target, key);
  Length(2, 120, { message: 'El nombre debe tener entre 2 y 120 caracteres.' })(
    target,
    key,
  );
};

export const StrongPassword = (): PropertyDecorator => (target, key) => {
  IsString({ message: 'La contraseña debe ser un texto.' })(target, key);
  Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: `La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`,
  })(target, key);
  Matches(/^(?=.*\p{L})(?=.*\d).+$/u, {
    message: 'La contraseña debe incluir al menos una letra y un número.',
  })(target, key);
};
