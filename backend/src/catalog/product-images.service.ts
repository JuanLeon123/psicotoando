import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Ruta pública bajo la que se sirven los archivos subidos. */
export const UPLOADS_ROUTE = '/api/uploads';
const PRODUCTS_FOLDER = 'products';

/** Formatos aceptados, reconocidos por su firma binaria y no por el nombre. */
const SIGNATURES: readonly { ext: string; matches: (b: Buffer) => boolean }[] =
  [
    {
      ext: 'jpg',
      matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    },
    {
      ext: 'png',
      matches: (b) =>
        b
          .subarray(0, 8)
          .equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          ),
    },
    {
      ext: 'webp',
      matches: (b) =>
        b.subarray(0, 4).toString('ascii') === 'RIFF' &&
        b.subarray(8, 12).toString('ascii') === 'WEBP',
    },
  ];

@Injectable()
export class ProductImagesService {
  private readonly logger = new Logger(ProductImagesService.name);

  constructor(private readonly config: ConfigService) {}

  get rootDir(): string {
    return resolve(this.config.getOrThrow<string>('UPLOADS_DIR'));
  }

  /** Guarda la imagen con un nombre aleatorio y devuelve su URL pública. */
  async save(file: Express.Multer.File | undefined): Promise<string> {
    if (!file) throw new BadRequestException('Selecciona una imagen.');
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('La imagen no puede superar los 5 MB.');
    }
    const format = SIGNATURES.find((s) => s.matches(file.buffer));
    if (!format) {
      throw new BadRequestException('La imagen debe ser JPG, PNG o WebP.');
    }
    const dir = join(this.rootDir, PRODUCTS_FOLDER);
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${format.ext}`;
    await writeFile(join(dir, name), file.buffer);
    return `${UPLOADS_ROUTE}/${PRODUCTS_FOLDER}/${name}`;
  }

  /** Borra una imagen subida; ignora las imágenes propias de la web (images/...). */
  async remove(url: string | null): Promise<void> {
    const prefix = `${UPLOADS_ROUTE}/${PRODUCTS_FOLDER}/`;
    if (!url?.startsWith(prefix)) return;
    const name = url.slice(prefix.length);
    if (!/^[\w-]+\.(jpg|png|webp)$/.test(name)) return;
    try {
      await unlink(join(this.rootDir, PRODUCTS_FOLDER, name));
    } catch (error) {
      this.logger.warn(`No se pudo borrar ${name}: ${String(error)}`);
    }
  }
}
