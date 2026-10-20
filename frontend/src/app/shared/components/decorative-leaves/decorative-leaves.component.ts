import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-decorative-leaves',
  template: '<i></i><i></i><i></i>',
  styleUrl: './decorative-leaves.component.scss',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecorativeLeavesComponent {}
