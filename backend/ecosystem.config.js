module.exports = {
  apps: [{
    name:     'pontofacil',
    script:   'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    watch:    false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/www/pontofacil/logs/pm2_error.log',
    out_file:   '/var/www/pontofacil/logs/pm2_out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    restart_delay: 3000,
    max_restarts: 10,
  }]
};
