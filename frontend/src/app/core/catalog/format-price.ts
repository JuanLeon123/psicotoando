const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** 120000 → «$ 120.000». Sin precio → «Precio próximamente». */
export function formatCop(value: number | null): string {
  return value === null ? 'Precio próximamente' : COP.format(value);
}
