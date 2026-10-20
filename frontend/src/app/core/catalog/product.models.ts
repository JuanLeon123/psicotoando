/** Producto tal como lo ve cualquier visitante de la tienda. */
export interface PublicProduct {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly contents: readonly string[];
  readonly activities: number | null;
  /** Pesos colombianos, sin decimales. Null = precio aún sin definir. */
  readonly priceCop: number | null;
  readonly inStock: boolean;
  /** `images/...` (imagen de la web) o `/api/uploads/...` (subida desde el panel). */
  readonly imageUrl: string | null;
  readonly imageAlt: string;
}

/** Producto con los campos de gestión que solo ve el panel. */
export interface AdminProduct extends PublicProduct {
  /** Null = no se controla el inventario. */
  readonly stock: number | null;
  readonly published: boolean;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Cuerpo para crear o editar un producto desde el panel. */
export interface ProductInput {
  readonly name: string;
  readonly summary: string;
  readonly contents: readonly string[];
  readonly activities: number | null;
  readonly priceCop: number | null;
  readonly stock: number | null;
  readonly imageAlt: string;
  readonly published: boolean;
  readonly sortOrder: number;
}
