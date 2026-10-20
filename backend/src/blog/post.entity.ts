import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PostStatus = 'draft' | 'published';

/**
 * Contenido del artículo, en orden. El frontend pinta cada tipo con su propia
 * plantilla (nunca como HTML crudo), así que el texto es siempre texto plano.
 */
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
      readonly images: readonly {
        readonly url: string;
        readonly alt: string;
      }[];
    }
  | { readonly type: 'video'; readonly url: string; readonly caption?: string }
  | {
      readonly type: 'youtube';
      readonly videoId: string;
      readonly caption?: string;
    }
  | { readonly type: 'quote'; readonly text: string; readonly author?: string }
  | { readonly type: 'list'; readonly items: readonly string[] };

@Entity({ name: 'posts' })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  slug!: string;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'varchar', length: 300, default: '' })
  excerpt!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  category!: string | null;

  @Column({ name: 'cover_url', type: 'varchar', length: 500, nullable: true })
  coverUrl!: string | null;

  @Column({ name: 'cover_alt', type: 'varchar', length: 300, default: '' })
  coverAlt!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  blocks!: PostBlock[];

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: PostStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
