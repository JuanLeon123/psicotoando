import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Media } from '../blog/media.entity';
import { UsersModule } from '../users/users.module';
import { SiteImage } from './site-image.entity';
import { SiteImagesController } from './site-images.controller';
import { SiteImagesService } from './site-images.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SiteImage, Media]),
    AuthModule,
    UsersModule,
  ],
  controllers: [SiteImagesController],
  providers: [SiteImagesService],
})
export class SiteImagesModule {}
