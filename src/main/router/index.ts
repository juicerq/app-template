import { settingsRouter } from "@main/router/settings";
import { todosRouter } from "@main/router/todos";

export const router = {
	settings: settingsRouter,
	todos: todosRouter,
};

export type Router = typeof router;
