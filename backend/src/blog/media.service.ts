import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { mkdir, open, rename, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Repository } from 'typeorm';
import { UPLOADS_ROUTE } from '../catalog/product-images.service';
import { Media, MediaKind } from './media.entity';

export const MAX_BLOG_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_BLOG_VIDEO_BYTES = 80 * 1024 * 1024;
const BLOG_FOLDER = 'blog';
export const TMP_FOLDER = 'tmp';

interface Format {
  readonly ext: string;
  readonly mime: string;
  readonly kind: MediaKind;
  readonly matches: (head: Buffer) => boolean;
}

/** Formatos aceptados, reconocidos por su firma binaria y no por el nombre. */
const FORMATS: readonly Format[] = [
  {
    ext: 'jpg',
    mime: 'image/jpeg',
    kind: 'image',
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: 'png',
    mime: 'image/png',
    kind: 'image',
    matches: (b) =>
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: 'webp',
    mime: 'image/webp',
    kind: 'image',
    matches: (b) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  {
    ext: 'mp4',
    mime: 'video/mp4',
    kind: 'video',
    matches: (b) => b.subarray(4, 8).toString('ascii') === 'ftyp',
  },
  {
    ext: 'webm',
    mime: 'video/webm',
    kind: 'video',
    matches: (b) =>
      b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
  },
];

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media) private readonly media: Repository<Media>,
    private readonly config: ConfigService,
  ) {}

  get rootDir(): string {
    return resolve(this.config.getOrThrow<string>('UPLOADS_DIR'));
  }

  list(kind?: MediaKind): Promise<Media[]> {
    return this.media.find({
      where: kind ? { kind } : {},
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Multer deja el archivo en UPLOADS_DIR/tmp; aquí se comprueba su firma y su
   * tamaño y se mueve a UPLOADS_DIR/blog con un nombre aleatorio.
   */
  async save(file: Express.Multer.File | undefined): Promise<Media> {
    if (!file) throw new BadRequestException(['Selecciona un archivo.']);
    try {
      const format = await this.detect(file.path);
      if (!format) {
        throw new BadRequestException([
          'El archivo debe ser una imagen JPG, PNG o WebP, o un video MP4 o WebM.',
        ]);
      }
      const max =
        format.kind === 'image' ? MAX_BLOG_IMAGE_BYTES : MAX_BLOG_VIDEO_BYTES;
      if (file.size > max) {
        throw new BadRequestException([
          format.kind === 'image'
            ? 'La imagen no puede superar los 5 MB.'
            : 'El video no puede superar los 80 MB.',
        ]);
      }
      const dir = join(this.rootDir, BLOG_FOLDER);
      await mkdir(dir, { recursive: true });
      const name = `${randomUUID()}.${format.ext}`;
      await rename(file.path, join(dir, name));
      return this.media.save(
        this.media.create({
          kind: format.kind,
          url: `${UPLOADS_ROUTE}/${BLOG_FOLDER}/${name}`,
          mime: format.mime,
          sizeBytes: file.size,
          originalName: (file.originalname ?? '').slice(0, 255),
          alt: '',
        }),
      );
    } finally {
      // Si se movió, el temporal ya no existe; si no, se descarta.
      if (file.path) await unlink(file.path).catch(() => undefined);
    }
  }

  async updateAlt(id: string, alt: string): Promise<Media> {
    const item = await this.findById(id);
    item.alt = alt;
    return this.media.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findById(id);
    await this.media.remove(item);
    const prefix = `${UPLOADS_ROUTE}/${BLOG_FOLDER}/`;
    const name = item.url.startsWith(prefix)
      ? item.url.slice(prefix.length)
      : '';
    if (!/^[\w-]+\.(jpg|png|webp|mp4|webm)$/.test(name)) return;
    try {
      await unlink(join(this.rootDir, BLOG_FOLDER, name));
    } catch (error) {
      this.logger.warn(`No se pudo borrar ${name}: ${String(error)}`);
    }
  }

  private async findById(id: string): Promise<Media> {
    const item = await this.media.findOneBy({ id });
    if (!item) throw new NotFoundException('No encontramos ese archivo.');
    return item;
  }

  private async detect(path: string | undefined): Promise<Format | undefined> {
    if (!path) return undefined;
    const handle = await open(path, 'r');
    try {
      const head = Buffer.alloc(16);
      await handle.read(head, 0, 16, 0);
      return FORMATS.find((f) => f.matches(head));
    } finally {
      await handle.close();
    }
  }
}
