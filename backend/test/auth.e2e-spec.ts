import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  GoogleIdentityService,
  GoogleProfile,
} from '../src/auth/google-identity.service';
import { configureApp } from '../src/configure-app';
import { MailService } from '../src/mail/mail.service';

const PASSWORD = 'secreta123';

describe('Auth and account (e2e)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  const sentResetUrls: string[] = [];
  const googleProfiles = new Map<string, GoogleProfile>();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({
        sendPasswordReset: (_to: string, _name: string, url: string) => {
          sentResetUrls.push(url);
          return Promise.resolve();
        },
      })
      .overrideProvider(GoogleIdentityService)
      .useValue({
        clientId: 'test-client-id.apps.googleusercontent.com',
        verify: (credential: string) => {
          const profile = googleProfiles.get(credential);
          return profile
            ? Promise.resolve(profile)
            : Promise.reject(
                new UnauthorizedException(
                  'No hemos podido verificar tu cuenta de Google.',
                ),
              );
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(DataSource);
  });

  beforeEach(async () => {
    await db.query(
      'TRUNCATE password_reset_tokens, sessions, users RESTART IDENTITY CASCADE',
    );
    sentResetUrls.length = 0;
    googleProfiles.clear();
  });

  afterAll(() => app.close());

  const api = () => request(app.getHttpServer());

  function refreshCookie(res: request.Response): string {
    const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    const cookie = cookies.find((c) => c.startsWith('pt_refresh='));
    if (!cookie) throw new Error('No refresh cookie');
    return cookie.split(';')[0];
  }

  function register(email = 'ana@example.com', password = PASSWORD) {
    return api()
      .post('/api/auth/register')
      .send({ fullName: 'Ana Prueba', email, password });
  }

  describe('register', () => {
    it('creates the account, returns the public user and sets a secure session cookie', async () => {
      const res = await register('  Ana@Example.COM ').expect(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        email: 'ana@example.com',
        fullName: 'Ana Prueba',
        hasPassword: true,
        googleLinked: false,
      });
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
      const cookie = ([] as string[])
        .concat(res.headers['set-cookie'])
        .find((c) => c.startsWith('pt_refresh='))!;
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Strict/);
      expect(cookie).toMatch(/Path=\/api\/auth/);

      const [row] = await db.query<{ password_hash: string }[]>(
        'SELECT password_hash FROM users',
      );
      expect(row.password_hash).toMatch(/^\$argon2id\$/);
    });

    it('rejects duplicated emails and weak or malformed input in Spanish', async () => {
      await register().expect(201);
      const duplicate = await register('ANA@example.com').expect(409);
      expect(duplicate.body.message).toBe(
        'Ya existe una cuenta con este correo.',
      );

      const invalid = await api()
        .post('/api/auth/register')
        .send({ fullName: 'A', email: 'no-es-correo', password: 'solotexto' })
        .expect(400);
      expect(invalid.body.message).toEqual(
        expect.arrayContaining([
          'El nombre debe tener entre 2 y 120 caracteres.',
          'Introduce un correo electrónico válido.',
          'La contraseña debe incluir al menos una letra y un número.',
        ]),
      );

      await api()
        .post('/api/auth/register')
        .send({
          fullName: 'Ana',
          email: 'b@example.com',
          password: PASSWORD,
          isAdmin: true,
        })
        .expect(400);
    });
  });

  describe('login', () => {
    it('accepts valid credentials and gives the same error for unknown email or wrong password', async () => {
      await register().expect(201);
      await api()
        .post('/api/auth/login')
        .send({ email: 'ANA@example.com', password: PASSWORD })
        .expect(200);

      const wrong = await api()
        .post('/api/auth/login')
        .send({ email: 'ana@example.com', password: 'otra12345' })
        .expect(401);
      const unknown = await api()
        .post('/api/auth/login')
        .send({ email: 'nadie@example.com', password: PASSWORD })
        .expect(401);
      expect(wrong.body.message).toBe('Correo o contraseña incorrectos.');
      expect(unknown.body.message).toBe(wrong.body.message);
    });
  });

  describe('sessions', () => {
    it('rotates the refresh token and rejects the previous one', async () => {
      const first = refreshCookie(await register().expect(201));
      const refreshed = await api()
        .post('/api/auth/refresh')
        .set('Cookie', first)
        .expect(200);
      expect(refreshed.body.user.email).toBe('ana@example.com');
      const second = refreshCookie(refreshed);
      expect(second).not.toBe(first);

      await api().post('/api/auth/refresh').set('Cookie', first).expect(401);
      await api().post('/api/auth/refresh').set('Cookie', second).expect(200);
    });

    it('revokes every session when an old rotated token is reused', async () => {
      const first = refreshCookie(await register().expect(201));
      const second = refreshCookie(
        await api().post('/api/auth/refresh').set('Cookie', first).expect(200),
      );
      // Simulate the stolen token being replayed after the grace window.
      await db.query(
        "UPDATE sessions SET revoked_at = now() - interval '1 minute' WHERE revoked_at IS NOT NULL",
      );
      await api().post('/api/auth/refresh').set('Cookie', first).expect(401);
      await api().post('/api/auth/refresh').set('Cookie', second).expect(401);
    });

    it('logs out by revoking the session and clearing the cookie', async () => {
      const registered = await register().expect(201);
      const cookie = refreshCookie(registered);
      const token = registered.body.accessToken as string;

      const res = await api()
        .post('/api/auth/logout')
        .set('Cookie', cookie)
        .expect(204);
      expect(String(res.headers['set-cookie'])).toMatch(/pt_refresh=;/);
      await api().post('/api/auth/refresh').set('Cookie', cookie).expect(401);
      await api()
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('rejects refresh without cookie and protected routes without token', async () => {
      await api().post('/api/auth/refresh').expect(401);
      await api().get('/api/users/me').expect(401);
      await api()
        .get('/api/users/me')
        .set('Authorization', 'Bearer no-es-un-jwt')
        .expect(401);
    });
  });

  describe('my account', () => {
    it('reads and updates the profile, clearing optional fields with empty values', async () => {
      const token = (await register().expect(201)).body.accessToken as string;
      const auth = { Authorization: `Bearer ${token}` };

      const updated = await api()
        .patch('/api/users/me')
        .set(auth)
        .send({
          fullName: '  Ana María  ',
          phone: '+57 300 123 4567',
          childName: 'Lucas',
          childBirthDate: '2021-03-04',
        })
        .expect(200);
      expect(updated.body).toMatchObject({
        fullName: 'Ana María',
        phone: '+57 300 123 4567',
        childName: 'Lucas',
        childBirthDate: '2021-03-04',
      });

      const cleared = await api()
        .patch('/api/users/me')
        .set(auth)
        .send({ phone: '', childName: null })
        .expect(200);
      expect(cleared.body).toMatchObject({ phone: null, childName: null });

      await api()
        .patch('/api/users/me')
        .set(auth)
        .send({ childBirthDate: '2999-01-01' })
        .expect(400);
      await api()
        .patch('/api/users/me')
        .set(auth)
        .send({ email: 'otra@example.com' })
        .expect(400);

      const me = await api().get('/api/users/me').set(auth).expect(200);
      expect(me.body.fullName).toBe('Ana María');
    });

    it('changes the password with the current one and signs out other sessions', async () => {
      const current = (await register().expect(201)).body.accessToken as string;
      const other = refreshCookie(
        await api()
          .post('/api/auth/login')
          .send({ email: 'ana@example.com', password: PASSWORD })
          .expect(200),
      );
      const auth = { Authorization: `Bearer ${current}` };

      const wrong = await api()
        .patch('/api/users/me/password')
        .set(auth)
        .send({ currentPassword: 'mala12345', newPassword: 'nueva1234' })
        .expect(400);
      expect(wrong.body.message).toBe('La contraseña actual no es correcta.');

      await api()
        .patch('/api/users/me/password')
        .set(auth)
        .send({ currentPassword: PASSWORD, newPassword: 'nueva1234' })
        .expect(204);
      await api().get('/api/users/me').set(auth).expect(200);
      await api().post('/api/auth/refresh').set('Cookie', other).expect(401);
      await api()
        .post('/api/auth/login')
        .send({ email: 'ana@example.com', password: 'nueva1234' })
        .expect(200);
    });
  });

  describe('password reset', () => {
    it('answers the same for unknown emails and sends a single-use link for known ones', async () => {
      const session = refreshCookie(await register().expect(201));
      await api()
        .post('/api/auth/forgot-password')
        .send({ email: 'nadie@example.com' })
        .expect(204);
      expect(sentResetUrls).toHaveLength(0);

      await api()
        .post('/api/auth/forgot-password')
        .send({ email: 'ana@example.com' })
        .expect(204);
      expect(sentResetUrls).toHaveLength(1);
      const url = new URL(sentResetUrls[0]);
      expect(url.pathname).toBe('/restablecer-contrasena');
      const token = url.searchParams.get('token')!;

      await api()
        .post('/api/auth/reset-password')
        .send({ token, password: 'nueva1234' })
        .expect(204);
      const reused = await api()
        .post('/api/auth/reset-password')
        .send({ token, password: 'otra12345' })
        .expect(400);
      expect(reused.body.message).toBe('El enlace no es válido o ha caducado.');

      await api().post('/api/auth/refresh').set('Cookie', session).expect(401);
      await api()
        .post('/api/auth/login')
        .send({ email: 'ana@example.com', password: 'nueva1234' })
        .expect(200);
    });

    it('invalidates earlier links when a new one is requested and rejects expired ones', async () => {
      await register().expect(201);
      for (let i = 0; i < 2; i++) {
        await api()
          .post('/api/auth/forgot-password')
          .send({ email: 'ana@example.com' })
          .expect(204);
      }
      const [older, newer] = sentResetUrls.map((u) =>
        new URL(u).searchParams.get('token')!,
      );
      await api()
        .post('/api/auth/reset-password')
        .send({ token: older, password: 'nueva1234' })
        .expect(400);

      await db.query(
        "UPDATE password_reset_tokens SET expires_at = now() - interval '1 second'",
      );
      await api()
        .post('/api/auth/reset-password')
        .send({ token: newer, password: 'nueva1234' })
        .expect(400);
    });
  });

  describe('google', () => {
    const profile: GoogleProfile = {
      googleId: 'google-123',
      email: 'ana@example.com',
      fullName: 'Ana Google',
      avatarUrl: 'https://example.com/ana.png',
    };

    it('exposes the client id', async () => {
      const res = await api().get('/api/auth/providers').expect(200);
      expect(res.body).toEqual({
        google: { clientId: 'test-client-id.apps.googleusercontent.com' },
      });
    });

    it('creates a passwordless account, then reuses it on the next sign-in', async () => {
      googleProfiles.set('valid-credential', profile);
      const first = await api()
        .post('/api/auth/google')
        .send({ credential: 'valid-credential' })
        .expect(200);
      expect(first.body.user).toMatchObject({
        email: 'ana@example.com',
        fullName: 'Ana Google',
        hasPassword: false,
        googleLinked: true,
      });
      refreshCookie(first);

      const second = await api()
        .post('/api/auth/google')
        .send({ credential: 'valid-credential' })
        .expect(200);
      expect(second.body.user.id).toBe(first.body.user.id);

      // A Google-only account cannot log in with a password until it sets one.
      await api()
        .post('/api/auth/login')
        .send({ email: 'ana@example.com', password: PASSWORD })
        .expect(401);
      await api()
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${second.body.accessToken}`)
        .send({ newPassword: 'nueva1234' })
        .expect(204);
      await api()
        .post('/api/auth/login')
        .send({ email: 'ana@example.com', password: 'nueva1234' })
        .expect(200);
    });

    it('links Google to an existing account with the same email', async () => {
      const registered = await register().expect(201);
      googleProfiles.set('valid-credential', profile);
      const res = await api()
        .post('/api/auth/google')
        .send({ credential: 'valid-credential' })
        .expect(200);
      expect(res.body.user).toMatchObject({
        id: registered.body.user.id,
        fullName: 'Ana Prueba',
        hasPassword: true,
        googleLinked: true,
      });
    });

    it('rejects credentials that fail verification', async () => {
      const res = await api()
        .post('/api/auth/google')
        .send({ credential: 'forged' })
        .expect(401);
      expect(res.body.message).toBe(
        'No hemos podido verificar tu cuenta de Google.',
      );
      const [{ count }] = await db.query<{ count: string }[]>(
        'SELECT count(*) FROM users',
      );
      expect(count).toBe('0');
    });
  });
});
