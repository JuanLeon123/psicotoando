/**
 * Huecos de la web cuya foto se puede cambiar desde el panel. El frontend
 * guarda, para cada uno, la página, la forma y la imagen original.
 */
export const SITE_IMAGE_SLOTS = [
  'home.hero',
  'auth.visual',
  'about.story',
  'about.family',
  'kits.gallery.1',
  'kits.gallery.2',
  'kits.gallery.3',
  'kits.gallery.4',
  'advisory.hero',
  'advisory.gallery.1',
  'advisory.gallery.2',
  'advisory.gallery.3',
  'advisory.gallery.4',
  'resources.featured',
] as const;

export type SiteImageSlot = (typeof SITE_IMAGE_SLOTS)[number];

export function isSiteImageSlot(key: string): key is SiteImageSlot {
  return (SITE_IMAGE_SLOTS as readonly string[]).includes(key);
}
