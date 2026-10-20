import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { INITIAL_STEPS } from '../../data/advisory.data';

@Component({
  selector: 'app-initial-consultation',
  imports: [IconComponent],
  templateUrl: './initial-consultation.component.html',
  styleUrl: './initial-consultation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitialConsultationComponent {
  protected readonly steps = INITIAL_STEPS;
}
