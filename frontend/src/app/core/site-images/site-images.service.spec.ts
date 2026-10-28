import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { SiteImage } from './site-images.models';
import { SiteImagesService } from './site-images.service';

const UPLOADED: SiteImage = {
  mediaId: '5b0f5f6e-7d1c-4c55-9a3e-2f4f1d1c9a10',
  url: '/api/uploads/blog/portada.webp',
  alt: 'Mamá e hijo leen un cuento.',
  focusX: 30,
  focusY: 70,
};

describe('SiteImagesService', () => {
  let service: SiteImagesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SiteImagesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the original image until the panel changes it', () => {
    const hero = service.image('home.hero');
    expect(hero()).toEqual({
      url: 'images/family-play.webp',
      alt: 'Una mamá y su hijo disfrutan construyendo juntos con bloques de madera de colores.',
      position: null,
    });

    service.set('home.hero', UPLOADED);
    expect(hero()).toEqual({
      url: UPLOADED.url,
      alt: UPLOADED.alt,
      position: '30% 70%',
    });

    service.set('home.hero', null);
    expect(hero().url).toBe('images/family-play.webp');
  });

  it('keeps decorative images without alt text', () => {
    service.set('auth.visual', UPLOADED);
    expect(service.image('auth.visual')().alt).toBe('');
  });

  it('loads the chosen images at startup', async () => {
    const loading = service.load();
    http.expectOne('/api/site-images').flush({ 'about.story': UPLOADED });
    await loading;
    expect(service.image('about.story')().url).toBe(UPLOADED.url);
    expect(service.image('home.hero')().url).toBe('images/family-play.webp');
  });

  it('falls back to the original images when the API fails', async () => {
    const loading = service.load();
    http
      .expectOne('/api/site-images')
      .flush('error', { status: 500, statusText: 'Server Error' });
    await loading;
    expect(service.images()).toEqual({});
  });
});
