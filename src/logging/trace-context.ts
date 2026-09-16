import { AsyncLocalStorage } from 'node:async_hooks'

export interface TraceStore {
	traceId: string
	[key: string]: unknown
}

const traceStorage = new AsyncLocalStorage<TraceStore>()

/**
 * Distributed Tracing Context for Hermex Microservices.
 * Propagates correlation IDs across asynchronous execution boundaries
 * (HTTP requests, gRPC calls, and AMQP event handlers) without boilerplate.
 */
export class TraceContext {
	/**
	 * Returns the active trace ID (correlation ID) for the current asynchronous execution context,
	 * or undefined if outside of a trace boundary.
	 */
	static getTraceId(): string | undefined {
		return traceStorage.getStore()?.traceId
	}

	/**
	 * Returns the full active trace store.
	 */
	static getStore(): TraceStore | undefined {
		return traceStorage.getStore()
	}

	/**
	 * Executes the given callback inside a scoped trace context.
	 * All subsequent asynchronous operations, promises, and logs will automatically
	 * have access to this trace ID.
	 */
	static run<T>(
		traceId: string,
		callback: () => T,
		extra?: Record<string, unknown>
	): T {
		return traceStorage.run({ traceId, ...extra }, callback)
	}
}
