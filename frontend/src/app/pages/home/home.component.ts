import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';
import { BenefitsComponent } from './components/benefits/benefits.component';
import { KitsComponent } from './components/kits/kits.component';
import { NextStepsComponent } from './components/next-steps/next-steps.component';

@Component({
  selector: 'app-home',
  imports: [
    HeroComponent,
    BenefitsComponent,
    KitsComponent,
    NextStepsComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
