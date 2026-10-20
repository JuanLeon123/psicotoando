import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { FullName, TrimToNull } from '../../common/validation';

export class UpdateProfileDto {
  @IsOptional()
  @FullName()
  fullName?: string;

  @TrimToNull()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString({ message: 'El teléfono debe ser un texto.' })
  @MaxLength(30, { message: 'El teléfono es demasiado largo.' })
  @Matches(/^[+\d][\d\s().-]*$/, {
    message: 'Introduce un teléfono válido.',
  })
  phone?: string | null;

  @TrimToNull()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString({ message: 'El nombre del hijo o hija debe ser un texto.' })
  @MaxLength(120, { message: 'El nombre del hijo o hija es demasiado largo.' })
  childName?: string | null;

  @TrimToNull()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString(
    { strict: true },
    { message: 'Introduce una fecha de nacimiento válida.' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Introduce una fecha de nacimiento válida.',
  })
  childBirthDate?: string | null;
}
