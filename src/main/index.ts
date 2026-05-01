import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow } from "electron";
import { setupAutoUpdate } from "@main/auto-update";
import "@main/db";
import { DbSettings } from "@main/db/DbSettings";
import { startOrpcServer } from "@main/ipc";

const here = dirname(fileURLToPath(import.meta.url));

function createWindow() {
	const saved = DbSettings.get("windowBounds");

	const win = new BrowserWindow({
		width: saved?.width ?? 1024,
		height: saved?.height ?? 768,
		x: saved?.x,
		y: saved?.y,
		frame: true,
		webPreferences: {
			preload: join(here, "../preload/index.cjs"),
			sandbox: true,
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	if (saved?.maximized) {
		win.maximize();
	}

	win.on("close", () => {
		DbSettings.set("windowBounds", {
			...win.getNormalBounds(),
			maximized: win.isMaximized(),
		});
	});

	if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
		win.loadURL(process.env.ELECTRON_RENDERER_URL);
		win.webContents.openDevTools({ mode: "detach" });
	} else {
		win.loadFile(join(here, "../renderer/index.html"));
	}
}

app.whenReady().then(() => {
	startOrpcServer();
	createWindow();
	setupAutoUpdate();
});

app.on("window-all-closed", () => app.quit());
