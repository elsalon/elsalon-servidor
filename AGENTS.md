# AGENTS.md — El Salón (servidor)

Guidance for AI agents working in this repository. Read this before making changes.

## What this project is

**El Salón** is the web **backend** of an educational platform for an art/design school —
a shared *"salón"* (hall) where students (*alumnos*) and teachers (*docentes*) publish work,
comment on it, give appreciation, and organize by course. There is a separate frontend (not in
this repo) that talks to this backend over REST/GraphQL.

- **The UI and domain language are Spanish.** Collections, fields, endpoints, and most variables
  are named in Spanish. Keep domain terms in Spanish (e.g. `entrada`, `sala`, `comisión`). New
  code should match this convention — do not translate domain nouns to English.
- This project is built **on top of [Payload CMS](https://payloadcms.com) v2** (`payload ^2.30.4`),
  running as a custom Express server. Payload provides the admin panel, auth, REST + GraphQL APIs,
  access control, hooks, and the MongoDB ODM layer.

## Tech stack

| Concern        | Choice |
|----------------|--------|
| CMS / framework| Payload CMS **v2** (`payload/config`, `payload/types`) |
| Server         | Express 4 (`src/server.ts`) wrapping `payload.init({ express: app })` |
| Database       | MongoDB via `@payloadcms/db-mongodb` (Mongoose adapter) |
| File storage   | S3-compatible (DigitalOcean / Hetzner Spaces) via `@payloadcms/plugin-cloud-storage` |
| Rich text      | `@payloadcms/richtext-slate` (content is also stored/handled as HTML in `contenido`) |
| Bundler        | webpack (`@payloadcms/bundler-webpack`) |
| Language       | TypeScript 4.8 (collections in `.ts`); some subsystems are `.js` (notifications, jobs, mail) |
| Email          | Nodemailer SMTP (MailerSend) + a custom DB-backed mail queue |
| Deploy         | Docker / docker-compose (dev + prod compose overrides) |

> Note: this is **Payload v2**, not v3. APIs differ from current Payload docs — check the
> installed version. `package.json` `description` still says "blank template"; ignore it.

## Repository layout

```
src/
  payload.config.ts        # ★ Central config: collections, globals, plugins, db, email, endpoints
  server.ts                # ★ Express bootstrap; payload.init; loads El Salón + Biblioteca; starts jobs/mail
  globals.js               # In-memory runtime singletons (elSalonId, bibliotecaId, notificationService)
  helper.ts                # ★ Shared access-control fns + reusable hooks (extracto, soft-delete, populate…)
  SlugField.js             # Reusable slug field factory
  SearchQuery.js           # GET /api/busqueda endpoint handler
  emailTemplates.js        # HTML email templates
  GeneradorNotificacionesMail.js  # Mail notification triggers + GET /api/desuscribir

  collections/             # ★ One file per Payload collection (the data model)
    Users.ts  Salas.ts  Comisiones.ts  Grupos.ts
    Entradas.ts  Comentarios.ts  Enlaces.ts  Aprecio.ts  Guardado.ts
    Notificaciones.ts  Fijadas.ts  Eventos.ts  Etiquetas.ts  Secciones.ts
    Imagenes.ts  Archivos.ts  Avatares.ts  (uploads)
    MailQueue.ts  Ajustes.ts (global)
    CamposEntradasYComentarios.ts  # Shared field set reused by Entradas + Comentarios
    ComisionesEndpoints.js         # feed / unirme / abandonar handlers for Comisiones
    Paginas.ts, LinksExternos.ts   # currently commented out of config

  hooks/Notificaciones/    # ★ In-app notification engine (see "Notifications" below)
    NotificationService.js   # Queue + dispatch; constructed once, stored in globals
    NotificationRegistry.js  # Maps notification type string -> Handler class
    NotificationsHooks.js    # The hook fns wired into collection afterChange hooks
    BaseNotificationHandler.js
    handlers/                # One handler per notification scenario

  Jobs/                    # node-cron scheduled jobs
    JobsManager.js           # Instantiated in server.ts onInit
    EliminarFijadasVencidas.js
    EliminarNotificacionesViejas.js

  MailQueueProcessor.js    # Polls MailQueue collection and sends pending emails
  MailQueueProcessor / GeneradorNotificacionesMail  # email side of notifications

  utils/                   # icsGenerator, googleDriveDownloader, pdfCoverSearch
  scripts/                 # export-entradas-sample.ts (export entradas to JSON for AI embeddings)
  procesarBiblioteca.ts    # Manual script: enrich Biblioteca entries (Drive download + PDF covers)
  migrations/              # Payload migrations (timestamped .ts)
  migracion/               # One-off HumHub import scripts (legacy data migration, .js)
  payload-types.ts         # GENERATED — do not hand-edit (run generate:types)
```

★ = start here when orienting in the codebase.

## How to run / common commands

```bash
yarn dev                    # nodemon dev server (PAYLOAD_CONFIG_PATH=src/payload.config.ts)
yarn build                  # copyfiles + payload build (admin bundle) + tsc
yarn serve                  # production: node dist/server.js
yarn generate:types         # regenerate src/payload-types.ts after model changes
yarn generate:graphQLSchema # regenerate GraphQL schema

# Docker
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d   # dev
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d  # prod

# Manual scripts (run inside Docker in prod)
docker-compose run --rm payload yarn procesar-biblioteca
docker-compose run --rm payload yarn export:entradas-sample
```

Admin panel: `http://localhost:3000/admin`. API base: `/api`. Root `/` redirects to `/admin`.

**After changing any collection's fields, run `yarn generate:types`.** `payload-types.ts` is generated.

## Architecture notes (important behaviors)

### Runtime singletons (`globals.js`)
`server.ts` `onInit` resolves (or creates) two special `salas` by slug and caches their IDs in
`globals`: **`elSalonId`** (slug `el-salon`) and **`bibliotecaId`** (slug `biblioteca`). It also
constructs the `NotificationService` and stores it in `globals.notificationService`. Code reads
these via `require('../globals')`. Don't assume they're set outside the running server (scripts
that call `payload.init` independently won't have them unless they re-run that logic).

### The feed
The personalized feed is `GET /api/salas/feed` (in `Salas.ts`). It composes a Payload `where`
query from the user's **enlaces** (follows): main salas are always included; `salon` enlaces are
time-restricted to the academic period; `bitacora` enlaces include a user's posts; `grupo` enlaces
include a group's posts; plus the user's own posts and any `destacada` entry. Sorted by
`lastActivity` (not `updatedAt` — see below), paginated 12/page.

### `lastActivity` vs `updatedAt`
`entradas.lastActivity` is a dedicated sort key bumped when someone **comments** (via
`ActualizarActividadEntrada`), so commenting floats an entry up the feed without `updatedAt`
marking it as "edited". Keep this distinction.

### Soft delete
User-facing deletes are **soft** (`SoftDelete(collection)` in `helper.ts`): sets
`isDeleted/deletedAt/deletedBy` instead of removing the doc. Reads are filtered by
`PublicadasYNoBorradas` access control. **Exception:** requests from the admin panel (detected via
`req.headers.referer` containing `/admin`) perform a real hard delete. Deleting an entry also
removes its `fijadas`.

### Hooks pattern
Collections compose small reusable hooks from `helper.ts`. Typical `entradas`/`comentarios` flow:
- `beforeChange`: `ValidarContenidoVacio` → `LimpiarContenido` → `CrearExtracto` → `SetAutor` → (biblioteca enrichment)
- `afterChange`: fire notifications (group, mentions, comment, mail)
- `afterRead`: `PopulateComentarios`, `PopulateAprecios`, `PopulateGuardado`

**`context.skipHooks`** is the convention to bypass hook side-effects (used by internal updates like
`ActualizarActividadEntrada`, migrations, and scripts). Honor it when adding new hooks. There are
finer-grained flags too (`skipBibliotecaEnriquecimiento`, `skipPopulateComentarios`, `crearExtracto`).

### Authorship: individual vs group
Entries/comments can be authored by a user (`autor`) or a group (`autoriaGrupal: true` + `grupo`).
This dual authorship branches across access control (`isAdminAutorOrIntegrante`), soft delete, and
the entire notification handler matrix. Many handlers are named `…Usuario…` vs `…Grupal…` for this.

### Notifications (two channels)
1. **In-app** — `NotificationService` (queue processed every 5s) → writes to `notificaciones`
   collection. Trigger with `notificationService.triggerNotification(type, rawContext)`. Each `type`
   string maps to a Handler in `NotificationRegistry.js`; handlers build identidad/mensaje/link/
   categoría/recipients and optionally **aggregate** into an existing notification
   (`requiresAggregation`). Wiring lives in `NotificationsHooks.js`, called from collection
   `afterChange` hooks.
2. **Email** — `GeneradorNotificacionesMail.js` enqueues into the **`mailQueue`** collection;
   `MailQueueProcessor.js` polls and sends via Payload's email transport. Per-user toggles live in
   `users.notificacionesMail`. Unsubscribe via `GET /api/desuscribir`.

When adding a notification scenario: add a handler in `handlers/`, register it in
`NotificationRegistry.js`, and trigger it from the relevant hook.

### Scheduled jobs
`JobManager` (started in `server.ts` onInit) sets up node-cron jobs: delete expired `fijadas`, prune
old `notificaciones`. Add new jobs there.

### Biblioteca enrichment
New entries in the **Biblioteca** sala get auto-enriched in `beforeChange`
(`BibliotecaEnriquecimiento` in `Entradas.ts`): detect Google Drive links in `contenido`, download
files (`utils/googleDriveDownloader`), and generate a PDF cover thumbnail
(`utils/pdfCoverSearch`, via CloudConvert with ApyHub fallback). The manual batch version is
`procesarBiblioteca.ts` (`yarn procesar-biblioteca`).

### Custom endpoints (beyond Payload's auto REST/GraphQL)
- `GET /api/busqueda` — search (`SearchQuery.js`)
- `GET /api/desuscribir` — email unsubscribe
- `GET /api/salas/feed` — personalized feed
- `GET /api/salas/:id/calendar/:period.ics` — iCalendar export per academic period
- `PATCH /api/entradas/:id/destacar`, `DELETE /api/entradas/:id` (soft) — see `Entradas.ts`
- `PATCH /api/users/:id/cambiar-rol`, `PATCH /api/users/:id/toggle-admin`
- `GET /api/grupos/me`, `Comisiones` feed/unirme/abandonar

### Access control roles
- `isAdmin` — `user.isAdmin` flag
- `rol` is `alumno` | `docente` (separate from admin). `isAdminOrDocente` gates teacher actions.
- `isAdminOrSelf`, `isAutor`, `isAdminOrAutor`, `isAdminOrIntegrante`, `isAdminAutorOrIntegrante`
- Access fns can return a Payload `Where` filter (row-level access), not just boolean.

## Glossary (Spanish domain terms)

| Term            | Collection / field   | Meaning |
|-----------------|----------------------|---------|
| **El Salón**    | special `sala`       | The main hall; its ID is cached as `globals.elSalonId`. |
| **Sala**        | `salas`              | A space/room. Has academic-period config (`archivo`: anual/cuatrimestral), events, color, slug. |
| **Biblioteca**  | special `sala`       | Library space; entries auto-enriched from Google Drive / PDF. ID = `globals.bibliotecaId`. |
| **Entrada**     | `entradas`           | A **post** — the core content unit (text/HTML `contenido`, images, files, mentions, tags). |
| **Comentario**  | `comentarios`        | A comment on an entrada. Shares fields with entradas via `CamposEntradasYComentarios`. |
| **Comisión**    | `comisiones`         | A **course section / class group** (docentes + integrantes, tied to a sala `contexto`). |
| **Grupo**       | `grupos`             | A user-created **group** that can co-author content (`autoriaGrupal`). |
| **Enlace**      | `enlaces`            | A **follow/subscription**. `tipo`: `bitacora` (a user), `salon` (a sala), `grupo`. Drives the feed. |
| **Bitácora**    | (enlace tipo)        | Following a user's personal log/posts. |
| **Aprecio**     | `aprecio`            | "Appreciation" / like. Unique per (autor, contenidoid) — duplicates rejected. |
| **Guardado**    | `guardado`           | A user's saved/bookmarked content, with a `categoria`. Private to its author. |
| **Fijada**      | `fijadas`            | A **pinned** entry (has expiration; pruned by a cron job). |
| **Destacada**   | `entradas.destacada` | A **featured** entry (set by docente/admin via `/destacar`); always shows in feeds. |
| **Mención**     | `mencionados`        | @mention of a user or group inside content. Triggers notifications. |
| **Etiqueta**    | `etiquetas`          | A hashtag / tag. |
| **Sección**     | `secciones`          | Content sections (org structure). |
| **Notificación**| `notificaciones`     | In-app notification (may aggregate). |
| **Extracto**    | `*.extracto`         | Auto-generated plain-text preview (first ~120 chars, mentions/tags flattened). |
| **Integrante**  | field                | A member (of a grupo or comisión). |
| **Alumno / Docente** | `users.rol`     | Student / teacher role. |
| **Ajustes**     | global `ajustes`     | Site-wide settings (Payload global, not a collection). |

Content-markup conventions inside `contenido` (parsed by `CrearExtracto`):
- `[name](usuario:ID)` — user mention   ·   `[name](grupo:ID)` — group mention
- `[name](etiqueta:ID)` — tag           ·   `[image:HEXID]` — inline image reference

## Conventions & gotchas for agents

- **Keep domain terms in Spanish.** Match existing naming; comments are often Spanish too.
- **Payload v2 API** — verify against the installed version, not the latest docs.
- **Regenerate types** after model changes (`yarn generate:types`); never hand-edit `payload-types.ts`.
- **Respect `context.skipHooks`** (and the finer-grained skip flags) in any new hook.
- **Soft delete + admin hard-delete branch** — preserve the `referer.includes('/admin')` distinction.
- **`globals.js` singletons** are runtime-only; not available to standalone scripts unless re-initialized.
- Notifications have a heavy **handler matrix** (usuario × grupal × entrada × comentario). Adding a
  case usually means a new handler + registry entry + hook trigger, plus its email counterpart.
- **Two delete semantics, two notification channels, two authorship modes** — the recurring sources
  of subtle bugs. When touching one, check the other branch.
- `.env` holds secrets (DB URI, S3/Spaces creds, SMTP, `PAYLOAD_SECRET`). Never commit it or echo values.
- Mixed `.ts`/`.js`: collections/utils are TS; notifications, jobs, mail, globals, slug, search are JS.
```
