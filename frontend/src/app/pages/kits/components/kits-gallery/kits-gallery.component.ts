import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { SiteImagesService } from '../../../../core/site-images/site-images.service';

@Component({
  selector: 'app-kits-gallery',
  imports: [NgOptimizedImage],
  templateUrl: './kits-gallery.component.html',
  styleUrl: './kits-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitsGalleryComponent {
  private readonly images = inject(SiteImagesService);
  protected readonly photos = [
    this.images.image('kits.gallery.1'),
    this.images.image('kits.gallery.2'),
    this.images.image('kits.gallery.3'),
    this.images.image('kits.gallery.4'),
  ];
}
