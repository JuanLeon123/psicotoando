import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BRAND_STORY } from '../../data/about.data';
import { SiteImagesService } from '../../../../core/site-images/site-images.service';

@Component({
  selector: 'app-about-story',
  imports: [NgOptimizedImage, IconComponent],
  templateUrl: './about-story.component.html',
  styleUrl: './about-story.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutStoryComponent {
  protected readonly paragraphs = BRAND_STORY;
  protected readonly photo = inject(SiteImagesService).image('about.story');
}
