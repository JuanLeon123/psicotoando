import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BENEFITS } from '../../data/home.data';

@Component({
  selector: 'app-home-benefits',
  imports: [IconComponent],
  templateUrl: './benefits.component.html',
  styleUrl: './benefits.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BenefitsComponent {
  protected readonly benefits = BENEFITS;
}
