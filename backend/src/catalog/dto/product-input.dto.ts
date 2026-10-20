import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/** Quita espacios y líneas vacías de la lista de contenidos. */
const CleanList = () =>
  Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? (value as unknown[])
          .map((item) => (typeof item === 'string' ? item.trim() : item))
          .filter((item) => item !== '')
      : value,
  );

const MAX_PRICE_COP = 100_000_000;

/** Campos opcionales comunes a crear y editar. */
abstract class ProductFieldsDto {
  @IsOptional()
  @IsArray({ message: 'Los contenidos deben ser una lista.' })
  @CleanList()
  @ArrayMaxSize(12, { message: 'Incluye como máximo 12 contenidos.' })
  @IsString({ each: true, message: 'Cada contenido debe ser un texto.' })
  @MaxLength(200, {
    each: true,
    message: 'Cada contenido puede tener hasta 200 caracteres.',
  })
  contents?: string[];

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: 'Las actividades deben ser un número entero.' })
  @Min(0, { message: 'Las actividades no pueden ser negativas.' })
  @Max(999, { message: 'Revisa el número de actividades.' })
  activities?: number | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: 'El precio debe ser un número entero en pesos.' })
  @Min(0, { message: 'El precio no puede ser negativo.' })
  @Max(MAX_PRICE_COP, { message: 'Revisa el precio.' })
  priceCop?: number | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: 'El inventario debe ser un número entero.' })
  @Min(0, { message: 'El inventario no puede ser negativo.' })
  @Max(1_000_000, { message: 'Revisa el inventario.' })
  stock?: number | null;

  @IsOptional()
  @trim()
  @IsString({ message: 'El texto alternativo debe ser un texto.' })
  @MaxLength(300, {
    message: 'El texto alternativo puede tener hasta 300 caracteres.',
  })
  imageAlt?: string;

  @IsOptional()
  @IsBoolean({ message: 'Indica si el producto está publicado.' })
  published?: boolean;

  @IsOptional()
  @IsInt({ message: 'El orden debe ser un número entero.' })
  @Min(0, { message: 'El orden no puede ser negativo.' })
  @Max(9999, { message: 'Revisa el orden.' })
  sortOrder?: number;
}

export class CreateProductDto extends ProductFieldsDto {
  @trim()
  @IsString({ message: 'El nombre debe ser un texto.' })
  @Length(2, 120, { message: 'El nombre debe tener entre 2 y 120 caracteres.' })
  name!: string;

  @trim()
  @IsString({ message: 'La descripción debe ser un texto.' })
  @Length(10, 500, {
    message: 'La descripción debe tener entre 10 y 500 caracteres.',
  })
  summary!: string;
}

export class UpdateProductDto extends ProductFieldsDto {
  @IsOptional()
  @trim()
  @IsString({ message: 'El nombre debe ser un texto.' })
  @Length(2, 120, { message: 'El nombre debe tener entre 2 y 120 caracteres.' })
  name?: string;

  @IsOptional()
  @trim()
  @IsString({ message: 'La descripción debe ser un texto.' })
  @Length(10, 500, {
    message: 'La descripción debe tener entre 10 y 500 caracteres.',
  })
  summary?: string;
}
