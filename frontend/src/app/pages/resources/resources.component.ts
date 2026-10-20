import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ResourcesIntroComponent } from './components/resources-intro/resources-intro.component';
import { FeaturedArticleComponent } from './components/featured-article/featured-article.component';
import { CaregiverRecommendationsComponent } from './components/caregiver-recommendations/caregiver-recommendations.component';

@Component({
  selector: 'app-resources',
  imports: [
    ResourcesIntroComponent,
    FeaturedArticleComponent,
    CaregiverRecommendationsComponent,
  ],
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesComponent {}
