# ZenStack in This Codebase

This project uses ZenStack as the application data layer. The ZModel schema defines the database shape, relations, and access policies; the Nuxt server binds those policies to the current Supabase user; and app pages query data through ZenStack's RPC query service.

The important rule is: client code should talk to ZenStack through the generated query service, and server code should use a policy-bound client unless it is doing trusted bootstrap work.

## Main files

| File | Purpose |
| --- | --- |
| `zenstack/schema.zmodel` | Source of truth for models, relations, enums, and access policies. |
| `zenstack/schema.ts` | Generated full schema used on the server. Includes policy metadata. Do not edit. |
| `zenstack/schema-lite.ts` | Generated lite schema used by the browser client. Safe for frontend imports. Do not edit. |
| `server/lib/zenstack.ts` | Creates the raw and policy-enabled ZenStack clients, and binds auth per request. |
| `server/api/model/[...].ts` | ZenStack RPC query-service endpoint for Nuxt. |
| `app/utils/zenstack-client.ts` | Frontend helper that creates the typed ZenStack fetch client. |
| `zenstack/migrations/` | Tracked SQL migrations generated or reviewed from schema changes. |

## Data model source of truth

Model changes start in `zenstack/schema.zmodel`. The schema currently includes `User`, `Project`, `ProjectMember`, and `State`, with access policies declared next to the models.

For example, project creation is allowed only when the authenticated user is the creator:

```zmodel
@@allow('create', auth() != null && auth().isActive && createdById == auth().id)
```

Project membership has a bootstrap rule that allows the creator to add themselves as the initial admin member during nested project creation:

```zmodel
@@allow('create', auth() != null && auth().isActive && userId == auth().id && role == ADMIN && project.createdById == auth().id)
```

That policy is what makes this operation valid through the normal policy-enforced client:

```ts
await client.project.create({
  data: {
    name,
    identifier,
    createdById: user.id,
    leadId: user.id,
    members: {
      create: {
        userId: user.id,
        role: "ADMIN",
      },
    },
  },
});
```

Do not bypass policies for ordinary product operations. If an operation needs a raw DB bypass, treat that as a signal to revisit the model and policies first.

## Server-side clients

`server/lib/zenstack.ts` creates two clients:

```ts
export const rawDb = new ZenStackClient(schema, {
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
});

export const policyDb = rawDb.$use(new PolicyPlugin());
```

`rawDb` bypasses access policies. Use it only for trusted server work, such as initializing the local `User` profile from the Supabase session.

`policyDb` enforces ZModel policies. Before using it for a request, bind the current app user:

```ts
export async function getUserDb(event: H3Event) {
  const user = await getCurrentUser(event);
  return policyDb.$setAuth(user);
}
```

The bound user becomes `auth()` inside policy expressions.

## Supabase user bootstrap

Supabase Auth owns authentication. The app's `User` table stores the domain profile and uses the Supabase user id as `User.id`.

`getCurrentUser(event)` reads the Supabase session with `serverSupabaseUser(event)`, requires an email and `user_metadata.name`, and upserts the local `User` row. It also rejects inactive users.

`server/api/me.get.ts` returns this current local user and is useful for account display and session bootstrap.

## Query service wiring

The generic ZenStack RPC endpoint is defined in `server/api/model/[...].ts`:

```ts
import { RPCApiHandler } from "@zenstackhq/server/api";
import { createEventHandler } from "@zenstackhq/server/nuxt";
import { schema } from "../../../zenstack/schema";
import { getUserDb } from "../../lib/zenstack";

const apiHandler = new RPCApiHandler({
  schema,
  queryOptions: {
    slicing: {
      includedModels: ["Project", "ProjectMember"],
    },
  },
});

export default createEventHandler({
  apiHandler,
  getClient: (event) => getUserDb(event),
});
```

The filename `[...].ts` is Nuxt/Nitro catch-all routing. It handles all RPC paths under `/api/model/*`, so one route can serve operations like project `findMany`, `create`, `update`, and related nested writes.

The handler is intentionally sliced to expose only `Project` and `ProjectMember` for now. Add more models to `includedModels` as the UI needs them.

## Frontend client

Frontend code uses `app/utils/zenstack-client.ts`:

```ts
import { createClient, type FetchFn } from "@zenstackhq/fetch-client";
import { schema } from "~~/zenstack/schema-lite";

export function useZenStackClient() {
  const requestUrl = useRequestURL();
  const requestHeaders = useRequestHeaders(["cookie"]);

  const fetchWithCookies: FetchFn = (url, init) => {
    const headers = new Headers(init?.headers);

    if (import.meta.server && requestHeaders.cookie) {
      headers.set("cookie", requestHeaders.cookie);
    }

    return fetch(url, { ...init, headers });
  };

  return createClient(schema, {
    endpoint: `${requestUrl.origin}/api/model`,
    fetch: fetchWithCookies,
  });
}
```

This helper imports `schema-lite.ts`, not the full server schema. The lite schema keeps policy metadata out of the browser bundle while preserving the model structure needed for typed queries.

Because the file is under `app/utils`, Nuxt auto-imports `useZenStackClient`. Pages can call it without a manual import:

```ts
const client = useZenStackClient();
```

If this helper is moved outside `app/utils` or `app/composables`, add an explicit import or configure Nuxt auto-imports.

## Querying from pages

Use the fetch client for CRUD operations from Vue pages. The API mirrors ZenStack's ORM client.

List projects:

```ts
const client = useZenStackClient();

const { data: projects, refresh } = await useAsyncData(
  "projects",
  () =>
    client.project.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        identifier: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  { default: () => [] },
);
```

Create a project with its initial admin membership:

```ts
await client.project.create({
  data: {
    name: event.data.name,
    identifier: event.data.identifier.toUpperCase(),
    description: event.data.description || undefined,
    createdById: user.value.id,
    leadId: user.value.id,
    members: {
      create: {
        userId: user.value.id,
        role: "ADMIN",
      },
    },
  },
  select: {
    id: true,
    name: true,
    identifier: true,
    description: true,
    createdAt: true,
    updatedAt: true,
  },
});

await refresh();
```

Prefer `select` for page queries so the UI only receives fields it actually renders.

## Generated schemas

After changing `zenstack/schema.zmodel`, regenerate the TypeScript schemas with the project-local ZenStack CLI:

```bash
pnpm exec zen generate --lite
```

This updates both the server schema and the lite frontend schema. Do not hand-edit generated files.

Use schema validation when changing policies:

```bash
pnpm exec zen check
```

Use `pnpm exec` as the normal CLI runner for this pnpm project. If pnpm's package policy or lifecycle checks ever get in the way while debugging locally, the direct binary is an acceptable fallback:

```bash
./node_modules/.bin/zen check
```

## Migrations

Schema changes that affect the database should have a tracked migration under `zenstack/migrations/`.

The normal command is:

```bash
pnpm exec zen migrate dev --name <migration_name>
```

For Supabase pooler connections, Prisma migration may require pooler parameters:

```txt
?pgbouncer=true&connection_limit=1
```

If a direct migration command fails against the pooler, use a migration connection string with those parameters or apply pending migrations with an environment override.

Do not use `zen db push` for changes that should be committed and replayed by other environments.

## When to add custom server routes

The default choice for model CRUD is the ZenStack query service. Add custom server endpoints only when the operation is not a normal model query or mutation.

Good reasons for a custom endpoint include:

- integrating with a third-party API,
- doing non-CRUD orchestration that cannot be expressed as a single nested write,
- returning a purpose-built aggregate read model,
- performing trusted bootstrap work that intentionally bypasses user policies.

Before adding a custom endpoint for a domain operation, first ask whether the ZModel relations and policies should be improved so the operation can run through the policy-enforced client.

## Adding more models to the query service

The RPC endpoint currently exposes only `Project` and `ProjectMember`:

```ts
includedModels: ["Project", "ProjectMember"]
```

When adding UI for states, issues, labels, or comments, add the relevant models to this list and make sure their policies are complete before querying them from the client.

Keep the exposed surface area narrow. Policies protect data, but slicing keeps the public API easier to reason about.
