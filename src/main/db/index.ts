import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type * as ElectronModule from "electron";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

function resolveDbPath(): string {
	const fromEnv = process.env.DATABASE_PATH;
	if (fromEnv) {
		return fromEnv;
	}

	const { app } = require("electron") as typeof ElectronModule;
	return join(app.getPath("userData"), "app.db");
}

const sqlite = new Database(resolveDbPath());

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite);
export const rawDb = sqlite;

migrate(db, { migrationsFolder: join(here, "migrations") });
