import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SiteImagesService } from '../../../../core/site-images/site-images.service';

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
  protected readonly photo = inject(SiteImagesService).image('auth.visual');
}
