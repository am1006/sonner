# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sonner is an opinionated toast notification component for React. The library provides a `<Toaster />` component and a `toast()` function that can be called from anywhere in the app.

Please note, in this "hotwire" branch, you will only be working in the "rails" folder.

Before anything else:

```bash
cd rails
```

Anything else is from the upstream, which we should not touch.

## Architecture

### Rails Integration (`rails/`)

Vanilla JavaScript port for Rails/Hotwire applications:
- **rails/packages/vanilla/**: Core vanilla JS toast library (no React dependency)
- **rails/packages/stimulus/**: Stimulus controllers for Rails integration

### Toast State Management
The `Observer` class in `state.ts` uses a pub/sub pattern. Components subscribe to toast changes, and the `toast` API publishes updates.

### Toast Types
Built-in types: `success`, `error`, `info`, `warning`, `loading`, `default`. Each type can have custom icons and styling via CSS data attributes.

### Positioning
Toasts support 6 positions: `top-left`, `top-right`, `top-center`, `bottom-left`, `bottom-right`, `bottom-center`. Position is determined by `data-y-position` and `data-x-position` attributes.

### Animations
CSS-based animations using data attributes (`data-mounted`, `data-removed`, `data-swiping`, `data-swipe-out`) and CSS custom properties (`--offset`, `--swipe-amount-x`, `--swipe-amount-y`).
