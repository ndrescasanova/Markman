# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools directly.

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.

## Available gstack skills

- `/office-hours` — YC-style office hours for startup/project brainstorming
- `/plan-ceo-review` — CEO/founder-mode plan review
- `/plan-eng-review` — Eng manager-mode architecture review
- `/plan-design-review` — Designer's eye plan review
- `/design-consultation` — Full design system consultation
- `/review` — Pre-landing PR code review
- `/ship` — Ship workflow: tests, changelog, PR creation
- `/land-and-deploy` — Merge PR, wait for CI/deploy, verify production
- `/canary` — Post-deploy canary monitoring
- `/benchmark` — Performance regression detection
- `/browse` — Fast headless browser for QA and site testing
- `/qa` — Systematically QA test and fix bugs
- `/qa-only` — QA report only (no fixes)
- `/design-review` — Designer's eye visual QA with fixes
- `/setup-browser-cookies` — Import cookies from real browser for authenticated testing
- `/setup-deploy` — Configure deployment settings
- `/retro` — Weekly engineering retrospective
- `/investigate` — Systematic root cause debugging
- `/document-release` — Post-ship documentation update
- `/codex` — OpenAI Codex CLI code review / challenge / consult
- `/cso` — Chief Security Officer security audit
- `/careful` — Safety guardrails for destructive commands
- `/freeze` — Restrict edits to a specific directory
- `/guard` — Full safety mode (careful + freeze combined)
- `/unfreeze` — Clear freeze boundary
- `/gstack-upgrade` — Upgrade gstack to latest version
