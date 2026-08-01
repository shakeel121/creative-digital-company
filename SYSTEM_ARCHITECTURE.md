# Creative Digital Company — System Architecture

- **Document type:** System architecture (current + target state)
- **Author:** CTO (Founding Engineer)
- **Version:** 1.0
- **Status:** Draft for board review
- **Date:** 2026-08-02
- **Companion docs:** [Technology Strategy](/CRE/issues/CRE-6#document-technology-strategy),
  [Software Development Roadmap](/CRE/issues/CRE-6#document-roadmap)

---

## 0. Architecture summary

The architecture follows the **static-first** principle (TDR-001/002/006): today the public
surface is a fully static site served by a CDN with no server. The **target architecture** (this
document) describes the layered system we adopt as products and Workstreams B/C land, adding
serverless functions, a managed database, AI services, auth, queues, notifications, monitoring, and
analytics **only when a product need requires them**.

Every diagram below is Mermaid and renders on GitHub and in Mermaid-enabled Markdown viewers.

---

## 1. High-level architecture

```mermaid
flowchart TB
    subgraph Users
        U[Visitors / Clients / End users]
    end

    subgraph Edge["Edge & Delivery (Netlify CDN)"]
        CDN[Global CDN<br/>static assets + caching]
        WAF[WAF / TLS termination]
        GW[API Gateway<br/>routing + rate limiting]
    end

    subgraph Core["Application (serverless-first)"]
        FE[Frontend<br/>Vite static bundle]
        FN[Netlify Functions<br/>API endpoints / BFF]
    end

    subgraph Data["Data & Services"]
        DB[(Managed Postgres<br/>e.g. Supabase)]
        OBJ[Object Storage<br/>Netlify Blobs / S3]
        CACHE[(Redis cache<br/>opt-in when hot)]
    end

    subgraph Platform["Platform Services"]
        AI[AI Services<br/>OpenAI / Anthropic / Gemini]
        AUTH[Auth Service<br/>managed OAuth/JWT]
        Q[Queue System<br/>managed queue]
        NOTIF[Notification Service<br/>email / web push]
    end

    subgraph Ops["Operations"]
        MON[Monitoring<br/>uptime + logs + errors]
        AN[Analytics<br/>traffic + product events]
    end

    U --> CDN
    CDN --> FE
    CDN --> WAF
    WAF --> GW
    GW --> FN
    FN --> DB
    FN --> OBJ
    FN --> CACHE
    FN --> AI
    FN --> AUTH
    FN --> Q
    Q --> NOTIF
    FN --> MON
    CDN --> AN
    FE --> GW
```

**Principles encoded here:**
- Static content never touches a server — it is served from the CDN edge.
- All dynamic work enters through one gateway into serverless functions.
- Platform services (AI, auth, queue, notifications) are **managed** — no self-hosting.
- Everything reports to monitoring and analytics in a sidecar/edge manner.

---

## 2. Microservices

We do **not** run a distributed microservice fleet today. For a 1–3 engineer company, a
**serverless-function monolith (BFF) with clearly bounded modules** is the right default
(see TDR-006). "Services" are logical, independently deployable functions/units.

```mermaid
flowchart LR
    subgraph API["Serverless API (Netlify Functions)"]
        M1[Content / Pages]
        M2[Forms & Inquiries]
        M3[Projects / Portfolio]
        M4[AI Copilot / Chat]
        M5[Auth & Users]
        M6[Admin / CMS]
    end

    GW[API Gateway] --> M1
    GW --> M2
    GW --> M3
    GW --> M4
    GW --> M5
    GW --> M6
```

**Rules:**
- Each function/service is independently deployable and has a bounded responsibility.
- Services communicate **only** through the gateway or the queue — no direct calls.
- When a single function's responsibility outgrows the function runtime, it graduates to a
  dedicated managed service; we never "split for splitting's sake."

---

## 3. Frontend

**Stack (TDR-001):** Vite + vanilla JavaScript (ES modules) + semantic HTML/CSS. No framework
today; native Web Components when reusable widgets arrive. Progressive enhancement and
accessibility are non-negotiable.

```mermaid
flowchart TB
    subgraph Build["Build time"]
        SRC[src/ (JS + CSS + HTML)]
        VITE[Vite build]
        LINT[ESLint + Prettier]
        TEST[Vitest + smoke tests]
        DIST[dist/ static bundle]
    end

    subgraph Runtime["Runtime"]
        CDN2[Netlify CDN]
        INDEX[index.html]
        JS[hashed JS asset]
        CSS[hashed CSS asset]
        IMG[assets: favicon / images]
    end

    SRC --> VITE
    LINT --> VITE
    TEST --> VITE
    VITE --> DIST
    DIST --> CDN2
    CDN2 --> INDEX
    CDN2 --> JS
    CDN2 --> CSS
    CDN2 --> IMG
    JS --> API[Serverless API (when interactive)]
```

**Frontend decisions:**
- Core content renders without JS (progressive enhancement); JS only enhances.
- All assets hashed and long-cacheable; CDN serves them without server round-trips.
- Any interactive feature calls the serverless API through the gateway with HTTPS.

---

## 4. Backend

**Stack (TDR-006):** Serverless functions (Netlify Functions, edge/regional) as the BFF; managed
Postgres for persistence; Redis cache only when hot reads demand it.

```mermaid
flowchart TB
    GW2[API Gateway] --> FN1[Function: auth middleware]
    FN1 --> FN2[Function: domain logic<br/>content / projects / forms]
    FN2 --> DB2[(Postgres)]
    FN2 --> C2[(Redis cache - opt-in)]
    FN2 --> OBJ2[(Object storage)]
    FN2 --> EXT[External APIs<br/>AI, email, payments]
    FN2 --> Q2[(Queue)]
```

**Backend decisions:**
- Stateless functions; all state lives in Postgres/storage/queue.
- Middleware (auth, validation, rate-limit) applied at the gateway or first function layer.
- No always-on servers; functions scale with demand and idle at zero cost.
- Configuration via environment/secrets on the hosting platform — never in source.

---

## 5. Database

**Default:** managed Postgres (e.g., Supabase). **Nothing else until a requirement is proven.**

```mermaid
erDiagram
    USER {
        uuid id PK
        text email
        text name
        text role
        timestamptz created_at
    }
    PROJECT {
        uuid id PK
        text slug
        text title
        text description
        jsonb metadata
        timestamptz created_at
    }
    INQUIRY {
        uuid id PK
        uuid user_id FK
        text subject
        text body
        text status
        timestamptz created_at
    }
    ASSET {
        uuid id PK
        text url
        text kind
        uuid project_id FK
    }
    SESSION {
        uuid id PK
        uuid user_id FK
        text refresh_token
        timestamptz expires_at
    }

    USER ||--o{ PROJECT : "owns"
    USER ||--o{ INQUIRY : "submits"
    PROJECT ||--o{ ASSET : "contains"
    USER ||--o{ SESSION : "has"
```

**Database decisions:**
- Row-level security (RLS) at the database, not just the API.
- Schema migrations committed to the repo; no ad-hoc DDL.
- Postgres JSONB used sparingly for flexible metadata; relational model first.
- Backups and TLS managed by the provider.

---

## 6. AI services

**Stack (TDR-007):** managed AI APIs (OpenAI / Anthropic / Gemini) called from serverless
functions. Keys are platform secrets. Human review required for client-facing output.

```mermaid
flowchart TB
    UI[Frontend] --> GW3[API Gateway]
    GW3 --> FP[Function: AI proxy / copilot]
    FP --> VAL[Prompt + safety layer<br/>injection / PII guards]
    VAL --> APIAI[Managed AI API<br/>OpenAI / Anthropic / Gemini]
    APIAI --> LOG[Usage & cost logging]
    LOG --> RESP[Response back to UI]
    FP --> MOD[Moderation / review queue]
```

**AI decisions:**
- All AI calls go through our function (never direct from the browser) so keys stay secret.
- Prompt templates versioned in the repo; output logged for cost + audit.
- Safety review required per feature (prompt injection, PII, hallucination risk).
- Cost tracked per feature; provider selection is a TDR decision with board approval when it
  involves committed spend.

---

## 7. Authentication

**Stack:** managed auth (OAuth2/OIDC — e.g., Supabase Auth / Netlify Identity) with JWT;
session refresh tokens in a cookie/secure store. Row-level security enforces per-user access.

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant A as Auth Service (managed)
    participant DB as Postgres (RLS)

    U->>FE: Login request
    FE->>A: OAuth / credentials
    A-->>FE: ID token + refresh token
    FE->>GW: API call + bearer token
    GW->>A: Verify JWT (cached keys)
    A-->>GW: Valid / claims
    GW->>DB: Query (RLS enforced by claims)
    DB-->>GW: Authorized rows
    GW-->>FE: Response
```

**Auth decisions:**
- No self-hosted identity server.
- Token verification cached to avoid per-request latency.
- Admin/author roles enforced at DB RLS + API middleware.

---

## 8. Storage

```mermaid
flowchart TB
    subgraph Storage["Storage tiers"]
        S1[Netlify CDN - static site assets]
        S2[Object storage - uploads, media<br/>Netlify Blobs / S3-compatible]
        S3[Postgres - relational data]
        S4[Redis cache - ephemeral hot data]
    end

    GW4[API / Edge] --> S1
    GW4 --> S2
    GW4 --> S3
    GW4 --> S4
    S2 --> S3[metadata in Postgres]
```

**Storage decisions:**
- **Static:** CDN (fastest, zero server).
- **Binary uploads:** object storage with metadata rows in Postgres.
- **Relational:** Postgres.
- **Cache:** Redis only when profiling shows a hot read path that Postgres/CDN cannot serve.
- Backup/retention policy documented per tier (provider-managed for managed tiers).

---

## 9. API Gateway

```mermaid
flowchart LR
    C[Clients<br/>browser / curl] --> R1[Rate limiting]
    R1 --> R2[TLS / WAF]
    R2 --> R3[Auth token check]
    R3 --> R4[Route to function]
    R4 --> R5[Response caching]
    R5 --> C
```

**Gateway decisions:**
- Provided by the hosting platform edge (Netlify) — no self-hosted gateway today.
- Responsibilities: TLS, routing, rate limiting, request validation, authz bootstrap, response
  caching (CDN for static, edge cache for safe dynamic responses).
- Gateway rules live in `netlify.toml`/redirects as code.
- If a self-hosted gateway is ever required (unlikely at this scale), it is a TDR decision.

---

## 10. Queue system

```mermaid
flowchart LR
    PROD[Producer functions] --> Q0[(Managed queue)]
    Q0 --> W1[Worker: email/send]
    Q0 --> W2[Worker: webhook push]
    Q0 --> W3[Worker: AI batch jobs]
    Q0 --> W4[Worker: exports/cleanup]
    W1 --> N1[Notification service]
    W2 --> N1
    W3 --> LOG1[(Usage logs)]
    W4 --> DB0[(Postgres)]
```

**Queue decisions:**
- Managed queue (e.g., hosted queue/Supabase queue or a managed broker) — no self-hosted Kafka/RabbitMQ.
- Purpose: decouple slow/fan-out work (notifications, AI batches, exports) from request time.
- Retry + dead-letter policy per worker; idempotency keys for safe retries.
- Adopt only when request-time work actually exceeds function limits — otherwise keep it synchronous.

---

## 11. Notification service

```mermaid
flowchart TB
    QN[(Queue)] --> NS[Notification Service]
    NS --> CH1[Email provider]
    NS --> CH2[Web push / in-app]
    NS --> CH3[Webhook to client systems]
    NS --> PREF[Preference store (Postgres)]
    QN --> SN[Status ledger / delivery log]
```

**Notification decisions:**
- Single notification service owns templates, channel routing, and delivery logs.
- Templates versioned; per-channel failure isolation (one channel failing never blocks others).
- Unsubscribe/preference management required before any outbound campaign.
- Managed providers (email/transactional + push) — no self-hosted SMTP/push infra.

---

## 12. Monitoring

```mermaid
flowchart TB
    subgraph Sources["Sources"]
        S1[Live site checks]
        S2[Function logs]
        S3[CDN / edge metrics]
        S4[CI / deploy status]
        S5[Error tracker]
    end

    S1 --> AGG[Aggregator]
    S2 --> AGG
    S3 --> AGG
    S4 --> AGG
    S5 --> AGG
    AGG --> AL[Alerts]
    AGG --> DB3[(Metrics store)]
    AL --> P1[Uptime + deploy health dashboard]
    AL --> P2[On-call / rollback runbook]
```

**Monitoring decisions (staged):**
- **Stage 1 (now):** uptime HTTP checks on the live URL + CI/deploy run status.
- **Stage 2 (with traffic/functions):** Netlify Analytics, structured function logs, hosted error
  tracking (e.g., Sentry), synthetic checks on key flows.
- Alerts require owners; no alert without a runbook action.
- Logs never contain secrets/PII; events, not raw dumps.

---

## 13. Analytics

```mermaid
flowchart LR
    EDGE[CDN / edge] --> EV[Event stream<br/>pageviews, clicks]
    EV --> EA[Analytics service<br/>Netlify Analytics / product analytics]
    EA --> DASH[Dashboards]
    EA --> RPT[Reports]
    EV --> EXPORT[Export pipeline<br/>to warehouse if needed]
```

**Analytics decisions:**
- Privacy-friendly defaults first (Netlify Analytics — no cookie banner required).
- Product/event analytics added when a product feature needs funnel insight.
- PII is not collected in raw events; IP/device data minimized.
- Instrumentation is additive and non-blocking — never in the critical path.
- Export to a warehouse only when reporting outgrows the analytics service.

---

## 14. Target topology (all layers together)

```mermaid
flowchart TB
    U2[Users] --> CDN3[CDN / WAF / Gateway]
    CDN3 --> FE2[Frontend bundle]
    CDN3 --> GW3[Serverless API]
    GW3 --> AUTH2[Managed Auth]
    GW3 --> FN3[Domain functions]
    FN3 --> PG[(Postgres)]
    FN3 --> OBJ3[Object storage]
    FN3 --> AI2[AI services]
    FN3 --> Q3[(Queue)]
    Q3 --> NOTIF2[Notification service]
    NOTIF2 --> EMAIL[Email / push / webhook]
    FN3 --> MON2[Monitoring]
    CDN3 --> AN2[Analytics]
    MON2 --> RUNBOOK[Incident / rollback runbook]
```

---

## 15. Adoption path (ties to roadmap)

| Layer               | Today       | Adopt at milestone | Trigger                       |
| ------------------- | ----------- | ------------------ | ----------------------------- |
| Frontend (static)   | ✅ Live     | M2 (done)          | —                             |
| CI/CD               | ✅ Live     | M2 (done)          | —                             |
| Design system       | Ad-hoc CSS  | M3                 | Rebrand + component reuse     |
| Product template    | —           | M4                 | First client product          |
| Serverless API      | —           | M4/M5              | First interactive feature     |
| Database (Postgres) | —           | M5                 | Persistent data requirement   |
| Auth                | —           | M5                 | Gated/private content         |
| AI services         | —           | M5+                | Product feature ticket        |
| Queue + notif       | —           | M6                 | Async/fan-out workload        |
| Monitoring          | Uptime+CI   | M6                 | More than static surface      |
| Analytics           | —           | M6/M7              | Traffic needs measurement     |
| Production launch   | —           | M8                 | Go/no-go review               |

## 16. Architecture principles (recap)

1. **Static-first** — serve what can be static from the CDN; add servers only for real need.
2. **Serverless before servers** — functions scale with demand and cost nothing idle.
3. **Managed over self-hosted** — databases, auth, AI, queues, notifications, observability.
4. **Gateway as the only front door** — no direct service-to-service calls.
5. **Security by default** — TLS, secrets, RLS, least-privilege tokens, no secrets in code.
6. **Observable from day one** — uptime + deploy health now; deeper telemetry when it matters.
7. **Everything as code** — topology, gateway rules, migrations, and workflows live in the repo.

## 17. Next action

Board review/adoption of this architecture. On approval, the CTO will:
1. Formalize the design-system + component layer (M3) against the Frontend/Storage sections.
2. Open implementation tickets for the serverless API + Postgres (M5) when a product need is
   confirmed.
3. Keep `netlify.toml` and CI/deploy as the executable representation of the edge/gateway section.
