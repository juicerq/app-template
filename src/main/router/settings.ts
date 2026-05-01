import { DbSettings } from "@main/db/DbSettings";
import { settingsContract } from "@main/db/settingsContract";
import { base } from "@main/router/_base";

export const settingsRouter = {
	theme: {
		get: base.handler(() => ({ value: DbSettings.get("theme") })),
		set: base.input(settingsContract.theme).handler(({ input }) => {
			DbSettings.set("theme", input);
			return null;
		}),
	},
	windowBounds: {
		get: base.handler(() => ({ value: DbSettings.get("windowBounds") })),
		set: base.input(settingsContract.windowBounds).handler(({ input }) => {
			DbSettings.set("windowBounds", input);
			return null;
		}),
	},
};
