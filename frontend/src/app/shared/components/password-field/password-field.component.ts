import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

/** Password input with an accessible show/hide toggle. */
@Component({
  selector: 'app-password-field',
  imports: [ReactiveFormsModule],
  template: `
    <div class="password-input">
      <input
        class="form-input"
        [id]="inputId()"
        [type]="visible() ? 'text' : 'password'"
        [formControl]="control()"
        [attr.autocomplete]="autocomplete()"
        [attr.aria-invalid]="invalid()"
        [attr.aria-describedby]="describedBy() || null"
        [attr.aria-required]="required() || null"
        maxlength="128"
        spellcheck="false"
        autocapitalize="off"
      />
      <button
        class="password-toggle"
        type="button"
        [attr.aria-pressed]="visible()"
        [attr.aria-controls]="inputId()"
        (click)="visible.set(!visible())"
      >
        {{ visible() ? 'Ocultar' : 'Mostrar' }}<span class="sr-only">
          contraseña</span
        >
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .password-input {
      position: relative;
    }
    .form-input {
      padding-right: 92px;
    }
    .password-toggle {
      position: absolute;
      top: 50%;
      right: 6px;
      min-width: 76px;
      min-height: 36px;
      padding: 6px 12px;
      border: 0;
      border-radius: var(--radius-pill);
      color: var(--color-heading);
      background: transparent;
      font-size: 13px;
      font-weight: 800;
      transform: translateY(-50%);
    }
    .password-toggle:hover {
      background: var(--color-sky);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFieldComponent {
  readonly inputId = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly autocomplete = input<'current-password' | 'new-password'>(
    'current-password',
  );
  readonly invalid = input(false);
  readonly required = input(true);
  readonly describedBy = input<string>('');
  protected readonly visible = signal(false);
}
