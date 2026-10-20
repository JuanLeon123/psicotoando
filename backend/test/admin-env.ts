// Imported before AppModule: ConfigModule reads process.env when the module loads,
// and process.env wins over .env.test, so the admin exists only in suites that import this.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const ADMIN_EMAIL = 'admin@psicotoando.com';
export const ADMIN_PASSWORD = 'clave-admin-segura-2026';
export const PREVIOUS_ENV = { ...process.env };

process.env.ADMIN_EMAIL = ADMIN_EMAIL;
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.UPLOADS_DIR = mkdtempSync(join(tmpdir(), 'psicotoando-uploads-'));
