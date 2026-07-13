# Dev Guide

Internal notes for contributors. This content is intentionally kept out of
README.md, which is published to package registries.

## Code knowledge graph

This repo carries a local **code knowledge graph** ([colbymchenry/codegraph](https://github.com/colbymchenry/codegraph))
that the ReportPortal AI agents (and your own tooling) use to resolve symbols and
references without scanning raw files.

```bash
npm run codegraph             # build it the first time, fast incremental sync after
npm run codegraph -- --force  # rebuild from scratch
```

The graph lives in `.codegraph/codegraph.db` — it is **gitignored and local to your
machine** (only `.codegraph/.gitignore` is committed). It is a pure derivative of the
source, so regenerate it any time. The engine is fetched on demand via `npx`, so there
is no added project dependency.
