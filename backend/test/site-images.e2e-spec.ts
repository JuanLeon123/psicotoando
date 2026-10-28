import { ADMIN_EMAIL, ADMIN_PASSWORD, PREVIOUS_ENV } from './admin-env';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { rm } from 'node:fs/promises';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { MailService } from '../src/mail/mail.service';
import { AdminAccountService } from '../src/users/admin-account.service';

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const FAKE_MP4 = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x18]),
  Buffer.from('ftypisom', 'ascii'),
  Buffer.alloc(64),
]);

describe('Site images (e2e)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendPasswordReset: () => Promise.resolve() })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(DataSource);
  });

  beforeEach(async () => {
    await db.query(
      'TRUNCATE password_reset_tokens, sessions, users, site_images, media RESTART IDENTITY CASCADE',
    );
    await app.get(AdminAccountService).onApplicationBootstrap();
    const res = await api()
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);
    token = (res.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
    await rm(process.env.UPLOADS_DIR!, { recursive: true, force: true });
    process.env = PREVIOUS_ENV;
  });

  const api = () => request(app.getHttpServer());
  const admin = (method: 'put' | 'post' | 'delete', path: string) =>
    api()[method](path).set('Authorization', `Bearer ${token}`);

  async function upload(file: Buffer, name: string): Promise<string> {
    const res = await admin('post', '/api/admin/blog/media')
      .attach('file', file, name)
      .expect(201);
    return (res.body as { id: string }).id;
  }

  const choice = (mediaId: string) => ({
    mediaId,
    alt: '  Mamá e hijo juegan con bloques.  ',
    focusX: 30,
    focusY: 70,
  });

  it('starts empty, so every slot shows its original image', async () => {
    const res = await api().get('/api/site-images').expect(200);
    expect(res.body).toEqual({});
  });

  it('requires the admin account to change a slot', async () => {
    await api().put('/api/admin/site-images/home.hero').send({}).expect(401);
    await api().delete('/api/admin/site-images/home.hero').expect(401);
  });

  it('assigns a library image to a slot, replaces it and restores the original', async () => {
    const first = await upload(PNG_1PX, 'portada.png');
    const saved = await admin('put', '/api/admin/site-images/home.hero')
      .send(choice(first))
      .expect(200);
    expect(saved.body).toEqual({
      mediaId: first,
      url: expect.stringMatching(/^\/api\/uploads\/blog\/[\w-]+\.png$/),
      alt: 'Mamá e hijo juegan con bloques.',
      focusX: 30,
      focusY: 70,
    });

    const second = await upload(PNG_1PX, 'otra.png');
    await admin('put', '/api/admin/site-images/home.hero')
      .send({ ...choice(second), focusX: 50 })
      .expect(200);
    const listed = await api().get('/api/site-images').expect(200);
    const body = listed.body as Record<string, { url: string; focusX: number }>;
    expect(Object.keys(body)).toEqual(['home.hero']);
    expect(body['home.hero'].focusX).toBe(50);
    expect(body['home.hero'].url).not.toBe(saved.body.url);

    await admin('delete', '/api/admin/site-images/home.hero').expect(204);
    expect((await api().get('/api/site-images')).body).toEqual({});
    // Restaurar es idempotente.
    await admin('delete', '/api/admin/site-images/home.hero').expect(204);
  });

  it('falls back to the original image when the photo is deleted from the library', async () => {
    const id = await upload(PNG_1PX, 'portada.png');
    await admin('put', '/api/admin/site-images/about.story')
      .send(choice(id))
      .expect(200);
    await admin('delete', `/api/admin/blog/media/${id}`).expect(204);
    expect((await api().get('/api/site-images')).body).toEqual({});
  });

  it('rejects unknown slots, videos, missing media and bad focus points', async () => {
    const image = await upload(PNG_1PX, 'portada.png');
    await admin('put', '/api/admin/site-images/home.nope')
      .send(choice(image))
      .expect(404);
    await admin('delete', '/api/admin/site-images/home.nope').expect(404);

    const video = await upload(FAKE_MP4, 'clip.mp4');
    await admin('put', '/api/admin/site-images/home.hero')
      .send(choice(video))
      .expect(400);

    await admin('put', '/api/admin/site-images/home.hero')
      .send(choice('5b0f5f6e-7d1c-4c55-9a3e-2f4f1d1c9a10'))
      .expect(404);

    await admin('put', '/api/admin/site-images/home.hero')
      .send({ ...choice(image), focusY: 101 })
      .expect(400);
  });
});
