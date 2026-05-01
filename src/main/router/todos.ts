import { type } from "arktype";
import { DbTodos } from "@main/db/DbTodos";
import { base } from "@main/router/_base";

export const todosRouter = {
	list: base.handler(() => DbTodos.list()),
	create: base
		.input(type({ title: "string > 0" }))
		.handler(({ input }) => DbTodos.create({ title: input.title })),
};
