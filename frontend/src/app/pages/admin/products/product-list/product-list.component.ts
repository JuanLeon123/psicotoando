import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../../core/admin/admin-api.service';
import { describeApiError } from '../../../../core/auth/api-error';
import { formatCop } from '../../../../core/catalog/format-price';
import { AdminProduct } from '../../../../core/catalog/product.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

type LoadState = 'loading' | 'ready' | 'error';

/** Quita tildes y mayúsculas para que «motricidad» encuentre «Motricidad». */
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

@Component({
  selector: 'app-admin-product-list',
  imports: [RouterLink, IconComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['../../_admin-shared.scss', './product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  private readonly api = inject(AdminApiService);
  private readonly dialog =
    viewChild<ElementRef<HTMLDialogElement>>('confirmDialog');

  protected readonly formatCop = formatCop;
  protected readonly state = signal<LoadState>('loading');
  protected readonly products = signal<AdminProduct[]>([]);
  protected readonly query = signal('');
  protected readonly busyId = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly toDelete = signal<AdminProduct | null>(null);

  protected readonly filtered = computed(() => {
    const query = normalize(this.query().trim());
    const products = this.products();
    return query
      ? products.filter((p) => normalize(`${p.name} ${p.summary}`).includes(query))
      : products;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.products().subscribe({
      next: (products) => {
        this.products.set(products);
        this.state.set('ready');
      },
      error: (error: unknown) => {
        this.error.set(describeApiError(error));
        this.state.set('error');
      },
    });
  }

  protected stockLabel(product: AdminProduct): string {
    if (product.stock === null) return 'Sin control';
    return product.stock === 1 ? '1 unidad' : `${product.stock} unidades`;
  }

  protected togglePublished(product: AdminProduct): void {
    this.busyId.set(product.id);
    this.message.set(null);
    this.error.set(null);
    this.api
      .updateProduct(product.id, { published: !product.published })
      .subscribe({
        next: (updated) => {
          this.replace(updated);
          this.busyId.set(null);
          this.message.set(
            updated.published
              ? `«${updated.name}» ya se ve en la tienda.`
              : `«${updated.name}» quedó como borrador y no se ve en la tienda.`,
          );
        },
        error: (error: unknown) => {
          this.busyId.set(null);
          this.error.set(describeApiError(error));
        },
      });
  }

  protected askDelete(product: AdminProduct): void {
    this.toDelete.set(product);
    this.dialog()?.nativeElement.showModal();
  }

  protected cancelDelete(): void {
    this.dialog()?.nativeElement.close();
  }

  protected confirmDelete(): void {
    const product = this.toDelete();
    if (!product) return;
    this.busyId.set(product.id);
    this.api.deleteProduct(product.id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((p) => p.id !== product.id));
        this.busyId.set(null);
        this.dialog()?.nativeElement.close();
        this.message.set(`«${product.name}» se eliminó.`);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.dialog()?.nativeElement.close();
        this.error.set(describeApiError(error));
      },
    });
  }

  private replace(updated: AdminProduct): void {
    this.products.update((list) =>
      list.map((p) => (p.id === updated.id ? updated : p)),
    );
  }
}
