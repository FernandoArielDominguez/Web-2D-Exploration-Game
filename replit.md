# Emberwild

An original 2D browser exploration game foundation where players can wander through a living meadow and gradually build a home.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/emberwild run dev` — run the Emberwild browser game
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/emberwild/src/game/` — the Canvas 2D engine and game systems
- `artifacts/emberwild/src/App.tsx` — the React UI bridge and game overlays
- `artifacts/emberwild/src/index.css` — Emberwild visual language and responsive shell
- `artifacts/emberwild/README.md` — player controls and phase notes
- `artifacts/emberwild/ARCHITECTURE.md` — runtime communication and coordinate-space decisions

## Architecture decisions

- The game engine owns the loop, input, world coordinates, camera, and Canvas rendering; React only owns the surrounding UI shell.
- A fixed-step loop keeps player movement independent of frame rate while Canvas rendering remains responsive.
- Content systems will be data-driven and added incrementally; the foundation currently uses only primitive placeholder art.

## Product

The current foundation is a playable dusk meadow with WASD/arrow movement, camera following, world bounds, a responsive HUD, pause overlays, and a debug overlay toggled with F3. Gathering, inventory, crafting, construction, combat, progression, and saving are planned for subsequent phases.

## User preferences

- Keep the game original and avoid external assets; placeholders should remain replaceable by local user-provided art.
- Prefer modular, data-driven systems over content-specific branches.

## Gotchas

- The Emberwild workflow provides `PORT` and `BASE_PATH`; restart the managed artifact workflow rather than running Vite manually.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
