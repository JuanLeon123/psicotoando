import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-resources-intro',
  templateUrl: './resources-intro.component.html',
  styleUrl: './resources-intro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesIntroComponent {}
