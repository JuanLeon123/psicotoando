import { MigrationInterface, QueryRunner } from 'typeorm';

/** Fotos de la web elegidas desde el panel, una por hueco. */
export class SiteImages1761200000000 implements MigrationInterface {
  name = 'SiteImages1761200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE site_images (
        key varchar(60) PRIMARY KEY,
        media_id uuid NOT NULL REFERENCES media (id) ON DELETE CASCADE,
        alt varchar(300) NOT NULL DEFAULT '',
        focus_x smallint NOT NULL DEFAULT 50 CHECK (focus_x BETWEEN 0 AND 100),
        focus_y smallint NOT NULL DEFAULT 50 CHECK (focus_y BETWEEN 0 AND 100),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX site_images_media_idx ON site_images (media_id)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE site_images`);
  }
}
