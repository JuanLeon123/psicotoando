import { DataSourceOptions } from 'typeorm';
import { User } from '../users/user.entity';
import { Session } from '../auth/session.entity';
import { PasswordResetToken } from '../auth/password-reset-token.entity';
import { InitialSchema1760480000000 } from './migrations/1760480000000-initial-schema';
import { AdminAndCatalog1760800000000 } from './migrations/1760800000000-admin-and-catalog';
import { BlogAndOrders1761000000000 } from './migrations/1761000000000-blog-and-orders';
import { SiteImages1761200000000 } from './migrations/1761200000000-site-images';
import { Media } from '../blog/media.entity';
import { Post } from '../blog/post.entity';
import { Order, OrderItem } from '../orders/order.entity';
import { Product } from '../catalog/product.entity';
import { SiteSettings } from '../settings/site-settings.entity';
import { SiteImage } from '../site-images/site-image.entity';

type EnvReader = (key: string) => string | undefined;

export function buildDataSourceOptions(env: EnvReader): DataSourceOptions {
  return {
    type: 'postgres',
    host: env('DB_HOST') ?? 'localhost',
    port: Number(env('DB_PORT') ?? 5433),
    username: env('DB_USER'),
    password: env('DB_PASSWORD'),
    database: env('DB_NAME'),
    entities: [
      User,
      Session,
      PasswordResetToken,
      Product,
      SiteSettings,
      Post,
      Media,
      SiteImage,
      Order,
      OrderItem,
    ],
    migrations: [
      InitialSchema1760480000000,
      AdminAndCatalog1760800000000,
      BlogAndOrders1761000000000,
      SiteImages1761200000000,
    ],
    // The schema is managed only through migrations, never synchronized.
    synchronize: false,
    migrationsRun: true,
  };
}
