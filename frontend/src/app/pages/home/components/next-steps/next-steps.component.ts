import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IconComponent,
  IconName,
} from '../../../../shared/components/icon/icon.component';

interface NextStep {
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
  readonly link: string;
}

@Component({
  selector: 'app-home-next-steps',
  imports: [RouterLink, IconComponent],
  templateUrl: './next-steps.component.html',
  styleUrl: './next-steps.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextStepsComponent {
  protected readonly steps: readonly NextStep[] = [
    {
      title: 'Sobre nosotros',
      description: 'Conoce quiénes somos y por qué unimos psicología y terapia ocupacional.',
      icon: 'family-heart',
      link: '/sobre-nosotros',
    },
    {
      title: 'Asesoría y seguimiento',
      description: 'Te orientamos para elegir el kit adecuado y te acompañamos en el proceso.',
      icon: 'chat',
      link: '/asesoria-y-seguimiento',
    },
    {
      title: 'Recursos para familias',
      description: 'Ideas y recomendaciones para cuidar también de quien cuida.',
      icon: 'heart',
      link: '/recursos-para-familias',
    },
  ];
}
