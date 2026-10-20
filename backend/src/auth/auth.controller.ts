import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { PublicUser } from '../users/user.entity';
import { AuthResult, AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleIdentityService } from './google-identity.service';
import { SESSION_EXPIRED_MESSAGE } from './sessions.service';

export const REFRESH_COOKIE = 'pt_refresh';
const REFRESH_COOKIE_PATH = '/api/auth';
/** Stricter limit for endpoints that accept credentials or send email. */
const SENSITIVE = { default: { limit: 10, ttl: 60_000 } };

interface AuthResponse {
  readonly accessToken: string;
  readonly user: PublicUser;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleIdentityService,
    private readonly config: ConfigService,
  ) {}

  @Get('providers')
  providers() {
    const clientId = this.google.clientId;
    return { google: clientId ? { clientId } : null };
  }

  @Throttle(SENSITIVE)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.respond(res, await this.auth.register(dto, userAgent));
  }

  @Throttle(SENSITIVE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.respond(res, await this.auth.login(dto, userAgent));
  }

  @Throttle(SENSITIVE)
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.respond(
      res,
      await this.auth.loginWithGoogle(dto.credential, userAgent),
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const token = readRefreshCookie(req);
    if (!token) throw new UnauthorizedException(SESSION_EXPIRED_MESSAGE);
    try {
      return this.respond(res, await this.auth.refresh(token, userAgent));
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const token = readRefreshCookie(req);
    if (token) await this.auth.logout(token);
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  @Throttle(SENSITIVE)
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.auth.forgotPassword(dto.email);
  }

  @Throttle(SENSITIVE)
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.auth.resetPassword(dto);
  }

  private respond(res: Response, result: AuthResult): AuthResponse {
    const days = this.config.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      ...this.cookieOptions(),
      maxAge: days * 86_400_000,
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<boolean>('COOKIE_SECURE'),
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
    };
  }
}

function readRefreshCookie(req: Request): string | undefined {
  const value = (req.cookies as Record<string, unknown> | undefined)?.[
    REFRESH_COOKIE
  ];
  return typeof value === 'string' && value ? value : undefined;
}
