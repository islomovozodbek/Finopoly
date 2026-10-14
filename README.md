# Finopoly

The deployed classroom game is the React + Express/Socket.IO + SQLite application in **`market-masters/`**. This is the application to edit and deploy. The separate Supabase implementation in `apps/` is retained for reference and is not the live game entry point.

The live source was restored from `finopoly-local` commit `9f1099a6e5830e56bee8ae36680c66fd90fabe2c`. Both the live branch's history and the original `main` history are preserved when synchronizing this release; no force push is needed.

## Run the live game

Requires Node.js 22 or newer.

```sh
npm run install:live
npm run dev
```

For a production build and server:

```sh
npm run build
npm start
```

The server serves the built frontend and Socket.IO on the same origin. It listens on `PORT` (default `3001`). Both repository-root and `market-masters/` Docker build contexts are supported. A service whose existing build/start commands target `market-masters/` can keep those paths.

## Saved games and turns

The existing SQLite file location remains `market-masters/server/data/database.sqlite`. `FINOPOLY_DB_PATH` optionally selects a file on an existing persistent volume. The new columns are added in place; the migration does not reset teams, cash, or history. Do not replace a production database with a local file.

Rolls, offered investments, and board events are saved on the server. Reopening a page, reconnecting, or restarting the server with the same database restores the exact pending turn. The server rejects additional movement and stale submissions, and calculates returns from the saved card. Investment returns stay hidden until submission. Team icons are assigned once and stored with the team.

## Verify a deployment

`GET /health` returns JSON with `app: "Finopoly"`, `source: "market-masters"`, and the Railway Git commit when available. The page title is **Finopoly**, and the header contains a light/dark theme switch. These signals distinguish this release from the older Market Masters bundle and the Supabase rewrite.

```sh
npm run test:live
```

This runs actual SQLite turn tests and Socket.IO tests that restart the server mid-turn. `pnpm test` continues to run the separate rewrite's existing test suite. The UI uses the UI/UX Pro Max and Taste guidance for readable typography, semantic color roles, accessible controls, and paired light/dark palettes.
