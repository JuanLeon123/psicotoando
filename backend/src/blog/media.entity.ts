import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type MediaKind = 'image' | 'video';

/** Archivo subido desde el panel para usarlo en artículos del blog. */
@Entity({ name: 'media' })
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  kind!: MediaKind;

  /** Ruta pública bajo /api/uploads/... */
  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'varchar', length: 60 })
  mime!: string;

  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes!: number;

  @Column({ name: 'original_name', type: 'varchar', length: 255, default: '' })
  originalName!: string;

  @Column({ type: 'varchar', length: 300, default: '' })
  alt!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
