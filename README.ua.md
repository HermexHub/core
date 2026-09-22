<div align="center">

# 🧱 Базова бібліотека Hermex
### Базові утиліти, структурований Pino-логер та наскрізний трейсинг

[ [English](README.md) ] &nbsp;•&nbsp; [ **Українська** ] &nbsp;•&nbsp; [ [Головний огляд](../overview/README.ua.md) ] &nbsp;•&nbsp; [ [NPM Пакет](https://www.npmjs.com/package/@hermex/core) ]

<p align="center">
  @hermex/core (v1.2.1) &bull; Pino JSON &bull; AsyncLocalStorage &bull; CI/CD автопублікація
</p>

</div>

> **`@hermex/core`** — фундаментальний спільний пакет платформи Hermex.  
> Містить структурований JSON-логер `HermexLogger` (Pino) із маскуванням PCI-DSS, `TraceContext` (`AsyncLocalStorage`) для наскрізного трасування, універсальний декоратор `@CorrelationId()`, базові конфігурації TypeScript та Prettier.

---

## 📦 Модульні експорти

```json
{
  "@hermex/core": "Головний модуль (HermexLogger, TraceContext)",
  "@hermex/core/prettier": "Конфігурація Prettier із сортуванням імпортів",
  "@hermex/core/tsconfig": "Базовий tsconfig.base.json для всіх сервісів",
  "@hermex/core/decorators": "Декоратор параметра @CorrelationId()",
  "@hermex/core/constants": "Константа заголовка X_CORRELATION_ID",
  "@hermex/core/helpers": "Хелпер createGrpcMetadata() для gRPC клієнтів"
}
```

---

## 🪵 1. Структуроване логування (`HermexLogger`)

`HermexLogger` замінює стандартний логер NestJS на високопродуктивний **Pino**, записуючи JSON прямо у `process.stdout`:

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
Чутливі поля автоматично маскуються:
```typescript
// Ключі: 'password', 'refreshToken', 'cvv', 'cardNumber', 'pan', 'pin'
// Значення замінюються на: '[REDACTED]'
```

---

## 🔍 2. Наскрізне трасування (`TraceContext`)

Працює на базі `AsyncLocalStorage` у Node.js/Bun. Усуває необхідність передавати `traceId` вручну крізь шари коду:

```typescript
import { TraceContext } from '@hermex/core';

// У Middleware або AMQP Consumer:
TraceContext.run(correlationId, () => {
  // У будь-якому вкладеному виклику:
  const currentTraceId = TraceContext.getTraceId();
});
```

---

## 🎯 3. Декоратор `@CorrelationId()`

Витягує ідентифікатор кореляції в контекстах **Express HTTP** та **gRPC RPC**:

```typescript
@Get(':id')
async findOne(
  @Param('id') id: string,
  @CorrelationId() traceId: string,
) {
  // traceId отримано із HTTP-заголовка або gRPC metadata
}
```

---

## 🛠️ 4. Хелпер `createGrpcMetadata()`

Формування метаданих gRPC без дублювання коду:

```typescript
import { createGrpcMetadata } from '@hermex/core';

const metadata = createGrpcMetadata(traceId);
grpcClient.createOrder(request, metadata);
```

---

## ⚙️ Встановлення та використання

```bash
bun add @hermex/core
```

### Налаштування Prettier:
У `package.json`:
```json
{
  "prettier": "@hermex/core/prettier"
}
```

### Налаштування TypeScript:
У `tsconfig.json`:
```json
{
  "extends": "@hermex/core/tsconfig",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```
