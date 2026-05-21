# Floci UI — Agent Guide

This document is intended for AI agents that need to understand, extend, or modify the Floci Web UI.

---

## Project Context

**Floci** is a local AWS emulator built on Quarkus (Java), running by default on port `4566`. This UI is a management console for it — similar in concept to the AWS Management Console, but for the local emulator.

The UI lives in the `ui/` folder at the root of the Floci monorepo and is completely independent of the Java build.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18 |
| Build tool | Vite | 5 |
| Language | TypeScript | 5 |
| UI components | Ant Design | 5 |
| Data fetching | TanStack React Query | 5 |
| Routing | React Router | 6 |
| AWS SDK | `@aws-sdk/client-s3`, `@aws-sdk/client-dynamodb` | 3 |
| Container | nginx:alpine | (latest stable) |

---

## Directory Structure

```
ui/
├── Dockerfile                  # Multi-stage: Node build → nginx serve
├── docker-entrypoint.sh        # Injects FLOCI_ENDPOINT into config.js at runtime
├── nginx.conf                  # SPA routing + no-cache for config.js
├── .env.example                # Template: VITE_FLOCI_ENDPOINT=http://localhost:4566
├── index.html                  # Loads /config.js before main bundle
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx                # Entry point: QueryClientProvider + ConfigProvider
    ├── App.tsx                 # BrowserRouter + route definitions
    ├── config.ts               # Resolves FLOCI_ENDPOINT at runtime
    ├── aws/
    │   ├── s3Client.ts         # Pre-configured S3Client
    │   └── dynamoClient.ts     # Pre-configured DynamoDBClient
    ├── components/
    │   └── AppLayout.tsx       # Sider + Header + Content wrapper
    └── pages/
        ├── Dashboard.tsx       # Health, service list, resource counts
        ├── S3Browser.tsx       # Bucket/object browser with upload/download
        └── DynamoBrowser.tsx   # Table/item browser with scan and filter
```

---

## Runtime Config Injection

Vite bakes env vars at build time. To support changing the endpoint without rebuilding the Docker image, the pattern used is:

1. `docker-entrypoint.sh` runs before nginx and writes `/usr/share/nginx/html/config.js`:
   ```js
   window.__FLOCI_CONFIG__ = { endpoint: "http://floci:4566" };
   ```
2. `index.html` loads `<script src="/config.js">` before the main bundle.
3. `src/config.ts` reads `window.__FLOCI_CONFIG__?.endpoint` first, then falls back to `import.meta.env.VITE_FLOCI_ENDPOINT`, then to `http://localhost:4566`.

To change the endpoint in Docker, set the `FLOCI_ENDPOINT` environment variable on the `floci-ui` container (in `docker-compose.yml` or via `-e`). No rebuild required.

---

## Key Floci API Endpoints

All requests go to `FLOCI_ENDPOINT` (default: `http://localhost:4566`).

### Health & Info
| Method | Path | Description |
|---|---|---|
| GET | `/_floci/health` | Returns `{ status, version, services: { [name]: { available, status } } }` |
| GET | `/_floci/info` | Emulator version and edition |
| GET | `/_floci/config` | Full runtime configuration |

### S3 (REST XML, path-style)
The AWS SDK handles all S3 requests. `forcePathStyle: true` is required.

| Operation | SDK Command |
|---|---|
| List buckets | `ListBucketsCommand` |
| List objects (v2) | `ListObjectsV2Command({ Delimiter: '/' })` for folder simulation |
| Put object | `PutObjectCommand` |
| Get object | `GetObjectCommand` |
| Delete object | `DeleteObjectCommand` |

### DynamoDB (AWS JSON 1.1, POST to `/`)
All DynamoDB operations use `X-Amz-Target` header. The SDK handles this transparently.

| Operation | SDK Command |
|---|---|
| List tables | `ListTablesCommand` |
| Describe table | `DescribeTableCommand` |
| Scan items | `ScanCommand` |
| Query items | `QueryCommand` |
| Put item | `PutItemCommand` |
| Delete item | `DeleteItemCommand` |

---

## Adding a New Page

1. Create `src/pages/MyService.tsx` following the pattern of `S3Browser.tsx` or `DynamoBrowser.tsx`.
2. Add the route in `src/App.tsx`:
   ```tsx
   <Route path="/myservice" element={<MyService />} />
   ```
3. Add a menu entry in `src/components/AppLayout.tsx` in the `menuItems` array.
4. If the service needs a new AWS SDK client, add it under `src/aws/`.

---

## Adding a New AWS SDK Client

Create `src/aws/myServiceClient.ts`:
```ts
import { MyServiceClient } from '@aws-sdk/client-my-service'
import { FLOCI_ENDPOINT } from '../config'

export const myClient = new MyServiceClient({
  endpoint: FLOCI_ENDPOINT,
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
})
```
Install the package: `npm install @aws-sdk/client-my-service`

---

## DynamoDB Attribute Unwrapping

DynamoDB SDK returns typed attribute values: `{ S: "foo" }`, `{ N: "42" }`, `{ M: {...} }`, etc.
The `unwrapAttr(attr)` function in `DynamoBrowser.tsx` converts these to plain JS values recursively. If you need this elsewhere, extract it to `src/aws/dynamoUtils.ts`.

---

## Docker

```
docker compose up --build
```
- UI available at `http://localhost:8080`
- Emulator at `http://localhost:4566`

To point the UI at a different Floci server, change `FLOCI_ENDPOINT` in `docker-compose.yml` under the `floci-ui` service.

---

## Ideas for Future Extension

- **SQS**: List queues, view messages, send/purge — `@aws-sdk/client-sqs`
- **SNS**: List topics and subscriptions — `@aws-sdk/client-sns`
- **Cognito**: User pool management — `@aws-sdk/client-cognito-identity-provider`
- **CloudWatch**: Metrics and alarms — `@aws-sdk/client-cloudwatch`
- **Secrets Manager**: List/view secrets — `@aws-sdk/client-secrets-manager`
- **Lambda**: List functions, invoke — `@aws-sdk/client-lambda`
- **SQS Message Inspector**: Receive and display message body + attributes
- **DynamoDB Item Editor**: Inline editing + PutItemCommand
- **S3 Object Preview**: In-browser preview for images and text files
- **Dark mode**: Ant Design supports `theme.darkAlgorithm` — just swap the algorithm in `main.tsx`
- **Pagination for DynamoDB Scan**: Store `LastEvaluatedKey` for multi-page navigation
- **Resource search**: Cross-service search bar that finds buckets/tables by name
