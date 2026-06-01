# react-nav-router

Lightweight iOS-style stack router for React 18.

[![CI](https://github.com/TODO/react-nav-router/actions/workflows/ci.yml/badge.svg)](https://github.com/TODO/react-nav-router/actions/workflows/ci.yml)
[![Docs](https://github.com/TODO/react-nav-router/actions/workflows/docs.yml/badge.svg)](https://github.com/TODO/react-nav-router/actions/workflows/docs.yml)

> Documentation & live demos: <https://TODO.github.io/react-nav-router>

## Install

```bash
pnpm add react-nav-router
```

Peer: `react@>=18`, `react-dom@>=18`.

## Quick start

```tsx
import { createRouter, NavRouter } from 'react-nav-router';

const router = createRouter({ rootRoute: '/', history: 'hash' });

export default function App() {
  return <NavRouter router={router} render={(p) => <Page path={p} />} />;
}
```

## Features

- iOS-style push / pop / replace transitions
- `willAppear` / `didAppear` / `willDisappear` / `didDisappear` lifecycle
- Hash-mode history binding with `popstate` / `hashchange` handling
- `customNavigation` hook for per-app stack policies
- Tiny — zero runtime dependencies, tree-shakeable

## Development

```bash
pnpm install
pnpm test           # unit tests (57 tests)
pnpm e2e            # playwright e2e (requires docs:build first)
pnpm docs:dev       # live docs site at localhost:5173
pnpm build          # produce dist/
```

## Docs deployment

First-time: repo **Settings → Pages → Source = "GitHub Actions"**.  
Subsequent pushes to `main` deploy automatically via `docs.yml`.

## License

MIT
