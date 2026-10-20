import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ResourceIllustration } from '../../data/resources.data';

const IMAGES: Partial<Record<ResourceIllustration, string>> = {
  feelings: 'images/resources-feelings.webp',
  rest: 'images/resources-rest.webp',
  support: 'images/resources-support.webp',
};

@Component({
  selector: 'app-resource-illustration',
  templateUrl: './resource-illustration.component.html',
  styleUrl: './resource-illustration.component.scss',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceIllustrationComponent {
  readonly kind = input.required<ResourceIllustration>();
  protected readonly image = computed(() => IMAGES[this.kind()]);
}
