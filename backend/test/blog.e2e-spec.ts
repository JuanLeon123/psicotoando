import { ADMIN_EMAIL, ADMIN_PASSWORD, PREVIOUS_ENV } from './admin-env';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
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
/** Cabecera mínima de un MP4: tamaño de caja + «ftyp» + marca. */
const FAKE_MP4 = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x18]),
  Buffer.from('ftypisom', 'ascii'),
  Buffer.alloc(64),
]);

describe('Blog (e2e)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  let uploadsDir: string;
  let token: string;

  beforeAll(async () => {
    uploadsDir = process.env.UPLOADS_DIR!;
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
      'TRUNCATE password_reset_tokens, sessions, users, posts, media RESTART IDENTITY CASCADE',
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
    await rm(uploadsDir, { recursive: true, force: true });
    process.env = PREVIOUS_ENV;
  });

  const api = () => request(app.getHttpServer());
  const admin = (method: 'get' | 'post' | 'patch' | 'delete', path: string) =>
    api()[method](path).set('Authorization', `Bearer ${token}`);

  async function createPost(body: object = {}) {
    const res = await admin('post', '/api/admin/blog/posts')
      .send({ title: 'Cuidar a quien cuida', ...body })
      .expect(201);
    return res.body as {
      id: string;
      slug: string;
      status: string;
      publishedAt: string | null;
    };
  }

  describe('access control', () => {
    it('requires the admin account for every admin endpoint', async () => {
      await api().get('/api/admin/blog/posts').expect(401);
      await api().get('/api/admin/blog/media').expect(401);
      const customer = await api()
        .post('/api/auth/register')
        .send({
          fullName: 'Ana Cliente',
          email: 'ana@example.com',
          password: 'secreta123',
        })
        .expect(201);
      await api()
        .get('/api/admin/blog/posts')
        .set(
          'Authorization',
          `Bearer ${(customer.body as { accessToken: string }).accessToken}`,
        )
        .expect(403);
    });
  });

  describe('posts', () => {
    it('keeps drafts private and publishes with a date', async () => {
      const draft = await createPost({
        excerpt: 'Un resumen.',
        blocks: [{ type: 'paragraph', text: 'Hola familias.' }],
      });
      expect(draft).toMatchObject({
        slug: 'cuidar-a-quien-cuida',
        status: 'draft',
        publishedAt: null,
      });
      await api().get('/api/blog/posts/cuidar-a-quien-cuida').expect(404);
      expect((await api().get('/api/blog/posts').expect(200)).body.total).toBe(
        0,
      );

      const published = await admin(
        'patch',
        `/api/admin/blog/posts/${draft.id}`,
      )
        .send({ status: 'published' })
        .expect(200);
      expect(published.body.publishedAt).toEqual(expect.any(String));

      const detail = await api()
        .get('/api/blog/posts/cuidar-a-quien-cuida')
        .expect(200);
      expect(detail.body).toMatchObject({
        title: 'Cuidar a quien cuida',
        blocks: [{ type: 'paragraph', text: 'Hola familias.' }],
        readingMinutes: 1,
      });
      expect(detail.body).not.toHaveProperty('status');

      const list = await api().get('/api/blog/posts').expect(200);
      expect(list.body.items[0]).not.toHaveProperty('blocks');
    });

    it('hides posts scheduled for the future', async () => {
      await createPost({
        status: 'published',
        publishedAt: new Date(Date.now() + 86_400_000).toISOString(),
      });
      expect((await api().get('/api/blog/posts').expect(200)).body.total).toBe(
        0,
      );
    });

    it('generates unique slugs', async () => {
      await createPost();
      const twin = await createPost();
      expect(twin.slug).toBe('cuidar-a-quien-cuida-2');
    });

    it('paginates newest first and filters by category', async () => {
      for (let i = 1; i <= 4; i++) {
        await createPost({
          title: `Artículo ${i}`,
          category: i % 2 ? 'Juego' : 'Familia',
          status: 'published',
          publishedAt: new Date(Date.UTC(2026, 0, i)).toISOString(),
        });
      }
      const first = await api()
        .get('/api/blog/posts?page=1&pageSize=3')
        .expect(200);
      expect(first.body).toMatchObject({
        total: 4,
        page: 1,
        pageSize: 3,
        categories: ['Familia', 'Juego'],
      });
      expect(
        (first.body.items as { title: string }[]).map((p) => p.title),
      ).toEqual(['Artículo 4', 'Artículo 3', 'Artículo 2']);

      const second = await api()
        .get('/api/blog/posts?page=2&pageSize=3')
        .expect(200);
      expect(second.body.items).toHaveLength(1);

      const juego = await api()
        .get('/api/blog/posts?category=Juego')
        .expect(200);
      expect(juego.body.total).toBe(2);

      await api().get('/api/blog/posts?pageSize=100').expect(400);
    });

    it('validates blocks strictly and normalizes YouTube links', async () => {
      const ok = await createPost({
        blocks: [
          { type: 'heading', text: '  Jugar en casa  ' },
          {
            type: 'youtube',
            videoId: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            caption: '',
          },
          {
            type: 'image',
            url: 'images/resources-family.webp',
            alt: 'Mamá e hija jugando.',
            extra: 'se descarta',
          },
          { type: 'list', items: ['uno', '', ' dos '] },
          { type: 'quote', text: 'Crecemos en familia.' },
        ],
      });
      const detail = await admin(
        'get',
        `/api/admin/blog/posts/${ok.id}`,
      ).expect(200);
      expect(detail.body.blocks).toEqual([
        { type: 'heading', text: 'Jugar en casa' },
        { type: 'youtube', videoId: 'dQw4w9WgXcQ' },
        {
          type: 'image',
          url: 'images/resources-family.webp',
          alt: 'Mamá e hija jugando.',
        },
        { type: 'list', items: ['uno', 'dos'] },
        { type: 'quote', text: 'Crecemos en familia.' },
      ]);

      const cases: [object, string][] = [
        [
          { type: 'script', text: 'x' },
          'Bloque 1: tipo de bloque no permitido.',
        ],
        [
          { type: 'image', url: 'https://evil.example/x.png', alt: 'x' },
          'Bloque 1: la imagen debe ser un archivo subido a la web.',
        ],
        [
          { type: 'youtube', videoId: 'https://vimeo.com/123' },
          'Bloque 1: el enlace de YouTube no es válido.',
        ],
        [
          { type: 'image', url: '/api/uploads/../secret.png', alt: 'x' },
          'Bloque 1: la imagen debe ser un archivo subido a la web.',
        ],
        [
          { type: 'paragraph', text: '   ' },
          'Bloque 1: el párrafo no puede estar vacío.',
        ],
      ];
      for (const [block, message] of cases) {
        const res = await admin('post', '/api/admin/blog/posts')
          .send({ title: 'Inválido', blocks: [block] })
          .expect(400);
        expect(res.body.message).toEqual([message]);
      }

      await admin('post', '/api/admin/blog/posts')
        .send({
          title: 'Portada externa',
          coverUrl: 'https://evil.example/a.png',
        })
        .expect(400);
    });

    it('deletes posts', async () => {
      const post = await createPost();
      await admin('delete', `/api/admin/blog/posts/${post.id}`).expect(204);
      await admin('get', `/api/admin/blog/posts/${post.id}`).expect(404);
    });
  });

  describe('media library', () => {
    it('stores images and videos by their real format and deletes the files', async () => {
      const image = await admin('post', '/api/admin/blog/media')
        .attach('file', PNG_1PX, 'foto.png')
        .expect(201);
      expect(image.body).toMatchObject({
        kind: 'image',
        mime: 'image/png',
        originalName: 'foto.png',
      });
      expect(image.body.url).toMatch(/^\/api\/uploads\/blog\/[\w-]+\.png$/);
      await api()
        .get(image.body.url as string)
        .expect(200)
        .expect('Content-Type', /image\/png/);

      // La extensión no importa: manda la firma del archivo.
      const video = await admin('post', '/api/admin/blog/media')
        .attach('file', FAKE_MP4, 'clip.bin')
        .expect(201);
      expect(video.body).toMatchObject({ kind: 'video', mime: 'video/mp4' });
      await api()
        .get(video.body.url as string)
        .set('Range', 'bytes=0-7')
        .expect(206);

      const disguised = await admin('post', '/api/admin/blog/media')
        .attach('file', Buffer.from('no soy un video'), 'clip.mp4')
        .expect(400);
      expect(disguised.body.message).toEqual([
        'El archivo debe ser una imagen JPG, PNG o WebP, o un video MP4 o WebM.',
      ]);

      const videos = await admin(
        'get',
        '/api/admin/blog/media?kind=video',
      ).expect(200);
      expect(videos.body).toHaveLength(1);

      const renamed = await admin(
        'patch',
        `/api/admin/blog/media/${image.body.id}`,
      )
        .send({ alt: 'Un píxel' })
        .expect(200);
      expect(renamed.body.alt).toBe('Un píxel');

      // Las imágenes subidas se pueden usar en los bloques.
      await createPost({
        coverUrl: image.body.url,
        blocks: [{ type: 'video', url: video.body.url }],
      });

      await admin('delete', `/api/admin/blog/media/${image.body.id}`).expect(
        204,
      );
      await admin('delete', `/api/admin/blog/media/${video.body.id}`).expect(
        204,
      );
      expect(await readdir(join(uploadsDir, 'blog'))).toHaveLength(0);
      // Los temporales de multer tampoco quedan.
      expect(await readdir(join(uploadsDir, 'tmp'))).toHaveLength(0);
    });
  });
});
