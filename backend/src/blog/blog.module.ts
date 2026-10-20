import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join, resolve } from 'node:path';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AdminBlogController } from './admin-blog.controller';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { Media } from './media.entity';
import { MediaService, TMP_FOLDER } from './media.service';
import { Post } from './post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Media]),
    AuthModule,
    UsersModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      // multer crea la carpeta temporal si no existe.
      useFactory: (config: ConfigService) => ({
        dest: join(
          resolve(config.getOrThrow<string>('UPLOADS_DIR')),
          TMP_FOLDER,
        ),
      }),
    }),
  ],
  controllers: [BlogController, AdminBlogController],
  providers: [BlogService, MediaService],
})
export class BlogModule {}
