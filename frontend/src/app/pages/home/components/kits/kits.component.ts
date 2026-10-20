import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { KitCardComponent } from '../kit-card/kit-card.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { InfoDialogService } from '../../../../core/services/info-dialog.service';
import { CartService } from '../../../../core/cart/cart.service';
import { ProductsService } from '../../../../core/catalog/products.service';
import { PublicProduct } from '../../../../core/catalog/product.models';
import { SiteSettingsService } from '../../../../core/settings/site-settings.service';
import { productDialogContent } from '../../../../shared/catalog/product-dialog';

/** La portada muestra los primeros kits publicados; el resto está en /tienda. */
const HOME_KITS = 3;

@Component({
  selector: 'app-home-kits',
  imports: [KitCardComponent, IconComponent, RouterLink],
  templateUrl: './kits.component.html',
  styleUrl: './kits.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitsComponent {
  private readonly info = inject(InfoDialogService);
  private readonly settings = inject(SiteSettingsService).settings;
  private readonly cart = inject(CartService);

  /** Undefined mientras carga; si la API falla, la sección queda sin tarjetas. */
  protected readonly kits = toSignal(
    inject(ProductsService)
      .list()
      .pipe(
        map((products) => products.slice(0, HOME_KITS)),
        catchError(() => of([] as PublicProduct[])),
      ),
  );

  protected openKit(kit: PublicProduct): void {
    this.info.open(
      productDialogContent(kit, {
        whatsappNumber: this.settings().whatsappNumber,
        onAddToCart: (product) => this.cart.addProduct(product),
      }),
    );
  }
}
