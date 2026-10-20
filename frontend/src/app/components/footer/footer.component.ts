import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { DecorativeLeavesComponent } from '../../shared/components/decorative-leaves/decorative-leaves.component';
import { InfoDialogService } from '../../core/services/info-dialog.service';
import { AuthService } from '../../core/auth/auth.service';
import { SiteSettingsService } from '../../core/settings/site-settings.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, IconComponent, DecorativeLeavesComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
  protected readonly info = inject(InfoDialogService);
  protected readonly auth = inject(AuthService);
  protected readonly settings = inject(SiteSettingsService).settings;
}
