import { IsOptional, IsString, Length } from 'class-validator';
import { StrongPassword } from '../../common/validation';

export class ChangePasswordDto {
  @IsOptional()
  @IsString({ message: 'Introduce tu contraseña actual.' })
  @Length(1, 128, { message: 'Introduce tu contraseña actual.' })
  currentPassword?: string;

  @StrongPassword()
  newPassword!: string;
}
