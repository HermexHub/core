import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { randomUUID } from 'node:crypto'
import { Metadata } from '@grpc/grpc-js'
import { X_CORRELATION_ID } from '../constants'
import { TraceContext } from '../logging/trace-context'

/**
 * Universal gRPC Trace Interceptor for Hermex Microservices.
 * Extracts the incoming x-correlation-id from gRPC Metadata
 * and binds it to TraceContext (AsyncLocalStorage) across the RPC call execution.
 */
@Injectable()
export class GrpcTraceInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const rpcContext = context.switchToRpc()
		const metadata = rpcContext.getContext<Metadata>()
		let correlationId: string | undefined

		if (metadata && typeof metadata.get === 'function') {
			const values = metadata.get(X_CORRELATION_ID)
			if (values && values.length > 0 && typeof values[0] === 'string') {
				correlationId = values[0]
			}
		}

		const traceId = correlationId || randomUUID()

		return new Observable((subscriber) => {
			TraceContext.run(traceId, () => {
				next.handle().subscribe(subscriber)
			})
		})
	}
}
