import { app } from "electron";
import electronUpdater from "electron-updater";

const { autoUpdater } = electronUpdater;

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export function setupAutoUpdate(): void {
	if (!app.isPackaged) {
		return;
	}

	autoUpdater.autoDownload = true;
	autoUpdater.autoInstallOnAppQuit = true;

	autoUpdater.on("error", (err) => {
		console.error("[auto-update] error", err);
	});

	autoUpdater.on("update-downloaded", (info) => {
		console.info("[auto-update] downloaded", info.version);
	});

	autoUpdater.checkForUpdates().catch((err: unknown) => {
		console.error("[auto-update] initial check failed", err);
	});

	setInterval(() => {
		autoUpdater.checkForUpdates().catch((err: unknown) => {
			console.error("[auto-update] periodic check failed", err);
		});
	}, SIX_HOURS_MS);
}
