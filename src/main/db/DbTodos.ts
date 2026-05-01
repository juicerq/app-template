import { desc } from "drizzle-orm";
import { db } from "@main/db";
import { todos } from "@main/db/schema";

export const DbTodos = {
	list() {
		return db
			.select()
			.from(todos)
			.orderBy(desc(todos.createdAt), desc(todos.id))
			.all();
	},
	create({ title }: { title: string }) {
		return db.insert(todos).values({ title }).returning().get();
	},
};
