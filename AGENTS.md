<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## LogiSync

Skills in `.claude/skills/` carry the details — load the relevant one before starting:

- **logisync-conventions** — stack, commands, and the version traps in Next 16 / Prisma 7 / Tailwind 4. Note that `pnpm build` does not catch type errors; `pnpm tsgo` is the only gate.
- **logisync-auth** — the two-layer admin guard, which endpoints are still unguarded, and the QR code that breaks if you guard one of them carelessly.
- **logisync-pricing** — the pricing engine, the closed set of service cities, and the waybill lifecycle.

Current work is defined in `docs/BACKLOG.md`, mirroring the [Trello board](https://trello.com/b/tJSo9Rjp/logisync) (Trello is the source of truth).
