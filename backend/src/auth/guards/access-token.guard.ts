import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { SESSION_EXPIRED_MESSAGE, SessionsService } from '../sessions.service';

export interface RequestAuth {
  readonly userId: string;
  readonly sessionId: string;
}

export type AuthenticatedRequest = Request & { auth: RequestAuth };

/** Requires a valid Bearer access token whose session has not been revoked. */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Inicia sesión para continuar.');
    }
    let payload;
    try {
      payload = await this.auth.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException(SESSION_EXPIRED_MESSAGE);
    }
    if (!(await this.sessions.isActive(payload.sid, payload.sub))) {
      throw new UnauthorizedException(SESSION_EXPIRED_MESSAGE);
    }
    request.auth = { userId: payload.sub, sessionId: payload.sid };
    return true;
  }
}
