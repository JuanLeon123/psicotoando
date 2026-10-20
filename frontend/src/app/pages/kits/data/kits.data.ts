import { IconName } from '../../../shared/components/icon/icon.component';

export type KitTone = 'teal' | 'coral' | 'olive' | 'yellow';

export interface KitLevel {
  readonly name: string;
  readonly description: string;
  readonly icon: IconName;
  readonly tone: KitTone;
}

export interface DevelopmentArea {
  readonly name: string;
  readonly description: string;
  readonly icon: IconName;
  readonly tone: KitTone;
  readonly activities: readonly {
    readonly label: string;
    readonly icon: IconName;
  }[];
}

export const KIT_PHOTOS = [
  {
    image: 'images/advisory-stacking.webp',
    alt: 'Vasos de colores para apilar y reproducir patrones sobre una bandeja.',
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
    image: 'images/advisory-matching.webp',
    alt: 'Caja de actividades con piezas de colores para asociar y encajar.',
  },
] as const;

export const KIT_LEVELS: readonly KitLevel[] = [
  {
    name: 'Explorador',
    description:
      'Iniciamos el descubrimiento y la exploración del entorno y de sí mismos.',
    icon: 'search',
    tone: 'teal',
  },
  {
    name: 'Experimentador',
    description: 'Probamos, experimentamos y desarrollamos nuevas habilidades.',
    icon: 'lightbulb',
    tone: 'yellow',
  },
  {
    name: 'Experto',
    description:
      'Integramos, aplicamos y fortalecemos habilidades de manera autónoma.',
    icon: 'star',
    tone: 'olive',
  },
];

export const DEVELOPMENT_AREAS: readonly DevelopmentArea[] = [
  {
    name: 'Cognitiva',
    description:
      'Favorece procesos de atención, memoria, seguimiento de instrucciones y resolución de problemas.',
    icon: 'brain',
    tone: 'teal',
    activities: [
      { label: 'Atención', icon: 'eye' },
      { label: 'Memoria', icon: 'memory' },
      { label: 'Resolución de problemas', icon: 'puzzle' },
    ],
  },
  {
    name: 'Sensorial',
    description:
      'Estimula la percepción e integración de estímulos visuales, auditivos y táctiles, favoreciendo la exploración y la respuesta al entorno.',
    icon: 'hand',
    tone: 'yellow',
    activities: [
      { label: 'Visual', icon: 'eye' },
      { label: 'Auditivo', icon: 'ear' },
      { label: 'Táctil', icon: 'hand' },
    ],
  },
  {
    name: 'Percepción / Visoespacial',
    description:
      'Estimula la discriminación visual y auditiva, la orientación espacial, el reconocimiento figura-fondo y las relaciones entre objetos (rompecabezas, tangram, copia de patrones).',
    icon: 'eye',
    tone: 'olive',
    activities: [
      { label: 'Discriminación', icon: 'search' },
      { label: 'Orientación espacial', icon: 'cube' },
      { label: 'Relaciones entre objetos', icon: 'shapes' },
    ],
  },
  {
    name: 'Motricidad fina',
    description:
      'Fortalece la coordinación óculo-manual, la precisión y el control de los movimientos pequeños de manos y dedos.',
    icon: 'hand',
    tone: 'coral',
    activities: [
      { label: 'Coordinación óculo-manual', icon: 'eye' },
      { label: 'Precisión', icon: 'target' },
      { label: 'Control de dedos', icon: 'hand' },
    ],
  },
  {
    name: 'Motricidad gruesa',
    description:
      'Favorece el equilibrio, la coordinación y el control postural mediante el movimiento de los grandes grupos musculares.',
    icon: 'run',
    tone: 'teal',
    activities: [
      { label: 'Equilibrio', icon: 'balance' },
      { label: 'Coordinación', icon: 'run' },
      { label: 'Control postural', icon: 'balance' },
    ],
  },
  {
    name: 'Viso construcción',
    description:
      'Potencia la coordinación visomotora y la capacidad de analizar e interpretar información visual para construir o reproducir modelos.',
    icon: 'cube',
    tone: 'yellow',
    activities: [
      { label: 'Coordinación visomotora', icon: 'pencil' },
      { label: 'Análisis visual', icon: 'eye' },
      { label: 'Construcción de modelos', icon: 'blocks' },
    ],
  },
  {
    name: 'Socioemocional',
    description:
      'Favorece el reconocimiento y la expresión de las emociones, la empatía, la autorregulación, la autoestima y el desarrollo de habilidades para establecer relaciones interpersonales positivas.',
    icon: 'heart',
    tone: 'olive',
    activities: [
      { label: 'Emociones', icon: 'smile' },
      { label: 'Empatía', icon: 'family' },
      { label: 'Relaciones positivas', icon: 'family-heart' },
    ],
  },
];
