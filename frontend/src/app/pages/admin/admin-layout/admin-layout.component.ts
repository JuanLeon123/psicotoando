import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import {
  IconComponent,
  IconName,
} from '../../../shared/components/icon/icon.component';

interface AdminLink {
  readonly label: string;
  readonly path: string;
  readonly icon: IconName;
  readonly exact: boolean;
}

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly links: readonly AdminLink[] = [
    { label: 'Resumen', path: '/admin', icon: 'chart', exact: true },
    { label: 'Productos', path: '/admin/productos', icon: 'box', exact: false },
    { label: 'Pedidos', path: '/admin/pedidos', icon: 'clipboard', exact: false },
    { label: 'Blog', path: '/admin/blog', icon: 'lightbulb', exact: false },
    { label: 'Ajustes', path: '/admin/ajustes', icon: 'chat', exact: false },
  ];
  protected readonly menuOpen = signal(false);
  protected readonly signingOut = signal(false);

  constructor() {
    // En móvil el menú se cierra al cambiar de sección.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  protected signOut(): void {
    this.signingOut.set(true);
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/'));
  }
}
