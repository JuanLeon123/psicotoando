import { Transform } from 'class-transformer';
import { IsInt, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class UpdateSiteImageDto {
  @IsUUID('4', { message: 'Elige una imagen de la biblioteca.' })
  mediaId!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'La descripción debe ser un texto.' })
  @MaxLength(300, {
    message: 'La descripción puede tener hasta 300 caracteres.',
  })
  alt!: string;

  @IsInt({ message: 'El punto de enfoque debe ser un número entero.' })
  @Min(0, { message: 'El punto de enfoque va de 0 a 100.' })
  @Max(100, { message: 'El punto de enfoque va de 0 a 100.' })
  focusX!: number;

  @IsInt({ message: 'El punto de enfoque debe ser un número entero.' })
  @Min(0, { message: 'El punto de enfoque va de 0 a 100.' })
  @Max(100, { message: 'El punto de enfoque va de 0 a 100.' })
  focusY!: number;
}
