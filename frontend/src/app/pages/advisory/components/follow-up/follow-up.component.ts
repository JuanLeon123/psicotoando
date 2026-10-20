import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { FOLLOW_UP_SERVICES } from '../../data/advisory.data';

@Component({
  selector: 'app-advisory-follow-up',
  imports: [IconComponent],
  templateUrl: './follow-up.component.html',
  styleUrl: './follow-up.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowUpComponent {
  protected readonly services = FOLLOW_UP_SERVICES;
}
