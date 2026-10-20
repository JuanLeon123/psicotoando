import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
  readonly googleId: string;
  readonly email: string;
  readonly fullName: string;
  readonly avatarUrl: string | null;
}

const INVALID_GOOGLE_MESSAGE = 'No hemos podido verificar tu cuenta de Google.';

@Injectable()
export class GoogleIdentityService {
  private readonly client = new OAuth2Client();

  constructor(private readonly config: ConfigService) {}

  get clientId(): string | null {
    return this.config.get<string>('GOOGLE_CLIENT_ID') || null;
  }

  /** Verifies a Google Identity Services ID token (signature, audience, expiry). */
  async verify(credential: string): Promise<GoogleProfile> {
    const audience = this.clientId;
    if (!audience) {
      throw new UnauthorizedException(
        'El inicio de sesión con Google no está disponible.',
      );
    }
    let payload;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException(INVALID_GOOGLE_MESSAGE);
    }
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new UnauthorizedException(INVALID_GOOGLE_MESSAGE);
    }
    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      fullName: (payload.name ?? payload.email.split('@')[0]).slice(0, 120),
      avatarUrl: payload.picture?.slice(0, 500) ?? null,
    };
  }
}
