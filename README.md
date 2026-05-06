# LMU Endurance Strategy

A full-stack web application for Le Mans Ultimate race engineers. Manage race setup, plan pit-stop strategies, track live stints, and recalculate remaining strategy on the fly.

Built as a demonstration project for a Claude-powered agent team workflow: GitHub issues flow through a **PO → Architect → Dev → QA** pipeline, fully automated with Claude Code slash commands.

---

## Features

- **Dashboard** — View, create, and delete races
- **Race Creation** — Configure track, duration, fuel/energy/tyre specs, and driver rotation
- **Strategy Calculation** — Generate Normal, Fuel Save, and Mixed variants; compare side-by-side; activate one
- **Live Race Execution** — Confirm stints, record actual lap counts, trigger dynamic recalculation of remaining strategy
- **Timeline & Schedule** — Visual timeline, changeover table, per-driver summaries
- **Authentication** — Session-based login; all pages and endpoints require authentication
- **Registration Codes** — Server-side gating for new account creation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, SQLite (better-sqlite3), bcrypt, express-session |
| Frontend | React 19, Vite, React Router v7 |
| Database | SQLite with WAL mode |
| E2E Tests | Cucumber 11, Playwright |
| Unit Tests | Node.js built-in test runner |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
git clone https://github.com/sandrseb/lmu-endurance-strategy.git
cd lmu-endurance-strategy
npm run install:all
```

Copy the environment template and fill in values:

```bash
cp .env.example .env
```

### Run

```bash
# Start backend + frontend concurrently (recommended)
npm run dev

# Or start individually
npm run dev:server   # Express on :3001
npm run dev:client   # Vite on :5173
```

### Database

```bash
npm run db:reset     # Reset schema and run migrations
```

---

## Project Structure

```
lmu-endurance-strategy/
├── server/                  # Express + SQLite backend
│   ├── index.js             # App entry point
│   ├── middleware/auth.js   # Session authentication guard
│   ├── routes/              # auth, races, drivers, strategies, stints
│   ├── engine/              # Strategy calculation & pit-time computation
│   ├── db/                  # Connection, migrations
│   └── tests/               # Node.js unit/API tests
├── client/                  # React + Vite frontend
│   └── src/
│       ├── pages/           # Login, Dashboard, RaceCreate, StrategyCreate, etc.
│       ├── components/      # Shared UI components
│       └── api.js           # API client helpers
├── e2e/                     # Cucumber + Playwright E2E tests
│   ├── features/            # Gherkin .feature files (one per epic)
│   ├── steps/               # Playwright step definitions
│   └── support/             # Shared world & auth helpers
├── .claude/
│   └── agents/              # Agent role definitions (po.md, architect.md, dev.md, qa.md)
├── .github/
│   └── issues/              # Issue templates per epic
├── CLAUDE.md                # Claude Code project instructions
├── req.md                   # Full requirements, user stories, data model
└── .env.example
```

---

## Testing

```bash
# Unit & API tests (Node.js test runner)
npm test

# E2E tests (Cucumber + Playwright, headless)
npm run test:e2e

# E2E tests with visible browser
cd e2e && HEADED=true npm test
```

E2E tests follow a BDD-first approach: QA writes Gherkin feature files **before** Dev implements, so the scenarios serve as the definition of done.

Feature files live in `e2e/features/epic-{n}-*.feature`.  
Step definitions live in `e2e/steps/epic-{n}-*.js`.

---

## Claude Agent Workflow

This project uses a **PO → Architect → Dev → QA** agent pipeline powered by [Claude Code](https://claude.ai/code). Each role has a definition file in `.claude/agents/`.

### Agents

| Agent | File | Responsibility |
|---|---|---|
| **PO** | `.claude/agents/po.md` | Refines a GitHub issue into acceptance criteria |
| **Architect** | `.claude/agents/architect.md` | Designs DB changes, API contracts, file changes |
| **Dev** | `.claude/agents/dev.md` | Implements the feature on a branch |
| **QA** | `.claude/agents/qa.md` | Writes BDD scenarios, implements step definitions, reviews PR |

### Slash Commands

Run any stage individually, or fire the full cycle with one command:

```
/po <github-issue-url>        # Analyse issue, post acceptance criteria as comment
/architect <github-issue-url> # Design implementation, post plan as comment
/dev <github-issue-url>       # Create branch, implement feature
/qa <github-issue-url>        # Write feature file, implement steps, review PR
/workflow <github-issue-url>  # Run full PO → Architect → Dev → QA cycle
```

### Full Development Flow

```
GitHub Issue
    │
    ▼
/po        → Posts acceptance criteria & out-of-scope as issue comment
    │
    ▼
/architect → Posts DB schema, API contracts, file list as issue comment
    │
    ▼
QA writes  → e2e/features/epic-{n}-*.feature  (definition of done)
    │
    ▼
/dev       → Creates branch feat/epic-{n}-*, implements, opens PR
    │
    ▼
/qa        → Implements e2e/steps/epic-{n}-*.js, runs tests, reviews PR
    │
    ▼
PR merged
```

### Why This Setup

The agent workflow was built in response to a challenge:

> Install Claude. Create a sample local full-stack app in GitHub. Set up a team of agents able to complete the basic E2E cycle from GitHub issues to PRs. Use a basic PO → Architect → Dev → QA workflow.

Each agent has a tightly scoped role definition, reads the same `req.md` as its source of truth, and posts structured output as GitHub comments so the next agent (or a human reviewer) always has full context.

---

## Key Constraints

- **Pit stop times are always computed** from the lookup tables in `req.md` (Appendix A). Manual entry is never allowed.
- **Energy reserve floor** is 0.1% — hardcoded, non-configurable.
- **Confirmed stints are immutable** — only future stints are recalculated after confirmation.
- **Authentication is required** on every page and every API endpoint.
- **Cascade deletes** — deleting a race removes all associated drivers, stints, and strategy data.

---

## Requirements

See [`req.md`](./req.md) for the full specification: epics, user stories with acceptance criteria, data model, pit time formula, damage tables, and the 22 pre-loaded LMU tracks.
