import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-featured-article',
  imports: [NgOptimizedImage],
  templateUrl: './featured-article.component.html',
  styleUrl: './featured-article.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedArticleComponent {}
