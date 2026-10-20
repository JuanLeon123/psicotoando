import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../core/blog/blog.service';
import { PostSummary, formatPostDate } from '../../../core/blog/blog.models';

type LoadState = 'loading' | 'ready' | 'error';
export const BLOG_PAGE_SIZE = 9;

/** Listado público del blog con filtro por categoría y «Cargar más». */
@Component({
  selector: 'app-blog-list',
  imports: [RouterLink],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListComponent {
  private readonly blog = inject(BlogService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<LoadState>('loading');
  protected readonly posts = signal<readonly PostSummary[]>([]);
  protected readonly categories = signal<readonly string[]>([]);
  protected readonly category = signal<string | null>(null);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly loadingMore = signal(false);
  protected readonly formatDate = formatPostDate;

  constructor() {
    this.load();
  }

  protected selectCategory(category: string | null): void {
    if (category === this.category()) return;
    this.category.set(category);
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.page.set(1);
    this.blog
      .list({ page: 1, pageSize: BLOG_PAGE_SIZE, category: this.category() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.posts.set(result.items);
          this.total.set(result.total);
          // Las categorías se fijan con la primera carga sin filtro.
          if (!this.category()) this.categories.set(result.categories);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected loadMore(): void {
    const next = this.page() + 1;
    this.loadingMore.set(true);
    this.blog
      .list({ page: next, pageSize: BLOG_PAGE_SIZE, category: this.category() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.posts.update((posts) => [...posts, ...result.items]);
          this.total.set(result.total);
          this.page.set(next);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false),
      });
  }
}
