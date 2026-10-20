import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DEVELOPMENT_AREAS } from '../../data/kits.data';

@Component({
  selector: 'app-development-areas',
  imports: [IconComponent],
  templateUrl: './development-areas.component.html',
  styleUrl: './development-areas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevelopmentAreasComponent {
  protected readonly areas = DEVELOPMENT_AREAS;
}
