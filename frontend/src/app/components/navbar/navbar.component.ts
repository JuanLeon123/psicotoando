import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { InfoDialogService } from '../../core/services/info-dialog.service';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';

const NOTICE_MS = 5000;

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  protected readonly menuOpen = signal(false);
  protected readonly homeLinkOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'exact',
    matrixParams: 'ignored',
  } as const;
  protected readonly info = inject(InfoDialogService);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly cartLabel = computed(() => {
    const count = this.cart.count();
    if (count === 0) return 'Carrito vacío';
    return `Carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`;
  });
  protected readonly isAdmin = computed(
    () => this.auth.user()?.role === 'admin',
  );
  /** Enlace de cuenta del menú desplegable (tablet y móvil). */
  protected readonly account = computed(() => {
    if (this.isAdmin()) return { link: '/admin', label: 'Panel' };
    return this.auth.user()
      ? { link: '/mi-cuenta', label: 'Mi cuenta' }
      : { link: '/iniciar-sesion', label: 'Iniciar sesión' };
  });
  protected readonly initial = computed(() =>
    (this.auth.user()?.fullName.trim()[0] ?? '').toLocaleUpperCase('es'),
  );
  private readonly menuToggle =
    viewChild.required<ElementRef<HTMLButtonElement>>('menuToggle');

  constructor() {
    // El aviso de «añadido al carrito» se cierra solo. El temporizador corre fuera
    // de la zona para no bloquear la estabilidad de la app (pruebas, SSR).
    const zone = inject(NgZone);
    effect((onCleanup) => {
      if (!this.cart.notice()) return;
      const timer = zone.runOutsideAngular(() =>
        setTimeout(() => zone.run(() => this.cart.dismissNotice()), NOTICE_MS),
      );
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected closeMenu(returnFocus = false): void {
    this.menuOpen.set(false);
    if (returnFocus) this.menuToggle().nativeElement.focus();
  }

  protected openAdvisory(): void {
    this.closeMenu();
    this.info.openAdvisory();
  }
}
