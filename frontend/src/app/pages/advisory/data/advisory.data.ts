import { IconName } from '../../../shared/components/icon/icon.component';

interface AdvisoryStep {
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
  readonly tone: 'teal' | 'coral' | 'yellow';
}

export const INITIAL_STEPS: readonly AdvisoryStep[] = [
  {
    title: 'Nos cuentas sobre tu hijo o hija',
    description: 'Antecedentes, manejo terapéutico actual y necesidades.',
    icon: 'clipboard',
    tone: 'teal',
  },
  {
    title: 'Hacemos una valoración rápida',
    description: 'Analizamos la información para orientarte.',
    icon: 'chat',
    tone: 'coral',
  },
  {
    title: 'Te guiamos en la elección del kit más adecuado',
    description: 'Según el nivel de desarrollo y los objetivos iniciales.',
    icon: 'box',
    tone: 'yellow',
  },
  {
    title: 'Definimos objetivos con sentido',
    description: 'Claros, realistas y alcanzables.',
    icon: 'target',
    tone: 'coral',
  },
];

export const FOLLOW_UP_SERVICES: readonly AdvisoryStep[] = [
  {
    title: 'Asesoría del producto con respuesta rápida',
    description:
      'Podrás consultarnos tus dudas sobre el uso del kit y sus actividades.',
    icon: 'chat',
    tone: 'teal',
  },
  {
    title: 'Hasta 2 asesorías o seguimientos virtuales',
    description:
      'Posterior a la compra, para revisar cómo va el proceso y realizar los ajustes necesarios.',
    icon: 'video',
    tone: 'yellow',
  },
];

export const ACTIVITY_GALLERY = [
  {
    image: 'images/advisory-matching.webp',
    alt: 'Caja de actividades con piezas de colores para asociar y encajar.',
  },
  {
    image: 'images/advisory-sorting.webp',
    alt: 'Actividad de clasificación de pompones por colores con pinzas y recipientes.',
  },
  {
    image: 'images/advisory-tracing.webp',
    alt: 'Una mano traza líneas con tiza sobre una pizarra de madera.',
  },
  {
    image: 'images/advisory-stacking.webp',
    alt: 'Vasos de colores para apilar y reproducir patrones sobre una bandeja.',
  },
] as const;
