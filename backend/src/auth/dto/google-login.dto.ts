import { IsString, Length } from 'class-validator';

export class GoogleLoginDto {
  @IsString({ message: 'Falta la credencial de Google.' })
  @Length(1, 4096, { message: 'Falta la credencial de Google.' })
  credential!: string;
}
