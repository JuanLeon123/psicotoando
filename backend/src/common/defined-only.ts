/**
 * Keeps only the fields the client actually sent. DTO classes declare every
 * field, so absent ones arrive as `undefined` and would wipe columns on assign.
 */
export function definedOnly<T extends object>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
