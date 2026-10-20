import { BadRequestException } from '@nestjs/common';
import { PostBlock } from './post.entity';

export const MAX_BLOCKS = 200;
const LIMITS = {
  paragraph: 5000,
  heading: 160,
  caption: 300,
  alt: 300,
  quote: 1000,
  author: 120,
  listItems: 30,
  listItem: 300,
  gallery: 12,
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
/** Archivos subidos (/api/uploads/...) o imágenes propias de la web (images/...). */
const OWN_URL =
  /^(\/api\/uploads\/[A-Za-z0-9_-]+(\/[A-Za-z0-9_.-]+)+|images\/[A-Za-z0-9_.-]+)$/;

/**
 * Extrae el id de un video de YouTube a partir del id o de un enlace
 * (watch?v=, youtu.be/, embed/, shorts/). Devuelve null si no es válido.
 */
export function youtubeId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  let candidate: string | null = null;
  if (host === 'youtu.be') {
    candidate = url.pathname.slice(1).split('/')[0];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    candidate =
      url.searchParams.get('v') ??
      url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ??
      null;
  }
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

export function isOwnMediaUrl(url: unknown): url is string {
  return typeof url === 'string' && !url.includes('..') && OWN_URL.test(url);
}

/**
 * Valida y normaliza el contenido de un artículo. Cada bloque se reconstruye
 * con solo sus campos permitidos; cualquier otra cosa se rechaza en español.
 */
export function normalizeBlocks(input: unknown): PostBlock[] {
  if (!Array.isArray(input)) {
    throw invalid('El contenido del artículo debe ser una lista de bloques.');
  }
  if (input.length > MAX_BLOCKS) {
    throw invalid(`Un artículo admite como máximo ${MAX_BLOCKS} bloques.`);
  }
  return (input as unknown[]).map((raw, index) =>
    normalizeBlock(raw, index + 1),
  );
}

function normalizeBlock(raw: unknown, position: number): PostBlock {
  if (typeof raw !== 'object' || raw === null) {
    throw invalid(`El bloque ${position} no es válido.`);
  }
  const block = raw as Record<string, unknown>;
  const where = `Bloque ${position}`;
  switch (block.type) {
    case 'paragraph':
      return {
        type: 'paragraph',
        text: requiredText(
          block.text,
          LIMITS.paragraph,
          `${where}: el párrafo`,
        ),
      };
    case 'heading':
      return {
        type: 'heading',
        text: requiredText(
          block.text,
          LIMITS.heading,
          `${where}: el subtítulo`,
        ),
      };
    case 'image':
      return {
        type: 'image',
        url: ownUrl(block.url, `${where}: la imagen`),
        alt: requiredText(
          block.alt,
          LIMITS.alt,
          `${where}: la descripción de la imagen`,
        ),
        ...optional(
          'caption',
          block.caption,
          LIMITS.caption,
          `${where}: el pie de foto`,
        ),
      };
    case 'gallery': {
      if (!Array.isArray(block.images) || block.images.length === 0) {
        throw invalid(`${where}: la galería necesita al menos una imagen.`);
      }
      if (block.images.length > LIMITS.gallery) {
        throw invalid(
          `${where}: la galería admite hasta ${LIMITS.gallery} imágenes.`,
        );
      }
      return {
        type: 'gallery',
        images: (block.images as unknown[]).map((image, i) => {
          const item = (
            typeof image === 'object' && image !== null ? image : {}
          ) as Record<string, unknown>;
          const label = `${where}, imagen ${i + 1}`;
          return {
            url: ownUrl(item.url, label),
            alt: requiredText(item.alt, LIMITS.alt, `${label}: la descripción`),
          };
        }),
      };
    }
    case 'video':
      return {
        type: 'video',
        url: ownUrl(block.url, `${where}: el video`),
        ...optional(
          'caption',
          block.caption,
          LIMITS.caption,
          `${where}: el pie del video`,
        ),
      };
    case 'youtube': {
      const id =
        typeof block.videoId === 'string' ? youtubeId(block.videoId) : null;
      if (!id) throw invalid(`${where}: el enlace de YouTube no es válido.`);
      return {
        type: 'youtube',
        videoId: id,
        ...optional(
          'caption',
          block.caption,
          LIMITS.caption,
          `${where}: el pie del video`,
        ),
      };
    }
    case 'quote':
      return {
        type: 'quote',
        text: requiredText(block.text, LIMITS.quote, `${where}: la cita`),
        ...optional(
          'author',
          block.author,
          LIMITS.author,
          `${where}: el autor de la cita`,
        ),
      };
    case 'list': {
      if (!Array.isArray(block.items)) {
        throw invalid(`${where}: la lista necesita elementos.`);
      }
      const items = (block.items as unknown[])
        .map((item) => (typeof item === 'string' ? item.trim() : item))
        .filter((item) => item !== '');
      if (items.length === 0) throw invalid(`${where}: la lista está vacía.`);
      if (items.length > LIMITS.listItems) {
        throw invalid(
          `${where}: la lista admite hasta ${LIMITS.listItems} elementos.`,
        );
      }
      return {
        type: 'list',
        items: items.map((item, i) =>
          requiredText(item, LIMITS.listItem, `${where}, elemento ${i + 1}`),
        ),
      };
    }
    default:
      throw invalid(`${where}: tipo de bloque no permitido.`);
  }
}

function requiredText(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw invalid(`${label} no puede estar vacío.`);
  }
  const text = value.trim();
  if (text.length > max) {
    throw invalid(`${label} puede tener hasta ${max} caracteres.`);
  }
  return text;
}

function optional<K extends string>(
  key: K,
  value: unknown,
  max: number,
  label: string,
): Partial<Record<K, string>> {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'string') throw invalid(`${label} debe ser un texto.`);
  const text = value.trim();
  if (text === '') return {};
  if (text.length > max)
    throw invalid(`${label} puede tener hasta ${max} caracteres.`);
  return { [key]: text } as Record<K, string>;
}

function ownUrl(value: unknown, label: string): string {
  if (!isOwnMediaUrl(value)) {
    throw invalid(`${label} debe ser un archivo subido a la web.`);
  }
  return value;
}

function invalid(message: string): BadRequestException {
  // Mismo formato que la validación global: { message: string[] }.
  return new BadRequestException([message]);
}

/** Minutos de lectura estimados (200 palabras por minuto, mínimo 1). */
export function readingMinutes(
  blocks: readonly PostBlock[],
  extra = '',
): number {
  const text = [
    extra,
    ...blocks.flatMap((b) => {
      switch (b.type) {
        case 'paragraph':
        case 'heading':
          return [b.text];
        case 'quote':
          return [b.text];
        case 'list':
          return [...b.items];
        default:
          return [];
      }
    }),
  ].join(' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
