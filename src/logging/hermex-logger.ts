import { LoggerService } from '@nestjs/common'
import pino, { Level, Logger as PinoInstance } from 'pino'
import { TraceContext } from './trace-context'

export interface HermexLoggerOptions {
	serviceName: string
	level?: string
}

/**
 * Enterprise Structured Logger for Hermex Microservices based on Pino.
 * Follows 12-Factor App principles: logs are pure event streams emitted to process.stdout.
 *
 * Features:
 * - Direct stdout output (zero networking, zero worker_threads overhead)
 * - Automatic correlation_id / trace_id enrichment via TraceContext (AsyncLocalStorage)
 * - PCI-DSS & OWASP data sanitization (redacting passwords, CVV, card numbers)
 * - 100% compatible with NestJS LoggerService (app.useLogger)
 */
export class HermexLogger implements LoggerService {
	private readonly pino: PinoInstance
	private readonly serviceName: string

	constructor(options: HermexLoggerOptions) {
		this.serviceName = options.serviceName
		const level =
			options.level ||
			process.env.LOG_LEVEL ||
			(process.env.NODE_ENV === 'production' ? 'info' : 'debug')

		// AppSec / PCI-DSS: Native redact of sensitive credentials, tokens and payment data
		const redact = [
			'password',
			'passwordHash',
			'cvv',
			'cvc',
			'cardNumber',
			'pan',
			'token',
			'accessToken',
			'refreshToken',
			'authorization',
			'*.password',
			'*.passwordHash',
			'*.cvv',
			'*.cvc',
			'*.cardNumber',
			'*.pan',
			'*.token',
			'*.accessToken',
			'*.refreshToken',
			'*.authorization'
		]

		const pinoOptions: pino.LoggerOptions = {
			name: options.serviceName,
			level,
			redact: {
				paths: redact,
				censor: '[REDACTED]'
			},
			mixin: () => {
				const traceId = TraceContext.getTraceId()
				return {
					service_name: this.serviceName,
					...(traceId ? { trace_id: traceId } : {})
				}
			},
			base: {
				service_name: this.serviceName
			},
			timestamp: pino.stdTimeFunctions.isoTime
		}

		// Cloud-Native Standard: emit structured JSON directly to process.stdout
		this.pino = pino(pinoOptions, process.stdout)
	}

	log(message: any, ...optionalParams: any[]): void {
		this.callPino('info', message, optionalParams)
	}

	error(message: any, ...optionalParams: any[]): void {
		this.callPino('error', message, optionalParams)
	}

	warn(message: any, ...optionalParams: any[]): void {
		this.callPino('warn', message, optionalParams)
	}

	debug(message: any, ...optionalParams: any[]): void {
		this.callPino('debug', message, optionalParams)
	}

	verbose(message: any, ...optionalParams: any[]): void {
		this.callPino('trace', message, optionalParams)
	}

	fatal(message: any, ...optionalParams: any[]): void {
		this.callPino('fatal', message, optionalParams)
	}

	/**
	 * Extracts contextual parameters adhering to NestJS LoggerService conventions.
	 */
	private callPino(level: Level, message: any, params: any[]): void {
		let context: string | undefined
		let stack: string | undefined
		let data: Record<string, any> = {}

		if (params && params.length > 0) {
			if (level === 'error') {
				if (typeof params[0] === 'string' && params.length > 1) {
					stack = params[0]
					context = params[1]
				} else if (typeof params[0] === 'string') {
					if (params[0].includes('\n') || params[0].includes('at ')) {
						stack = params[0]
					} else {
						context = params[0]
					}
				} else if (typeof params[0] === 'object' && params[0] !== null) {
					data = params[0]
					if (params.length > 1 && typeof params[1] === 'string') {
						context = params[1]
					}
				}
			} else {
				const lastParam = params[params.length - 1]
				if (typeof lastParam === 'string') {
					context = lastParam
					if (
						params.length > 1 &&
						typeof params[0] === 'object' &&
						params[0] !== null
					) {
						data = params[0]
					}
				} else if (typeof params[0] === 'object' && params[0] !== null) {
					data = params[0]
				}
			}
		}

		const logObj: Record<string, any> = { ...data }
		if (context) {
			logObj.context = context
		}
		if (stack) {
			logObj.stack = stack
		}

		// Fallback: extract trace_id from message brackets if not already set by TraceContext
		if (!TraceContext.getTraceId() && typeof message === 'string') {
			const uuidMatch = message.match(/\[([0-9a-fA-F-]{36})\]/)
			if (uuidMatch && uuidMatch[1]) {
				logObj.trace_id = uuidMatch[1]
			}
		}

		if (typeof message === 'object' && message !== null) {
			if (message instanceof Error) {
				logObj.err = message
				this.pino[level](logObj, message.message)
			} else {
				Object.assign(logObj, message)
				this.pino[level](logObj)
			}
		} else {
			this.pino[level](logObj, String(message))
		}
	}
}
