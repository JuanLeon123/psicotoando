import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdvisoryHeroComponent } from './components/advisory-hero/advisory-hero.component';
import { InitialConsultationComponent } from './components/initial-consultation/initial-consultation.component';
import { FollowUpComponent } from './components/follow-up/follow-up.component';
import { FamilyResourcesComponent } from './components/family-resources/family-resources.component';
import { NewChallengesComponent } from './components/new-challenges/new-challenges.component';

@Component({
  selector: 'app-advisory',
  imports: [
    AdvisoryHeroComponent,
    InitialConsultationComponent,
    FollowUpComponent,
    FamilyResourcesComponent,
    NewChallengesComponent,
  ],
  templateUrl: './advisory.component.html',
  styleUrl: './advisory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvisoryComponent {}
