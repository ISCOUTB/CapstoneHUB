<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI Conventions

All new UI must be built with [shadcn/ui](https://ui.shadcn.com) whenever possible. Do not hand-roll components (buttons, dialogs, forms, etc.) when a shadcn equivalent exists. Add new components via the shadcn CLI.

Colors, radii, animation utilities and screen layout follow the UTB design
system: see [docs/frontend_design_system.md](../docs/frontend_design_system.md).
Use the design tokens (`bg-utb-blue`, `ring-utb-blue/10`, `text-muted-foreground`)
instead of raw hex values, and open every module screen with `ModuleHeader`.
