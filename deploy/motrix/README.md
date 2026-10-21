# Producción en motrix (psicotoando.com)

Sin Docker. Misma estructura que los demás sitios del servidor:

```text
Cloudflare (DNS psicotoando.com y www → túnel "motrix")
  → cloudflared (servicio systemd motrix-tunnel, ~/.cloudflared/config.yml)
  → nginx 127.0.0.1:8087   (/etc/nginx/sites-available/psicotoando.com)
       /        → ~/psicotoando/web      (Angular compilado, SPA)
       /api/    → 127.0.0.1:3200         (pm2 "psicotoando-api", NestJS, Node 24 de nvm)
  → PostgreSQL 17 en 127.0.0.1:5433, rol y base "psicotoando"
```

www.psicotoando.com redirige a psicotoando.com.

## Rutas en el servidor

| Ruta | Qué es |
|---|---|
| `~/psicotoando/.env` | Variables de producción (permisos 600). Enlazado como `app/backend/.env`. |
| `~/psicotoando/app` | Código subido (sus `node_modules` se conservan entre publicaciones) |
| `~/psicotoando/web` | Web publicada; `web.anterior` es la versión previa |
| `~/psicotoando/uploads` | Imágenes y videos subidos desde el panel (no se borra al publicar) |
| `~/deploys/psicotoando-deploy` | Copia de esta carpeta (`instalar.sh`, nginx, pm2) |

## Publicar

Desde el PC, en la raíz del repositorio (Git Bash):

```bash
scripts/publicar-motrix.sh
```

Sube los archivos del repositorio, incluidos los cambios sin commit pero nunca los ignorados
(`.env`). Compila backend y frontend en motrix, cambia la web y recarga pm2. Las migraciones de
TypeORM se ejecutan solas al arrancar la API.

La primera vez se usó `--init` (crea `~/psicotoando/.env` con secretos aleatorios) y después
`instalar.sh` con sudo. Ninguno de los dos hace falta de nuevo.

## Tareas con sudo

`sudo` pide contraseña, así que hay que ejecutarlo en una terminal propia, no con el prefijo `!`
de Claude Code (no tiene TTY):

```bash
ssh -t motrix "sudo bash ~/deploys/psicotoando-deploy/instalar.sh"     # base, nginx y túnel (idempotente)
```

Después de cambiar `nginx-psicotoando.conf`, publicar y volver a ejecutar `instalar.sh`.

## Cambiar variables (.env)

```bash
ssh -t motrix "nano ~/psicotoando/.env"
ssh motrix 'source ~/.nvm/nvm.sh && pm2 restart psicotoando-api --update-env && pm2 save'
```

- Contraseña del panel `/admin`: `grep ADMIN_ ~/psicotoando/.env` en motrix.
- **Wompi:** en producción (`WOMPI_ENV=production`, llaves `pub_prod_`/`prv_prod_`/`prod_integrity_`/`prod_events_`).
  URL de eventos configurada en Wompi: `https://psicotoando.com/api/payments/wompi/events`.
  Comprobar: `curl https://psicotoando.com/api/payments/config` → `{"enabled":true,"environment":"production"}`.
- **SMTP:** vacío. Sin él no salen los correos de recuperar contraseña ni de pedidos.
- **GOOGLE_CLIENT_ID:** vacío. El botón de Google queda oculto.

## Revisar

```bash
ssh motrix 'source ~/.nvm/nvm.sh && pm2 ls && pm2 logs psicotoando-api --lines 50 --nostream'
ssh motrix 'tail -50 /var/log/nginx/psicotoando.error.log'
```
