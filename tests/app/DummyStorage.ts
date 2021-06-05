import { IStorage } from "app/Storage";

export default class DummyStorage implements IStorage {
	private values: { [key: string]: any } = {};

	async getAll(): Promise<{ [key: string]: any; }> {
		return { ...this.values };
	}

	async get<T>(key: string): Promise<T | null> {
		return this.values[key] ?? null;
	}

	async set<T>(key: string, value: T): Promise<void> {
		this.values[key] = value;
	}

	async remove(key: string): Promise<void> {
		delete this.values[key];
	}

	async clear(): Promise<void> {
		this.values = {}
	}
}
