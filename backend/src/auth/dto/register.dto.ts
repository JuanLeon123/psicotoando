import {
  FullName,
  NormalizedEmail,
  StrongPassword,
} from '../../common/validation';

export class RegisterDto {
  @FullName()
  fullName!: string;

  @NormalizedEmail()
  email!: string;

  @StrongPassword()
  password!: string;
}
