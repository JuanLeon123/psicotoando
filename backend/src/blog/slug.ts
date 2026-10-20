/** «Cuidar a quien cuida» → «cuidar-a-quien-cuida». */
export function slugify(text: string, fallback: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 160) || fallback
  );
}
