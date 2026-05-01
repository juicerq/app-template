import { cpSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import type { Plugin } from "vite";

const aliasNode = {
	"@main": resolve(import.meta.dirname, "./src/main"),
	"@preload": resolve(import.meta.dirname, "./src/preload"),
	"@shared": resolve(import.meta.dirname, "./src/shared"),
};

const aliasWeb = {
	"@renderer": resolve(import.meta.dirname, "./src/renderer/src"),
	"@main": resolve(import.meta.dirname, "./src/main"),
	"@shared": resolve(import.meta.dirname, "./src/shared"),
};

function copyMigrations(): Plugin {
	const from = resolve(import.meta.dirname, "src/main/db/migrations");
	return {
		name: "copy-migrations",
		apply: "build",
		closeBundle() {
			const to = resolve(import.meta.dirname, "out/main/migrations");
			cpSync(from, to, { recursive: true });
		},
	};
}

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin(), copyMigrations()],
		resolve: { alias: aliasNode },
	},
	preload: {
		plugins: [externalizeDepsPlugin()],
		resolve: { alias: aliasNode },
		build: {
			rollupOptions: {
				output: {
					format: "cjs",
					entryFileNames: "[name].cjs",
				},
			},
		},
	},
	renderer: {
		plugins: [
			tanstackRouter({ target: "react", autoCodeSplitting: true }),
			react(),
			tailwindcss(),
		],
		resolve: { alias: aliasWeb },
	},
});
