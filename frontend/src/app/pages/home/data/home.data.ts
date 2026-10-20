import { IconName } from '../../../shared/components/icon/icon.component';

interface Benefit {
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
  readonly tone: 'teal' | 'coral' | 'yellow' | 'blue' | 'green';
}

export const BENEFITS: readonly Benefit[] = [
  {
    title: 'Juego con sentido',
    description:
      'Actividades diseñadas por profesionales para potenciar el desarrollo.',
    icon: 'home',
    tone: 'teal',
  },
  {
    title: 'Gratificantes y reconfortantes',
    description:
      'Experiencias que generan bienestar, motivación y conexión en familia.',
    icon: 'smile',
    tone: 'coral',
  },
  {
    title: 'Potenciamos el desarrollo',
    description:
      'Fortalecemos habilidades cognitivas, emocionales, motoras y sociales.',
    icon: 'sprout',
    tone: 'yellow',
  },
  {
    title: 'Acompañamiento profesional',
    description: 'Asesoría, pautas y seguimiento personalizado.',
    icon: 'family',
    tone: 'blue',
  },
  {
    title: 'Crecemos en familia',
    description: 'Porque el mejor lugar para desarrollarse es juntos.',
    icon: 'heart',
    tone: 'green',
  },
];
