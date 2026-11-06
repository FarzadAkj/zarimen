/**
 * PM2 processes for production (see docs/DEPLOY.md):
 *   pm2 start ecosystem.config.cjs && pm2 save
 * One backend instance only: the Zarinpal clean-up timers (@Cron) run inside it.
 */
module.exports = {
	apps: [
		{
			name: "zar-imen-backend",
			cwd: "./apps/backend",
			script: "dist/main.js",
			node_args: "--env-file=.env --enable-source-maps",
			instances: 1,
			exec_mode: "fork",
			max_memory_restart: "500M",
		},
		{
			name: "zar-imen-frontend",
			cwd: "./apps/frontend",
			script: "node_modules/next/dist/bin/next",
			args: "start -p 3010",
			instances: 1,
			exec_mode: "fork",
			max_memory_restart: "700M",
		},
	],
}
