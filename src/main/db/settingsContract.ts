import { type } from "arktype";

const theme = type.enumerated("light", "dark", "system");

const windowBounds = type({
	x: "number",
	y: "number",
	width: "number",
	height: "number",
	maximized: "boolean",
});

export const settingsContract = {
	theme,
	windowBounds,
} as const;

export type SettingsKey = keyof typeof settingsContract;
export type SettingValue<K extends SettingsKey> =
	(typeof settingsContract)[K]["infer"];
