import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ACTIVITY_GALLERY } from '../../data/advisory.data';

@Component({
  selector: 'app-new-challenges',
  templateUrl: './new-challenges.component.html',
  styleUrl: './new-challenges.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewChallengesComponent {
  protected readonly activities = ACTIVITY_GALLERY;
}
