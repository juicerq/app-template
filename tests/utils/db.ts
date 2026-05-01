import { rawDb } from "@main/db";

const SYSTEM_TABLE_PREFIXES = ["sqlite_", "__drizzle_"];

export function resetDb(): void {
	const tables = rawDb
		.prepare<unknown[], { name: string }>(
			"SELECT name FROM sqlite_master WHERE type = 'table'",
		)
		.all();

	for (const { name } of tables) {
		if (SYSTEM_TABLE_PREFIXES.some((prefix) => name.startsWith(prefix))) {
			continue;
		}
		rawDb.prepare(`DELETE FROM "${name}"`).run();
	}
}
