import { type } from "arktype";

export const envelopeSchema = type({
	version: "number",
	data: "unknown",
});

export type Envelope<T> = {
	version: number;
	data: T;
};
