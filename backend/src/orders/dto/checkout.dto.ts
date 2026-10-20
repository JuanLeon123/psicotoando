import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CartQuoteDto } from '../../catalog/dto/cart-quote.dto';
import { FullName, NormalizedEmail, TrimToNull } from '../../common/validation';
import { COLOMBIAN_DEPARTMENTS } from '../colombia';

const trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  );

/** «+57 300 123 4567» → «3001234567». Celulares (3…) y fijos (60…) tienen 10 dígitos. */
const ColombianPhone = (): PropertyDecorator => (target, key) => {
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const digits = value.replace(/\D/g, '');
    return digits.length === 12 && digits.startsWith('57')
      ? digits.slice(2)
      : digits;
  })(target, key);
  Matches(/^(3\d{9}|60\d{8})$/, {
    message:
      'Escribe un celular colombiano de 10 dígitos, por ejemplo 300 123 4567.',
  })(target, key);
};

export class CheckoutCustomerDto {
  @FullName()
  fullName!: string;

  @NormalizedEmail()
  email!: string;

  @ColombianPhone()
  phone!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[\s.-]/g, '') : value,
  )
  @Matches(/^\d{5,15}$/, {
    message: 'La cédula debe tener entre 5 y 15 dígitos, sin puntos.',
  })
  document!: string;
}

export class CheckoutShippingDto {
  @IsIn(COLOMBIAN_DEPARTMENTS, { message: 'Elige un departamento.' })
  department!: string;

  @trim()
  @IsString({ message: 'La ciudad debe ser un texto.' })
  @Length(2, 80, { message: 'Escribe la ciudad o municipio.' })
  city!: string;

  @trim()
  @IsString({ message: 'La dirección debe ser un texto.' })
  @Length(5, 200, {
    message: 'Escribe la dirección completa (5 a 200 caracteres).',
  })
  address!: string;

  @IsOptional()
  @TrimToNull()
  @IsString({ message: 'Las indicaciones deben ser un texto.' })
  @MaxLength(300, {
    message: 'Las indicaciones pueden tener hasta 300 caracteres.',
  })
  notes?: string | null;
}

export class CheckoutDto extends CartQuoteDto {
  @IsObject({ message: 'Faltan los datos de contacto.' })
  @ValidateNested()
  @Type(() => CheckoutCustomerDto)
  customer!: CheckoutCustomerDto;

  @IsObject({ message: 'Faltan los datos de envío.' })
  @ValidateNested()
  @Type(() => CheckoutShippingDto)
  shipping!: CheckoutShippingDto;
}

export class VerifyPaymentDto {
  @IsString({ message: 'Falta el identificador del pago.' })
  @Matches(/^[\w-]{5,60}$/, {
    message: 'El identificador del pago no es válido.',
  })
  transactionId!: string;
}
