import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { catchError, filter, map, of, switchMap, tap } from 'rxjs';
import { BlogService } from '../../../core/blog/blog.service';
import {
  PostSummary,
  PublicPost,
  formatPostDate,
} from '../../../core/blog/blog.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PostBlocksComponent } from '../post-blocks/post-blocks.component';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';
const RELATED = 3;

/** Artículo del blog en /blog/:slug. */
@Component({
  selector: 'app-blog-post',
  imports: [RouterLink, IconComponent, PostBlocksComponent],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostComponent {
  private readonly blog = inject(BlogService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly route = inject(ActivatedRoute);

  protected readonly state = signal<LoadState>('loading');
  protected readonly post = signal<PublicPost | null>(null);
  protected readonly related = signal<readonly PostSummary[]>([]);
  protected readonly formatDate = formatPostDate;

  constructor() {
    const destroyRef = inject(DestroyRef);
    // El router pone el título genérico de la ruta al terminar de navegar; si el
    // artículo llegó antes, se vuelve a aplicar el suyo.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(() => {
        const post = this.post();
        if (post) this.title.setTitle(`${post.title} | Psico T.O ando`);
      });
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug') ?? ''),
        tap(() => this.state.set('loading')),
        switchMap((slug) =>
          this.blog.bySlug(slug).pipe(
            map((post) => ({ post, error: null as unknown })),
            catchError((error: unknown) => of({ post: null, error })),
          ),
        ),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(({ post, error }) => {
        if (post) {
          this.post.set(post);
          this.state.set('ready');
          this.title.setTitle(`${post.title} | Psico T.O ando`);
          this.meta.updateTag({ name: 'description', content: post.excerpt });
          this.loadRelated(post.id);
          return;
        }
        this.post.set(null);
        this.state.set(
          error instanceof HttpErrorResponse && error.status === 404
            ? 'not-found'
            : 'error',
        );
      });
  }

  private loadRelated(currentId: string): void {
    this.blog.list({ page: 1, pageSize: RELATED + 1 }).subscribe({
      next: (page) =>
        this.related.set(
          page.items.filter((p) => p.id !== currentId).slice(0, RELATED),
        ),
      error: () => this.related.set([]),
    });
  }
}
