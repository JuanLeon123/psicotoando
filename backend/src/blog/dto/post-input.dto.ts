import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { TrimToNull } from '../../common/validation';
import type { PostStatus } from '../post.entity';

const trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
const isSet = (_: unknown, value: unknown) =>
  value !== null && value !== undefined;

/** Campos opcionales comunes a crear y editar. Los bloques se validan aparte. */
abstract class PostFieldsDto {
  @IsOptional()
  @trim()
  @IsString({ message: 'El resumen debe ser un texto.' })
  @MaxLength(300, { message: 'El resumen puede tener hasta 300 caracteres.' })
  excerpt?: string;

  @TrimToNull()
  @ValidateIf(isSet)
  @IsString({ message: 'La categoría debe ser un texto.' })
  @MaxLength(60, { message: 'La categoría puede tener hasta 60 caracteres.' })
  category?: string | null;

  @TrimToNull()
  @ValidateIf(isSet)
  @IsString({ message: 'La portada no es válida.' })
  @MaxLength(500, { message: 'La portada no es válida.' })
  coverUrl?: string | null;

  @IsOptional()
  @trim()
  @IsString({ message: 'La descripción de la portada debe ser un texto.' })
  @MaxLength(300, {
    message: 'La descripción de la portada puede tener hasta 300 caracteres.',
  })
  coverAlt?: string;

  /** Se valida y normaliza en normalizeBlocks(). */
  @IsOptional()
  @IsArray({
    message: 'El contenido del artículo debe ser una lista de bloques.',
  })
  blocks?: unknown[];

  @IsOptional()
  @IsIn(['draft', 'published'], {
    message: 'El estado debe ser borrador o publicado.',
  })
  status?: PostStatus;

  @ValidateIf(isSet)
  @Type(() => Date)
  @IsDate({ message: 'La fecha de publicación no es válida.' })
  publishedAt?: Date | null;
}

export class CreatePostDto extends PostFieldsDto {
  @trim()
  @IsString({ message: 'El título debe ser un texto.' })
  @Length(3, 160, { message: 'El título debe tener entre 3 y 160 caracteres.' })
  title!: string;
}

export class UpdatePostDto extends PostFieldsDto {
  @IsOptional()
  @trim()
  @IsString({ message: 'El título debe ser un texto.' })
  @Length(3, 160, { message: 'El título debe tener entre 3 y 160 caracteres.' })
  title?: string;
}

export class ListPostsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser 1 o mayor.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero.' })
  @Min(1, { message: 'El tamaño de página debe ser 1 o mayor.' })
  @Max(24, { message: 'El tamaño de página puede ser como máximo 24.' })
  pageSize?: number;

  @IsOptional()
  @trim()
  @IsString({ message: 'La categoría debe ser un texto.' })
  @MaxLength(60, { message: 'La categoría puede tener hasta 60 caracteres.' })
  category?: string;
}

export class MediaQueryDto {
  @IsOptional()
  @IsIn(['image', 'video'], { message: 'El tipo debe ser image o video.' })
  kind?: 'image' | 'video';
}

export class UpdateMediaDto {
  @trim()
  @IsString({ message: 'La descripción debe ser un texto.' })
  @MaxLength(300, {
    message: 'La descripción puede tener hasta 300 caracteres.',
  })
  alt!: string;
}
