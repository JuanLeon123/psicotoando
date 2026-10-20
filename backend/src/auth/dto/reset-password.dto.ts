import { IsString, Length } from 'class-validator';
import { StrongPassword } from '../../common/validation';

export class ResetPasswordDto {
  @IsString({ message: 'El enlace no es válido o ha caducado.' })
  @Length(1, 200, { message: 'El enlace no es válido o ha caducado.' })
  token!: string;

  @StrongPassword()
  password!: string;
}
