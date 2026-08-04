module.exports = {
  apps: [
    {
      name: "brasil-mais-bolsas",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      // Caminho do app dentro do monorepo. O `next start` roda a partir daqui, mas o
      // `pnpm install`/`pnpm build` precisa ser executado na RAIZ do repositorio —
      // as dependencias sao resolvidas por workspace, nao por pasta.
      cwd: "/var/www/brasil-mais-bolsas/apps/web",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      // Sem teto, um app que falha no boot (build ausente, env faltando) reinicia
      // em loop infinito consumindo CPU sem que nada acuse. O backoff da espaco
      // para falhas transitorias antes de o PM2 desistir e marcar 'errored'.
      max_restarts: 10,
      exp_backoff_restart_delay: 200,
      env: {
        NODE_ENV: "production",
        PORT: 3005
      },
      error_file: "/var/logs/brasil-mais-bolsas/brasil-mais-bolsas/pm2-error.log",
      out_file: "/var/logs/brasil-mais-bolsas/brasil-mais-bolsas/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true
    }
  ]
}