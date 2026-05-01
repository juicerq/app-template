import { app } from "electron";
import electronUpdater from "electron-updater";
import { Logger } from "@main/logger";

const { autoUpdater } = electronUpdater;

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export function setupAutoUpdate(): void {
	if (!app.isPackaged) {
		return;
	}

	autoUpdater.autoDownload = true;
	autoUpdater.autoInstallOnAppQuit = true;

	autoUpdater.on("error", (err) => {
		Logger.error("auto-update:error", { err: String(err) });
	});

	autoUpdater.on("update-downloaded", (info) => {
		Logger.info("auto-update:downloaded", { version: info.version });
	});

	autoUpdater.checkForUpdates().catch((err: unknown) => {
		Logger.error("auto-update:initial-check-failed", { err: String(err) });
	});

	setInterval(() => {
		autoUpdater.checkForUpdates().catch((err: unknown) => {
			Logger.error("auto-update:periodic-check-failed", { err: String(err) });
		});
	}, SIX_HOURS_MS);
}
