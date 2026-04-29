# LMU Endurance Strategy

## Project Overview
A web application for Le Mans Ultimate endurance race engineers. Manages race setup, pit-stop strategy planning, live stint tracking, and dynamic strategy recalculation.

## Tech Stack (Target)
- **Backend**: Node.js, Express, SQLite (better-sqlite3), bcrypt, express-session
- **Frontend**: React 19, Vite, React Router
- **Database**: SQLite with WAL mode

## Requirements
All functional requirements, user stories, data model, and appendix tables are in `req.md`.

## Agent Team Workflow
This project uses a PO → Architect → Dev → QA agent workflow for the E2E development cycle from GitHub issues to PRs.

### Agent Definitions
See `.claude/agents/` for role specifications:
- **PO** (`.claude/agents/po.md`) — Refines issues into acceptance criteria
- **Architect** (`.claude/agents/architect.md`) — Designs implementation plans
- **Dev** (`.claude/agents/dev.md`) — Implements the code
- **QA** (`.claude/agents/qa.md`) — Reviews against acceptance criteria

### Slash Commands
- `/po <issue-url>` — Run PO analysis on an issue
- `/architect <issue-url>` — Produce architecture plan
- `/dev <issue-url>` — Implement the feature
- `/qa <issue-url>` — Review the PR
- `/workflow <issue-url>` — Run full PO → Architect → Dev → QA cycle

### Development Flow
1. A GitHub issue exists describing a feature (one per epic)
2. `/po` refines it into acceptance criteria (posted as issue comment)
3. `/architect` designs the implementation (posted as issue comment)
4. `/dev` creates a branch, implements, opens a PR
5. `/qa` reviews the PR, approves or requests changes
