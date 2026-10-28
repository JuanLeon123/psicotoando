import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SiteImagesService } from '../../../../core/site-images/site-images.service';

@Component({
  selector: 'app-new-challenges',
  templateUrl: './new-challenges.component.html',
  styleUrl: './new-challenges.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewChallengesComponent {
  private readonly images = inject(SiteImagesService);
  protected readonly activities = [
    this.images.image('advisory.gallery.1'),
    this.images.image('advisory.gallery.2'),
    this.images.image('advisory.gallery.3'),
    this.images.image('advisory.gallery.4'),
  ];
}
