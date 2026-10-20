import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { formatCop } from '../../../../core/catalog/format-price';
import { PublicProduct } from '../../../../core/catalog/product.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-kit-card',
  imports: [IconComponent],
  templateUrl: './kit-card.component.html',
  styleUrl: './kit-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitCardComponent {
  readonly kit = input.required<PublicProduct>();
  readonly selected = output<PublicProduct>();

  protected readonly price = computed(() =>
    this.kit().inStock ? formatCop(this.kit().priceCop) : 'Agotado',
  );
}
