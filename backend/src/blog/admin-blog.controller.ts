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
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { BlogService } from './blog.service';
import {
  CreatePostDto,
  MediaQueryDto,
  UpdateMediaDto,
  UpdatePostDto,
} from './dto/post-input.dto';
import { MAX_BLOG_VIDEO_BYTES, MediaService } from './media.service';
import {
  AdminPost,
  PublicMedia,
  toAdminPost,
  toPublicMedia,
} from './post.mapper';

@Controller('admin/blog')
@UseGuards(AccessTokenGuard, AdminGuard)
export class AdminBlogController {
  constructor(
    private readonly blog: BlogService,
    private readonly media: MediaService,
  ) {}

  @Get('posts')
  async list(): Promise<AdminPost[]> {
    return (await this.blog.listAll()).map(toAdminPost);
  }

  @Get('categories')
  categories(): Promise<string[]> {
    return this.blog.allCategories();
  }

  @Get('posts/:id')
  async detail(@Param('id', ParseUUIDPipe) id: string): Promise<AdminPost> {
    return toAdminPost(await this.blog.findById(id));
  }

  @Post('posts')
  async create(@Body() dto: CreatePostDto): Promise<AdminPost> {
    return toAdminPost(await this.blog.create(dto));
  }

  @Patch('posts/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<AdminPost> {
    return toAdminPost(await this.blog.update(id, dto));
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.blog.remove(id);
  }

  @Get('media')
  async listMedia(@Query() query: MediaQueryDto): Promise<PublicMedia[]> {
    return (await this.media.list(query.kind)).map(toPublicMedia);
  }

  @Post('media')
  @UseInterceptors(
    // Disco y no memoria: los videos pueden pesar hasta 80 MB. El destino
    // (UPLOADS_DIR/tmp) lo fija MulterModule en BlogModule.
    FileInterceptor('file', {
      limits: { fileSize: MAX_BLOG_VIDEO_BYTES + 1, files: 1 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<PublicMedia> {
    return toPublicMedia(await this.media.save(file));
  }

  @Patch('media/:id')
  async updateMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMediaDto,
  ): Promise<PublicMedia> {
    return toPublicMedia(await this.media.updateAlt(id, dto.alt));
  }

  @Delete('media/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMedia(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.media.remove(id);
  }
}
