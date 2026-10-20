import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostBlock } from '../../../core/blog/blog.models';
import { PostBlocksComponent } from './post-blocks.component';

describe('PostBlocksComponent', () => {
  function render(blocks: PostBlock[]): ComponentFixture<PostBlocksComponent> {
    TestBed.configureTestingModule({ imports: [PostBlocksComponent] });
    const fixture = TestBed.createComponent(PostBlocksComponent);
    fixture.componentRef.setInput('blocks', blocks);
    fixture.detectChanges();
    return fixture;
  }

  it('renders every block type with its own markup', () => {
    const element: HTMLElement = render([
      { type: 'heading', text: 'Jugar en casa' },
      { type: 'paragraph', text: 'Primera línea\nSegunda línea' },
      { type: 'image', url: 'images/a.webp', alt: 'Mamá e hija', caption: 'En la sala' },
      {
        type: 'gallery',
        images: [
          { url: 'images/b.webp', alt: 'Bloques' },
          { url: 'images/c.webp', alt: 'Pelotas' },
        ],
      },
      { type: 'video', url: '/api/uploads/blog/v.mp4', caption: 'Un juego' },
      { type: 'youtube', videoId: 'dQw4w9WgXcQ' },
      { type: 'quote', text: 'Crecemos en familia.', author: 'Psico T.O ando' },
      { type: 'list', items: ['Uno', 'Dos'] },
    ]).nativeElement;

    expect(element.querySelector('h2')?.textContent).toBe('Jugar en casa');
    expect(element.querySelector('.block-paragraph')?.textContent).toBe(
      'Primera línea\nSegunda línea',
    );
    expect(element.querySelector('figure img')?.getAttribute('alt')).toBe('Mamá e hija');
    expect(element.querySelector('figcaption')?.textContent).toBe('En la sala');
    expect(element.querySelectorAll('.block-gallery img').length).toBe(2);
    const video = element.querySelector('video')!;
    expect(video.getAttribute('src')).toBe('/api/uploads/blog/v.mp4');
    expect(video.hasAttribute('controls')).toBeTrue();
    expect(element.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0',
    );
    expect(element.querySelector('blockquote')?.textContent).toContain('— Psico T.O ando');
    expect(element.querySelectorAll('.block-list li').length).toBe(2);
  });

  it('never embeds an invalid YouTube id', () => {
    const element: HTMLElement = render([
      { type: 'youtube', videoId: '"><script>' },
    ]).nativeElement;
    expect(element.querySelector('iframe')).toBeNull();
  });

  it('shows markup in text as plain text instead of HTML', () => {
    const element: HTMLElement = render([
      { type: 'paragraph', text: '<img src=x onerror=alert(1)><b>hola</b>' },
    ]).nativeElement;
    const paragraph = element.querySelector('.block-paragraph')!;
    expect(paragraph.querySelector('img, b')).toBeNull();
    expect(paragraph.textContent).toContain('<b>hola</b>');
  });

  it('opens images in a lightbox', () => {
    const fixture = render([{ type: 'image', url: 'images/a.webp', alt: 'Mamá e hija' }]);
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('.zoomable')!.click();
    fixture.detectChanges();
    const dialog = element.querySelector<HTMLDialogElement>('dialog.lightbox')!;
    expect(dialog.open).toBeTrue();
    expect(dialog.querySelector('img')?.getAttribute('alt')).toBe('Mamá e hija');
    dialog.close();
  });
});
