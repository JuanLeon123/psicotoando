import { NormalizedEmail } from '../../common/validation';

export class ForgotPasswordDto {
  @NormalizedEmail()
  email!: string;
}
