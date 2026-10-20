import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminBlogApiService } from '../../../../core/blog/admin-blog-api.service';
import { AdminPost, formatPostDate } from '../../../../core/blog/blog.models';
import { describeApiError } from '../../../../core/auth/api-error';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

type LoadState = 'loading' | 'ready' | 'error';

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Lista de artículos del blog en el panel. */
@Component({
  selector: 'app-admin-post-list',
  imports: [RouterLink, IconComponent],
  templateUrl: './post-list.component.html',
  styleUrls: ['../../_admin-shared.scss', './post-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostListComponent {
  private readonly api = inject(AdminBlogApiService);
  private readonly dialog =
    viewChild<ElementRef<HTMLDialogElement>>('confirmDialog');

  protected readonly state = signal<LoadState>('loading');
  protected readonly posts = signal<AdminPost[]>([]);
  protected readonly query = signal('');
  protected readonly busyId = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly toDelete = signal<AdminPost | null>(null);
  protected readonly formatDate = formatPostDate;

  protected readonly filtered = computed(() => {
    const query = normalize(this.query().trim());
    return query
      ? this.posts().filter((p) =>
          normalize(`${p.title} ${p.excerpt} ${p.category ?? ''}`).includes(query),
        )
      : this.posts();
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.posts().subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.state.set('ready');
      },
      error: (error: unknown) => {
        this.error.set(describeApiError(error));
        this.state.set('error');
      },
    });
  }

  /** Programado = publicado con fecha futura. */
  protected isScheduled(post: AdminPost): boolean {
    return (
      post.status === 'published' &&
      !!post.publishedAt &&
      new Date(post.publishedAt).getTime() > Date.now()
    );
  }

  protected askDelete(post: AdminPost): void {
    this.toDelete.set(post);
    this.dialog()?.nativeElement.showModal();
  }

  protected cancelDelete(): void {
    this.dialog()?.nativeElement.close();
  }

  protected confirmDelete(): void {
    const post = this.toDelete();
    if (!post) return;
    this.busyId.set(post.id);
    this.message.set(null);
    this.error.set(null);
    this.api.deletePost(post.id).subscribe({
      next: () => {
        this.posts.update((list) => list.filter((p) => p.id !== post.id));
        this.busyId.set(null);
        this.dialog()?.nativeElement.close();
        this.message.set(`«${post.title}» se eliminó.`);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.dialog()?.nativeElement.close();
        this.error.set(describeApiError(error));
      },
    });
  }
}
