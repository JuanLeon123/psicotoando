import { MigrationInterface, QueryRunner } from 'typeorm';

/** Rol de administrador, catálogo de productos y ajustes editables del sitio. */
export class AdminAndCatalog1760800000000 implements MigrationInterface {
  name = 'AdminAndCatalog1760800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN role varchar(20) NOT NULL DEFAULT 'customer',
        ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin'))
    `);

    await queryRunner.query(`
      CREATE TABLE products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug varchar(140) NOT NULL,
        name varchar(120) NOT NULL,
        summary varchar(500) NOT NULL,
        contents text[] NOT NULL DEFAULT '{}',
        activities integer CHECK (activities IS NULL OR activities >= 0),
        price_cop integer CHECK (price_cop IS NULL OR price_cop >= 0),
        stock integer CHECK (stock IS NULL OR stock >= 0),
        image_url varchar(500),
        image_alt varchar(300) NOT NULL DEFAULT '',
        published boolean NOT NULL DEFAULT false,
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX products_slug_key ON products (slug)`,
    );
    await queryRunner.query(
      `CREATE INDEX products_published_order_idx ON products (published, sort_order)`,
    );

    // Los tres kits que ya mostraba la web, para que la tienda no quede vacía.
    // Sin precio hasta que el administrador lo defina.
    await queryRunner.query(`
      INSERT INTO products
        (slug, name, summary, contents, activities, image_url, image_alt, published, sort_order)
      VALUES
        ('kit-desarrollo-sensorial', 'Kit Desarrollo Sensorial',
         'Una invitación a descubrir texturas, formas y colores a través del juego compartido en casa.',
         ARRAY['18 actividades guiadas.', 'Propuestas para explorar los sentidos.', 'Materiales para descubrir y experimentar en familia.'],
         18, 'images/kit-sensory.webp',
         'Kit sensorial con caja, piezas de colores, pelotas y fichas de actividades sobre una mesa de madera.',
         true, 1),
        ('kit-motricidad-y-coordinacion', 'Kit Motricidad y Coordinación',
         'Actividades para explorar el movimiento y la coordinación de las manos, disfrutando cada pequeño logro.',
         ARRAY['20 actividades guiadas.', 'Propuestas de coordinación y motricidad fina.', 'Experiencias para practicar al ritmo de cada niño.'],
         20, 'images/kit-motor.webp',
         'Kit de motricidad con cuentas para ensartar, tijeras infantiles y fichas de actividades.',
         true, 2),
        ('kit-comunicacion-y-lenguaje', 'Kit Comunicación y Lenguaje',
         'Momentos de juego para compartir palabras, expresar ideas y conectar en familia.',
         ARRAY['16 actividades guiadas.', 'Propuestas para conversar, escuchar y contar historias.', 'Materiales para favorecer la interacción en familia.'],
         16, 'images/kit-language.webp',
         'Kit de lenguaje con tarjetas ilustradas, teléfono de juguete y cuentas de colores.',
         true, 3)
    `);

    // Una sola fila (id = 1) con los datos de contacto y redes del sitio.
    await queryRunner.query(`
      CREATE TABLE site_settings (
        id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        whatsapp_number varchar(20),
        contact_email varchar(254),
        instagram_url varchar(300),
        facebook_url varchar(300),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`INSERT INTO site_settings (id) VALUES (1)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE site_settings`);
    await queryRunner.query(`DROP TABLE products`);
    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT users_role_check, DROP COLUMN role`,
    );
  }
}
