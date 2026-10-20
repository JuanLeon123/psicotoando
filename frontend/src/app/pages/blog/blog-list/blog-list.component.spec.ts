import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BlogService } from '../../../core/blog/blog.service';
import { PostPage, PostSummary } from '../../../core/blog/blog.models';
import { BlogListComponent } from './blog-list.component';

function post(n: number, category: string): PostSummary {
  return {
    id: `p-${n}`,
    slug: `articulo-${n}`,
    title: `Artículo ${n}`,
    excerpt: `Resumen ${n}`,
    category,
    coverUrl: null,
    coverAlt: '',
    publishedAt: '2026-10-19T12:00:00.000Z',
    readingMinutes: 3,
  };
}

describe('BlogListComponent', () => {
  let list: jasmine.Spy;

  beforeEach(() => {
    list = jasmine.createSpy('list').and.callFake(
      (options: { category?: string | null; page?: number }) => {
        const all = [post(1, 'Juego'), post(2, 'Familia'), post(3, 'Juego')];
        const items = options.category
          ? all.filter((p) => p.category === options.category)
          : all;
        const page: PostPage = {
          items: options.page === 2 ? [post(4, 'Juego')] : items,
          total: options.category ? items.length : 4,
          page: options.page ?? 1,
          pageSize: 9,
          categories: ['Familia', 'Juego'],
        };
        return of(page);
      },
    );
    TestBed.configureTestingModule({
      imports: [BlogListComponent],
      providers: [provideRouter([]), { provide: BlogService, useValue: { list } }],
    });
  });

  const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

  it('renders post cards with date and reading time', () => {
    const fixture = TestBed.createComponent(BlogListComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const cards = element.querySelectorAll('.post-card');
    expect(cards.length).toBe(3);
    expect(text(cards[0].querySelector('h2'))).toBe('Artículo 1');
    expect(cards[0].querySelector('h2 a')?.getAttribute('href')).toBe('/blog/articulo-1');
    expect(text(cards[0].querySelector('.post-meta'))).toContain('19 de octubre de 2026');
    expect(text(cards[0].querySelector('.post-meta'))).toContain('3 min de lectura');
  });

  it('filters by category and loads more posts', () => {
    const fixture = TestBed.createComponent(BlogListComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('.more button')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.post-card').length).toBe(4);

    const chips = Array.from(element.querySelectorAll<HTMLButtonElement>('.chip'));
    chips.find((c) => text(c) === 'Juego')!.click();
    fixture.detectChanges();
    expect(list).toHaveBeenCalledWith({ page: 1, pageSize: 9, category: 'Juego' });
    expect(element.querySelectorAll('.post-card').length).toBe(2);
    expect(chips.find((c) => text(c) === 'Juego')!.getAttribute('aria-pressed')).toBe('true');
  });
});
