import { IsString, Length } from 'class-validator';
import { NormalizedEmail } from '../../common/validation';

export class LoginDto {
  @NormalizedEmail()
  email!: string;

  // Only bounded here: strength rules apply when a password is set, not on login.
  @IsString({ message: 'Introduce tu contraseña.' })
  @Length(1, 128, { message: 'Introduce tu contraseña.' })
  password!: string;
}
