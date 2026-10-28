import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'cart'
  | 'bag'
  | 'arrow'
  | 'heart'
  | 'home'
  | 'smile'
  | 'sprout'
  | 'family'
  | 'whatsapp'
  | 'menu'
  | 'close'
  | 'user'
  | 'target'
  | 'eye'
  | 'family-heart'
  | 'puzzle'
  | 'care'
  | 'clipboard'
  | 'chat'
  | 'box'
  | 'video'
  | 'chart'
  | 'play'
  | 'instagram'
  | 'facebook'
  | 'brain'
  | 'hand'
  | 'ear'
  | 'search'
  | 'cube'
  | 'shapes'
  | 'balance'
  | 'run'
  | 'lightbulb'
  | 'star'
  | 'memory'
  | 'blocks'
  | 'pencil'
  | 'image';

const ICON_PATHS: Record<IconName, readonly string[]> = {
  brain: [
    'M12 5a3 3 0 0 0-5.6-1.5A3 3 0 0 0 3 7a3 3 0 0 0-1 5 3 3 0 0 0 2 5 3 3 0 0 0 5 2.5 3 3 0 0 0 3-.5V5Z',
    'M12 5a3 3 0 0 1 5.6-1.5A3 3 0 0 1 21 7a3 3 0 0 1 1 5 3 3 0 0 1-2 5 3 3 0 0 1-5 2.5 3 3 0 0 1-3-.5',
    'M8 9a2 2 0 0 1 2 2m6-2a2 2 0 0 0-2 2m-7 3h2m6 0h2',
  ],
  hand: [
    'M18 11V6a2 2 0 0 0-4 0v5m0-1V4a2 2 0 0 0-4 0v6m0 .5V6a2 2 0 0 0-4 0v8',
    'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L6 15',
  ],
  ear: [
    'M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0',
    'M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4',
  ],
  search: ['M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z', 'm15.5 15.5 5 5'],
  cube: ['m12 2 9 5v10l-9 5-9-5V7l9-5Z', 'm3 7 9 5 9-5M12 12v10'],
  shapes: [
    'M8 3 3 11h10L8 3Z',
    'M21 17a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    'M3 14h7v7H3z',
  ],
  balance: [
    'M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
    'M3 9h18M12 9v6m0 0-4 7m4-7 4 7',
  ],
  run: [
    'M17 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
    'm5 21 4-5 3 1 2-5 3 3h3M8 11l3-3 4 1-2 4',
  ],
  lightbulb: [
    'M9 18h6m-5 4h4',
    'M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V18h6v-1.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z',
  ],
  star: [
    'm12 2 3 6.3 7 1-5 4.8 1.2 6.9-6.2-3.2L5.8 21 7 14.1 2 9.3l7-1Z',
  ],
  memory: [
    'M15 22v-4h2a2 2 0 0 0 2-2v-3l2-1-2-3.5A8 8 0 0 0 4 9c0 3 1 5 3 6.5V22',
    'M13 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  ],
  blocks: ['M3 14h8v7H3zM13 14h8v7h-8zM8 4h8v10H8z'],
  image: [
    'M3 5h18v14H3Z',
    'm3 16 5-5 4 4 3-3 6 6',
    'M16.5 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z',
  ],
  pencil: ['M17 3l4 4L8 20H4v-4L17 3Z', 'm14 6 4 4'],
  clipboard: [
    'M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2',
    'M9 2h6v4H9z',
    'M8 10h.01M12 10h4M8 14h.01M12 14h4M8 18h.01M12 18h4',
  ],
  chat: [
    'M17 11a5 5 0 0 0-5-5H7a5 5 0 0 0-5 5v1a5 5 0 0 0 3 4.6V21l5-4h2a5 5 0 0 0 5-5v-1Z',
    'M10 3h7a5 5 0 0 1 5 5v6l-3-2',
    'M6 11h.01M10 11h.01M14 11h.01',
  ],
  box: ['m3 7 9-5 9 5v10l-9 5-9-5V7Z', 'm3 7 9 5 9-5M12 12v10M8 4l9 5'],
  video: [
    'M2 3h20v14H2V3ZM9 17v4m6-4v4M6 21h12',
    'M11 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5 14a4 4 0 0 1 8 0M18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM14 11a4 4 0 0 1 6 3',
  ],
  chart: ['M4 13h3v8H4ZM11 8h3v13h-3ZM18 3h3v18h-3Z'],
  play: ['m8 4 13 8-13 8V4Z'],
  instagram: [
    'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z',
    'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM18 6h.01',
  ],
  facebook: ['M15 22V13h3l1-4h-4V6c0-1 1-2 2-2h2V1h-3c-4 0-6 2-6 6v2H7v4h3v9'],
  target: [
    'M20.5 10A9 9 0 1 1 14 3.5',
    'M16 10a5 5 0 1 1-6-3',
    'm11 13 9-9',
    'm16 4 4-3v3h3l-4 4h-3V4Z',
  ],
  eye: [
    'M2 13s3-6 10-6 10 6 10 6-3 6-10 6S2 13 2 13Z',
    'M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    'M12 2v2M4 4l2 2m14-2-2 2M12 22v-1',
  ],
  'family-heart': [
    'M12 7S6 4 8 2c1-1 3-1 4 1 1-2 3-2 4-1 2 2-4 5-4 5Z',
    'M8 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM20 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
    'M2 22v-5a4 4 0 0 1 7-2m13 7v-5a4 4 0 0 0-7-2M5 18v4m14-4v4',
    'M14 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 23v-2a4 4 0 0 1 8 0v2',
  ],
  puzzle: [
    'M9 3H5a2 2 0 0 0-2 2v4c4-2 4 4 0 2v7a2 2 0 0 0 2 2h4c-2-4 4-4 2 0h7a2 2 0 0 0 2-2v-4c4 2 4-4 0-2V5a2 2 0 0 0-2-2h-4c2-4-4-4-2 0H9Z',
    'M10 5v3m5 2h3M5 14h3m6 1v3',
  ],
  care: [
    'M12 12S5 8 5 5a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 3-7 7-7 7Z',
    'M10 22 4 18 1 11c0-2 2-2 3 0l2 4m4 7v-5l-3-3c-2-1-3 1-1 2l2 2M14 22l6-4 3-7c0-2-2-2-3 0l-2 4m-4 7v-5l3-3c2-1 3 1 1 2l-2 2',
  ],
  cart: [
    'M3 3h2l2.4 11.4a2 2 0 0 0 2 1.6H18a2 2 0 0 0 2-1.6L21 7H6',
    'M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
    'M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  ],
  bag: ['M5 7h14l1 14H4L5 7Z', 'M9 8V5a3 3 0 0 1 6 0v3'],
  arrow: ['M4 12h15', 'm13 6 6 6-6 6'],
  heart: [
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  ],
  home: [
    'm2 10 10-8 10 8',
    'M5 9v12h5v-5m4 0v5h5V9',
    'M12 16s-5-3-5-5a2.6 2.6 0 0 1 5-1 2.6 2.6 0 0 1 5 1c0 2-5 5-5 5Z',
  ],
  smile: [
    'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    'M8 9h.01M16 9h.01',
    'M7 14s1.5 4 5 4 5-4 5-4',
  ],
  sprout: [
    'M12 22V10',
    'M12 13C4 13 3 8 3 3c6 0 9 3 9 10Z',
    'M12 10c0-6 4-8 9-8 0 6-3 8-9 8Z',
    'M12 20c-6 0-9-3-9-6 5 0 9 1 9 6Z',
    'M12 18c0-4 4-6 9-6 0 4-3 6-9 6Z',
  ],
  family: [
    'M10 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    'M21 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    'M2 21v-6a5 5 0 0 1 5-5m15 11v-5a5 5 0 0 0-5-5',
    'M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    'M7 22v-2a5 5 0 0 1 10 0v2M5 16v5M19 17v4',
  ],
  whatsapp: [
    'M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.6-4.5A9 9 0 1 1 21 11.5Z',
    'M8 7c-2 3 4 9 7 7l1-2-3-1-1 1-2-2 1-1-1-3-2 1Z',
  ],
  menu: ['M4 6h16M4 12h16M4 18h16'],
  close: ['m6 6 12 12M18 6 6 18'],
  user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z', 'M4 21v-2a8 8 0 0 1 16 0v2'],
};

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    @for (path of paths[name()]; track $index) {
      <path [attr.d]="path" />
    }
  </svg>`,
  styles: [
    ':host { display: inline-flex; width: 24px; height: 24px; flex: 0 0 auto; } svg { width: 100%; height: 100%; }',
  ],
})
export class IconComponent {
  readonly name = input.required<IconName>();
  protected readonly paths = ICON_PATHS;
}
