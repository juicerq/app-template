#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const target = process.argv[2];

if (target !== "node" && target !== "electron") {
	console.error("usage: rebuild-better-sqlite3.mjs <node|electron>");
	process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = resolve(root, "node_modules/better-sqlite3");
const marker = resolve(pkgDir, ".abi-target");
const binPath = resolve(pkgDir, "build/Release/better_sqlite3.node");

const current = existsSync(marker) ? readFileSync(marker, "utf8").trim() : null;

if (current === target) {
	process.exit(0);
}

if (existsSync(binPath)) {
	rmSync(binPath);
}

const version =
	target === "node"
		? process.versions.node
		: JSON.parse(
				readFileSync(resolve(root, "node_modules/electron/package.json"), "utf8"),
			).version;

console.log(`rebuilding better-sqlite3 for ${target} ${version}`);

execSync(`bunx prebuild-install --runtime=${target} --target=${version}`, {
	cwd: pkgDir,
	stdio: "inherit",
});

writeFileSync(marker, target);
