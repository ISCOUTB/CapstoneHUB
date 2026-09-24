<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI Conventions

All UI follows the UTB design system: read
[docs/frontend_design_system.md](../docs/frontend_design_system.md) before
building or restyling a screen. The rules below are the short version; the doc is
the source of truth for tokens, utilities and per-screen accents.

## shadcn/ui first

Build with [shadcn/ui](https://ui.shadcn.com) whenever possible. Do not
hand-roll components (buttons, dialogs, forms, tables, etc.) when a shadcn
equivalent exists. Add new components via the shadcn CLI.

## Tokens, never raw hex

Every color lives in `app/globals.css`. Use the institutional tokens
(`utb-deep-blue`, `utb-blue`, `utb-blue-dark`, `utb-blue-light`,
`utb-blue-pale`, `utb-accent-1/2/3`) and the semantic shadcn tokens
(`--primary`, `--muted`, `--border`…). They resolve as Tailwind utilities with
opacity modifiers.

- Prefer `bg-utb-blue`, `ring-utb-blue/10`, `text-muted-foreground`.
- Never write `bg-[#0a41f5]` or other raw hex values in components.
- Radii come from `--radius: 0.625rem`; animations are CSS keyframes that honor
  `prefers-reduced-motion`. There is no animation library — use the `utb-*`
  utilities (`utb-rise`, `hover-lift`, `text-gradient-utb`, `utb-skeleton`…).

## Screens

Open every module screen with `ModuleHeader`
([`app/components/module-header.tsx`](./app/components/module-header.tsx)) and
the standard shell:

```tsx
<main className="flex-1 text-foreground">
  <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <ModuleHeader eyebrow="…" title="…" subtitle="…" />
    {/* content */}
  </section>
</main>
```

- `<body>` supplies the page background (`bg-muted/40`); do not add
  `bg-background` or `min-h-screen` to `main`.
- Width: `max-w-6xl` by default, `max-w-7xl` for project detail, `max-w-4xl` for
  forms.
- `ModuleHeader` `accentColor` distinguishes modules — use cool tones only
  (cyan/emerald/indigo; warm tones go muddy over the deep blue). Buttons passed
  in `actions` sit on the light part of the gradient: solid white with
  `text-utb-deep-blue`, not `bg-white/10`.
- Use `UtbLogo` for the mark; the two-part `navbar` (institutional band +
  `sticky` nav row) is intentional — keep the strips siblings inside `<body>`.

## Cards and tables

- Cards: use `Card` from `components/ui`. Standalone surfaces replicate it with
  `rounded-2xl bg-card p-5 shadow-sm ring-1 ring-utb-blue/10`.
- Tables: wrap in a card, header `bg-muted/50 hover:bg-muted/50`, rows
  `transition-colors hover:bg-utb-blue/[0.04]`.

## Adjusted shadcn primitives

`card.tsx`, `tabs.tsx`, `button.tsx`, `input.tsx`, `textarea.tsx` and
`select.tsx` were edited to inherit the language (see the doc's table). New
components pulled from the CLI arrive with default radii (`rounded-lg`); align
them to `rounded-xl` when they sit next to the adjusted ones.
