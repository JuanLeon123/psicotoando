import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ResourceIllustrationComponent } from '../resource-illustration/resource-illustration.component';
import { CAREGIVER_RECOMMENDATIONS } from '../../data/resources.data';

@Component({
  selector: 'app-caregiver-recommendations',
  imports: [ResourceIllustrationComponent],
  templateUrl: './caregiver-recommendations.component.html',
  styleUrl: './caregiver-recommendations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaregiverRecommendationsComponent {
  protected readonly recommendations = CAREGIVER_RECOMMENDATIONS;
}
