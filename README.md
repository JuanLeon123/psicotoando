# Psico T.O ando

Juego con sentido, gratificante y reconfortante. Crecemos en familia.

```text
frontend/   Angular 19: la web, la tienda, las pantallas de cliente y el panel /admin
backend/    NestJS 11 + PostgreSQL: API de cuentas, sesiones, catálogo y ajustes
infra/      Scripts de inicialización de la base de datos local
docker-compose.yml   PostgreSQL (5433), Mailpit (SMTP 1025, web 8025), backend (3000) y frontend (4200)
```

## Desarrollo con Docker

```bash
cp backend/.env.example backend/.env   # genera JWT_ACCESS_SECRET: openssl rand -base64 48
docker compose up -d --build           # web en http://localhost:4200, API en http://localhost:3000/api
docker compose logs -f backend frontend
```

El código se monta en los contenedores y se recarga al guardar. Tras cambiar dependencias
(`package.json`), reconstruye y renueva los `node_modules` de los contenedores:
`docker compose up -d --build -V backend frontend`.

## Desarrollo local sin contenedores para la app

```bash
docker compose up -d postgres mailpit

cd backend
nvm use && npm install
cp .env.example .env          # genera JWT_ACCESS_SECRET: openssl rand -base64 48
npm run start:dev             # http://localhost:3000/api

cd ../frontend
npm install
npm start                     # http://localhost:4200 (proxy de /api al backend)
```

Más detalles en [backend/README.md](backend/README.md) y [frontend/docs](frontend/docs).

## Panel de administración

La cuenta de administración se define en `backend/.env` (`ADMIN_EMAIL` y `ADMIN_PASSWORD`). Al arrancar, el backend la crea, y al iniciar sesión con ella se abre http://localhost:4200/admin. Ahí se gestionan los productos de la tienda y los datos de contacto. Más detalles en [frontend/docs/admin.md](frontend/docs/admin.md).
