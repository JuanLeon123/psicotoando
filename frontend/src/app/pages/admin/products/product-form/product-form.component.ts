import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { AdminApiService } from '../../../../core/admin/admin-api.service';
import { describeApiError } from '../../../../core/auth/api-error';
import { formatCop } from '../../../../core/catalog/format-price';
import {
  AdminProduct,
  ProductInput,
} from '../../../../core/catalog/product.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { controlErrorMessage } from '../../../../shared/forms/form-errors';
import {
  MAX_CONTENTS,
  MAX_PRICE_COP,
  imageFileError,
  integerTextValidator,
  parseInteger,
} from './product-form.validators';

type SaveState = 'idle' | 'saving' | 'uploading';

const FIELD_ORDER = [
  'name',
  'summary',
  'priceCop',
  'stock',
  'activities',
  'sortOrder',
  'imageAlt',
] as const;

const groupThousands = (value: number | null) =>
  value === null ? '' : new Intl.NumberFormat('es-CO').format(value);

@Component({
  selector: 'app-admin-product-form',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './product-form.component.html',
  styleUrls: ['../../_admin-shared.scss', './product-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly dialog =
    viewChild<ElementRef<HTMLDialogElement>>('confirmDialog');

  /** Id del producto en edición; null al crear uno nuevo. */
  protected readonly productId =
    inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly maxContents = MAX_CONTENTS;

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(120),
      ],
    }),
    summary: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500),
      ],
    }),
    priceCop: new FormControl('', {
      nonNullable: true,
      validators: [integerTextValidator(MAX_PRICE_COP)],
    }),
    stock: new FormControl('', {
      nonNullable: true,
      validators: [integerTextValidator(1_000_000)],
    }),
    activities: new FormControl('', {
      nonNullable: true,
      validators: [integerTextValidator(999)],
    }),
    sortOrder: new FormControl('0', {
      nonNullable: true,
      validators: [integerTextValidator(9999)],
    }),
    imageAlt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
    published: new FormControl(false, { nonNullable: true }),
    contents: new FormArray<FormControl<string>>([]),
  });

  protected readonly loading = signal(this.productId !== null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly saveState = signal<SaveState>('idle');
  protected readonly serverError = signal<string | null>(null);
  protected readonly savedMessage = signal<string | null>(
    this.router.getCurrentNavigation()?.extras.state?.['created']
      ? 'Producto creado. Puedes seguir editándolo.'
      : null,
  );
  protected readonly deleting = signal(false);

  /** Imagen ya guardada en el servidor. */
  protected readonly savedImageUrl = signal<string | null>(null);
  /** Imagen elegida y aún sin subir. */
  protected readonly pendingFile = signal<File | null>(null);
  protected readonly pendingPreview = signal<string | null>(null);
  protected readonly imageError = signal<string | null>(null);

  private readonly values = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly preview = computed(() => {
    const value = this.values();
    const price = parseInteger(value.priceCop);
    return {
      name: value.name?.trim() || 'Nombre del producto',
      summary: value.summary?.trim() || 'Aquí aparecerá la descripción corta.',
      price: formatCop(price === null || Number.isNaN(price) ? null : price),
      activities: parseInteger(value.activities),
      published: value.published ?? false,
      image: this.pendingPreview() ?? this.savedImageUrl(),
    };
  });

  constructor() {
    if (this.productId) {
      this.api
        .product(this.productId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (product) => {
            this.fill(product);
            this.loading.set(false);
          },
          error: (error: unknown) => {
            this.loadError.set(
              describeApiError(error, 'No pudimos cargar el producto.'),
            );
            this.loading.set(false);
          },
        });
    }
    this.destroyRef.onDestroy(() => this.revokePreview());
  }

  protected get contents(): FormArray<FormControl<string>> {
    return this.form.controls.contents;
  }

  protected errorFor(name: (typeof FIELD_ORDER)[number]): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !(control.touched || this.submitted())) return null;
    if (control.errors?.['integer']) return 'Escribe solo números enteros, sin decimales.';
    if (control.errors?.['maxValue']) return 'Revisa este valor: es demasiado alto.';
    return controlErrorMessage(control);
  }

  protected contentError(index: number): string | null {
    const control = this.contents.at(index);
    return control.invalid && (control.touched || this.submitted())
      ? controlErrorMessage(control)
      : null;
  }

  protected addContent(): void {
    if (this.contents.length >= MAX_CONTENTS) return;
    this.contents.push(this.contentControl(''));
    this.focusContent(this.contents.length - 1);
  }

  protected removeContent(index: number): void {
    this.contents.removeAt(index);
    this.contents.markAsDirty();
  }

  protected moveContent(index: number, offset: -1 | 1): void {
    const target = index + offset;
    if (target < 0 || target >= this.contents.length) return;
    const control = this.contents.at(index);
    this.contents.removeAt(index, { emitEvent: false });
    this.contents.insert(target, control);
    this.focusContent(target);
  }

  /** Muestra el precio con puntos de miles al salir del campo. */
  protected tidyPrice(): void {
    const control = this.form.controls.priceCop;
    const value = parseInteger(control.value);
    if (value !== null && !Number.isNaN(value)) {
      control.setValue(groupThousands(value));
    }
  }

  protected pickImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const error = imageFileError(file);
    this.imageError.set(error);
    if (error) return;
    this.revokePreview();
    this.pendingFile.set(file);
    this.pendingPreview.set(URL.createObjectURL(file));
  }

  protected discardImage(): void {
    this.revokePreview();
    this.pendingFile.set(null);
    this.imageError.set(null);
  }

  protected submit(): void {
    if (this.saveState() !== 'idle') return;
    this.submitted.set(true);
    this.serverError.set(null);
    this.savedMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    const body = this.toInput();
    const id = this.productId;
    this.saveState.set('saving');
    const save$ = id
      ? this.api.updateProduct(id, body)
      : this.api.createProduct(body);
    save$
      .pipe(
        switchMap((product) => this.uploadPending(product)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (product) => {
          this.saveState.set('idle');
          this.discardImage();
          if (!id) {
            void this.router.navigate(['/admin/productos', product.id], {
              replaceUrl: true,
              state: { created: true },
            });
            return;
          }
          this.fill(product);
          this.savedMessage.set(
            product.published
              ? 'Cambios guardados. Ya se ven en la tienda.'
              : 'Cambios guardados. El producto sigue como borrador.',
          );
        },
        error: (error: unknown) => {
          this.saveState.set('idle');
          this.serverError.set(describeApiError(error));
        },
      });
  }

  protected askDelete(): void {
    this.dialog()?.nativeElement.showModal();
  }

  protected cancelDelete(): void {
    this.dialog()?.nativeElement.close();
  }

  protected confirmDelete(): void {
    const id = this.productId;
    if (!id || this.deleting()) return;
    this.deleting.set(true);
    this.api.deleteProduct(id).subscribe({
      next: () => {
        this.dialog()?.nativeElement.close();
        void this.router.navigateByUrl('/admin/productos');
      },
      error: (error: unknown) => {
        this.deleting.set(false);
        this.dialog()?.nativeElement.close();
        this.serverError.set(describeApiError(error));
      },
    });
  }

  private uploadPending(product: AdminProduct): Observable<AdminProduct> {
    const file = this.pendingFile();
    if (!file) return of(product);
    this.saveState.set('uploading');
    return this.api.uploadProductImage(product.id, file);
  }

  private toInput(): ProductInput {
    const value = this.form.getRawValue();
    return {
      name: value.name.trim(),
      summary: value.summary.trim(),
      contents: value.contents.map((line) => line.trim()).filter(Boolean),
      priceCop: parseInteger(value.priceCop),
      stock: parseInteger(value.stock),
      activities: parseInteger(value.activities),
      sortOrder: parseInteger(value.sortOrder) ?? 0,
      imageAlt: value.imageAlt.trim(),
      published: value.published,
    };
  }

  private fill(product: AdminProduct): void {
    this.contents.clear({ emitEvent: false });
    for (const line of product.contents) {
      this.contents.push(this.contentControl(line), { emitEvent: false });
    }
    this.form.patchValue({
      name: product.name,
      summary: product.summary,
      priceCop: groupThousands(product.priceCop),
      stock: product.stock === null ? '' : String(product.stock),
      activities: product.activities === null ? '' : String(product.activities),
      sortOrder: String(product.sortOrder),
      imageAlt: product.imageAlt,
      published: product.published,
    });
    this.form.markAsPristine();
    this.savedImageUrl.set(product.imageUrl);
  }

  private contentControl(value: string): FormControl<string> {
    return new FormControl(value, {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    });
  }

  private focusFirstInvalid(): void {
    const name = FIELD_ORDER.find((key) => this.form.controls[key].invalid);
    if (name) {
      document.getElementById(`product-${name}`)?.focus();
      return;
    }
    const index = this.contents.controls.findIndex((c) => c.invalid);
    if (index >= 0) document.getElementById(`product-content-${index}`)?.focus();
  }

  /** Enfoca una línea de contenidos cuando ya está pintada. */
  private focusContent(index: number): void {
    afterNextRender(
      () => document.getElementById(`product-content-${index}`)?.focus(),
      { injector: this.injector },
    );
  }

  private revokePreview(): void {
    const url = this.pendingPreview();
    if (url) URL.revokeObjectURL(url);
    this.pendingPreview.set(null);
  }
}
