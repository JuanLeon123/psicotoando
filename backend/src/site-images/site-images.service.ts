import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../blog/media.entity';
import { UpdateSiteImageDto } from './dto/update-site-image.dto';
import { SiteImageSlot, isSiteImageSlot } from './site-image-slots';
import { SiteImage } from './site-image.entity';

@Injectable()
export class SiteImagesService {
  constructor(
    @InjectRepository(SiteImage)
    private readonly images: Repository<SiteImage>,
    @InjectRepository(Media) private readonly media: Repository<Media>,
  ) {}

  /** Solo los huecos cambiados; el resto usa su imagen original. */
  list(): Promise<SiteImage[]> {
    return this.images.find({ order: { key: 'ASC' } });
  }

  async set(key: string, dto: UpdateSiteImageDto): Promise<SiteImage> {
    const slot = this.slot(key);
    const media = await this.media.findOneBy({ id: dto.mediaId });
    if (!media) {
      throw new NotFoundException(
        'No encontramos esa imagen en la biblioteca.',
      );
    }
    if (media.kind !== 'image') {
      throw new BadRequestException(['Elige una imagen, no un video.']);
    }
    return this.images.save(
      this.images.create({
        key: slot,
        media,
        alt: dto.alt,
        focusX: dto.focusX,
        focusY: dto.focusY,
      }),
    );
  }

  /** Vuelve a la imagen original. La foto sigue en la biblioteca. */
  async reset(key: string): Promise<void> {
    await this.images.delete({ key: this.slot(key) });
  }

  private slot(key: string): SiteImageSlot {
    if (!isSiteImageSlot(key)) {
      throw new NotFoundException('Ese espacio de imagen no existe.');
    }
    return key;
  }
}
