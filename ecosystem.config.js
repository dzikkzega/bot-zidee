module.exports = {
  apps: [
    {
      name: "zideebot",
      script: "index.js",
      instances: 1,
      exec_mode: "fork", // Force fork mode for WhatsApp bot
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      // Logging configuration
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Memory optimization
      node_args:
        "--max-old-space-size=512 --optimize-for-size --gc-interval=100",

      // Restart configuration
      min_uptime: "10s",
      max_restarts: 10,

      // Advanced PM2 features
      kill_timeout: 5000,
      listen_timeout: 3000,

      // WhatsApp bot specific settings
      merge_logs: true,
      combine_logs: true,
    },
  ],

  deploy: {
    production: {
      user: "node",
      host: "localhost",
      ref: "origin/master",
      repo: "git@github.com:repo.git",
      path: "/var/www/production",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.js --env production",
    },
  },
};
