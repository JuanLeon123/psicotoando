import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { InfoDialogComponent } from './shared/components/info-dialog/info-dialog.component';
import { SiteSettingsService } from './core/settings/site-settings.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    InfoDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);

  /** El panel tiene su propio layout, sin el navbar ni el footer públicos. */
  protected readonly isAdminArea = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => isAdminUrl(this.router.url)),
    ),
    { initialValue: isAdminUrl(this.router.url) },
  );

  constructor() {
    inject(SiteSettingsService).load();
  }
}

function isAdminUrl(url: string): boolean {
  return url === '/admin' || url.startsWith('/admin/') || url.startsWith('/admin?');
}
