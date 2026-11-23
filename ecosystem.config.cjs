// PM2 process definition for the Innoventies API.
// Start:   pm2 start ecosystem.config.cjs --env staging
// Reload:  pm2 reload innoventies-api
module.exports = {
  apps: [
    {
      name: 'innoventies-api',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      // Runtime config comes from .env in this directory (loaded by dotenv in server.js).
      env: { NODE_ENV: 'development' },
      env_staging: { NODE_ENV: 'production' },
      env_production: { NODE_ENV: 'production' },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      time: true,
    },
  ],
};
