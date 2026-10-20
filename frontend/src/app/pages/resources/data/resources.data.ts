export type ResourceIllustration =
  | 'feelings'
  | 'learning'
  | 'rest'
  | 'progress'
  | 'support'
  | 'care';

export interface CaregiverRecommendation {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly illustration: ResourceIllustration;
}

export const CAREGIVER_RECOMMENDATIONS: readonly CaregiverRecommendation[] = [
  {
    id: 'reconocer-emociones',
    title: 'Reconoce cómo te sientes',
    description:
      'Cuidar también puede generar cansancio, preocupación, frustración o miedo. No tienes que sentirte bien todo el tiempo. Reconocer lo que sientes es también una forma de cuidarte.',
    illustration: 'feelings',
  },
  {
    id: 'pedir-orientacion',
    title: 'No tienes que saberlo todo',
    description:
      'Pedir orientación, buscar información y aceptar ayuda no significa que estés fallando. Contar con herramientas claras te permite acompañar mejor y sentir mayor confianza en el proceso.',
    illustration: 'learning',
  },
  {
    id: 'tiempo-para-ti',
    title: 'Reserva pequeños momentos para ti',
    description:
      'No siempre es posible tener mucho tiempo libre, pero unos minutos para respirar, descansar, caminar, escuchar música o hacer algo que disfrutes pueden marcar la diferencia. Tu bienestar también importa.',
    illustration: 'rest',
  },
  {
    id: 'celebrar-logros',
    title: 'Reconoce los pequeños logros',
    description:
      'El desarrollo se construye paso a paso. Celebra los avances de tu hijo o hija, pero también reconoce tus propios esfuerzos. Lo que hoy parece pequeño puede ser un gran paso en el camino.',
    illustration: 'progress',
  },
  {
    id: 'buscar-apoyo',
    title: 'Busca acompañamiento cuando lo necesites',
    description:
      'No tienes que afrontar solo las pausas, dificultades o cambios en los procesos terapéuticos. Buscar apoyo profesional y utilizar recursos adecuados puede ayudarte a transformar la incertidumbre en oportunidades para continuar acompañando.',
    illustration: 'support',
  },
];
