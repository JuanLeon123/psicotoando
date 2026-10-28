import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { AboutStoryComponent } from './components/about-story/about-story.component';
import { AboutPurposeComponent } from './components/about-purpose/about-purpose.component';
import { AboutValuesComponent } from './components/about-values/about-values.component';
import { SiteImagesService } from '../../core/site-images/site-images.service';

@Component({
  selector: 'app-about',
  imports: [
    NgOptimizedImage,
    AboutStoryComponent,
    AboutPurposeComponent,
    AboutValuesComponent,
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  protected readonly illustration =
    inject(SiteImagesService).image('about.family');
}
