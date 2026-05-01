import { client } from "@renderer/lib/api";

export function installLoggerBridge(): void {
	window.addEventListener("error", (e) => {
		client.logger
			.error({
				message: e.message,
				stack: e.error instanceof Error ? e.error.stack : undefined,
				source: "window.error",
			})
			.catch(() => {});
	});

	window.addEventListener("unhandledrejection", (e) => {
		const reason = e.reason;
		client.logger
			.error({
				message: reason instanceof Error ? reason.message : String(reason),
				stack: reason instanceof Error ? reason.stack : undefined,
				source: "unhandledrejection",
			})
			.catch(() => {});
	});
}
