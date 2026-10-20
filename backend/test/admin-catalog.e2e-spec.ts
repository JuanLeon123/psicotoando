import { ADMIN_EMAIL, ADMIN_PASSWORD, PREVIOUS_ENV } from './admin-env';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GoogleIdentityService } from '../src/auth/google-identity.service';
import { configureApp } from '../src/configure-app';
import { MailService } from '../src/mail/mail.service';
import { AdminAccountService } from '../src/users/admin-account.service';

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

describe('Admin panel and catalog (e2e)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  let uploadsDir: string;
  const sentResets: string[] = [];

  beforeAll(async () => {
    uploadsDir = process.env.UPLOADS_DIR!;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({
        sendPasswordReset: (to: string) => {
          sentResets.push(to);
          return Promise.resolve();
        },
      })
      .overrideProvider(GoogleIdentityService)
      .useValue({
        clientId: 'test-client-id.apps.googleusercontent.com',
        verify: () =>
          Promise.resolve({
            googleId: 'google-admin',
            email: ADMIN_EMAIL,
            fullName: 'Admin',
            avatarUrl: null,
          }),
      })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(DataSource);
  });

  beforeEach(async () => {
    await db.query(
      'TRUNCATE password_reset_tokens, sessions, users, products RESTART IDENTITY CASCADE',
    );
    await db.query(
      'UPDATE site_settings SET whatsapp_number = NULL, contact_email = NULL, instagram_url = NULL, facebook_url = NULL',
    );
    await app.get(AdminAccountService).onApplicationBootstrap();
    sentResets.length = 0;
  });

  afterAll(async () => {
    await app.close();
    await rm(uploadsDir, { recursive: true, force: true });
    process.env = PREVIOUS_ENV;
  });

  const api = () => request(app.getHttpServer());

  async function login(email: string, password: string): Promise<string> {
    const res = await api()
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  }

  const adminToken = () => login(ADMIN_EMAIL, ADMIN_PASSWORD);

  async function customerToken(): Promise<string> {
    const res = await api()
      .post('/api/auth/register')
      .send({
        fullName: 'Ana Cliente',
        email: 'ana@example.com',
        password: 'secreta123',
      })
      .expect(201);
    return (res.body as { accessToken: string }).accessToken;
  }

  async function createProduct(token: string, body: object = {}) {
    const res = await api()
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Kit Sensorial',
        summary: 'Texturas y colores para jugar en familia.',
        ...body,
      })
      .expect(201);
    return res.body as { id: string; slug: string; imageUrl: string | null };
  }

  describe('fixed admin account', () => {
    it('is created from the environment and signs in with role admin', async () => {
      const res = await api()
        .post('/api/auth/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .expect(200);
      expect(res.body.user).toMatchObject({
        email: ADMIN_EMAIL,
        role: 'admin',
      });
    });

    it('re-applies the env password if it was changed elsewhere', async () => {
      await db.query(`UPDATE users SET password_hash = 'x' WHERE email = $1`, [
        ADMIN_EMAIL,
      ]);
      await app.get(AdminAccountService).onApplicationBootstrap();
      await adminToken();
    });

    it('cannot change its password from the site or receive reset links', async () => {
      const token = await adminToken();
      await api()
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: ADMIN_PASSWORD, newPassword: 'otraClave1234' })
        .expect(403);
      await api()
        .post('/api/auth/forgot-password')
        .send({ email: ADMIN_EMAIL })
        .expect(204);
      expect(sentResets).toEqual([]);
    });

    it('cannot be taken over through Google sign-in', async () => {
      const res = await api()
        .post('/api/auth/google')
        .send({ credential: 'any' })
        .expect(401);
      expect(res.body.message).toBe(
        'Esta cuenta solo puede entrar con correo y contraseña.',
      );
      const [row] = await db.query<{ google_id: string | null }[]>(
        'SELECT google_id FROM users WHERE email = $1',
        [ADMIN_EMAIL],
      );
      expect(row.google_id).toBeNull();
    });

    it('registers customers with role customer', async () => {
      const token = await customerToken();
      const me = await api()
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(me.body.role).toBe('customer');
    });
  });

  describe('access control', () => {
    it('requires a session and the admin role for every admin endpoint', async () => {
      await api().get('/api/admin/products').expect(401);
      await api().get('/api/admin/summary').expect(401);
      await api().put('/api/admin/settings').send({}).expect(401);

      const customer = await customerToken();
      for (const path of ['/api/admin/products', '/api/admin/summary']) {
        const res = await api()
          .get(path)
          .set('Authorization', `Bearer ${customer}`)
          .expect(403);
        expect(res.body.message).toBe(
          'Esta sección es solo para administración.',
        );
      }
    });
  });

  describe('products', () => {
    it('creates, edits and lists products; the public store shows only published ones', async () => {
      const token = await adminToken();
      const draft = await createProduct(token, {
        contents: ['  18 actividades  ', '', 'Guía para familias'],
        priceCop: 120000,
        stock: 0,
      });
      expect(draft.slug).toBe('kit-sensorial');

      const published = await createProduct(token, {
        name: 'Kit Motricidad y Coordinación',
        published: true,
        sortOrder: 1,
      });
      expect(published.slug).toBe('kit-motricidad-y-coordinacion');

      const store = await api().get('/api/products').expect(200);
      expect(store.body).toHaveLength(1);
      expect(store.body[0]).toMatchObject({
        slug: 'kit-motricidad-y-coordinacion',
        priceCop: null,
        inStock: true,
      });
      expect(store.body[0]).not.toHaveProperty('published');
      await api().get('/api/products/kit-sensorial').expect(404);

      const edited = await api()
        .patch(`/api/admin/products/${draft.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ published: true, name: 'Kit Desarrollo Sensorial' })
        .expect(200);
      expect(edited.body).toMatchObject({
        slug: 'kit-desarrollo-sensorial',
        contents: ['18 actividades', 'Guía para familias'],
        stock: 0,
      });

      const detail = await api()
        .get('/api/products/kit-desarrollo-sensorial')
        .expect(200);
      expect(detail.body).toMatchObject({ priceCop: 120000, inStock: false });

      const admin = await api()
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(admin.body).toHaveLength(2);
    });

    it('gives each product a unique slug and validates input in Spanish', async () => {
      const token = await adminToken();
      await createProduct(token);
      const twin = await createProduct(token);
      expect(twin.slug).toBe('kit-sensorial-2');

      const invalid = await api()
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'K', summary: 'corta', priceCop: -1, slug: 'manual' })
        .expect(400);
      expect(invalid.body.message).toEqual(
        expect.arrayContaining(['property slug should not exist']),
      );

      const messages = await api()
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'K', summary: 'corta', priceCop: -1 })
        .expect(400);
      expect(messages.body.message).toEqual(
        expect.arrayContaining([
          'El nombre debe tener entre 2 y 120 caracteres.',
          'La descripción debe tener entre 10 y 500 caracteres.',
          'El precio no puede ser negativo.',
        ]),
      );
    });

    it('stores real images, rejects disguised files and cleans up on replace and delete', async () => {
      const token = await adminToken();
      const product = await createProduct(token);
      const upload = (buffer: Buffer, name: string) =>
        api()
          .post(`/api/admin/products/${product.id}/image`)
          .set('Authorization', `Bearer ${token}`)
          .attach('image', buffer, name);

      const fake = await upload(
        Buffer.from('no soy una imagen'),
        'foto.png',
      ).expect(400);
      expect(fake.body.message).toBe('La imagen debe ser JPG, PNG o WebP.');

      const first = await upload(PNG_1PX, 'a.png').expect(201);
      const url = (first.body as { imageUrl: string }).imageUrl;
      expect(url).toMatch(/^\/api\/uploads\/products\/[\w-]+\.png$/);
      await api()
        .get(url)
        .expect(200)
        .expect('Content-Type', /image\/png/);

      await upload(PNG_1PX, 'b.png').expect(201);
      expect(await readdir(join(uploadsDir, 'products'))).toHaveLength(1);
      await api().get(url).expect(404);

      await api()
        .delete(`/api/admin/products/${product.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
      expect(await readdir(join(uploadsDir, 'products'))).toHaveLength(0);
    });
  });

  describe('cart quote', () => {
    it('prices the cart from the database and flags lines that cannot be bought', async () => {
      const token = await adminToken();
      const sensorial = await createProduct(token, {
        published: true,
        priceCop: 120000,
      });
      const limited = await createProduct(token, {
        name: 'Kit Motricidad',
        published: true,
        priceCop: 95000,
        stock: 2,
      });
      const noPrice = await createProduct(token, {
        name: 'Kit Lenguaje',
        published: true,
      });
      const soldOut = await createProduct(token, {
        name: 'Kit Agotado',
        published: true,
        priceCop: 50000,
        stock: 0,
      });
      const draft = await createProduct(token, {
        name: 'Kit Borrador',
        priceCop: 10000,
      });

      const ok = await api()
        .post('/api/cart/quote')
        .send({
          items: [
            { productId: sensorial.id, quantity: 1 },
            { productId: limited.id, quantity: 3 },
            { productId: sensorial.id, quantity: 1 },
          ],
        })
        .expect(200);
      expect(ok.body).toMatchObject({
        itemCount: 4,
        subtotalCop: 2 * 120000 + 2 * 95000,
        purchasable: true,
      });
      expect(ok.body.lines).toEqual([
        expect.objectContaining({
          productId: sensorial.id,
          quantity: 2,
          unitPriceCop: 120000,
          lineTotalCop: 240000,
          issue: null,
        }),
        expect.objectContaining({
          productId: limited.id,
          requestedQuantity: 3,
          quantity: 2,
          maxQuantity: 2,
          issue: 'limited_stock',
        }),
      ]);

      const blocked = await api()
        .post('/api/cart/quote')
        .send({
          items: [
            { productId: sensorial.id, quantity: 1 },
            { productId: noPrice.id, quantity: 1 },
            { productId: soldOut.id, quantity: 1 },
            { productId: draft.id, quantity: 1 },
          ],
        })
        .expect(200);
      expect(blocked.body.purchasable).toBe(false);
      expect(blocked.body.subtotalCop).toBe(120000);
      expect(
        (blocked.body.lines as { issue: string | null }[]).map((l) => l.issue),
      ).toEqual([null, 'no_price', 'out_of_stock', 'unavailable']);
      expect(blocked.body.lines[3].product).toBeNull();
    });

    it('validates the cart in Spanish and accepts an empty one', async () => {
      const empty = await api()
        .post('/api/cart/quote')
        .send({ items: [] })
        .expect(200);
      expect(empty.body).toEqual({
        lines: [],
        itemCount: 0,
        subtotalCop: 0,
        purchasable: false,
      });

      const invalid = await api()
        .post('/api/cart/quote')
        .send({ items: [{ productId: 'abc', quantity: 50 }] })
        .expect(400);
      expect(invalid.body.message).toEqual(
        expect.arrayContaining([
          'Hay un producto no válido en el carrito.',
          'Puedes pedir hasta 20 unidades de cada producto.',
        ]),
      );
    });
  });

  describe('settings and summary', () => {
    it('lets the admin edit contact settings that anyone can read', async () => {
      const token = await adminToken();
      const saved = await api()
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          whatsappNumber: '+57 300 123 4567',
          contactEmail: '  hola@psicotoando.com ',
          instagramUrl: 'https://instagram.com/psicotoando',
          facebookUrl: '',
        })
        .expect(200);
      expect(saved.body).toMatchObject({
        whatsappNumber: '573001234567',
        contactEmail: 'hola@psicotoando.com',
        instagramUrl: 'https://instagram.com/psicotoando',
        facebookUrl: null,
      });
      const pub = await api().get('/api/settings').expect(200);
      expect(pub.body.whatsappNumber).toBe('573001234567');

      const invalid = await api()
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ instagramUrl: 'http://inseguro.com', whatsappNumber: '12' })
        .expect(400);
      expect(invalid.body.message).toEqual(
        expect.arrayContaining([
          'El enlace de Instagram debe empezar por https://',
        ]),
      );
    });

    it('summarises customers and products without counting the admin', async () => {
      await customerToken();
      const token = await adminToken();
      await createProduct(token, { published: true });
      await createProduct(token);
      const res = await api()
        .get('/api/admin/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toMatchObject({
        customers: { total: 1, last30Days: 1 },
        products: { total: 2, published: 1 },
      });
    });
  });
});
