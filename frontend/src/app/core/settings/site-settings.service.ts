import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { EMPTY_SETTINGS, SiteSettings } from './site-settings.models';

/**
 * Contacto y redes editables desde el panel. Se cargan una vez al arrancar;
 * si la API falla, la web sigue funcionando sin esos enlaces.
 */
@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly http = inject(HttpClient);
  private readonly current = signal<SiteSettings>(EMPTY_SETTINGS);
  private loaded = false;

  readonly settings = this.current.asReadonly();

  load(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.http
      .get<SiteSettings>('/api/settings')
      .pipe(catchError(() => of(EMPTY_SETTINGS)))
      .subscribe((settings) => this.current.set(settings));
  }

  /** El panel actualiza la copia local tras guardar. */
  set(settings: SiteSettings): void {
    this.current.set(settings);
  }
}
