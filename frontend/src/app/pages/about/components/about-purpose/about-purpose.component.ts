import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BRAND_PURPOSE } from '../../data/about.data';

@Component({
  selector: 'app-about-purpose',
  imports: [IconComponent],
  templateUrl: './about-purpose.component.html',
  styleUrl: './about-purpose.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPurposeComponent {
  protected readonly statements = BRAND_PURPOSE;
}
