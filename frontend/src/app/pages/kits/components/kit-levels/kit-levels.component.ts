import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { KIT_LEVELS } from '../../data/kits.data';

@Component({
  selector: 'app-kit-levels',
  imports: [IconComponent],
  templateUrl: './kit-levels.component.html',
  styleUrl: './kit-levels.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitLevelsComponent {
  protected readonly levels = KIT_LEVELS;
}
