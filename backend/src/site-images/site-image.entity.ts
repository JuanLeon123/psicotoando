import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Media } from '../blog/media.entity';

/**
 * Foto elegida para un hueco de la web. Sin fila, la web muestra su imagen
 * original; al borrar la foto de la biblioteca, la fila desaparece con ella.
 */
@Entity({ name: 'site_images' })
export class SiteImage {
  @PrimaryColumn({ type: 'varchar', length: 60 })
  key!: string;

  @ManyToOne(() => Media, { onDelete: 'CASCADE', eager: true, nullable: false })
  @JoinColumn({ name: 'media_id' })
  media!: Media;

  @Column({ type: 'varchar', length: 300, default: '' })
  alt!: string;

  /** Punto de la foto que siempre queda visible al recortarla, en %. */
  @Column({ name: 'focus_x', type: 'smallint', default: 50 })
  focusX!: number;

  @Column({ name: 'focus_y', type: 'smallint', default: 50 })
  focusY!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

export interface PublicSiteImage {
  /** Foto de la biblioteca; el panel la usa para reajustar el hueco. */
  readonly mediaId: string;
  readonly url: string;
  readonly alt: string;
  readonly focusX: number;
  readonly focusY: number;
}

export function toPublicSiteImage(image: SiteImage): PublicSiteImage {
  return {
    mediaId: image.media.id,
    url: image.media.url,
    alt: image.alt,
    focusX: image.focusX,
    focusY: image.focusY,
  };
}
