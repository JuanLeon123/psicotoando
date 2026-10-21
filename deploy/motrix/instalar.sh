#!/usr/bin/env bash
# Instala Psico T.O ando en motrix UNA vez: base de datos en PostgreSQL 17, nginx y túnel Cloudflare.
# Antes: scripts/publicar-motrix.sh --init desde el PC (sube el código y crea ~/psicotoando/.env).
# Uso:   sudo bash ~/deploys/psicotoando-deploy/instalar.sh
# No instala paquetes. Los secretos se leen de ~/psicotoando/.env sin mostrarse.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Ejecuta con sudo"; exit 1; }

DIR="$(dirname "$(readlink -f "$0")")"
ENV=/home/motrix/psicotoando/.env
TUNEL_CFG=/home/motrix/.cloudflared/config.yml
PUERTO=8087
HOSTS=(psicotoando.com www.psicotoando.com)

[ -f "$ENV" ] || { echo "No existe $ENV. Primero: scripts/publicar-motrix.sh --init (desde el PC)."; exit 1; }
leer() { grep -E "^$1=" "$ENV" | head -1 | cut -d= -f2-; }

echo "==> PostgreSQL 17 (puerto 5433): rol y base 'psicotoando'"
DB_PASS="$(leer DB_PASSWORD)"
[ -n "$DB_PASS" ] || { echo "Falta DB_PASSWORD en $ENV"; exit 1; }
sudo -u postgres psql -p 5433 -X -q -v ON_ERROR_STOP=1 -v pass="$DB_PASS" <<'SQL'
SELECT 'CREATE ROLE psicotoando LOGIN' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'psicotoando') \gexec
ALTER ROLE psicotoando WITH LOGIN PASSWORD :'pass';
SELECT 'CREATE DATABASE psicotoando OWNER psicotoando' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'psicotoando') \gexec
SQL
echo "    ok"

echo "==> nginx (127.0.0.1:$PUERTO)"
DEST=/etc/nginx/sites-available/psicotoando.com
[ -f "$DEST" ] && cp "$DEST" "$DEST.bak"
cp "$DIR/nginx-psicotoando.conf" "$DEST"
ln -sf "$DEST" /etc/nginx/sites-enabled/psicotoando.com
if nginx -t; then systemctl reload nginx; else
  [ -f "$DEST.bak" ] && cp "$DEST.bak" "$DEST" || rm -f "$DEST" /etc/nginx/sites-enabled/psicotoando.com
  echo "Error en la configuración de nginx: se restauró la anterior."; exit 1
fi

echo "==> Túnel Cloudflare 'motrix'"
if ! grep -q "hostname: psicotoando.com" "$TUNEL_CFG"; then
  cp -a "$TUNEL_CFG" "$TUNEL_CFG.antes-psicotoando-$(date +%F-%H%M)"
  sudo -u motrix python3 - "$TUNEL_CFG" "$PUERTO" "${HOSTS[@]}" <<'PY'
import sys
ruta, puerto, hosts = sys.argv[1], sys.argv[2], sys.argv[3:]
lineas = open(ruta).read().split('\n')
salida, hecho = [], False
for l in lineas:
    if not hecho and l.strip() == '- service: http_status:404':
        for h in hosts:
            salida += ['  - hostname: ' + h, '    service: http://127.0.0.1:' + puerto]
        hecho = True
    salida.append(l)
if not hecho:
    sys.exit('No encontré la regla final "- service: http_status:404" en ' + ruta)
open(ruta, 'w').write('\n'.join(salida))
PY
fi
sudo -u motrix cloudflared tunnel --config "$TUNEL_CFG" ingress validate
systemctl restart motrix-tunnel
sleep 5
systemctl is-active motrix-tunnel
echo "Conectores cloudflared corriendo (debe ser 1):"
pgrep -fa "cloudflared tunnel run" || true

echo "==> Comprobación local"
curl -s -o /dev/null -w "nginx (Host psicotoando.com): %{http_code}\n" -H "Host: psicotoando.com" "http://127.0.0.1:$PUERTO/"
echo "Listo. Ahora, desde el PC: scripts/publicar-motrix.sh (arranca la API en pm2)."
