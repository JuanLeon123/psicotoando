import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { definedOnly } from '../common/defined-only';
import { isOwnMediaUrl, normalizeBlocks } from './blocks';
import { CreatePostDto, UpdatePostDto } from './dto/post-input.dto';
import { Post } from './post.entity';
import { slugify } from './slug';

const NOT_FOUND = 'No encontramos ese artículo.';

export interface PostPage {
  readonly items: Post[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly categories: string[];
}

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
  ) {}

  /** Publicados con fecha ya alcanzada (una fecha futura programa la publicación). */
  private published() {
    return this.posts
      .createQueryBuilder('post')
      .where('post.status = :status', { status: 'published' })
      .andWhere('post.published_at <= now()');
  }

  async listPublished(
    page = 1,
    pageSize = 9,
    category?: string,
  ): Promise<PostPage> {
    const query = this.published();
    if (category) query.andWhere('post.category = :category', { category });
    const [items, total] = await query
      .orderBy('post.published_at', 'DESC')
      .addOrderBy('post.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    const categories = await this.published()
      .select('DISTINCT post.category', 'category')
      .andWhere('post.category IS NOT NULL')
      .orderBy('category', 'ASC')
      .getRawMany<{ category: string }>();
    return {
      items,
      total,
      page,
      pageSize,
      categories: categories.map((row) => row.category),
    };
  }

  async findPublishedBySlug(slug: string): Promise<Post> {
    const post = await this.published()
      .andWhere('post.slug = :slug', { slug })
      .getOne();
    if (!post) throw new NotFoundException(NOT_FOUND);
    return post;
  }

  listAll(): Promise<Post[]> {
    return this.posts.find({ order: { updatedAt: 'DESC' } });
  }

  /** Categorías usadas en cualquier artículo, para sugerirlas en el editor. */
  async allCategories(): Promise<string[]> {
    const rows = await this.posts
      .createQueryBuilder('post')
      .select('DISTINCT post.category', 'category')
      .where('post.category IS NOT NULL')
      .orderBy('category', 'ASC')
      .getRawMany<{ category: string }>();
    return rows.map((row) => row.category);
  }

  async findById(id: string): Promise<Post> {
    const post = await this.posts.findOneBy({ id });
    if (!post) throw new NotFoundException(NOT_FOUND);
    return post;
  }

  async create(dto: CreatePostDto): Promise<Post> {
    const fields = this.prepare(dto);
    const post = this.posts.create({
      ...fields,
      slug: await this.uniqueSlug(dto.title),
    });
    applyPublishDate(post, dto.publishedAt);
    return this.posts.save(post);
  }

  async update(id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.findById(id);
    if (dto.title !== undefined && dto.title !== post.title) {
      post.slug = await this.uniqueSlug(dto.title, post.id);
    }
    Object.assign(post, this.prepare(dto));
    applyPublishDate(post, dto.publishedAt);
    return this.posts.save(post);
  }

  async remove(id: string): Promise<void> {
    await this.posts.remove(await this.findById(id));
  }

  private prepare(dto: CreatePostDto | UpdatePostDto): Partial<Post> {
    const fields = definedOnly(dto);
    // La fecha la aplica applyPublishDate(); aquí no se copia.
    delete fields.publishedAt;
    const { blocks, ...rest } = fields;
    if (rest.coverUrl && !isOwnMediaUrl(rest.coverUrl)) {
      throw new BadRequestException([
        'La portada debe ser una imagen subida a la web.',
      ]);
    }
    return {
      ...rest,
      ...(blocks !== undefined ? { blocks: normalizeBlocks(blocks) } : {}),
    };
  }

  private async uniqueSlug(title: string, ownId?: string): Promise<string> {
    const base = slugify(title, 'articulo');
    for (let n = 1; n < 1000; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      const taken = await this.posts.findOneBy({ slug });
      if (!taken || taken.id === ownId) return slug;
    }
    throw new ConflictException(
      'Ya existen demasiados artículos con ese título.',
    );
  }
}

/**
 * Una fecha explícita manda (null la quita); si no, al publicar por primera vez
 * se usa el momento actual.
 */
function applyPublishDate(post: Post, publishedAt: Date | null | undefined) {
  if (publishedAt !== undefined) {
    post.publishedAt = publishedAt;
  }
  if (post.status === 'published' && !post.publishedAt) {
    post.publishedAt = new Date();
  }
}
