import { eq, sql } from "drizzle-orm";
import { db } from "@main/db";
import { settings } from "@main/db/schema";
import {
	settingsContract,
	type SettingsKey,
	type SettingValue,
} from "@main/db/settingsContract";

export const DbSettings = {
	get<K extends SettingsKey>(key: K): SettingValue<K> | undefined {
		const row = db
			.select({ value: settings.value })
			.from(settings)
			.where(eq(settings.key, key))
			.get();

		if (!row) {
			return undefined;
		}

		return settingsContract[key].assert(JSON.parse(row.value)) as SettingValue<K>;
	},
	set<K extends SettingsKey>(key: K, value: SettingValue<K>): void {
		const json = JSON.stringify(value);
		db.insert(settings)
			.values({ key, value: json })
			.onConflictDoUpdate({
				target: settings.key,
				set: { value: json, updatedAt: sql`(unixepoch())` },
			})
			.run();
	},
};
