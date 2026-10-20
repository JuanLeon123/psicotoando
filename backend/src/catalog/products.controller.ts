import { Controller, Get, Param } from '@nestjs/common';
import { PublicProduct, toPublicProduct } from './product.entity';
import { ProductsService } from './products.service';

/** Catálogo público: solo productos publicados. */
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  async list(): Promise<PublicProduct[]> {
    return (await this.products.listPublished()).map(toPublicProduct);
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string): Promise<PublicProduct> {
    return toPublicProduct(await this.products.findPublishedBySlug(slug));
  }
}
