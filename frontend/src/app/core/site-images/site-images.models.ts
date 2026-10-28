/** Foto elegida desde el panel para un hueco de la web. */
export interface SiteImage {
  readonly mediaId: string;
  readonly url: string;
  readonly alt: string;
  /** Punto que siempre queda visible al recortar, en % (0–100). */
  readonly focusX: number;
  readonly focusY: number;
}

export interface SiteImageInput {
  readonly mediaId: string;
  readonly alt: string;
  readonly focusX: number;
  readonly focusY: number;
}

/** Lo que pinta la web: la foto del panel o, si no hay, la original. */
export interface ResolvedSiteImage {
  readonly url: string;
  readonly alt: string;
  /** `object-position` de la foto del panel; null = el de la hoja de estilos. */
  readonly position: string | null;
}

export interface SiteImagePreview {
  readonly label: string;
  /** Valor CSS de `aspect-ratio` del hueco en ese tamaño de pantalla. */
  readonly ratio: string;
}

export interface SiteImageSlot {
  readonly key: SiteImageKey;
  readonly page: string;
  readonly label: string;
  readonly hint: string;
  /** cover = se recorta para llenar el hueco; contain = se ve entera. */
  readonly fit: 'cover' | 'contain';
  readonly previews: readonly SiteImagePreview[];
  /** Imagen de adorno: sin texto alternativo (alt=""). */
  readonly decorative: boolean;
  readonly original: { readonly url: string; readonly alt: string };
}

/** Mismas claves que `SITE_IMAGE_SLOTS` en el backend. */
export type SiteImageKey =
  | 'home.hero'
  | 'auth.visual'
  | 'about.story'
  | 'about.family'
  | 'kits.gallery.1'
  | 'kits.gallery.2'
  | 'kits.gallery.3'
  | 'kits.gallery.4'
  | 'advisory.hero'
  | 'advisory.gallery.1'
  | 'advisory.gallery.2'
  | 'advisory.gallery.3'
  | 'advisory.gallery.4'
  | 'resources.featured';

const ACTIVITY_PHOTOS = {
  stacking: {
    url: 'images/advisory-stacking.webp',
    alt: 'Vasos de colores para apilar y reproducir patrones sobre una bandeja.',
  },
  sorting: {
    url: 'images/advisory-sorting.webp',
    alt: 'Actividad de clasificación de pompones por colores con pinzas y recipientes.',
  },
  tracing: {
    url: 'images/advisory-tracing.webp',
    alt: 'Una mano traza líneas con tiza sobre una pizarra de madera.',
  },
  matching: {
    url: 'images/advisory-matching.webp',
    alt: 'Caja de actividades con piezas de colores para asociar y encajar.',
  },
};

const galleryPhoto = (
  page: 'kits' | 'advisory',
  index: number,
  original: SiteImageSlot['original'],
  ratio: string,
): SiteImageSlot => ({
  key: `${page}.gallery.${index}` as SiteImageKey,
  page: page === 'kits' ? 'Nuestros kits' : 'Asesoría y seguimiento',
  label: `Galería · foto ${index}`,
  hint:
    page === 'kits'
      ? 'Fila de cuatro fotos de actividades.'
      : 'Fotos de actividades en «Extensiones y nuevos retos».',
  fit: 'cover',
  previews: [{ label: 'Así se verá', ratio }],
  decorative: false,
  original,
});

/** Todos los huecos editables, en el orden en que aparecen en el panel. */
export const SITE_IMAGE_SLOTS: readonly SiteImageSlot[] = [
  {
    key: 'home.hero',
    page: 'Inicio',
    label: 'Portada principal',
    hint: 'La foto grande de la portada, con forma ovalada.',
    fit: 'cover',
    previews: [
      { label: 'Computador', ratio: '71 / 50' },
      { label: 'Móvil', ratio: '13 / 10' },
    ],
    decorative: false,
    original: {
      url: 'images/family-play.webp',
      alt: 'Una mamá y su hijo disfrutan construyendo juntos con bloques de madera de colores.',
    },
  },
  {
    key: 'about.story',
    page: 'Sobre nosotros',
    label: 'Foto principal',
    hint: 'Junto a la historia de la marca, arriba de la página.',
    fit: 'cover',
    previews: [
      { label: 'Computador', ratio: '4 / 5' },
      { label: 'Tablet', ratio: '16 / 11' },
      { label: 'Móvil', ratio: '4 / 3' },
    ],
    decorative: false,
    original: {
      url: 'images/about-play.webp',
      alt: 'Una mamá y su hijo comparten un juego con bloques de colores y fichas de actividades en casa.',
    },
  },
  {
    key: 'about.family',
    page: 'Sobre nosotros',
    label: 'Ilustración de los valores',
    hint: 'Se ve entera, sin recortes. Queda mejor una ilustración con fondo blanco o transparente (PNG).',
    fit: 'contain',
    previews: [{ label: 'Así se verá', ratio: '4 / 3' }],
    decorative: true,
    original: { url: 'images/about-family.webp', alt: '' },
  },
  galleryPhoto('kits', 1, ACTIVITY_PHOTOS.stacking, '4 / 3'),
  galleryPhoto('kits', 2, ACTIVITY_PHOTOS.sorting, '4 / 3'),
  galleryPhoto('kits', 3, ACTIVITY_PHOTOS.tracing, '4 / 3'),
  galleryPhoto('kits', 4, ACTIVITY_PHOTOS.matching, '4 / 3'),
  {
    key: 'advisory.hero',
    page: 'Asesoría y seguimiento',
    label: 'Foto principal',
    hint: 'Arriba de la página, junto al título.',
    fit: 'cover',
    previews: [{ label: 'Así se verá', ratio: '4 / 3' }],
    decorative: false,
    original: {
      url: 'images/advisory-hero.webp',
      alt: 'Una mamá y su hija participan juntas en una videollamada mientras juegan con materiales de colores.',
    },
  },
  galleryPhoto('advisory', 1, ACTIVITY_PHOTOS.matching, '1 / 1'),
  galleryPhoto('advisory', 2, ACTIVITY_PHOTOS.sorting, '1 / 1'),
  galleryPhoto('advisory', 3, ACTIVITY_PHOTOS.tracing, '1 / 1'),
  galleryPhoto('advisory', 4, ACTIVITY_PHOTOS.stacking, '1 / 1'),
  {
    key: 'resources.featured',
    page: 'Recursos para familias',
    label: 'Artículo destacado',
    hint: 'Foto vertical junto al artículo destacado.',
    fit: 'cover',
    previews: [
      { label: 'Computador', ratio: '4 / 5' },
      { label: 'Tablet', ratio: '16 / 10' },
      { label: 'Móvil', ratio: '4 / 3' },
    ],
    decorative: false,
    original: {
      url: 'images/resources-family.webp',
      alt: 'Una mamá y su hija comparten un momento de juego con bloques de colores en casa.',
    },
  },
  {
    key: 'auth.visual',
    page: 'Iniciar sesión y registro',
    label: 'Foto lateral',
    hint: 'Acompaña los formularios de acceso. Solo se ve en pantallas grandes.',
    fit: 'cover',
    previews: [{ label: 'Así se verá', ratio: '5 / 6' }],
    decorative: true,
    original: { url: 'images/family-play.webp', alt: '' },
  },
];

export const SITE_IMAGE_SLOT_BY_KEY = new Map(
  SITE_IMAGE_SLOTS.map((slot) => [slot.key, slot]),
);

export function resolveSiteImage(
  slot: SiteImageSlot,
  custom: SiteImage | undefined,
): ResolvedSiteImage {
  if (!custom) return { ...slot.original, position: null };
  return {
    url: custom.url,
    alt: slot.decorative ? '' : custom.alt,
    position: `${custom.focusX}% ${custom.focusY}%`,
  };
}
