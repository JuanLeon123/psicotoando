export type PostStatus = 'draft' | 'published';

/** Contenido del artículo, en orden. Se pinta siempre como texto, nunca como HTML. */
export type PostBlock =
  | { readonly type: 'paragraph'; readonly text: string }
  | { readonly type: 'heading'; readonly text: string }
  | {
      readonly type: 'image';
      readonly url: string;
      readonly alt: string;
      readonly caption?: string;
    }
  | {
      readonly type: 'gallery';
      readonly images: readonly { readonly url: string; readonly alt: string }[];
    }
  | { readonly type: 'video'; readonly url: string; readonly caption?: string }
  | {
      readonly type: 'youtube';
      readonly videoId: string;
      readonly caption?: string;
    }
  | { readonly type: 'quote'; readonly text: string; readonly author?: string }
  | { readonly type: 'list'; readonly items: readonly string[] };

export type PostBlockType = PostBlock['type'];

/** Tarjeta del listado público. */
export interface PostSummary {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly category: string | null;
  readonly coverUrl: string | null;
  readonly coverAlt: string;
  readonly publishedAt: string | null;
  readonly readingMinutes: number;
}

export interface PublicPost extends PostSummary {
  readonly blocks: readonly PostBlock[];
}

export interface AdminPost extends PublicPost {
  readonly status: PostStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PostPage {
  readonly items: readonly PostSummary[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly categories: readonly string[];
}

export interface PostInput {
  readonly title: string;
  readonly excerpt: string;
  readonly category: string | null;
  readonly coverUrl: string | null;
  readonly coverAlt: string;
  readonly blocks: readonly PostBlock[];
  readonly status: PostStatus;
  readonly publishedAt: string | null;
}

export type MediaKind = 'image' | 'video';

export interface MediaItem {
  readonly id: string;
  readonly kind: MediaKind;
  readonly url: string;
  readonly mime: string;
  readonly sizeBytes: number;
  readonly originalName: string;
  readonly alt: string;
  readonly createdAt: string;
}

/** Límites que también aplica el backend. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm'];

const DATE = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });

/** «2026-10-19T…» → «19 de octubre de 2026». */
export function formatPostDate(iso: string | null): string {
  return iso ? DATE.format(new Date(iso)) : '';
}
