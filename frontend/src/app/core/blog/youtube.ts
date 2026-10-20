const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function isYoutubeId(value: string): boolean {
  return YOUTUBE_ID.test(value);
}

/**
 * Extrae el id de un video de YouTube a partir del id o de un enlace
 * (watch?v=, youtu.be/, embed/, shorts/). Igual que el backend.
 */
export function youtubeId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  let candidate: string | null = null;
  if (host === 'youtu.be') {
    candidate = url.pathname.slice(1).split('/')[0];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    candidate =
      url.searchParams.get('v') ??
      url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ??
      null;
  }
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
