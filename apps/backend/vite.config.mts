// To load env variables in build script
import swc from "unplugin-swc"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import "dotenv/config"

/**
 * Using bun for development and vite for production
 * 1. @Transform decorator doesn't work in vite dev.
 * 2. Bun build could not handle external packages.
 */

const mainFile = "./src/main.ts"

export default defineConfig({
	esbuild: false,
	plugins: [
		tsconfigPaths(),
		swc.vite(),
	],
	// The shared workspace package ships TypeScript source, so it must be bundled, not required at runtime.
	ssr: { noExternal: ["@zar-imen/shared"] },
	build: {
		sourcemap: true,
		ssr: mainFile,
		rollupOptions: { input: mainFile },
	},
	optimizeDeps: { noDiscovery: true },
})
