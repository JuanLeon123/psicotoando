// Llaves de Wompi falsas para las pruebas (se importan antes que AppModule).
export const WOMPI_TEST_KEYS = {
  WOMPI_ENV: 'sandbox',
  WOMPI_PUBLIC_KEY: 'pub_test_psicotoando',
  WOMPI_PRIVATE_KEY: 'prv_test_psicotoando',
  WOMPI_INTEGRITY_SECRET: 'test_integrity_secreto',
  WOMPI_EVENTS_SECRET: 'test_events_secreto',
} as const;

Object.assign(process.env, WOMPI_TEST_KEYS);
