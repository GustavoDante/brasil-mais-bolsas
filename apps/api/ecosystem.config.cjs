module.exports = {
  apps: [
    {
      name: "brasil-mais-bolsas-api",
      // O Nest compila para dist/main.js; `node dist/main` e o mesmo que o
      // script start:prod do package.json faz.
      script: "dist/main.js",
      // Caminho do app dentro do monorepo. O processo roda a partir daqui (e o
      // ConfigModule le o .env deste diretorio), mas o `pnpm install`/`pnpm build`
      // precisa ser executado na RAIZ do repositorio — as dependencias e os
      // pacotes @repo/* sao resolvidos por workspace, nao por pasta.
      cwd: "/var/www/brasil-mais-bolsas/apps/api",
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
        PORT: 3006
      },
      error_file: "/var/logs/brasil-mais-bolsas/api/pm2-error.log",
      out_file: "/var/logs/brasil-mais-bolsas/api/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true
    }
  ]
}
