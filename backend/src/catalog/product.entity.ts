import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 140 })
  slug!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 500 })
  summary!: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  contents!: string[];

  @Column({ type: 'integer', nullable: true })
  activities!: number | null;

  /** Precio en pesos colombianos, sin decimales. Null = aún sin precio. */
  @Column({ name: 'price_cop', type: 'integer', nullable: true })
  priceCop!: number | null;

  /** Unidades disponibles. Null = no se controla el inventario. */
  @Column({ type: 'integer', nullable: true })
  stock!: number | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'image_alt', type: 'varchar', length: 300, default: '' })
  imageAlt!: string;

  @Column({ type: 'boolean', default: false })
  published!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

/** Lo que ve cualquier visitante de la tienda. */
export interface PublicProduct {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly contents: readonly string[];
  readonly activities: number | null;
  readonly priceCop: number | null;
  readonly inStock: boolean;
  readonly imageUrl: string | null;
  readonly imageAlt: string;
}

/** Lo que ve el panel de administración. */
export interface AdminProduct extends PublicProduct {
  readonly stock: number | null;
  readonly published: boolean;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toPublicProduct(product: Product): PublicProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    summary: product.summary,
    contents: product.contents,
    activities: product.activities,
    priceCop: product.priceCop,
    inStock: product.stock === null || product.stock > 0,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
  };
}

export function toAdminProduct(product: Product): AdminProduct {
  return {
    ...toPublicProduct(product),
    stock: product.stock,
    published: product.published,
    sortOrder: product.sortOrder,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
