import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  Max,
  Min,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TrimToNull } from '../../common/validation';

const isSet = (_: unknown, value: unknown) =>
  value !== null && value !== undefined;
const httpsUrl = { protocols: ['https'], require_protocol: true };

export class UpdateSettingsDto {
  // Acepta «+57 300 123 4567» y guarda solo los dígitos.
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const digits = value.replace(/\D/g, '');
    return digits === '' ? null : digits;
  })
  @ValidateIf(isSet)
  @Matches(/^\d{8,15}$/, {
    message:
      'Escribe el WhatsApp con el indicativo del país, por ejemplo +57 300 123 4567.',
  })
  whatsappNumber?: string | null;

  @TrimToNull()
  @ValidateIf(isSet)
  @IsEmail({}, { message: 'Introduce un correo electrónico válido.' })
  @MaxLength(254, { message: 'El correo es demasiado largo.' })
  contactEmail?: string | null;

  @TrimToNull()
  @ValidateIf(isSet)
  @IsUrl(httpsUrl, {
    message: 'El enlace de Instagram debe empezar por https://',
  })
  @MaxLength(300, { message: 'El enlace de Instagram es demasiado largo.' })
  instagramUrl?: string | null;

  @TrimToNull()
  @ValidateIf(isSet)
  @IsUrl(httpsUrl, {
    message: 'El enlace de Facebook debe empezar por https://',
  })
  @MaxLength(300, { message: 'El enlace de Facebook es demasiado largo.' })
  facebookUrl?: string | null;

  @IsOptional()
  @IsInt({ message: 'El valor del envío debe ser un número entero en pesos.' })
  @Min(0, { message: 'El valor del envío no puede ser negativo.' })
  @Max(5_000_000, { message: 'Revisa el valor del envío.' })
  shippingFlatCop?: number;

  @ValidateIf(isSet)
  @IsInt({
    message: 'El monto para envío gratis debe ser un número entero en pesos.',
  })
  @Min(0, { message: 'El monto para envío gratis no puede ser negativo.' })
  @Max(100_000_000, { message: 'Revisa el monto para envío gratis.' })
  freeShippingFromCop?: number | null;
}
