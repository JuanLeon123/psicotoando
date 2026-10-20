import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { RequestAuth } from '../auth/guards/access-token.guard';
import { CurrentAuth } from '../auth/guards/current-auth.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PublicUser, toPublicUser } from './user.entity';
import { UsersService } from './users.service';

@Controller('users/me')
@UseGuards(AccessTokenGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async me(@CurrentAuth() auth: RequestAuth): Promise<PublicUser> {
    return toPublicUser(await this.findUser(auth.userId));
  }

  @Patch()
  async update(
    @CurrentAuth() auth: RequestAuth,
    @Body() dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    if (dto.childBirthDate && !isPlausibleBirthDate(dto.childBirthDate)) {
      throw new BadRequestException(
        'La fecha de nacimiento no puede ser futura ni anterior a 1990.',
      );
    }
    const user = await this.findUser(auth.userId);
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.childName !== undefined) user.childName = dto.childName;
    if (dto.childBirthDate !== undefined) {
      user.childBirthDate = dto.childBirthDate;
    }
    return toPublicUser(await this.users.save(user));
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentAuth() auth: RequestAuth,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.auth.changePassword(
      auth.userId,
      auth.sessionId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  private async findUser(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('No encontramos tu cuenta.');
    return user;
  }
}

function isPlausibleBirthDate(value: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return value >= '1990-01-01' && value <= today;
}
