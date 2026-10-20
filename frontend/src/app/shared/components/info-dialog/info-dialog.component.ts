import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import {
  InfoDialogAction,
  InfoDialogService,
} from '../../../core/services/info-dialog.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-info-dialog',
  imports: [IconComponent],
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoDialogComponent {
  protected readonly info = inject(InfoDialogService);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog().nativeElement;
      if (this.info.content()) {
        if (!element.open) element.showModal();
      } else if (element.open) {
        element.close();
      }
    });
  }

  protected runAction(action: InfoDialogAction): void {
    action.run?.();
    this.info.close();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      const bounds = this.dialog().nativeElement.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        this.info.close();
    }
  }
}
