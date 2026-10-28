import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { SiteImagesService } from '../../../../core/site-images/site-images.service';

@Component({
  selector: 'app-featured-article',
  imports: [NgOptimizedImage],
  templateUrl: './featured-article.component.html',
  styleUrl: './featured-article.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedArticleComponent {
  protected readonly photo =
    inject(SiteImagesService).image('resources.featured');
}
