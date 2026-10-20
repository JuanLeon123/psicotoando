import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminBlogApiService } from '../../../../core/blog/admin-blog-api.service';
import {
  AdminPost,
  MediaItem,
  PostBlock,
  PostBlockType,
  PostInput,
  PostStatus,
} from '../../../../core/blog/blog.models';
import { youtubeId, youtubeThumbnail } from '../../../../core/blog/youtube';
import { describeApiError } from '../../../../core/auth/api-error';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PostBlocksComponent } from '../../../blog/post-blocks/post-blocks.component';
import { MediaPickerComponent } from '../media-picker/media-picker.component';
import {
  BLOCK_LABELS,
  BLOCK_TYPES,
  EditorBlock,
  createBlock,
  fromLocalInput,
  fromPostBlock,
  previewBlocks,
  toLocalInput,
  toPostBlock,
} from './editor-blocks';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';
type PickerTarget = { kind: 'cover' } | { kind: 'block'; uid: number };

const EXCERPT_MAX = 300;

/** Editor de artículos del blog: datos, portada y contenido por bloques. */
@Component({
  selector: 'app-admin-post-editor',
  imports: [RouterLink, IconComponent, PostBlocksComponent, MediaPickerComponent],
  templateUrl: './post-editor.component.html',
  styleUrls: ['../../_admin-shared.scss', './post-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostEditorComponent {
  private readonly api = inject(AdminBlogApiService);
  private readonly router = inject(Router);
  private readonly picker = viewChild.required(MediaPickerComponent);

  protected readonly blockTypes = BLOCK_TYPES;
  protected readonly blockLabels = BLOCK_LABELS;
  protected readonly excerptMax = EXCERPT_MAX;
  protected readonly youtubeId = youtubeId;
  protected readonly youtubeThumbnail = youtubeThumbnail;

  protected readonly postId = signal<string | null>(
    inject(ActivatedRoute).snapshot.paramMap.get('id'),
  );
  protected readonly state = signal<LoadState>(this.postId() ? 'loading' : 'ready');
  protected readonly slug = signal<string | null>(null);

  protected readonly title = signal('');
  protected readonly excerpt = signal('');
  protected readonly category = signal('');
  protected readonly coverUrl = signal<string | null>(null);
  protected readonly coverAlt = signal('');
  protected readonly status = signal<PostStatus>('draft');
  protected readonly publishedAt = signal('');
  protected readonly blocks = signal<EditorBlock[]>([]);

  protected readonly categories = signal<string[]>([]);
  protected readonly preview = signal(false);
  protected readonly addMenuOpen = signal(false);
  protected readonly dirty = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly blockErrors = signal<ReadonlyMap<number, string>>(new Map());
  private pickerTarget: PickerTarget | null = null;

  protected readonly previewContent = computed(() => previewBlocks(this.blocks()));
  protected readonly isNew = computed(() => this.postId() === null);

  constructor() {
    const id = this.postId();
    if (id) this.load(id);
    // Al crear se navega a la URL de edición (otro componente): el aviso viaja en el estado.
    const saved = (history.state as { blogSaved?: string } | null)?.blogSaved;
    if (saved) this.message.set(saved);
    this.api.categories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });

    // Avisa antes de cerrar la pestaña con cambios sin guardar.
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!this.dirty()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    inject(DestroyRef).onDestroy(() =>
      window.removeEventListener('beforeunload', beforeUnload),
    );
  }

  // ---- Datos generales -------------------------------------------------

  protected setField(
    field: 'title' | 'excerpt' | 'category' | 'coverAlt' | 'publishedAt',
    value: string,
  ): void {
    this[field].set(value);
    this.touch();
  }

  protected setStatus(published: boolean): void {
    this.status.set(published ? 'published' : 'draft');
    this.touch();
  }

  protected chooseCover(): void {
    this.pickerTarget = { kind: 'cover' };
    this.picker().open({ kind: 'image' });
  }

  protected removeCover(): void {
    this.coverUrl.set(null);
    this.coverAlt.set('');
    this.touch();
  }

  // ---- Bloques ---------------------------------------------------------

  protected addBlock(type: PostBlockType): void {
    const block = createBlock(type);
    this.blocks.update((blocks) => [...blocks, block]);
    this.addMenuOpen.set(false);
    this.touch();
    if (type === 'image' || type === 'video' || type === 'gallery') {
      this.chooseMedia(block);
    } else {
      // Lleva el foco al primer campo del bloque nuevo.
      setTimeout(() =>
        document
          .querySelector<HTMLElement>(`[data-block="${block.uid}"] input, [data-block="${block.uid}"] textarea`)
          ?.focus(),
      );
    }
  }

  protected updateBlock(uid: number, patch: Partial<EditorBlock>): void {
    this.blocks.update((blocks) =>
      blocks.map((b) => (b.uid === uid ? ({ ...b, ...patch } as EditorBlock) : b)),
    );
    this.clearBlockError(uid);
    this.touch();
  }

  protected updateGalleryAlt(uid: number, index: number, alt: string): void {
    this.blocks.update((blocks) =>
      blocks.map((b) =>
        b.uid === uid && b.type === 'gallery'
          ? { ...b, images: b.images.map((img, i) => (i === index ? { ...img, alt } : img)) }
          : b,
      ),
    );
    this.clearBlockError(uid);
    this.touch();
  }

  protected removeGalleryImage(uid: number, index: number): void {
    this.blocks.update((blocks) =>
      blocks.map((b) =>
        b.uid === uid && b.type === 'gallery'
          ? { ...b, images: b.images.filter((_, i) => i !== index) }
          : b,
      ),
    );
    this.touch();
  }

  protected moveBlock(uid: number, offset: -1 | 1): void {
    this.blocks.update((blocks) => {
      const index = blocks.findIndex((b) => b.uid === uid);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= blocks.length) return blocks;
      const next = [...blocks];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    this.touch();
  }

  protected removeBlock(uid: number): void {
    this.blocks.update((blocks) => blocks.filter((b) => b.uid !== uid));
    this.clearBlockError(uid);
    this.touch();
  }

  protected chooseMedia(block: EditorBlock): void {
    this.pickerTarget = { kind: 'block', uid: block.uid };
    if (block.type === 'gallery') {
      this.picker().open({
        kind: 'image',
        multiple: true,
        selected: block.images.map((i) => i.url),
      });
    } else {
      this.picker().open({ kind: block.type === 'video' ? 'video' : 'image' });
    }
  }

  protected onPicked(items: MediaItem[]): void {
    const target = this.pickerTarget;
    this.pickerTarget = null;
    if (!target || items.length === 0) return;
    if (target.kind === 'cover') {
      this.coverUrl.set(items[0].url);
      if (!this.coverAlt()) this.coverAlt.set(items[0].alt);
      this.touch();
      return;
    }
    const block = this.blocks().find((b) => b.uid === target.uid);
    if (!block) return;
    if (block.type === 'gallery') {
      const previous = new Map(block.images.map((i) => [i.url, i.alt]));
      this.updateBlock(block.uid, {
        images: items.map((item) => ({
          url: item.url,
          alt: previous.get(item.url) || item.alt,
        })),
      });
    } else if (block.type === 'image') {
      this.updateBlock(block.uid, { url: items[0].url, alt: block.alt || items[0].alt });
    } else if (block.type === 'video') {
      this.updateBlock(block.uid, { url: items[0].url });
    }
  }

  // ---- Guardar ---------------------------------------------------------

  protected save(): void {
    this.message.set(null);
    this.error.set(null);
    const title = this.title().trim();
    if (title.length < 3) {
      this.error.set('Escribe un título de al menos 3 caracteres.');
      document.getElementById('post-title')?.focus();
      return;
    }
    const errors = new Map<number, string>();
    const blocks: PostBlock[] = [];
    for (const block of this.blocks()) {
      const result = toPostBlock(block);
      if (typeof result === 'string') errors.set(block.uid, result);
      else blocks.push(result);
    }
    this.blockErrors.set(errors);
    if (errors.size) {
      const [firstUid] = errors.keys();
      const position = this.blocks().findIndex((b) => b.uid === firstUid) + 1;
      this.error.set(
        `Revisa el bloque ${position}: ${errors.get(firstUid)}${errors.size > 1 ? ` (y ${errors.size - 1} más)` : ''}`,
      );
      document.querySelector<HTMLElement>(`[data-block="${firstUid}"]`)?.scrollIntoView({ block: 'center' });
      return;
    }
    if (this.coverUrl() && !this.coverAlt().trim()) {
      this.error.set('Describe la imagen de portada.');
      document.getElementById('cover-alt')?.focus();
      return;
    }

    const body: PostInput = {
      title,
      excerpt: this.excerpt().trim(),
      category: this.category().trim() || null,
      coverUrl: this.coverUrl(),
      coverAlt: this.coverAlt().trim(),
      blocks,
      status: this.status(),
      publishedAt: fromLocalInput(this.publishedAt()),
    };
    this.saving.set(true);
    const id = this.postId();
    const request = id ? this.api.updatePost(id, body) : this.api.createPost(body);
    request.subscribe({
      next: (post) => {
        this.saving.set(false);
        this.apply(post);
        this.dirty.set(false);
        const message =
          post.status === 'published'
            ? 'Artículo guardado y publicado en el blog.'
            : 'Borrador guardado. Solo se ve en el panel.';
        this.message.set(message);
        if (!id) {
          this.postId.set(post.id);
          void this.router.navigate(['/admin/blog', post.id], {
            replaceUrl: true,
            state: { blogSaved: message },
          });
        }
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(describeApiError(error));
      },
    });
  }

  private load(id: string): void {
    this.api.post(id).subscribe({
      next: (post) => {
        this.apply(post);
        this.state.set('ready');
      },
      error: (error: unknown) => {
        const status = (error as { status?: number }).status;
        this.state.set(status === 404 || status === 400 ? 'not-found' : 'error');
      },
    });
  }

  private apply(post: AdminPost): void {
    this.slug.set(post.slug);
    this.title.set(post.title);
    this.excerpt.set(post.excerpt);
    this.category.set(post.category ?? '');
    this.coverUrl.set(post.coverUrl);
    this.coverAlt.set(post.coverAlt);
    this.status.set(post.status);
    this.publishedAt.set(toLocalInput(post.publishedAt));
    this.blocks.set(post.blocks.map(fromPostBlock));
    this.blockErrors.set(new Map());
  }

  private touch(): void {
    this.dirty.set(true);
    this.message.set(null);
  }

  private clearBlockError(uid: number): void {
    if (!this.blockErrors().has(uid)) return;
    const next = new Map(this.blockErrors());
    next.delete(uid);
    this.blockErrors.set(next);
  }
}
