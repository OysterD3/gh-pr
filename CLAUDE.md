# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension built with React 19, TypeScript, Vite 7, and the CRXJS Vite plugin. The extension includes a popup, side panel, and content scripts that inject React components into web pages.

## Commands

```bash
pnpm dev      # Start development server with HMR
pnpm build    # Type-check and build for production
pnpm preview  # Preview production build
```

After running `pnpm dev`, load the unpacked extension from `dist/` in `chrome://extensions/` (Developer mode enabled).

## Architecture

**Entry Points:**
- `src/popup/` - Extension popup UI (action popup)
- `src/sidepanel/` - Side panel UI
- `src/content/` - Content scripts injected into matching pages

**Configuration:**
- `manifest.config.ts` - Chrome extension manifest (MV3) using CRXJS `defineManifest`
- `vite.config.ts` - Vite config with `@` alias pointing to `src/`

**Content Script Injection:**
The content script (`src/content/main.tsx`) creates a `#crxjs-app` div and mounts a React root into it. Content script views live in `src/content/views/`.

**Build Output:**
- `dist/` - Unpacked extension for development/testing
- `release/` - Zipped extension (`crx-{name}-{version}.zip`) for distribution
