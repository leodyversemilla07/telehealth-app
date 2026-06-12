// =============================================================================
// PM2 Ecosystem Configuration — Telehealth App
// =============================================================================

module.exports = {
  apps: [
    // ── NestJS API ──────────────────────────────────────────────────────
    {
      name: "telehealth-api",
      script: "apps/api/dist/src/main.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "/home/ec2-user/logs/api-error.log",
      out_file: "/home/ec2-user/logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M",
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",
    },
    // ── Next.js Web ─────────────────────────────────────────────────────
    {
      name: "telehealth-web",
      script: "apps/web/.next/standalone/apps/web/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      error_file: "/home/ec2-user/logs/web-error.log",
      out_file: "/home/ec2-user/logs/web-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "300M",
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
}
