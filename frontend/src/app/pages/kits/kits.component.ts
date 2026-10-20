import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { KitsIntroComponent } from './components/kits-intro/kits-intro.component';
import { KitsGalleryComponent } from './components/kits-gallery/kits-gallery.component';
import { KitLevelsComponent } from './components/kit-levels/kit-levels.component';
import { DevelopmentAreasComponent } from './components/development-areas/development-areas.component';

@Component({
  selector: 'app-kits',
  imports: [
    IconComponent,
    KitsIntroComponent,
    KitsGalleryComponent,
    KitLevelsComponent,
    DevelopmentAreasComponent,
  ],
  templateUrl: './kits.component.html',
  styleUrl: './kits.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitsComponent {}
