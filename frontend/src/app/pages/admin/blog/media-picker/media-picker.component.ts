import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { AdminBlogApiService } from '../../../../core/blog/admin-blog-api.service';
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MediaItem,
  MediaKind,
  VIDEO_TYPES,
} from '../../../../core/blog/blog.models';
import { describeApiError } from '../../../../core/auth/api-error';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface MediaPickerOptions {
  readonly kind: MediaKind;
  /** Galería: se pueden elegir varias imágenes. */
  readonly multiple?: boolean;
  readonly selected?: readonly string[];
}

/**
 * Biblioteca de fotos y videos del blog en una ventana nativa <dialog>.
 * Permite subir archivos nuevos (con progreso) y elegir uno o varios.
 */
@Component({
  selector: 'app-media-picker',
  imports: [IconComponent],
  templateUrl: './media-picker.component.html',
  styleUrls: ['../../_admin-shared.scss', './media-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaPickerComponent {
  readonly picked = output<MediaItem[]>();

  private readonly api = inject(AdminBlogApiService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly options = signal<MediaPickerOptions>({ kind: 'image' });
  protected readonly items = signal<MediaItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly selected = signal<readonly string[]>([]);
  protected readonly progress = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly accept = computed(() =>
    (this.options().kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES).join(','),
  );
  protected readonly title = computed(() => {
    const { kind, multiple } = this.options();
    if (kind === 'video') return 'Elige un video';
    return multiple ? 'Elige las imágenes' : 'Elige una imagen';
  });

  open(options: MediaPickerOptions): void {
    this.options.set(options);
    this.selected.set(options.selected ?? []);
    this.error.set(null);
    this.progress.set(null);
    this.load();
    this.dialog()?.nativeElement.showModal();
  }

  protected close(): void {
    this.dialog()?.nativeElement.close();
  }

  protected isSelected(item: MediaItem): boolean {
    return this.selected().includes(item.url);
  }

  protected toggle(item: MediaItem): void {
    if (!this.options().multiple) {
      this.picked.emit([item]);
      this.close();
      return;
    }
    this.selected.update((urls) =>
      urls.includes(item.url)
        ? urls.filter((url) => url !== item.url)
        : [...urls, item.url].slice(0, 12),
    );
  }

  protected confirm(): void {
    const byUrl = new Map(this.items().map((item) => [item.url, item]));
    this.picked.emit(
      this.selected()
        .map((url) => byUrl.get(url))
        .filter((item): item is MediaItem => !!item),
    );
    this.close();
  }

  protected upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const problem = checkFile(file, this.options().kind);
    if (problem) {
      this.error.set(problem);
      return;
    }
    this.error.set(null);
    this.progress.set(0);
    this.api.uploadMedia(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response && event.body) {
          const item = event.body;
          this.progress.set(null);
          this.items.update((items) => [item, ...items]);
          if (this.options().multiple) {
            this.selected.update((urls) => [...urls, item.url].slice(0, 12));
          } else {
            this.toggle(item);
          }
        }
      },
      error: (error: unknown) => {
        this.progress.set(null);
        this.error.set(describeApiError(error));
      },
    });
  }

  protected sizeLabel(bytes: number): string {
    return bytes >= 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  private load(): void {
    this.loading.set(true);
    this.api.media(this.options().kind).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(describeApiError(error));
      },
    });
  }
}

/** Comprobación previa a subir; el servidor vuelve a validar el contenido real. */
export function checkFile(file: File, kind: MediaKind): string | null {
  if (kind === 'image') {
    if (!IMAGE_TYPES.includes(file.type)) {
      return 'La imagen debe ser JPG, PNG o WebP.';
    }
    if (file.size > MAX_IMAGE_BYTES) return 'La imagen no puede superar los 5 MB.';
    return null;
  }
  if (!VIDEO_TYPES.includes(file.type)) return 'El video debe ser MP4 o WebM.';
  if (file.size > MAX_VIDEO_BYTES) return 'El video no puede superar los 80 MB.';
  return null;
}
