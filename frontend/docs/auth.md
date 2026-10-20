# Cuentas de cliente

Registro, inicio de sesión (correo o Google), recuperación de contraseña y la página «Mi cuenta». El frontend consume la API NestJS de `../backend` bajo `/api`.

## Rutas

| Ruta                      | Acceso                       | Contenido                                               |
| ------------------------- | ---------------------------- | ------------------------------------------------------- |
| `/iniciar-sesion`         | Solo sin sesión              | Correo y contraseña, enlace de recuperación y Google    |
| `/registro`               | Solo sin sesión              | Nombre, correo, contraseña, confirmación y aceptación   |
| `/recuperar-contrasena`   | Libre                        | Solicita el enlace por correo                           |
| `/restablecer-contrasena` | Libre (`?token=` del correo) | Nueva contraseña; sin token ofrece pedir otro enlace    |
| `/mi-cuenta`              | Solo con sesión              | Datos personales, contraseña, Google y cerrar sesión    |

Las rutas se cargan de forma diferida. `authGuard` envía a `/iniciar-sesion?returnUrl=…` y, tras entrar, se vuelve a esa ruta. `safeReturnUrl` solo acepta rutas internas para evitar redirecciones a otros sitios. `guestGuard` lleva a `/mi-cuenta` a quien ya tiene sesión.

En el navbar, el icono de usuario lleva a «Iniciar sesión» o, con sesión, muestra la inicial del cliente y lleva a «Mi cuenta». En tablet y móvil el mismo acceso aparece en el menú.

## Sesión

- El **token de acceso** (JWT, 15 min) se guarda solo en memoria, en un signal de `AuthService`. Nunca se escribe en `localStorage`.
- El **token de renovación** es una cookie `httpOnly` (`pt_refresh`, ruta `/api/auth`) que gestiona el servidor. El frontend no puede leerla; las llamadas a `/api/auth/*` se envían con `withCredentials`.
- Al abrir `/restablecer-contrasena`, el token del enlace se lee y se elimina de la URL con `Location.replaceState`, para que no quede en el historial ni viaje en el encabezado `Referer`.
- Al arrancar, `provideAuthSession()` intenta renovar la sesión en segundo plano, sin bloquear el primer render. Los guards esperan el resultado (`AuthService.resolved$`).
- `authInterceptor` añade `Authorization: Bearer` a las peticiones `/api/` y, ante un 401, renueva la sesión una sola vez y repite la petición. Las renovaciones simultáneas comparten una única petición. Si la renovación falla, se cierra la sesión local y se redirige al inicio de sesión.
- Cerrar sesión revoca la sesión en el servidor y limpia el estado aunque la API no responda.

## Google

`GET /api/auth/providers` indica si hay un client ID configurado. Si lo hay, `GoogleSignInButtonComponent` carga `https://accounts.google.com/gsi/client` bajo demanda y muestra el botón oficial «Continuar con Google». La credencial obtenida se envía a `POST /api/auth/google`, que la verifica en el servidor. Si no hay configuración, el botón no aparece; si el script no carga, se ofrece usar correo y contraseña.

## Estructura

```text
src/app/core/auth/
  auth.models.ts            Tipos del contrato con la API
  auth.service.ts           Estado de sesión (signals) y llamadas a la API
  auth.interceptor.ts       Bearer, cookies y renovación ante 401
  auth.guards.ts            authGuard y guestGuard
  auth.providers.ts         Restauración de la sesión al arrancar
  return-url.ts             Validación de la ruta de retorno
  api-error.ts              Mensajes de error en español
src/app/shared/forms/       Validadores y mensajes de error de formularios
src/app/shared/components/
  password-field/           Campo de contraseña con «Mostrar / Ocultar»
  google-sign-in-button/    Botón de Google y carga del script
src/app/pages/auth/         Inicio de sesión, registro, recuperación y su layout
src/app/pages/account/      «Mi cuenta»: datos personales y seguridad
src/styles/_forms.scss      Estilos compartidos de formularios
proxy.conf.json             En desarrollo, /api → http://localhost:3000
```

Las reglas de validación coinciden con las del servidor. Nombre: 2–120 caracteres. Contraseña: 8–128 caracteres, con al menos una letra y un número. Teléfono: hasta 30 caracteres. La fecha de nacimiento no puede ser futura.

## Accesibilidad

Cada campo tiene etiqueta y `autocomplete`. Los errores se enlazan con `aria-describedby` y marcan `aria-invalid`. Al enviar un formulario con errores, el foco va al primer campo inválido. Los errores del servidor y los mensajes de éxito se anuncian mediante regiones `aria-live`. El borde de los campos tiene un contraste mínimo de 3:1.

## Verificación

```bash
docker compose up -d          # desde la raíz: PostgreSQL y Mailpit
npm --prefix ../backend run start:dev
npm start                     # http://localhost:4200
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Hay pruebas de `AuthService` (sesión en memoria, renovación compartida, cierre de sesión), del interceptor (401 → renovación → reintento, y redirección si falla), de los guards y del formulario de inicio de sesión (validación, foco y error del servidor). Las páginas se revisaron a 1280 y 390 px sin desplazamiento horizontal. «Mi cuenta» se probó contra una API simulada.
