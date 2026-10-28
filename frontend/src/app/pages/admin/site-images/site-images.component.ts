import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminApiService } from '../../../core/admin/admin-api.service';
import { describeApiError } from '../../../core/auth/api-error';
import { MediaItem } from '../../../core/blog/blog.models';
import {
  SITE_IMAGE_SLOTS,
  SiteImageSlot,
  resolveSiteImage,
} from '../../../core/site-images/site-images.models';
import { SiteImagesService } from '../../../core/site-images/site-images.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { MediaPickerComponent } from '../blog/media-picker/media-picker.component';

/** Foto que se está ajustando antes de guardarla en un hueco. */
interface Draft {
  readonly slot: SiteImageSlot;
  readonly mediaId: string;
  readonly url: string;
  readonly alt: string;
  readonly focusX: number;
  readonly focusY: number;
}

const NUDGE_STEP = 5;
const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

/**
 * Fotos de la web agrupadas por página. Cada hueco toma una imagen de la
 * biblioteca (la misma del blog), con su punto de enfoque y descripción.
 */
@Component({
  selector: 'app-admin-site-images',
  imports: [IconComponent, MediaPickerComponent],
  templateUrl: './site-images.component.html',
  styleUrls: ['../_admin-shared.scss', './site-images.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSiteImagesComponent {
  private readonly api = inject(AdminApiService);
  private readonly siteImages = inject(SiteImagesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly picker = viewChild.required(MediaPickerComponent);
  private readonly editor =
    viewChild.required<ElementRef<HTMLDialogElement>>('editor');

  protected readonly groups = computed(() => {
    const custom = this.siteImages.images();
    const pages = new Map<
      string,
      {
        slot: SiteImageSlot;
        custom: boolean;
        url: string;
        position: string | null;
      }[]
    >();
    for (const slot of SITE_IMAGE_SLOTS) {
      const image = resolveSiteImage(slot, custom[slot.key]);
      const cards = pages.get(slot.page) ?? [];
      cards.push({ slot, custom: !!custom[slot.key], ...image });
      pages.set(slot.page, cards);
    }
    return [...pages].map(([page, cards]) => ({ page, cards }));
  });

  private choosingFor: SiteImageSlot | null = null;
  protected readonly draft = signal<Draft | null>(null);
  protected readonly draftPosition = computed(() => {
    const draft = this.draft();
    return draft ? `${draft.focusX}% ${draft.focusY}%` : null;
  });
  protected readonly submitted = signal(false);
  protected readonly altMissing = computed(() => {
    const draft = this.draft();
    return !!draft && !draft.slot.decorative && !draft.alt.trim();
  });
  protected readonly pending = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly editorError = signal<string | null>(null);

  constructor() {
    // Por si otra pestaña cambió fotos desde que se abrió la web.
    void this.siteImages.load();
  }

  protected change(slot: SiteImageSlot): void {
    this.choosingFor = slot;
    this.picker().open({ kind: 'image' });
  }

  protected picked([item]: MediaItem[]): void {
    const slot = this.choosingFor;
    if (!slot || !item) return;
    const current = this.siteImages.images()[slot.key];
    this.openEditor({
      slot,
      mediaId: item.id,
      url: item.url,
      alt: item.alt || current?.alt || '',
      focusX: 50,
      focusY: 50,
    });
  }

  /** Reajusta el enfoque o la descripción de la foto ya elegida. */
  protected adjust(slot: SiteImageSlot): void {
    const current = this.siteImages.images()[slot.key];
    if (!current) return;
    this.openEditor({ slot, ...current });
  }

  protected setFocus(event: MouseEvent): void {
    // Un «click» desde el teclado (Enter o espacio) no trae coordenadas.
    if (event.detail === 0) return;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.updateDraft({
      focusX: clamp(((event.clientX - box.left) / box.width) * 100),
      focusY: clamp(((event.clientY - box.top) / box.height) * 100),
    });
  }

  protected nudge(event: KeyboardEvent): void {
    const draft = this.draft();
    if (!draft) return;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-NUDGE_STEP, 0],
      ArrowRight: [NUDGE_STEP, 0],
      ArrowUp: [0, -NUDGE_STEP],
      ArrowDown: [0, NUDGE_STEP],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    this.updateDraft({
      focusX: clamp(draft.focusX + move[0]),
      focusY: clamp(draft.focusY + move[1]),
    });
  }

  protected setAlt(event: Event): void {
    this.updateDraft({ alt: (event.target as HTMLTextAreaElement).value });
  }

  protected closeEditor(): void {
    this.editor().nativeElement.close();
  }

  protected save(): void {
    const draft = this.draft();
    if (!draft || this.pending()) return;
    this.submitted.set(true);
    if (this.altMissing()) {
      document.getElementById('site-image-alt')?.focus();
      return;
    }
    this.pending.set(draft.slot.key);
    this.editorError.set(null);
    this.api
      .setSiteImage(draft.slot.key, {
        mediaId: draft.mediaId,
        alt: draft.slot.decorative ? '' : draft.alt.trim(),
        focusX: draft.focusX,
        focusY: draft.focusY,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (image) => {
          this.pending.set(null);
          this.siteImages.set(draft.slot.key, image);
          this.message.set(
            `Foto guardada en «${draft.slot.label}» (${draft.slot.page}). Ya se ve en la web.`,
          );
          this.closeEditor();
        },
        error: (error: unknown) => {
          this.pending.set(null);
          this.editorError.set(describeApiError(error));
        },
      });
  }

  protected reset(slot: SiteImageSlot): void {
    if (this.pending()) return;
    this.pending.set(slot.key);
    this.message.set(null);
    this.error.set(null);
    this.api
      .resetSiteImage(slot.key)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pending.set(null);
          this.siteImages.set(slot.key, null);
          this.message.set(
            `«${slot.label}» (${slot.page}) vuelve a mostrar la foto original. La que subiste sigue en la biblioteca.`,
          );
        },
        error: (error: unknown) => {
          this.pending.set(null);
          this.error.set(describeApiError(error));
        },
      });
  }

  private openEditor(draft: Draft): void {
    this.draft.set(draft);
    this.submitted.set(false);
    this.editorError.set(null);
    this.message.set(null);
    this.error.set(null);
    this.editor().nativeElement.showModal();
  }

  private updateDraft(change: Partial<Draft>): void {
    this.draft.update((draft) => (draft ? { ...draft, ...change } : draft));
  }
}
