// Entry point for the TypeORM CLI (migration:run / migration:revert).
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.config';

export default new DataSource(
  buildDataSourceOptions((key) => process.env[key]),
);
