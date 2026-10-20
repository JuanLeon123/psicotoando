import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { definedOnly } from '../common/defined-only';
import { buildCartQuote, CartQuote } from './cart-quote';
import { CreateProductDto, UpdateProductDto } from './dto/product-input.dto';
import { Product } from './product.entity';
import { ProductImagesService } from './product-images.service';

const NOT_FOUND = 'No encontramos ese producto.';
const ORDER = { sortOrder: 'ASC', createdAt: 'ASC' } as const;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    private readonly images: ProductImagesService,
  ) {}

  listPublished(): Promise<Product[]> {
    return this.products.find({ where: { published: true }, order: ORDER });
  }

  listAll(): Promise<Product[]> {
    return this.products.find({ order: ORDER });
  }

  async findPublishedBySlug(slug: string): Promise<Product> {
    const product = await this.products.findOneBy({ slug, published: true });
    if (!product) throw new NotFoundException(NOT_FOUND);
    return product;
  }

  async findById(id: string): Promise<Product> {
    const product = await this.products.findOneBy({ id });
    if (!product) throw new NotFoundException(NOT_FOUND);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.products.create({
      ...definedOnly(dto),
      slug: await this.uniqueSlug(dto.name),
    });
    return this.products.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);
    if (dto.name !== undefined && dto.name !== product.name) {
      product.slug = await this.uniqueSlug(dto.name, product.id);
    }
    Object.assign(product, definedOnly(dto));
    return this.products.save(product);
  }

  async replaceImage(id: string, file: Express.Multer.File | undefined) {
    const product = await this.findById(id);
    const url = await this.images.save(file);
    const previous = product.imageUrl;
    product.imageUrl = url;
    const saved = await this.products.save(product);
    await this.images.remove(previous);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findById(id);
    await this.products.remove(product);
    await this.images.remove(product.imageUrl);
  }

  async quote(
    items: readonly { productId: string; quantity: number }[],
  ): Promise<CartQuote> {
    const ids = [...new Set(items.map((item) => item.productId))];
    const products = ids.length
      ? await this.products.findBy({ id: In(ids) })
      : [];
    return buildCartQuote(items, products);
  }

  countAll(): Promise<number> {
    return this.products.count();
  }

  countPublished(): Promise<number> {
    return this.products.countBy({ published: true });
  }

  /** «Kit Motricidad y Coordinación» → «kit-motricidad-y-coordinacion», sin repetir. */
  private async uniqueSlug(name: string, ownId?: string): Promise<string> {
    const base =
      name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120) || 'producto';
    for (let n = 1; n < 1000; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      const taken = await this.products.findOneBy({ slug });
      if (!taken || taken.id === ownId) return slug;
    }
    throw new ConflictException(
      'Ya existen demasiados productos con ese nombre.',
    );
  }
}
