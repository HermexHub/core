<div align="center">

# 🧱 Hermex Core Library
### Foundation Utilities, Structured Pino Logger & Distributed Tracing

[ **English** ] &nbsp;•&nbsp; [ [Українська](README.ua.md) ] &nbsp;•&nbsp; [ [System Overview](../overview/README.md) ] &nbsp;•&nbsp; [ [NPM Package](https://www.npmjs.com/package/@hermex/core) ]

<p align="center">
  @hermex/core (v1.2.0) &bull; Pino JSON &bull; AsyncLocalStorage &bull; Auto-Publish CI/CD
</p>

</div>

> **`@hermex/core`** is the foundation library for all Hermex services.  
> It provides the structured high-speed JSON logger `HermexLogger` (Pino) with integrated PCI-DSS redaction, `TraceContext` (`AsyncLocalStorage`) for distributed correlation tracking, the `@CorrelationId()` parameter decorator, and base TypeScript and Prettier configurations.

---

## 📦 Sub-Path Exports

```json
{
  "@hermex/core": "Root module (HermexLogger, TraceContext)",
  "@hermex/core/prettier": "Shared Prettier configuration with import sorting",
  "@hermex/core/tsconfig": "Base tsconfig.base.json for all services",
  "@hermex/core/decorators": "Universal @CorrelationId() parameter decorator",
  "@hermex/core/constants": "X_CORRELATION_ID header constant",
  "@hermex/core/helpers": "createGrpcMetadata() helper for gRPC clients"
}
```

---

## 🪵 1. Structured Logging (`HermexLogger`)

`HermexLogger` replaces the standard NestJS logger with high-performance **Pino**, outputting structured JSON directly to `process.stdout`:

```json
{
  "level": 30,
  "time": 1726992000000,
  "service": "api-gateway",
  "traceId": "c3b95a8e-5b12-421b-bf8d-d3c26725ea94",
  "context": "OrdersController",
  "msg": "Order created successfully: e48f-39ad"
}
```

### PCI-DSS Redaction
Sensitive keys are automatically sanitized:
```typescript
// Target keys: 'password', 'refreshToken', 'cvv', 'cardNumber', 'pan', 'pin'
// Values replaced with: '[REDACTED]'
```

---

## 🔍 2. End-to-End Tracing (`TraceContext`)

Powered by Node.js / Bun `AsyncLocalStorage`. Eliminates manual `traceId` threading across controller, service, and repository layers:

```typescript
import { TraceContext } from '@hermex/core';

// In Middleware or AMQP Consumer:
TraceContext.run(correlationId, () => {
  // Anywhere down the asynchronous call chain:
  const currentTraceId = TraceContext.getTraceId();
});
```

---

## 🎯 3. Decorator `@CorrelationId()`

Extracts the correlation ID across both **Express HTTP** and **gRPC RPC** contexts:

```typescript
@Get(':id')
async findOne(
  @Param('id') id: string,
  @CorrelationId() traceId: string,
) {
  // traceId extracted from HTTP header or gRPC metadata
}
```

---

## 🛠️ 4. Helper `createGrpcMetadata()`

Constructs clean gRPC client call metadata:

```typescript
import { createGrpcMetadata } from '@hermex/core';

const metadata = createGrpcMetadata(traceId);
grpcClient.createOrder(request, metadata);
```

---

## ⚙️ Installation & Usage

```bash
bun add @hermex/core
```

### Configure Prettier:
In `package.json`:
```json
{
  "prettier": "@hermex/core/prettier"
}
```

### Configure TypeScript:
In `tsconfig.json`:
```json
{
  "extends": "@hermex/core/tsconfig",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```
