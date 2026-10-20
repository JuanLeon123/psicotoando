import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5433),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().min(60).default(900),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).default(30),
  PASSWORD_RESET_TTL_MINUTES: Joi.number().integer().min(5).default(60),
  COOKIE_SECURE: Joi.boolean().default(false),

  FRONTEND_URL: Joi.string().uri().default('http://localhost:4200'),
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),

  SMTP_HOST: Joi.string().allow('').default(''),
  SMTP_PORT: Joi.number().port().default(1025),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  MAIL_FROM: Joi.string().default(
    'Psico T.O ando <no-reply@psicotoando.local>',
  ),

  // Cuenta fija del panel de administración. Vacío = sin administrador.
  ADMIN_EMAIL: Joi.string().email().allow('').default(''),
  ADMIN_PASSWORD: Joi.when('ADMIN_EMAIL', {
    is: Joi.string().min(1),
    then: Joi.string().min(12).required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  ADMIN_NAME: Joi.string().default('Administración'),

  // Carpeta donde se guardan las imágenes subidas desde el panel.
  UPLOADS_DIR: Joi.string().default('uploads'),

  // Wompi. Vacío = pagos en línea desactivados (la tienda lo indica).
  // Llaves de pruebas: pub_test_ / prv_test_ / test_integrity_ / test_events_.
  WOMPI_ENV: Joi.string().valid('sandbox', 'production').default('sandbox'),
  WOMPI_PUBLIC_KEY: Joi.string().allow('').default(''),
  WOMPI_PRIVATE_KEY: Joi.string().allow('').default(''),
  WOMPI_INTEGRITY_SECRET: Joi.string().allow('').default(''),
  WOMPI_EVENTS_SECRET: Joi.string().allow('').default(''),
});
