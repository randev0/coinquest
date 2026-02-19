module.exports = {
  apps: [
    {
      name: 'coinquest',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/root/CoinQuest',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXTAUTH_URL: 'https://steadigital.com/coinquest',
        NEXTAUTH_URL_INTERNAL: 'http://127.0.0.1:3000/coinquest',
      },
    },
  ],
};
