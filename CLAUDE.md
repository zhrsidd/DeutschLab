# DeutschLab

Native macOS German-learning app for one user.

## Stack
- Tauri v2
- React
- TypeScript
- Tailwind CSS v4
- lucide-react
- SQLite via @tauri-apps/plugin-sql
- Local-only; no auth/backend/cloud

## Goal
Teach German from A0 toward C1 for eventual Physics study at ETH Zürich.
Current scope: Unit 1 only, A0 → strong A1, Oct 2026–Jan 2027.

## Current architecture
- `src/App.tsx`: main dashboard/navigation and lesson routing
- `src/data/unit1.ts`: Unit 1 curriculum + starter tasks
- `src/data/lessons/week1Vocabulary.ts`: Week 1 vocabulary
- `src/components/VocabularyLesson.tsx`: working vocabulary lesson
- `src/lib/db.ts`: SQLite initialization, task progress, lesson attempts

## Current working behavior
- Dashboard and Unit 1 curriculum UI work
- SQLite persistence works across restarts
- `vocab-001` opens a real lesson
- Vocabulary lesson flow:
  intro → learn → quiz → results
- Passing score is 80%
- Attempts are saved
- Passed lesson is persisted as complete

## Development rules
- Keep UI minimal, clean, monochrome, macOS-like
- Preserve existing working behavior
- Avoid unrelated refactors
- Prefer reusable lesson primitives over duplicated logic
- Keep everything local/offline unless explicitly requested
- No Supabase/auth/server
- Do not add packages unless necessary
- TypeScript must compile cleanly
- Keep Tailwind IntelliSense warnings clean where practical

## Learning design
Use:
teach → contextualise → recall → assess

Do not build a Duolingo clone.
Prioritise explanation, production, listening, speaking, and mistake-aware review.