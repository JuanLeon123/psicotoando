# Psico T.O ando · Backend

API en NestJS 11 con PostgreSQL (TypeORM): cuentas de clientes (registro, inicio de sesión con correo o Google, sesiones, recuperación de contraseña y «Mi cuenta»), catálogo de productos de la tienda, ajustes del sitio y panel de administración.

## Puesta en marcha

```bash
nvm use                 # Node 24 (ver .nvmrc)
npm install
cp .env.example .env    # y genera JWT_ACCESS_SECRET con: openssl rand -base64 48
docker compose up -d    # desde la raíz del proyecto: PostgreSQL y Mailpit
npm run start:dev       # http://localhost:3000/api
```

Las migraciones se aplican solas al arrancar (`migrationsRun`). También se pueden lanzar con `npm run migration:run` y deshacer con `npm run migration:revert`. El esquema nunca se sincroniza automáticamente.

En local, los correos llegan a Mailpit: http://localhost:8025.

## Endpoints

Todos bajo `/api`. Los errores siguen el formato de Nest (`{ statusCode, message, error }`) con mensajes en español.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/auth/providers` | `{ google: { clientId } \| null }` |
| POST | `/auth/register` | `{ fullName, email, password }` → 201 `{ accessToken, user }` · 409 si el correo existe |
| POST | `/auth/login` | `{ email, password }` → 200 `{ accessToken, user }` · 401 |
| POST | `/auth/google` | `{ credential }` (ID token de Google Identity Services) → 200 |
| POST | `/auth/refresh` | Cookie de sesión → 200 `{ accessToken, user }` y cookie rotada · 401 |
| POST | `/auth/logout` | Revoca la sesión y borra la cookie → 204 |
| POST | `/auth/forgot-password` | `{ email }` → 204 siempre |
| POST | `/auth/reset-password` | `{ token, password }` → 204 · 400 si el enlace no es válido |
| GET | `/users/me` | Perfil (Bearer) |
| PATCH | `/users/me` | `{ fullName?, phone?, childName?, childBirthDate? }` (Bearer) |
| PATCH | `/users/me/password` | `{ currentPassword?, newPassword }` (Bearer) → 204 · 403 para el administrador |
| GET | `/products` | Productos publicados, en orden |
| GET | `/products/:slug` | Un producto publicado · 404 si no existe o es borrador |
| POST | `/cart/quote` | `{ items: [{ productId, quantity }] }` → precios e inventario reales: `{ lines, itemCount, subtotalCop, purchasable }`. Cada línea indica `issue`: `unavailable`, `no_price`, `out_of_stock` o `limited_stock` (cantidad ajustada) |
| GET | `/payments/config` | `{ enabled, environment }`: si hay llaves de Wompi. Nunca devuelve llaves |
| POST | `/checkout` | `{ items, customer: { fullName, email, phone, document }, shipping: { department, city, address, notes? } }` → 201 `{ reference, checkoutUrl, fields }` · 409 `{ message, quote }` si el carrito cambió · 503 sin Wompi. Con Bearer, el pedido queda en la cuenta |
| POST | `/checkout/verify` | `{ transactionId }` → consulta la transacción en Wompi, actualiza el pedido y devuelve la vista pública |
| GET | `/orders/:reference` | Vista pública del pedido (estado, productos, totales, correo enmascarado) |
| POST | `/payments/wompi/events` | Webhook de Wompi. Valida el checksum → 200 · 401 si la firma no es válida |
| GET | `/users/me/orders` | Pedidos del cliente (Bearer) |
| GET | `/admin/orders` | `?status&fulfillment&q&page&pageSize` → `{ items, total, page, pageSize }` |
| GET | `/admin/orders/:id` | Detalle con cliente, dirección, productos y transacción |
| PATCH | `/admin/orders/:id` | `{ fulfillment }`: `unfulfilled`, `preparing`, `shipped`, `delivered` o `cancelled` |
| GET | `/settings` | `{ whatsappNumber, contactEmail, instagramUrl, facebookUrl }` |
| GET | `/admin/summary` | Clientes (total y últimos 30 días) y productos (total y publicados) |
| GET | `/admin/products` | Todos los productos, también borradores |
| GET | `/admin/products/:id` | Un producto |
| POST | `/admin/products` | `{ name, summary, contents?, activities?, priceCop?, stock?, imageAlt?, published?, sortOrder? }` → 201 |
| PATCH | `/admin/products/:id` | Los mismos campos, todos opcionales. Cambiar el nombre regenera el `slug` |
| POST | `/admin/products/:id/image` | `multipart/form-data`, campo `image` (JPG, PNG o WebP, máx. 5 MB). Reemplaza la anterior |
| DELETE | `/admin/products/:id` | Borra el producto y su imagen → 204 |
| PUT | `/admin/settings` | `{ whatsappNumber?, contactEmail?, instagramUrl?, facebookUrl?, shippingFlatCop?, freeShippingFromCop? }` (`null` o vacío borra el valor) |
| GET | `/uploads/products/<archivo>` | Imágenes subidas desde el panel |
| GET | `/blog/posts` | Artículos publicados, del más reciente al más antiguo, sin el contenido. `?page=&pageSize=` (por defecto 9, máx. 24) y `?category=`. Devuelve `{ items, total, page, pageSize, categories }` |
| GET | `/blog/posts/:slug` | Un artículo publicado con sus bloques · 404 si no existe, es borrador o tiene fecha futura |
| GET | `/admin/blog/posts` | Todos los artículos, también borradores |
| GET | `/admin/blog/categories` | Categorías usadas, para sugerirlas en el editor |
| GET | `/admin/blog/posts/:id` | Un artículo |
| POST | `/admin/blog/posts` | `{ title, excerpt?, category?, coverUrl?, coverAlt?, blocks?, status?, publishedAt? }` → 201 |
| PATCH | `/admin/blog/posts/:id` | Los mismos campos, todos opcionales. Cambiar el título regenera el `slug` |
| DELETE | `/admin/blog/posts/:id` | → 204 |
| GET | `/admin/blog/media` | Biblioteca de archivos del blog (`?kind=image\|video`) |
| POST | `/admin/blog/media` | `multipart/form-data`, campo `file`: JPG, PNG o WebP de hasta 5 MB, o MP4 o WebM de hasta 80 MB |
| PATCH | `/admin/blog/media/:id` | `{ alt }` |
| DELETE | `/admin/blog/media/:id` | Borra el registro y el archivo → 204 |
| GET | `/uploads/blog/<archivo>` | Imágenes y videos del blog (con soporte de `Range` para los videos) |

Las rutas `/admin/*` exigen Bearer de la cuenta de administración: 401 sin sesión, 403 para clientes.

## Seguridad

- **Contraseñas:** se guardan con argon2id. Deben tener entre 8 y 128 caracteres, con al menos una letra y un número.
- **Token de acceso:** JWT de 15 minutos, enviado como `Authorization: Bearer`. Lleva el id de la sesión, y el guard comprueba en cada petición que la sesión siga activa, así que cerrar sesión o cambiar la contraseña surten efecto al momento.
- **Sesión renovable:** token opaco aleatorio en la cookie `pt_refresh` (`HttpOnly`, `SameSite=Strict`, `Path=/api/auth` y `Secure` con `COOKIE_SECURE=true`). En la base de datos solo se guarda su hash SHA-256. Cada renovación lo rota de forma atómica.
- **Reutilización de tokens:** si alguien presenta un token ya rotado pasados más de 30 segundos, se revocan todas las sesiones del usuario.
- **Recuperación de contraseña:** los enlaces son de un solo uso, caducan en 60 minutos y solo se guarda su hash. Pedir uno nuevo invalida los anteriores. Al restablecer la contraseña se cierran todas las sesiones, y al cambiarla desde «Mi cuenta» se cierran todas menos la actual.
- **Cuentas no reveladas:** el login responde igual para un correo inexistente que para una contraseña incorrecta, con el mismo tiempo de respuesta, y la recuperación siempre devuelve 204.
- **Google:** el ID token se verifica en el servidor (firma, audiencia y caducidad) y se exige un correo verificado. Si ya existe una cuenta con ese correo, se vincula a ella.
- **Límite de peticiones:** 100 por minuto en general y 10 por minuto en registro, login, Google y recuperación.
- **Otras protecciones:** Helmet, CORS limitado a `FRONTEND_URL` y `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`.

## Panel de administración

- **Cuenta fija:** `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mínimo 12 caracteres). Al arrancar, el backend crea esa cuenta con rol `admin` o, si ya existe, le asigna el rol y vuelve a aplicar la contraseña si no coincide. Para cambiar la contraseña, edita `.env` y reinicia. Desde la web no se puede cambiar ni recuperar, y la cuenta no admite inicio de sesión con Google.
- **Productos:** precio en pesos colombianos enteros (`priceCop`, `null` = sin precio todavía) e inventario opcional (`stock`, `null` = sin control). Solo los productos con `published = true` aparecen en la tienda. La migración crea los tres kits de la web como punto de partida, sin precio.
- **Imágenes:** se identifican por su firma binaria, no por la extensión, y se guardan con nombre aleatorio en `UPLOADS_DIR/products`. Al reemplazarlas o borrar el producto se elimina el archivo. En producción, `UPLOADS_DIR` debe estar en un volumen persistente.
- **Ajustes:** el WhatsApp se guarda solo con dígitos e indicativo (`+57 300 123 4567` → `573001234567`), y las redes sociales deben empezar por `https://`.

## Blog

- **Bloques:** el contenido de un artículo es una lista de bloques: `paragraph`, `heading`, `image`, `gallery`, `video` (archivo subido), `youtube`, `quote` y `list`. El servidor reconstruye cada bloque con sus campos permitidos y rechaza tipos desconocidos, textos demasiado largos y URLs que no sean propias (`/api/uploads/...` o `images/...`).
- **YouTube:** se acepta el id o cualquier enlace (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`) y se guarda solo el id de 11 caracteres.
- **Publicación:** solo se ven los artículos con `status = published` y `publishedAt` ya alcanzado, así que una fecha futura programa el artículo. Al publicar sin fecha se usa el momento actual.
- **Archivos:** se suben a una carpeta temporal en disco (`UPLOADS_DIR/tmp`), se identifican por su firma binaria y se mueven a `UPLOADS_DIR/blog` con nombre aleatorio. Borrar un archivo de la biblioteca también borra el fichero. Los artículos que lo usaban mostrarán el hueco, así que conviene sustituirlo antes.

## Pagos con Wompi

- **Llaves:** `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET`, y `WOMPI_ENV=sandbox|production`. Sin las cuatro, el pago en línea queda desactivado y `POST /checkout` responde 503. Tras cambiarlas: `docker compose up -d --force-recreate backend`.
- **Pedido:** `POST /checkout` vuelve a calcular el carrito con los precios de la base de datos y suma el envío de `site_settings` (`shipping_flat_cop`, y gratis desde `free_shipping_from_cop`). Guarda el pedido `pending` con copia de nombres y precios. Devuelve los campos del Web Checkout (`https://checkout.wompi.co/p/`) con `signature:integrity` = SHA-256 de `referencia + monto en centavos + COP + secreto de integridad`. La referencia es `PT-AAAAMMDD-` + 10 caracteres aleatorios.
- **Confirmación:**
  - **Webhook (`POST /payments/wompi/events`):** el checksum se calcula con las propiedades que indica cada evento, más `timestamp` y el secreto de eventos, y se compara en tiempo constante. En Wompi, la URL de eventos es `https://<dominio>/api/payments/wompi/events`.
  - **Al volver (`POST /checkout/verify`):** el backend consulta la transacción con la llave privada. Es lo que funciona en local.
- **Reglas al aplicar una transacción:**
  - Se ignora si el monto o la moneda no coinciden con el pedido.
  - Un pedido aprobado no retrocede por eventos atrasados; solo puede pasar a anulado.
  - Si Wompi anula un pago ya aprobado, las unidades vuelven al inventario (una sola vez) y, si el envío no había salido, el pedido queda como cancelado. La anulación es definitiva: un «aprobado» atrasado no la revierte.
  - Al aprobarse, el inventario se descuenta **una sola vez** (`stock_applied`, con bloqueo de fila) y salen dos correos: la confirmación al cliente y el aviso a `ADMIN_EMAIL`.
- **Métricas** (`/admin/summary` → `sales`): solo cuentan pedidos aprobados. Los ingresos incluyen el envío. Los días se agrupan en hora de Colombia.

## Google

1. En Google Cloud Console, crea un «ID de cliente de OAuth» de tipo **Aplicación web**.
2. En «Orígenes de JavaScript autorizados», añade `http://localhost:4200` y el dominio de producción.
3. Pon el ID en `GOOGLE_CLIENT_ID`. El frontend lo obtiene de `/api/auth/providers` y solo muestra el botón cuando está configurado.

## Pruebas

```bash
docker compose up -d     # usa la base de datos psicotoando_test
npm run test:e2e
```

Las pruebas end-to-end recorren el registro, el login, la rotación de sesiones y la detección de reutilización, el cierre de sesión, el perfil, el cambio y la recuperación de contraseña, y Google. También cubren el checkout con Wompi (firma, envío, carrito desactualizado, webhook con firma inválida, aprobación idempotente con descuento único de inventario, montos alterados, consulta al volver, pedidos del cliente y del panel), la cuenta de administración, los permisos del panel, el catálogo (borradores, slugs, validación, subida y borrado de imágenes), los ajustes y el resumen. Usan `.env.test`, y sustituyen el envío de correo y la verificación de Google por dobles de prueba. La suite del panel define su propio administrador y una carpeta temporal de imágenes en `test/admin-env.ts`.

## Producción

- Usa `COOKIE_SECURE=true` (HTTPS), un `JWT_ACCESS_SECRET` propio y unas credenciales SMTP reales.
- Sirve el frontend y la API bajo el mismo dominio, con un proxy de `/api` a este servicio. Así la cookie `SameSite=Strict` funciona sin configurar CORS.
