import { Injectable, inject, signal } from '@angular/core';
import { SiteSettingsService } from '../settings/site-settings.service';
import { whatsappUrl } from '../settings/site-settings.models';
import { IconName } from '../../shared/components/icon/icon.component';

export interface InfoDialogAction {
  readonly label: string;
  /** Enlace externo (p. ej. wa.me); se abre en otra pestaña. */
  readonly href?: string;
  /** Acción en la propia web (p. ej. añadir al carrito); después se cierra la ventana. */
  readonly run?: () => void;
  readonly icon?: IconName;
}

export interface InfoDialogContent {
  readonly eyebrow: string;
  readonly title: string;
  /** Dato destacado bajo el título, p. ej. el precio. */
  readonly highlight?: string;
  readonly description: string;
  readonly items?: readonly string[];
  readonly image?: string;
  readonly imageAlt?: string;
  readonly action?: InfoDialogAction;
}

const ADVISORY_MESSAGE =
  'Hola, me gustaría agendar una asesoría con Psico T.O ando.';

@Injectable({ providedIn: 'root' })
export class InfoDialogService {
  private readonly settings = inject(SiteSettingsService);
  private readonly currentContent = signal<InfoDialogContent | null>(null);
  readonly content = this.currentContent.asReadonly();

  open(content: InfoDialogContent): void {
    this.currentContent.set(content);
  }
  close(): void {
    this.currentContent.set(null);
  }

  openAdvisory(): void {
    const whatsapp = this.settings.settings().whatsappNumber;
    const items = [
      'Orientación para elegir actividades con sentido.',
      'Pautas para integrar el juego en tu día a día.',
    ];
    this.open({
      eyebrow: 'Asesoría y seguimiento',
      title: 'Te acompañamos en cada paso',
      description:
        'Un espacio para conocer las necesidades de tu familia y orientarte en el uso de nuestros materiales en casa.',
      items: whatsapp
        ? items
        : [...items, 'El canal de reservas estará disponible próximamente.'],
      action: whatsapp
        ? {
            label: 'Escribir por WhatsApp',
            href: whatsappUrl(whatsapp, ADVISORY_MESSAGE),
            icon: 'whatsapp',
          }
        : undefined,
    });
  }
}
