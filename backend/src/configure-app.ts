import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { static as serveStatic } from 'express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { UPLOADS_ROUTE } from './catalog/product-images.service';

/** Shared by main.ts and the e2e tests so both run the same HTTP pipeline. */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  // Detrás de nginx (mismo equipo): req.ip es la IP real del cliente para el límite de peticiones.
  app.getHttpAdapter().getInstance().set('trust proxy', 'loopback');
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  // Imágenes subidas desde el panel. Nombres aleatorios, así que se pueden cachear.
  app.use(
    UPLOADS_ROUTE,
    serveStatic(resolve(config.getOrThrow<string>('UPLOADS_DIR')), {
      index: false,
      immutable: true,
      maxAge: '365d',
    }),
  );
  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_URL'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException(validationMessages(errors)),
    }),
  );
}

/**
 * Same shape as Nest's default ({ message: string[] }), but nested fields
 * (e.g. cart items) keep their plain Spanish message without the
 * "items.0." prefix, and repeated messages appear once.
 */
function validationMessages(errors: ValidationError[]): string[] {
  const messages = new Set<string>();
  const visit = (error: ValidationError) => {
    Object.values(error.constraints ?? {}).forEach((m) => messages.add(m));
    error.children?.forEach(visit);
  };
  errors.forEach(visit);
  return [...messages];
}
