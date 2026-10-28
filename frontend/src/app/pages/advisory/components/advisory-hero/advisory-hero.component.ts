import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { InfoDialogService } from '../../../../core/services/info-dialog.service';
import { SiteImagesService } from '../../../../core/site-images/site-images.service';

@Component({
  selector: 'app-advisory-hero',
  imports: [NgOptimizedImage, IconComponent],
  templateUrl: './advisory-hero.component.html',
  styleUrl: './advisory-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvisoryHeroComponent {
  protected readonly info = inject(InfoDialogService);
  protected readonly photo = inject(SiteImagesService).image('advisory.hero');
}
