export function assertDefined<T>(
	value: T | null | undefined,
	message?: string,
): asserts value is T {
	if (value === undefined || value === null) {
		throw new Error(message ?? "Expected value to be defined");
	}
}

export function assertIsInstanceOf<T>(
	value: unknown,
	ctor: abstract new (...args: never[]) => T,
): asserts value is T {
	if (!(value instanceof ctor)) {
		throw new Error(`Expected value to be instance of ${ctor.name}`);
	}
}
