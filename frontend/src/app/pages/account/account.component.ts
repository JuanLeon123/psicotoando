import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ProfileFormComponent } from './components/profile-form/profile-form.component';
import { SecurityFormComponent } from './components/security-form/security-form.component';
import { MyOrdersComponent } from './components/my-orders/my-orders.component';

@Component({
  selector: 'app-account',
  imports: [
    IconComponent,
    ProfileFormComponent,
    SecurityFormComponent,
    MyOrdersComponent,
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly user = this.auth.user;
  protected readonly firstName = computed(
    () => this.user()?.fullName.trim().split(/\s+/)[0] ?? '',
  );
  protected readonly initial = computed(() =>
    (this.user()?.fullName.trim()[0] ?? '?').toLocaleUpperCase('es'),
  );
  protected readonly loggingOut = signal(false);

  protected logout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/'));
  }
}
