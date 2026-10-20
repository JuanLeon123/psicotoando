import { createHash, timingSafeEqual } from 'node:crypto';

const sha256 = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex');

/** Firma de integridad del Web Checkout: SHA-256 de referencia + monto + moneda + secreto. */
export function integritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
): string {
  return sha256(`${reference}${amountInCents}${currency}${integritySecret}`);
}

export interface WompiEventSignature {
  readonly properties: readonly string[];
  readonly checksum: string;
}

/** Valor de una ruta con puntos («transaction.id») dentro de `data`. */
function valueAt(data: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object' && key in node) {
      return (node as Record<string, unknown>)[key];
    }
    return undefined;
  }, data);
}

/**
 * Checksum de un evento: SHA-256 de los valores de `signature.properties`
 * (en su orden, tomados de `data`), más `timestamp`, más el secreto de eventos.
 * La lista de propiedades la decide Wompi en cada evento; no se fija aquí.
 */
export function eventChecksum(
  data: unknown,
  properties: readonly string[],
  timestamp: number | string,
  eventsSecret: string,
): string {
  const values = properties.map((path) => {
    const value = valueAt(data, path);
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  });
  return sha256(`${values.join('')}${timestamp}${eventsSecret}`);
}

/** Compara checksums hex sin filtrar tiempos (Wompi los envía en mayúsculas). */
export function checksumMatches(expected: string, received: string): boolean {
  const a = Buffer.from(expected.toLowerCase(), 'utf8');
  const b = Buffer.from(received.trim().toLowerCase(), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
