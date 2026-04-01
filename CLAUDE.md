# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PAES Tutor (TOM) — a Chilean PAES exam preparation platform with 1,472+ verified questions across 5 subjects. Led by Tomás Vergara. Built with React 18 + TypeScript + Vite, backed by Supabase (PostgreSQL + Auth), styled with Tailwind CSS.

The app is entirely in Spanish. All UI text, questions, subjects, and content are in Spanish.

## Commands

All commands run from `frontend/`:

```bash
npm run dev        # Dev server at localhost:5173
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint (--max-warnings 0, strict)
npm run preview    # Preview production build locally
```

No test framework is configured.

## Architecture

### Frontend (`frontend/src/`)

**Entry flow:** `main.tsx` → `ThemeProvider` → `AppMain.tsx` (auth gate) → `LandingPage` (unauthenticated) or authenticated app

**App state machine in AppMain.tsx:** `subject` → `science-specialty` (if C selected) → `mode` → `practice`

**Three practice modes:**
- **TEST** — Random questions from one subject, timed, immediate feedback (`TestMode.tsx`, `ReadingTestMode.tsx` for reading passages)
- **PAES** — Full exam simulation across subjects (`PAESMode.tsx`)
- **REVIEW** — Review past answers with explanations (`ReviewMode.tsx`)

**Key directories:**
- `components/` — All UI components (no routing library, state machine in AppMain)
- `contexts/ThemeContext.tsx` — 7 color themes + dark mode, uses CSS custom properties
- `hooks/` — `useAuth`, `useTestSession` (localStorage persistence), `useImagePreloader`, `useThemeColors`
- `lib/supabase.ts` — Supabase client init
- `lib/questions.ts` — All Supabase queries (questions, sessions, attempts)
- `types.ts` — Core types: `Subject`, `PracticeMode`, `Question`, `QuestionOptions`
- `config/supabase.config.ts` — Supabase credentials

### Supabase (Backend)

**Project:** `bmsmmlymsjpydpealmcw` — Dashboard: https://supabase.com/dashboard/project/bmsmmlymsjpydpealmcw
**Tables:** `questions`, `user_sessions`, `question_attempts`, `profiles`
**Auth:** Email/password with PKCE flow
**Storage:** `questions-images` bucket for question diagrams/images
**Schema:** See `SETUP_SUPABASE.sql` for full DDL with RLS policies and indexes

Supabase anon key is hardcoded as fallback in `vite.config.ts`. These are public anon keys (restricted by RLS).

### Subject Codes

`M1` (Matemática 1), `M2` (Matemática 2), `L` (Lenguaje), `H` (Historia), `C` (Ciencias) with specialties `CB` (Biología), `CF` (Física), `CQ` (Química)

### Data Loading Scripts (root-level Python)

`load_questions_h.py`, `load_m1_questions.py`, `load_ciencias_questions.py` — load questions into Supabase from JSON banks in `pruebas/`

### Deployment

Live at **tutorpaes.cl** (Hostinger, DNS via ns1.dns-parking.com). Build config in `vercel.json`: builds from `frontend/`, outputs to `frontend/dist`, SPA rewrite for all routes.

## Key Patterns

- **No router:** Navigation is a state machine (`AppState` type) in `AppMain.tsx`, not React Router
- **Theme system:** `useThemeColors()` returns dynamic Tailwind class names based on selected theme. Theme CSS variables defined in `index.css` under `[data-theme="..."]` selectors
- **Session persistence:** `useTestSession` hook saves/resumes test state to localStorage, keyed per user
- **Question data:** DB uses `snake_case` (`correct_answer`, `area_tematica`), frontend `Question` type has both `camelCase` and `snake_case` variants — mapping happens in `lib/questions.ts`
- **Icons:** `lucide-react` used throughout
