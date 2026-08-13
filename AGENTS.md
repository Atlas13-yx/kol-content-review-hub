# Codex Collaboration Guide

## Product context

This repository contains the KOL Content Review Hub used by GAC International, its agency, and KOL creators. Preserve the responsibility boundaries between the GAC role (`Me`), agency role (`Agency`), and creator role (`KOL`).

## Development workflow

- Create feature branches with the `codex/` prefix.
- Keep changes scoped to the requested workflow; avoid unrelated visual rewrites.
- Do not commit `.env`, `.env.local`, API keys, tokens, production exports, or personal data.
- Treat the credentials in the login demo as non-production fixtures only.
- Run `npm run lint` and `npm run build` before handing off a code change.
- Update this README when setup, environment variables, scripts, or architecture changes.

## Architecture

- `src/pages/`: product screens and route-level views.
- `src/components/`: reusable UI and workflow modals.
- `src/services/dataService.ts`: client state, server synchronization, and workflow actions.
- `server.ts`: Express API, Gemini server-side calls, JSON persistence, and production static hosting.
- `src/data/mockData.ts`: demo seed data.
- `data/db.json`: current prototype database; do not put real personal or campaign data in commits.

## Workflow invariants

- Agency enters preliminary review feedback and hands work to GAC.
- GAC makes final approval or revision decisions.
- New script/video versions and publication-link submission remain agency-side actions.
- A final video approval creates the 1-day link-upload and 3-day performance-data reminders.
- Every state transition should add an auditable timeline event.

## Security expectations

- Gemini calls must remain server-side; never expose `GEMINI_API_KEY` to browser code.
- Validate API inputs and role authorization before production use.
- The current login UI is a demo and not real authentication.
- Replace JSON-file persistence and polling before multi-user production deployment.

