import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';

/**
 * Keeps the fixed admin account in sync with ADMIN_EMAIL / ADMIN_PASSWORD:
 * creates it on first boot, and re-hashes the password when the env changes.
 */
@Injectable()
export class AdminAccountService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminAccountService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL')?.toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;

    const existing = await this.users.findByEmail(email);
    if (!existing) {
      await this.users.create({
        email,
        fullName: this.config.getOrThrow<string>('ADMIN_NAME'),
        passwordHash: await argon2.hash(password),
        role: 'admin',
      });
      this.logger.log(`Cuenta de administración creada: ${email}`);
      return;
    }
    const passwordMatches = await verifyPassword(
      existing.passwordHash,
      password,
    );
    if (existing.role === 'admin' && passwordMatches) return;

    existing.role = 'admin';
    if (!passwordMatches) existing.passwordHash = await argon2.hash(password);
    await this.users.save(existing);
    this.logger.log(`Cuenta de administración actualizada: ${email}`);
  }
}

/** A missing or malformed stored hash simply counts as "does not match". */
async function verifyPassword(
  hash: string | null,
  password: string,
): Promise<boolean> {
  if (!hash) return false;
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
