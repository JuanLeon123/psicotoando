import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { CheckoutSession } from './order.models';

/**
 * Lleva al cliente al Web Checkout de Wompi. Wompi exige una navegación de
 * nivel superior (no un iframe ni una petición AJAX), así que se envía un
 * formulario GET con los campos que preparó el backend.
 */
@Injectable({ providedIn: 'root' })
export class WompiRedirectService {
  private readonly document = inject(DOCUMENT);

  go(session: CheckoutSession): void {
    const form = this.document.createElement('form');
    form.method = 'GET';
    form.action = session.checkoutUrl;
    form.hidden = true;
    for (const [name, value] of Object.entries(session.fields)) {
      const input = this.document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    this.document.body.appendChild(form);
    form.submit();
  }
}
