import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { formatCop } from '../../core/catalog/format-price';
import { PublicProduct } from '../../core/catalog/product.models';
import { ProductsService } from '../../core/catalog/products.service';
import { InfoDialogService } from '../../core/services/info-dialog.service';
import { CartService } from '../../core/cart/cart.service';
import { canAddToCart } from '../../core/cart/cart.models';
import { SiteSettingsService } from '../../core/settings/site-settings.service';
import { whatsappUrl } from '../../core/settings/site-settings.models';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  productDialogContent,
  productOrderMessage,
} from '../../shared/catalog/product-dialog';

type LoadState = 'loading' | 'ready' | 'error';

/** Catálogo público: los productos publicados desde el panel de administración. */
@Component({
  selector: 'app-shop',
  imports: [IconComponent, RouterLink],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopComponent {
  private readonly productsApi = inject(ProductsService);
  private readonly info = inject(InfoDialogService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cart = inject(CartService);
  protected readonly canAddToCart = canAddToCart;

  protected readonly settings = inject(SiteSettingsService).settings;
  protected readonly state = signal<LoadState>('loading');
  protected readonly products = signal<readonly PublicProduct[]>([]);
  protected readonly formatCop = formatCop;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.productsApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected orderUrl(product: PublicProduct): string | null {
    const number = this.settings().whatsappNumber;
    return number ? whatsappUrl(number, productOrderMessage(product)) : null;
  }

  protected openDetail(product: PublicProduct): void {
    this.info.open(
      productDialogContent(product, {
        whatsappNumber: this.settings().whatsappNumber,
        onAddToCart: (item) => this.cart.addProduct(item),
      }),
    );
  }
}
