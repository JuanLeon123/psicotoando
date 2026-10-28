import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UpdateSiteImageDto } from './dto/update-site-image.dto';
import { PublicSiteImage, toPublicSiteImage } from './site-image.entity';
import { SiteImagesService } from './site-images.service';

@Controller()
export class SiteImagesController {
  constructor(private readonly images: SiteImagesService) {}

  /** Mapa hueco → foto, solo con los huecos cambiados desde el panel. */
  @Get('site-images')
  async list(): Promise<Record<string, PublicSiteImage>> {
    const images = await this.images.list();
    return Object.fromEntries(
      images.map((image) => [image.key, toPublicSiteImage(image)]),
    );
  }

  @Put('admin/site-images/:key')
  @UseGuards(AccessTokenGuard, AdminGuard)
  async set(
    @Param('key') key: string,
    @Body() dto: UpdateSiteImageDto,
  ): Promise<PublicSiteImage> {
    return toPublicSiteImage(await this.images.set(key, dto));
  }

  @Delete('admin/site-images/:key')
  @UseGuards(AccessTokenGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  reset(@Param('key') key: string): Promise<void> {
    return this.images.reset(key);
  }
}
