import { Metadata } from '@grpc/grpc-js'
import { X_CORRELATION_ID } from '../constants'

/**
 * Creates gRPC Metadata pre-populated with x-correlation-id and optional custom headers.
 *
 * @param correlationId - Trace/correlation identifier to attach
 * @param extraHeaders - Optional record of additional key-value headers to attach
 * @returns Populated @grpc/grpc-js Metadata instance
 */
export function createGrpcMetadata(
	correlationId?: string,
	extraHeaders?: Record<string, string>
): Metadata {
	const metadata = new Metadata()

	if (correlationId) {
		metadata.set(X_CORRELATION_ID, correlationId)
	}

	if (extraHeaders) {
		for (const [key, value] of Object.entries(extraHeaders)) {
			if (value !== undefined && value !== null) {
				metadata.set(key, value)
			}
		}
	}

	return metadata
}
