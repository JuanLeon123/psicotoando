import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { KIT_PHOTOS } from '../../data/kits.data';

@Component({
  selector: 'app-kits-gallery',
  imports: [NgOptimizedImage],
  templateUrl: './kits-gallery.component.html',
  styleUrl: './kits-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitsGalleryComponent {
  protected readonly photos = KIT_PHOTOS;
}
