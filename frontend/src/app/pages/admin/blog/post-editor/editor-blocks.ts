import { PostBlock, PostBlockType } from '../../../../core/blog/blog.models';
import { youtubeId } from '../../../../core/blog/youtube';

/** Bloque en edición: campos sueltos y una clave estable para el @for. */
export type EditorBlock =
  | { uid: number; type: 'paragraph'; text: string }
  | { uid: number; type: 'heading'; text: string }
  | { uid: number; type: 'image'; url: string; alt: string; caption: string }
  | { uid: number; type: 'gallery'; images: { url: string; alt: string }[] }
  | { uid: number; type: 'video'; url: string; caption: string }
  | { uid: number; type: 'youtube'; link: string; caption: string }
  | { uid: number; type: 'quote'; text: string; author: string }
  | { uid: number; type: 'list'; text: string };

export const BLOCK_LABELS: Record<PostBlockType, string> = {
  paragraph: 'Párrafo',
  heading: 'Subtítulo',
  image: 'Imagen',
  gallery: 'Galería',
  video: 'Video subido',
  youtube: 'Video de YouTube',
  quote: 'Cita',
  list: 'Lista',
};

export const BLOCK_TYPES = Object.keys(BLOCK_LABELS) as PostBlockType[];

let nextUid = 1;

export function createBlock(type: PostBlockType): EditorBlock {
  const uid = nextUid++;
  switch (type) {
    case 'paragraph':
    case 'heading':
      return { uid, type, text: '' };
    case 'image':
      return { uid, type, url: '', alt: '', caption: '' };
    case 'gallery':
      return { uid, type, images: [] };
    case 'video':
      return { uid, type, url: '', caption: '' };
    case 'youtube':
      return { uid, type, link: '', caption: '' };
    case 'quote':
      return { uid, type, text: '', author: '' };
    case 'list':
      return { uid, type, text: '' };
  }
}

export function fromPostBlock(block: PostBlock): EditorBlock {
  const uid = nextUid++;
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return { uid, type: block.type, text: block.text };
    case 'image':
      return { uid, type: 'image', url: block.url, alt: block.alt, caption: block.caption ?? '' };
    case 'gallery':
      return { uid, type: 'gallery', images: block.images.map((i) => ({ ...i })) };
    case 'video':
      return { uid, type: 'video', url: block.url, caption: block.caption ?? '' };
    case 'youtube':
      return {
        uid,
        type: 'youtube',
        link: `https://www.youtube.com/watch?v=${block.videoId}`,
        caption: block.caption ?? '',
      };
    case 'quote':
      return { uid, type: 'quote', text: block.text, author: block.author ?? '' };
    case 'list':
      return { uid, type: 'list', text: block.items.join('\n') };
  }
}

/** Opcional: solo se incluye si tiene texto. */
const opt = <K extends string>(key: K, value: string) =>
  (value.trim() ? { [key]: value.trim() } : {}) as Partial<Record<K, string>>;

/**
 * Convierte un bloque del editor al formato guardado. Devuelve un mensaje si
 * le falta algo; `strict = false` (vista previa) solo descarta lo incompleto.
 */
export function toPostBlock(block: EditorBlock): PostBlock | string {
  switch (block.type) {
    case 'paragraph':
      return block.text.trim() ? { type: 'paragraph', text: block.text.trim() } : 'El párrafo está vacío.';
    case 'heading':
      return block.text.trim() ? { type: 'heading', text: block.text.trim() } : 'El subtítulo está vacío.';
    case 'image':
      if (!block.url) return 'Elige una imagen.';
      if (!block.alt.trim()) return 'Describe la imagen para quienes usan lectores de pantalla.';
      return { type: 'image', url: block.url, alt: block.alt.trim(), ...opt('caption', block.caption) };
    case 'gallery':
      if (block.images.length === 0) return 'Elige al menos una imagen para la galería.';
      if (block.images.some((i) => !i.alt.trim())) return 'Describe cada imagen de la galería.';
      return { type: 'gallery', images: block.images.map((i) => ({ url: i.url, alt: i.alt.trim() })) };
    case 'video':
      return block.url
        ? { type: 'video', url: block.url, ...opt('caption', block.caption) }
        : 'Elige un video.';
    case 'youtube': {
      const id = youtubeId(block.link);
      return id
        ? { type: 'youtube', videoId: id, ...opt('caption', block.caption) }
        : 'Pega un enlace de YouTube válido.';
    }
    case 'quote':
      return block.text.trim()
        ? { type: 'quote', text: block.text.trim(), ...opt('author', block.author) }
        : 'La cita está vacía.';
    case 'list': {
      const items = block.text.split('\n').map((line) => line.trim()).filter(Boolean);
      return items.length ? { type: 'list', items } : 'Escribe al menos un elemento de la lista.';
    }
  }
}

/** Bloques listos para la vista previa (los incompletos no se muestran). */
export function previewBlocks(blocks: readonly EditorBlock[]): PostBlock[] {
  return blocks.map(toPostBlock).filter((b): b is PostBlock => typeof b !== 'string');
}

/** ISO → valor de <input type="datetime-local"> en hora local. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/** Valor de <input type="datetime-local"> → ISO (o null si está vacío). */
export function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
