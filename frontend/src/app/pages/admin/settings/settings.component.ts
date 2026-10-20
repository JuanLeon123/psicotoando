import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { AdminApiService } from '../../../core/admin/admin-api.service';
import { describeApiError } from '../../../core/auth/api-error';
import { SiteSettingsService } from '../../../core/settings/site-settings.service';
import { SiteSettings } from '../../../core/settings/site-settings.models';
import {
  controlErrorMessage,
  focusFirstInvalid,
} from '../../../shared/forms/form-errors';
import { emailValidator } from '../../../shared/forms/validators';
import { OrdersService } from '../../../core/orders/orders.service';
import { formatCop } from '../../../core/catalog/format-price';
import {
  integerTextValidator,
  parseInteger,
} from '../products/product-form/product-form.validators';

const MAX_SHIPPING_COP = 5_000_000;
const MAX_FREE_FROM_COP = 100_000_000;

/** 12000 → «12.000» para mostrarlo en el campo. */
const pesosText = (value: number | null): string =>
  value === null ? '' : value.toLocaleString('es-CO');

function whatsappValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value?.trim() ?? '';
  if (!value) return null;
  if (!/^[+\d\s().-]+$/.test(value)) return { whatsapp: true };
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? null : { whatsapp: true };
}

function httpsValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value?.trim() ?? '';
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.includes('.') ? null : { https: true };
  } catch {
    return { https: true };
  }
}

const emptyToNull = (value: string): string | null => value.trim() || null;

/** «573001234567» → «+57 300 123 4567» solo para mostrarlo más legible. */
function displayWhatsapp(number: string | null): string {
  if (!number) return '';
  const match = /^57(\d{3})(\d{3})(\d{4})$/.exec(number);
  return match ? `+57 ${match[1]} ${match[2]} ${match[3]}` : `+${number}`;
}

@Component({
  selector: 'app-admin-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['../_admin-shared.scss', './settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSettingsComponent {
  private readonly api = inject(AdminApiService);
  private readonly siteSettings = inject(SiteSettingsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = new FormGroup({
    whatsappNumber: new FormControl('', {
      nonNullable: true,
      validators: [whatsappValidator],
    }),
    contactEmail: new FormControl('', {
      nonNullable: true,
      validators: [emailValidator],
    }),
    instagramUrl: new FormControl('', {
      nonNullable: true,
      validators: [httpsValidator],
    }),
    facebookUrl: new FormControl('', {
      nonNullable: true,
      validators: [httpsValidator],
    }),
    shippingFlatCop: new FormControl('', {
      nonNullable: true,
      validators: [integerTextValidator(MAX_SHIPPING_COP)],
    }),
    freeShippingFromCop: new FormControl('', {
      nonNullable: true,
      validators: [integerTextValidator(MAX_FREE_FROM_COP)],
    }),
  });
  protected readonly payments = toSignal(inject(OrdersService).paymentsConfig());
  /** En producción la API y la web comparten dominio, así que el webhook cuelga del mismo origen. */
  protected readonly webhookUrl = `${globalThis.location?.origin ?? ''}/api/payments/wompi/events`;
  protected readonly copied = signal(false);
  protected readonly formatCop = formatCop;
  protected readonly submitted = signal(false);
  protected readonly pending = signal(false);
  protected readonly saved = signal(false);
  protected readonly serverError = signal<string | null>(null);

  constructor() {
    // Los ajustes se cargan al arrancar la app; se rellenan mientras no se hayan editado.
    effect(() => {
      const settings = this.siteSettings.settings();
      untracked(() => {
        if (!this.form.dirty) this.fill(settings);
      });
    });
  }

  protected errorFor(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !(control.touched || this.submitted())) return null;
    if (control.errors?.['whatsapp']) {
      return 'Escribe el número con el indicativo del país, por ejemplo +57 300 123 4567.';
    }
    if (control.errors?.['https']) {
      return 'Pega el enlace completo, empezando por https://';
    }
    if (control.errors?.['integer']) {
      return 'Escribe un valor en pesos, sin decimales. Por ejemplo 12.000.';
    }
    if (control.errors?.['maxValue']) {
      return 'Revisa el valor: es demasiado alto.';
    }
    return controlErrorMessage(control);
  }

  protected submit(): void {
    if (this.pending()) return;
    this.submitted.set(true);
    this.saved.set(false);
    this.serverError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.form, 'settings');
      return;
    }
    const value = this.form.getRawValue();
    const body: SiteSettings = {
      whatsappNumber: emptyToNull(value.whatsappNumber),
      contactEmail: emptyToNull(value.contactEmail),
      instagramUrl: emptyToNull(value.instagramUrl),
      facebookUrl: emptyToNull(value.facebookUrl),
      shippingFlatCop: parseInteger(value.shippingFlatCop) ?? 0,
      freeShippingFromCop: parseInteger(value.freeShippingFromCop),
    };
    this.pending.set(true);
    this.api
      .updateSettings(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          this.pending.set(false);
          this.saved.set(true);
          this.form.markAsPristine();
          this.siteSettings.set(settings);
          this.fill(settings);
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.serverError.set(describeApiError(error));
        },
      });
  }

  private fill(settings: SiteSettings): void {
    this.form.reset({
      whatsappNumber: displayWhatsapp(settings.whatsappNumber),
      contactEmail: settings.contactEmail ?? '',
      instagramUrl: settings.instagramUrl ?? '',
      facebookUrl: settings.facebookUrl ?? '',
      shippingFlatCop: pesosText(settings.shippingFlatCop),
      freeShippingFromCop: pesosText(settings.freeShippingFromCop),
    });
  }

  protected async copyWebhook(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.webhookUrl);
      this.copied.set(true);
    } catch {
      document.getElementById('settings-webhook')?.focus();
    }
  }
}
