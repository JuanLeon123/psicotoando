/**
 * pm2 para Psico T.O ando en motrix. Lo aplica scripts/publicar-motrix.sh:
 *   pm2 startOrReload ~/deploys/psicotoando-deploy/ecosystem.config.cjs && pm2 save
 * Node 24 de nvm (backend/.nvmrc). Las variables vienen de ~/psicotoando/.env
 * (enlazado como ~/psicotoando/app/backend/.env).
 */
module.exports = {
  apps: [
    {
      name: 'psicotoando-api',
      cwd: '/home/motrix/psicotoando/app/backend',
      script: 'dist/main.js',
      interpreter: '/home/motrix/.nvm/versions/node/v24.22.0/bin/node',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '400M',
      time: true,
    },
  ],
};
