import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BRAND_VALUES } from '../../data/about.data';

@Component({
  selector: 'app-about-values',
  imports: [IconComponent],
  templateUrl: './about-values.component.html',
  styleUrl: './about-values.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutValuesComponent {
  protected readonly values = BRAND_VALUES;
}
