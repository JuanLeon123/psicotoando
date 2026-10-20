import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DecorativeLeavesComponent } from '../../../../shared/components/decorative-leaves/decorative-leaves.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { InfoDialogService } from '../../../../core/services/info-dialog.service';

@Component({
  selector: 'app-home-hero',
  imports: [
    NgOptimizedImage,
    RouterLink,
    IconComponent,
    DecorativeLeavesComponent,
  ],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  protected readonly info = inject(InfoDialogService);
}
