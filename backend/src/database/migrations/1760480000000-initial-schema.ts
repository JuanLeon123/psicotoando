import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760480000000 implements MigrationInterface {
  name = 'InitialSchema1760480000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(254) NOT NULL,
        password_hash varchar(255),
        full_name varchar(120) NOT NULL,
        phone varchar(30),
        child_name varchar(120),
        child_birth_date date,
        google_id varchar(255),
        avatar_url varchar(500),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT users_email_lowercase CHECK (email = lower(email))
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX users_email_key ON users (email)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX users_google_id_key ON users (google_id) WHERE google_id IS NOT NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        token_hash char(64) NOT NULL,
        user_agent varchar(255),
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        last_used_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX sessions_token_hash_key ON sessions (token_hash)`,
    );
    await queryRunner.query(
      `CREATE INDEX sessions_user_id_idx ON sessions (user_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE password_reset_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        token_hash char(64) NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX password_reset_tokens_token_hash_key ON password_reset_tokens (token_hash)`,
    );
    await queryRunner.query(
      `CREATE INDEX password_reset_tokens_user_id_idx ON password_reset_tokens (user_id)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE password_reset_tokens`);
    await queryRunner.query(`DROP TABLE sessions`);
    await queryRunner.query(`DROP TABLE users`);
  }
}
