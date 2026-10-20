import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateProductDto, UpdateProductDto } from './dto/product-input.dto';
import { MAX_IMAGE_BYTES } from './product-images.service';
import { AdminProduct, toAdminProduct } from './product.entity';
import { ProductsService } from './products.service';

@Controller('admin/products')
@UseGuards(AccessTokenGuard, AdminGuard)
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  async list(): Promise<AdminProduct[]> {
    return (await this.products.listAll()).map(toAdminProduct);
  }

  @Get(':id')
  async detail(@Param('id', ParseUUIDPipe) id: string): Promise<AdminProduct> {
    return toAdminProduct(await this.products.findById(id));
  }

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<AdminProduct> {
    return toAdminProduct(await this.products.create(dto));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<AdminProduct> {
    return toAdminProduct(await this.products.update(id, dto));
  }

  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      // Margen sobre el máximo para responder con un mensaje propio, no el de multer.
      limits: { fileSize: MAX_IMAGE_BYTES + 1, files: 1 },
    }),
  )
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<AdminProduct> {
    return toAdminProduct(await this.products.replaceImage(id, file));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.products.remove(id);
  }
}
