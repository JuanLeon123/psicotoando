import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

/** Shared frame for the sign-in, sign-up and password recovery pages. */
@Component({
  selector: 'app-auth-layout',
  imports: [NgOptimizedImage, IconComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {
  readonly heading = input.required<string>();
  readonly intro = input<string>('');
}
