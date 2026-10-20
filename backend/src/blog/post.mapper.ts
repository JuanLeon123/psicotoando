import { readingMinutes } from './blocks';
import { Post, PostBlock, PostStatus } from './post.entity';
import { Media, MediaKind } from './media.entity';

/** Tarjeta del listado público (sin el contenido). */
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

export interface PublicMedia {
  readonly id: string;
  readonly kind: MediaKind;
  readonly url: string;
  readonly mime: string;
  readonly sizeBytes: number;
  readonly originalName: string;
  readonly alt: string;
  readonly createdAt: string;
}

export function toPostSummary(post: Post): PostSummary {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    coverUrl: post.coverUrl,
    coverAlt: post.coverAlt,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    readingMinutes: readingMinutes(post.blocks, post.excerpt),
  };
}

export function toPublicPost(post: Post): PublicPost {
  return { ...toPostSummary(post), blocks: post.blocks };
}

export function toAdminPost(post: Post): AdminPost {
  return {
    ...toPublicPost(post),
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function toPublicMedia(media: Media): PublicMedia {
  return {
    id: media.id,
    kind: media.kind,
    url: media.url,
    mime: media.mime,
    sizeBytes: media.sizeBytes,
    originalName: media.originalName,
    alt: media.alt,
    createdAt: media.createdAt.toISOString(),
  };
}
