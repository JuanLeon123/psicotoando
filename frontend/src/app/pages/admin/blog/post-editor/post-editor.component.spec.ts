import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminBlogApiService } from '../../../../core/blog/admin-blog-api.service';
import { AdminPost, PostInput } from '../../../../core/blog/blog.models';
import { PostEditorComponent } from './post-editor.component';
import { toPostBlock } from './editor-blocks';

describe('PostEditorComponent', () => {
  let fixture: ComponentFixture<PostEditorComponent>;
  let element: HTMLElement;
  let api: jasmine.SpyObj<AdminBlogApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<AdminBlogApiService>('AdminBlogApiService', [
      'categories',
      'createPost',
      'updatePost',
      'post',
      'media',
    ]);
    api.categories.and.returnValue(of(['Juego']));
    api.createPost.and.callFake((body: PostInput) =>
      of({
        ...body,
        id: 'post-1',
        slug: 'jugar-en-casa',
        coverAlt: body.coverAlt,
        readingMinutes: 1,
        publishedAt: null,
        createdAt: '',
        updatedAt: '',
      } as AdminPost),
    );
    TestBed.configureTestingModule({
      imports: [PostEditorComponent],
      providers: [
        provideRouter([]),
        { provide: AdminBlogApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    });
    fixture = TestBed.createComponent(PostEditorComponent);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  function addBlock(label: string): void {
    element.querySelector<HTMLButtonElement>('.add-block > button')!.click();
    fixture.detectChanges();
    Array.from(element.querySelectorAll<HTMLButtonElement>('.block-menu button'))
      .find((b) => b.textContent?.trim() === label)!
      .click();
    fixture.detectChanges();
  }

  function type(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  const blockTypes = () =>
    Array.from(element.querySelectorAll('.block-type')).map((el) => el.textContent?.trim());

  it('adds, moves and removes blocks', () => {
    addBlock('Párrafo');
    addBlock('Subtítulo');
    addBlock('Cita');
    expect(blockTypes()).toEqual(['1. Párrafo', '2. Subtítulo', '3. Cita']);

    element.querySelector<HTMLButtonElement>('[aria-label="Subir bloque 2"]')!.click();
    fixture.detectChanges();
    expect(blockTypes()).toEqual(['1. Subtítulo', '2. Párrafo', '3. Cita']);

    element.querySelector<HTMLButtonElement>('[aria-label="Eliminar bloque 3"]')!.click();
    fixture.detectChanges();
    expect(blockTypes()).toEqual(['1. Subtítulo', '2. Párrafo']);
  });

  it('creates the post and opens its edit page', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    type('#post-title', 'Jugar en casa');
    addBlock('Párrafo');
    type('.block textarea', 'Un rato de juego cada día.');
    addBlock('Video de YouTube');
    type('.block input[type="url"]', 'https://youtu.be/dQw4w9WgXcQ');
    expect(element.querySelector('.youtube-thumb')?.getAttribute('src')).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );

    element.querySelector<HTMLButtonElement>('.editor-side .button--primary')!.click();
    fixture.detectChanges();
    expect(api.createPost).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Jugar en casa',
        status: 'draft',
        blocks: [
          { type: 'paragraph', text: 'Un rato de juego cada día.' },
          { type: 'youtube', videoId: 'dQw4w9WgXcQ' },
        ],
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/admin/blog', 'post-1'], {
      replaceUrl: true,
      state: { blogSaved: 'Borrador guardado. Solo se ve en el panel.' },
    });
    expect(element.querySelector('.form-alert--success')?.textContent).toContain('Borrador guardado');
  });

  it('points to the incomplete block instead of saving', () => {
    type('#post-title', 'Jugar en casa');
    addBlock('Párrafo');
    element.querySelector<HTMLButtonElement>('.editor-side .button--primary')!.click();
    fixture.detectChanges();
    expect(api.createPost).not.toHaveBeenCalled();
    expect(element.querySelector('.form-alert--error')?.textContent).toContain(
      'Revisa el bloque 1: El párrafo está vacío.',
    );
  });

  it('rejects links that are not YouTube videos', () => {
    expect(toPostBlock({ uid: 1, type: 'youtube', link: 'https://vimeo.com/1', caption: '' })).toBe(
      'Pega un enlace de YouTube válido.',
    );
  });
});
