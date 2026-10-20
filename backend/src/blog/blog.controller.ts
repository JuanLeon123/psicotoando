import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { ListPostsQueryDto } from './dto/post-input.dto';
import {
  PostSummary,
  PublicPost,
  toPostSummary,
  toPublicPost,
} from './post.mapper';

export interface PublicPostPage {
  readonly items: readonly PostSummary[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly categories: readonly string[];
}

/** Blog público: solo artículos publicados. */
@Controller('blog/posts')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  async list(@Query() query: ListPostsQueryDto): Promise<PublicPostPage> {
    const result = await this.blog.listPublished(
      query.page ?? 1,
      query.pageSize ?? 9,
      query.category || undefined,
    );
    return { ...result, items: result.items.map(toPostSummary) };
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string): Promise<PublicPost> {
    return toPublicPost(await this.blog.findPublishedBySlug(slug));
  }
}
