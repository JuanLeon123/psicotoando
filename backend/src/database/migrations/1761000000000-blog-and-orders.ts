import { MigrationInterface, QueryRunner } from 'typeorm';

/** Blog (artículos por bloques y biblioteca de archivos) y pedidos pagados con Wompi. */
export class BlogAndOrders1761000000000 implements MigrationInterface {
  name = 'BlogAndOrders1761000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE media (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        kind varchar(10) NOT NULL CHECK (kind IN ('image', 'video')),
        url varchar(500) NOT NULL,
        mime varchar(60) NOT NULL,
        size_bytes integer NOT NULL CHECK (size_bytes >= 0),
        original_name varchar(255) NOT NULL DEFAULT '',
        alt varchar(300) NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX media_created_idx ON media (created_at DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE posts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug varchar(180) NOT NULL,
        title varchar(160) NOT NULL,
        excerpt varchar(300) NOT NULL DEFAULT '',
        category varchar(60),
        cover_url varchar(500),
        cover_alt varchar(300) NOT NULL DEFAULT '',
        blocks jsonb NOT NULL DEFAULT '[]',
        status varchar(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'published')),
        published_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX posts_slug_key ON posts (slug)`,
    );
    await queryRunner.query(
      `CREATE INDEX posts_published_idx ON posts (status, published_at DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        reference varchar(40) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'approved', 'declined', 'voided', 'error')),
        fulfillment varchar(20) NOT NULL DEFAULT 'unfulfilled'
          CHECK (fulfillment IN ('unfulfilled', 'preparing', 'shipped', 'delivered', 'cancelled')),
        user_id uuid REFERENCES users (id) ON DELETE SET NULL,
        customer_name varchar(120) NOT NULL,
        customer_email varchar(254) NOT NULL,
        customer_phone varchar(30) NOT NULL,
        customer_document varchar(30) NOT NULL,
        shipping_department varchar(60) NOT NULL,
        shipping_city varchar(80) NOT NULL,
        shipping_address varchar(200) NOT NULL,
        shipping_notes varchar(300),
        subtotal_cop integer NOT NULL CHECK (subtotal_cop >= 0),
        shipping_cop integer NOT NULL CHECK (shipping_cop >= 0),
        total_cop integer NOT NULL CHECK (total_cop >= 0),
        currency varchar(3) NOT NULL DEFAULT 'COP',
        wompi_transaction_id varchar(60),
        payment_method varchar(40),
        paid_at timestamptz,
        stock_applied boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX orders_reference_key ON orders (reference)`,
    );
    await queryRunner.query(
      `CREATE INDEX orders_status_created_idx ON orders (status, created_at DESC)`,
    );
    await queryRunner.query(`CREATE INDEX orders_user_idx ON orders (user_id)`);

    await queryRunner.query(`
      CREATE TABLE order_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
        product_id uuid REFERENCES products (id) ON DELETE SET NULL,
        product_name varchar(120) NOT NULL,
        unit_price_cop integer NOT NULL CHECK (unit_price_cop >= 0),
        quantity integer NOT NULL CHECK (quantity > 0),
        line_total_cop integer NOT NULL CHECK (line_total_cop >= 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX order_items_order_idx ON order_items (order_id)`,
    );

    // Envío: valor fijo (0 = gratis) y, opcionalmente, envío gratis desde un monto.
    await queryRunner.query(`
      ALTER TABLE site_settings
        ADD COLUMN shipping_flat_cop integer NOT NULL DEFAULT 0 CHECK (shipping_flat_cop >= 0),
        ADD COLUMN free_shipping_from_cop integer CHECK (free_shipping_from_cop IS NULL OR free_shipping_from_cop >= 0)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE site_settings DROP COLUMN free_shipping_from_cop, DROP COLUMN shipping_flat_cop`,
    );
    await queryRunner.query(`DROP TABLE order_items`);
    await queryRunner.query(`DROP TABLE orders`);
    await queryRunner.query(`DROP TABLE posts`);
    await queryRunner.query(`DROP TABLE media`);
  }
}
