import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { SiteSettingsService } from '../../../../core/settings/site-settings.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-advisory-family-resources',
  imports: [IconComponent],
  templateUrl: './family-resources.component.html',
  styleUrl: './family-resources.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyResourcesComponent {
  protected readonly settings = inject(SiteSettingsService).settings;
  protected readonly hasLinks = computed(
    () => !!(this.settings().instagramUrl || this.settings().facebookUrl),
  );
}
