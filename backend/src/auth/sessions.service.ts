import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import { generateToken, hashToken } from '../common/tokens';
import { Session } from './session.entity';

/** A rotated token presented again after this window is treated as stolen. */
const REUSE_GRACE_MS = 30_000;

export const SESSION_EXPIRED_MESSAGE =
  'Tu sesión ha caducado. Inicia sesión de nuevo.';

export interface IssuedSession {
  readonly session: Session;
  readonly refreshToken: string;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, userAgent?: string): Promise<IssuedSession> {
    const refreshToken = generateToken();
    const ttlDays = this.config.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
    const session = await this.sessions.save(
      this.sessions.create({
        userId,
        tokenHash: hashToken(refreshToken),
        userAgent: userAgent?.slice(0, 255) ?? null,
        expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
        lastUsedAt: new Date(),
      }),
    );
    return { session, refreshToken };
  }

  /**
   * Exchanges a refresh token for a new one. The old session is revoked
   * atomically, so two concurrent calls with the same token cannot both win.
   */
  async rotate(
    refreshToken: string,
    userAgent?: string,
  ): Promise<IssuedSession> {
    const tokenHash = hashToken(refreshToken);
    const claimed = await this.sessions
      .createQueryBuilder()
      .update(Session)
      .set({ revokedAt: () => 'now()' })
      .where('token_hash = :tokenHash', { tokenHash })
      .andWhere('revoked_at IS NULL')
      .andWhere('expires_at > now()')
      .returning('id, user_id')
      .execute();

    const row = (claimed.raw as { id: string; user_id: string }[])[0];
    if (!row) {
      await this.handleInvalidToken(tokenHash);
      throw new UnauthorizedException(SESSION_EXPIRED_MESSAGE);
    }
    return this.create(row.user_id, userAgent);
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.sessions.update(
      { tokenHash: hashToken(refreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllForUser(
    userId: string,
    exceptSessionId?: string,
  ): Promise<void> {
    await this.sessions.update(
      {
        userId,
        revokedAt: IsNull(),
        ...(exceptSessionId ? { id: Not(exceptSessionId) } : {}),
      },
      { revokedAt: new Date() },
    );
  }

  async isActive(sessionId: string, userId: string): Promise<boolean> {
    return this.sessions.existsBy({
      id: sessionId,
      userId,
      revokedAt: IsNull(),
      expiresAt: MoreThan(new Date()),
    });
  }

  /** Reuse of a token rotated a while ago means it leaked: end every session of that user. */
  private async handleInvalidToken(tokenHash: string): Promise<void> {
    const session = await this.sessions.findOneBy({ tokenHash });
    if (
      session?.revokedAt &&
      Date.now() - session.revokedAt.getTime() > REUSE_GRACE_MS
    ) {
      await this.revokeAllForUser(session.userId);
    }
  }
}
