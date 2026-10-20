import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { generateToken, hashToken } from '../common/tokens';
import { MailService } from '../mail/mail.service';
import { PublicUser, toPublicUser, User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleIdentityService } from './google-identity.service';
import { PasswordResetToken } from './password-reset-token.entity';
import { SessionsService } from './sessions.service';

export interface AuthResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: PublicUser;
}

export interface AccessTokenPayload {
  readonly sub: string;
  readonly sid: string;
}

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.';
const INVALID_RESET_LINK = 'El enlace no es válido o ha caducado.';
const EMAIL_TAKEN = 'Ya existe una cuenta con este correo.';
const PG_UNIQUE_VIOLATION = '23505';
const ADMIN_PASSWORD_ONLY =
  'Esta cuenta solo puede entrar con correo y contraseña.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** Verified against when the email is unknown, so response time does not reveal accounts. */
  private readonly dummyHash = argon2.hash(generateToken());

  constructor(
    private readonly users: UsersService,
    private readonly sessions: SessionsService,
    private readonly google: GoogleIdentityService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokens: Repository<PasswordResetToken>,
  ) {}

  async register(dto: RegisterDto, userAgent?: string): Promise<AuthResult> {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException(EMAIL_TAKEN);
    }
    let user: User;
    try {
      user = await this.users.create({
        email: dto.email,
        fullName: dto.fullName,
        passwordHash: await argon2.hash(dto.password),
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(EMAIL_TAKEN);
      throw error;
    }
    return this.issue(user, userAgent);
  }

  async login(dto: LoginDto, userAgent?: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const valid = await argon2.verify(hash, dto.password);
    if (!user?.passwordHash || !valid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return this.issue(user, userAgent);
  }

  async loginWithGoogle(
    credential: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    const profile = await this.google.verify(credential);
    let user = await this.users.findByGoogleId(profile.googleId);
    if (!user) {
      // Google has verified ownership of the address, so an existing account is linked.
      user = await this.users.findByEmail(profile.email);
      if (user?.role === 'admin') {
        // The admin account only signs in with its fixed credentials.
        throw new UnauthorizedException(ADMIN_PASSWORD_ONLY);
      }
      if (user) {
        user.googleId = profile.googleId;
        user.avatarUrl ??= profile.avatarUrl;
        user = await this.users.save(user);
      } else {
        user = await this.users.create({
          email: profile.email,
          fullName: profile.fullName,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
          passwordHash: null,
        });
      }
    }
    return this.issue(user, userAgent);
  }

  async refresh(refreshToken: string, userAgent?: string): Promise<AuthResult> {
    const { session, refreshToken: nextToken } = await this.sessions.rotate(
      refreshToken,
      userAgent,
    );
    const user = await this.users.findById(session.userId);
    if (!user) throw new UnauthorizedException();
    return {
      accessToken: await this.signAccessToken(user.id, session.id),
      refreshToken: nextToken,
      user: toPublicUser(user),
    };
  }

  logout(refreshToken: string): Promise<void> {
    return this.sessions.revoke(refreshToken);
  }

  /** Always resolves the same way, whether or not the account exists. */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    // The admin password lives in the server configuration, not in reset links.
    if (!user || user.role === 'admin') return;

    await this.resetTokens.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );
    const token = generateToken();
    const ttlMinutes = this.config.getOrThrow<number>(
      'PASSWORD_RESET_TTL_MINUTES',
    );
    await this.resetTokens.save(
      this.resetTokens.create({
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
      }),
    );
    const resetUrl = new URL(
      '/restablecer-contrasena',
      this.config.getOrThrow<string>('FRONTEND_URL'),
    );
    resetUrl.searchParams.set('token', token);
    try {
      await this.mail.sendPasswordReset(
        user.email,
        user.fullName,
        resetUrl.toString(),
        ttlMinutes,
      );
    } catch (error) {
      // The response must not reveal whether an account exists, so mail errors are only logged.
      this.logger.error(
        'No se pudo enviar el correo de restablecimiento',
        error,
      );
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const claimed = await this.resetTokens
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ usedAt: () => 'now()' })
      .where('token_hash = :tokenHash', { tokenHash: hashToken(dto.token) })
      .andWhere('used_at IS NULL')
      .andWhere('expires_at > now()')
      .returning('user_id')
      .execute();
    const row = (claimed.raw as { user_id: string }[])[0];
    const user = row && (await this.users.findById(row.user_id));
    if (!user) throw new BadRequestException(INVALID_RESET_LINK);

    user.passwordHash = await argon2.hash(dto.password);
    await this.users.save(user);
    await this.sessions.revokeAllForUser(user.id);
  }

  async changePassword(
    userId: string,
    currentSessionId: string,
    currentPassword: string | undefined,
    newPassword: string,
  ): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    if (user.role === 'admin') {
      throw new ForbiddenException(
        'La contraseña del administrador se cambia en la configuración del servidor (ADMIN_PASSWORD).',
      );
    }
    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestException('Introduce tu contraseña actual.');
      }
      if (!(await argon2.verify(user.passwordHash, currentPassword))) {
        throw new BadRequestException('La contraseña actual no es correcta.');
      }
    }
    user.passwordHash = await argon2.hash(newPassword);
    await this.users.save(user);
    await this.sessions.revokeAllForUser(user.id, currentSessionId);
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token);
  }

  private async issue(user: User, userAgent?: string): Promise<AuthResult> {
    const { session, refreshToken } = await this.sessions.create(
      user.id,
      userAgent,
    );
    return {
      accessToken: await this.signAccessToken(user.id, session.id),
      refreshToken,
      user: toPublicUser(user),
    };
  }

  private signAccessToken(userId: string, sessionId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId, sid: sessionId };
    return this.jwt.signAsync(payload);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}
