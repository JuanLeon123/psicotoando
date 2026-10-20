import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/admin/admin-api.service';
import { AdminSummary } from '../../../core/admin/admin.models';
import { describeApiError } from '../../../core/auth/api-error';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { formatCop } from '../../../core/catalog/format-price';

const SHORT_DATE = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** «2026-10-19» → «19 oct» (la fecha ya viene en hora de Colombia). */
const shortDate = (isoDay: string) => SHORT_DATE.format(new Date(`${isoDay}T00:00:00Z`));

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['../_admin-shared.scss', './dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly api = inject(AdminApiService);
  protected readonly auth = inject(AuthService);
  protected readonly summary = signal<AdminSummary | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly formatCop = formatCop;
  protected readonly shortDate = shortDate;

  /** Barras del gráfico: altura relativa al mejor día del periodo. */
  protected readonly chart = computed(() => {
    const days = this.summary()?.sales.dailyRevenue ?? [];
    const max = Math.max(0, ...days.map((d) => d.revenueCop));
    return {
      max,
      days: days.map((d) => ({
        ...d,
        label: shortDate(d.date),
        height: max ? Math.max(2, Math.round((d.revenueCop / max) * 100)) : 0,
      })),
    };
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.api.summary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: (error: unknown) => this.error.set(describeApiError(error)),
    });
  }
}
