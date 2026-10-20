import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PostBlock } from '../../../core/blog/blog.models';
import { isYoutubeId } from '../../../core/blog/youtube';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface LightboxImage {
  readonly url: string;
  readonly alt: string;
}

/**
 * Pinta el contenido de un artículo. Cada tipo de bloque tiene su plantilla y
 * el texto se interpola siempre como texto (sin innerHTML).
 */
@Component({
  selector: 'app-post-blocks',
  imports: [IconComponent],
  templateUrl: './post-blocks.component.html',
  styleUrl: './post-blocks.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostBlocksComponent {
  readonly blocks = input.required<readonly PostBlock[]>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly lightbox =
    viewChild<ElementRef<HTMLDialogElement>>('lightbox');
  private readonly youtubeUrls = new Map<string, SafeResourceUrl>();

  protected readonly zoomed = signal<LightboxImage | null>(null);

  /**
   * Solo se confía en la URL del iframe después de validar el id, de modo que
   * nunca se incrusta otra cosa que el reproductor de YouTube sin cookies.
   */
  protected youtubeEmbed(id: string): SafeResourceUrl | null {
    if (!isYoutubeId(id)) return null;
    let url = this.youtubeUrls.get(id);
    if (!url) {
      url = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
      );
      this.youtubeUrls.set(id, url);
    }
    return url;
  }

  protected openImage(image: LightboxImage): void {
    this.zoomed.set(image);
    this.lightbox()?.nativeElement.showModal();
  }

  protected closeImage(): void {
    this.lightbox()?.nativeElement.close();
  }

  protected onLightboxClick(event: MouseEvent): void {
    if (event.target === this.lightbox()?.nativeElement) this.closeImage();
  }
}
