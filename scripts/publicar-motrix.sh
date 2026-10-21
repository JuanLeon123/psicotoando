#!/usr/bin/env bash
# Publica Psico T.O ando en motrix con la estructura del servidor (pm2 + nginx + túnel), sin Docker.
#   scripts/publicar-motrix.sh --init   # primera vez: crea ~/psicotoando/.env con secretos nuevos
#   scripts/publicar-motrix.sh          # publicaciones siguientes
# Sube los archivos del repositorio (incluidos los cambios sin commit, nunca los ignorados como .env)
# y compila en motrix con Node 24. No usa sudo: lo que lo necesita está en
# ~/deploys/psicotoando-deploy/instalar.sh y lo ejecuta Bairon una vez.
set -euo pipefail

HOST="${DEPLOY_HOST:-motrix@motrix}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
GIT=(git -c safe.directory='*' -C "$REPO")
REV="$("${GIT[@]}" rev-parse --short HEAD)"
NODE_BIN='$HOME/.nvm/versions/node/v24.22.0/bin'
INIT=false
for arg in "$@"; do
  case "$arg" in
    --init) INIT=true ;;
    *) echo "Opción desconocida: $arg"; exit 1 ;;
  esac
done

if ! "${GIT[@]}" diff --quiet || ! "${GIT[@]}" diff --cached --quiet; then
  echo "ℹ️  Hay cambios sin commit sobre $REV: se publican igual."
fi

if $INIT; then
  echo "→ Creando ~/psicotoando/.env en motrix (solo si no existe)"
  ssh "$HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
mkdir -p ~/psicotoando/uploads
umask 077
if [ -f ~/psicotoando/.env ]; then echo "   ya existe, no se toca"; exit 0; fi
rand() { openssl rand -base64 64 | tr -d '/+=\n' | cut -c1-"$1"; }
cat > ~/psicotoando/.env <<ENV
# Psico T.O ando en motrix (producción). Generado $(date -u +%FT%TZ). No subir a git.
NODE_ENV=production
PORT=3200
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=psicotoando
DB_PASSWORD=$(rand 32)
DB_NAME=psicotoando
JWT_ACCESS_SECRET=$(rand 64)
JWT_ACCESS_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
PASSWORD_RESET_TTL_MINUTES=60
COOKIE_SECURE=true
FRONTEND_URL=https://psicotoando.com
GOOGLE_CLIENT_ID=
# Sin SMTP los correos (recuperar contraseña, pedidos) no se envían.
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM="Psico T.O ando <no-reply@psicotoando.com>"
ADMIN_EMAIL=admin@psicotoando.com
ADMIN_PASSWORD=$(rand 20)
ADMIN_NAME=Administración
UPLOADS_DIR=/home/motrix/psicotoando/uploads
# Vacío = la tienda no ofrece pago en línea.
WOMPI_ENV=sandbox
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_INTEGRITY_SECRET=
WOMPI_EVENTS_SECRET=
ENV
echo "   creado (contraseña del panel: grep ADMIN_ ~/psicotoando/.env en motrix)"
REMOTE
fi

echo "→ Subiendo código $REV a ~/psicotoando/app (conserva node_modules)"
ssh "$HOST" 'mkdir -p ~/psicotoando/app && cd ~/psicotoando/app &&
  find . -mindepth 1 -maxdepth 1 ! -name backend ! -name frontend -exec rm -rf {} + &&
  mkdir -p backend frontend && find backend frontend -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +'
"${GIT[@]}" ls-files -z --cached --others --exclude-standard \
  | (cd "$REPO" && tar --null -T - -cf -) \
  | ssh "$HOST" 'tar -xm -C ~/psicotoando/app'

echo "→ Instalando dependencias y compilando en motrix (Node 24)"
ssh "$HOST" "export PATH=$NODE_BIN:\$PATH CI=true NG_CLI_ANALYTICS=false
  set -e
  cd ~/psicotoando/app/backend
  npm ci --no-audit --no-fund >/tmp/psicotoando-install.log 2>&1 || { tail -20 /tmp/psicotoando-install.log; exit 1; }
  npm run build >/tmp/psicotoando-build.log 2>&1 || { tail -20 /tmp/psicotoando-build.log; exit 1; }
  ln -sf ~/psicotoando/.env ~/psicotoando/app/backend/.env
  cd ~/psicotoando/app/frontend
  npm ci --no-audit --no-fund >>/tmp/psicotoando-install.log 2>&1 || { tail -20 /tmp/psicotoando-install.log; exit 1; }
  npx ng build >>/tmp/psicotoando-build.log 2>&1 || { tail -30 /tmp/psicotoando-build.log; exit 1; }
  rm -rf ~/psicotoando/web.nuevo && cp -r dist/psicotoando/browser ~/psicotoando/web.nuevo
  rm -rf ~/psicotoando/web.anterior && { [ -d ~/psicotoando/web ] && mv ~/psicotoando/web ~/psicotoando/web.anterior || true; }
  mv ~/psicotoando/web.nuevo ~/psicotoando/web && chmod -R o+rX ~/psicotoando/web && chmod o+x ~/psicotoando
  mkdir -p ~/deploys/psicotoando-deploy
  cp ~/psicotoando/app/deploy/motrix/* ~/deploys/psicotoando-deploy/
  chmod +x ~/deploys/psicotoando-deploy/*.sh
  echo '   compilado'"

echo "→ Arrancando/recargando pm2 'psicotoando-api'"
ssh "$HOST" 'source ~/.nvm/nvm.sh >/dev/null
  if ! PGPASSWORD="$(grep -E "^DB_PASSWORD=" ~/psicotoando/.env | cut -d= -f2-)" \
       psql -h 127.0.0.1 -p 5433 -U psicotoando -d psicotoando -Atqc "select 1" >/dev/null 2>&1; then
    echo "   Falta la base de datos, nginx y el túnel. Bairon: sudo bash ~/deploys/psicotoando-deploy/instalar.sh"
    exit 0
  fi
  pm2 startOrReload ~/deploys/psicotoando-deploy/ecosystem.config.cjs --update-env >/dev/null && pm2 save >/dev/null
  for i in $(seq 1 45); do
    code="$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3200/api/settings || true)"
    [ "$code" != "000" ] && { echo "   API responde ($code)"; exit 0; }; sleep 2
  done
  echo "   La API no respondió. Revisa: pm2 logs psicotoando-api --lines 50"; exit 1'

echo "✓ Publicado $REV  ·  https://psicotoando.com  ·  panel: https://psicotoando.com/admin"
