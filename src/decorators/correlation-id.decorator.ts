import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { X_CORRELATION_ID } from '../constants/headers.constant'

export const CorrelationId = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): string | undefined => {
		if (ctx.getType() === 'rpc') {
			const metadata = ctx.switchToRpc().getContext<Metadata>()
			const header = metadata?.get?.(X_CORRELATION_ID)
			return header && header.length > 0 ? (header[0] as string) : undefined
		}

		if (ctx.getType() === 'http') {
			const req = ctx.switchToHttp().getRequest()
			return (
				req?.correlationId ||
				(req?.headers?.[X_CORRELATION_ID] as string) ||
				undefined
			)
		}

		return undefined
	}
)
