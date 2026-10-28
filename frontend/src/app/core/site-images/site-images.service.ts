import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import {
  ResolvedSiteImage,
  SITE_IMAGE_SLOT_BY_KEY,
  SiteImage,
  SiteImageKey,
  resolveSiteImage,
} from './site-images.models';

type SiteImageMap = Partial<Record<SiteImageKey, SiteImage>>;

/** Más allá de esto, la web arranca con las fotos originales. */
const LOAD_TIMEOUT_MS = 2000;

/**
 * Fotos de la web elegidas desde el panel. Se esperan al arrancar para no
 * enseñar la foto original y cambiarla un instante después; si la API falla o
 * tarda, la web usa las originales.
 */
@Injectable({ providedIn: 'root' })
export class SiteImagesService {
  private readonly http = inject(HttpClient);
  private readonly custom = signal<SiteImageMap>({});

  readonly images = this.custom.asReadonly();

  async load(): Promise<void> {
    const images = await firstValueFrom(
      this.http.get<SiteImageMap>('/api/site-images').pipe(
        timeout(LOAD_TIMEOUT_MS),
        catchError(() => of({})),
      ),
    );
    this.custom.set(images);
  }

  image(key: SiteImageKey): Signal<ResolvedSiteImage> {
    const slot = SITE_IMAGE_SLOT_BY_KEY.get(key)!;
    return computed(() => resolveSiteImage(slot, this.custom()[key]));
  }

  /** El panel actualiza la copia local tras guardar o restaurar. */
  set(key: SiteImageKey, image: SiteImage | null): void {
    this.custom.update((images) => {
      const next = { ...images };
      if (image) next[key] = image;
      else delete next[key];
      return next;
    });
  }
}
