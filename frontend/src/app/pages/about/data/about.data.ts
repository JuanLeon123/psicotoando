import { IconName } from '../../../shared/components/icon/icon.component';

export interface BrandStatement {
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
  readonly tone: 'teal' | 'green' | 'coral' | 'yellow';
}

export const BRAND_STORY: readonly string[] = [
  'Psico T.O ando nació como un canal interactivo de atención integral dedicado al apoyo de las familias para el bienestar y desarrollo de niños, niñas y adolescentes.',
  'Nuestro nombre nace de la unión entre la Psicología y la Terapia Ocupacional (Psico - TO). Añadimos el sufijo -ando para reflejar que el desarrollo humano es un proceso dinámico, continuo y en constante movimiento a lo largo del tiempo, trascendiendo momentos o intervenciones aisladas.',
  'En sus inicios, por medio de recursos interactivos, abordamos temas importantes y claves como la estimulación cognitiva, pautas de crianza, comunicación asertiva y el fomento de hábitos y rutinas para la vida diaria.',
  'Actualmente, Psico T.O ando se ha constituido como una empresa enfocada en el diseño, planeación y desarrollo de material de apoyo terapéutico y lúdico-pedagógico para enriquecer las intervenciones del sector salud.',
  'Su enfoque central es vincular activamente a las familias en los tratamientos de sus hijos con herramientas útiles, prácticas y sencillas para aplicar en el hogar, además de acompañamiento y asesoría en los procesos con objetivos claros, medibles y alcanzables en aquellos casos donde los servicios de salud se encuentran estancados, pausados o no han podido iniciar.',
];

export const BRAND_PURPOSE: readonly BrandStatement[] = [
  {
    title: 'Misión',
    description:
      'Diseñar, planear y desarrollar materiales y herramientas de apoyo terapéutico prácticas, accesibles y guiadas para potenciar el desarrollo integral de niños, niñas y adolescentes, vinculando activamente a sus familias en el proceso desde el hogar, promoviendo la continuidad, acompañamiento y soluciones efectivas ante las barreras o demoras del sistema de salud.',
    icon: 'target',
    tone: 'teal',
  },
  {
    title: 'Visión',
    description:
      'Ser una empresa referente e innovadora en la creación de recursos interactivos y herramientas de apoyo terapéutico a nivel familiar e institucional, transformando los hogares en entornos activos en los procesos terapéuticos, garantizando que el núcleo familiar cuente con el material y la guía necesaria para el desarrollo pleno.',
    icon: 'eye',
    tone: 'green',
  },
];

export const BRAND_VALUES: readonly BrandStatement[] = [
  {
    title: 'Vinculación Familiar',
    description:
      'Reconocer al entorno familiar como el actor clave y facilitador del proceso terapéutico.',
    icon: 'family-heart',
    tone: 'teal',
  },
  {
    title: 'Accesibilidad Lúdica',
    description:
      'Diseñar herramientas prácticas, dinámicas y sencillas que faciliten el aprendizaje en casa.',
    icon: 'puzzle',
    tone: 'coral',
  },
  {
    title: 'Compromiso y Acompañamiento',
    description:
      'Estar presentes y establecer metas claras cuando las familias enfrentan trabas o vacíos en el sistema de salud.',
    icon: 'care',
    tone: 'yellow',
  },
  {
    title: 'Empatía',
    description:
      'Promover la identificación y comprensión de las condiciones y necesidades familiares para proponer acciones acordes a estas para el bienestar emocional en niños y adolescentes.',
    icon: 'smile',
    tone: 'green',
  },
];
