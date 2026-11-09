# Sistema de diseño del Frontend

Identidad visual institucional UTB para CapstoneHUB. El lenguaje se tomó del
proyecto **utb-web-asistencia** (Sistema de Asistencia UTB) y se adaptó a la
arquitectura de este frontend.

Ver también: [Arquitectura del frontend](./frontend_arch.md).

## Principios

1. **Un solo azul manda.** El primario es el azul institucional `#0a41f5`. Las
   superficies oscuras (sidebar, heros) usan el azul profundo `#05174a`; el
   topbar es claro sobre `bg-card`.
2. **Tokens antes que hex sueltos.** Todo color vive en `app/globals.css`. No se
   escriben valores como `bg-[#0a41f5]` en los componentes.
3. **Las pantallas se ven simétricas.** Todo módulo muestra su categoría y
   título con el mismo `ModuleHeader` en el topbar; lo que cambia es el
   `eyebrow`, el `title` y el `accentColor`.
4. **Sin librería de animación.** Las animaciones son keyframes CSS y respetan
   `prefers-reduced-motion`.

## Tokens

Definidos en [`app/globals.css`](../hub-frontend/app/globals.css).

### Paleta institucional

Registrada en `@theme`, así que resuelve como utilidad de Tailwind con
modificador de opacidad (`bg-utb-blue/10`, `ring-utb-blue/10`, `text-utb-blue-pale/70`).

| Token | Valor | Uso |
| --- | --- | --- |
| `utb-deep-blue` | `#05174a` | Sidebar, base de los heros. |
| `utb-navy` | `#071f5a` | Paso intermedio del degradado. |
| `utb-blue` | `#0a41f5` | Primario: botones, píldoras activas, acentos. |
| `utb-blue-dark` | `#0835c8` | Hover del primario. |
| `utb-blue-light` | `#547af8` | Degradados y textos destacados. |
| `utb-blue-pale` | `#93b4ff` | Texto secundario sobre fondo oscuro. |
| `utb-accent-1/2/3` | ámbar / esmeralda / rojo | Acentos de estado. |

### Tokens semánticos

Los de shadcn/ui (`--primary`, `--muted`, `--border`…) se redefinieron con matiz
frío (hue 264) para que los componentes base hereden la identidad sin tocarlos
uno a uno.

- `--radius: 0.625rem` (antes `0.45rem`), de donde salen `rounded-lg` … `rounded-4xl`.
- Tipografía: **Geist Sans** y **Geist Mono**.
- Modo oscuro: variante azulada, no gris neutro.

> **Desviación deliberada respecto al referente:** ahí
> `--muted-foreground` es `oklch(0.50 0.10 264)`. Con contenido real (descripciones,
> subtítulos) ese croma hace que el texto secundario se lea como enlaces azules,
> así que aquí se bajó a `0.035`.

## Utilidades

Declaradas en `@layer utilities` de `globals.css`.

| Clase | Efecto |
| --- | --- |
| `utb-rise` | Entrada del elemento. Se escalona con `--utb-delay`. |
| `utb-orb` | Flotación lenta del orbe de los heros. |
| `hover-lift` | Elevación de tarjeta al hacer hover. |
| `grid-lines` / `grid-lines-dark` | Rejilla de fondo, sobre claro / sobre oscuro. |
| `noise-overlay` | Textura de ruido sobre superficies oscuras. |
| `text-gradient-utb` | Texto con degradado azul. |
| `glow-border` | Borde con brillo azul. |
| `shimmer` / `utb-skeleton` | Estados de carga. |
| `utb-spinner` | Rotación de 700 ms. |
| `pulse-dot` | Punto indicador con pulso. |
| `line-reveal` | Revelado horizontal de una regla. |
| `scrollbar-hidden` | Scroll funcional sin barra visible. |

Para escalonar una lista:

```tsx
{items.map((item, i) => (
  <article
    key={item.id}
    className="utb-rise"
    style={{ "--utb-delay": `${i * 80}ms` } as React.CSSProperties}
  >
    …
  </article>
))}
```

## Componentes propios

### `ModuleHeader`

[`app/components/module-header.tsx`](../hub-frontend/app/components/module-header.tsx).
Header del módulo activo dentro del topbar: barra de acento, categoría
(`eyebrow`), título y, cuando aplica, el contador del equipo. No se renderiza
en el cuerpo de la página: `PageFrame` publica estos datos con
`PageHeaderSync` y el topbar los consume.

```tsx
<ModuleHeader
  eyebrow="Gestión de proyectos"
  title="Lista de proyectos"
  accentColor="rgba(56,189,248,0.34)" // opcional
  teamSize={4} // opcional
/>
```

`accentColor` diferencia cada módulo. Los acentos actuales son tonos fríos;
mantener esa familia para que la barra se lea bien sobre el topbar claro.

| Pantalla | Acento |
| --- | --- |
| Proyectos, detalle | por defecto (azul) |
| Proponer | `rgba(56,189,248,0.34)` — cian |
| Perfil | `rgba(16,185,129,0.28)` — esmeralda |
| Administración | `rgba(129,140,248,0.38)` — índigo |

Los botones que van en `actions` se apoyan sobre la zona clara del degradado:
usar fondo sólido blanco con texto `text-utb-deep-blue`, no `bg-white/10`.

### `UtbLogo`

[`app/components/utb-logo.tsx`](../hub-frontend/app/components/utb-logo.tsx).
Isotipo vectorial inline: nítido a cualquier tamaño, colorable con
`currentColor` y sin request HTTP. Acepta `size` (px) o dimensionado por
`className` (`h-16 w-auto`), útil para tamaños responsivos.

## Shell: sidebar y topbar

[`app/components/app-shell.tsx`](../hub-frontend/app/components/app-shell.tsx)
monta el chrome de la plataforma: una **sidebar** oscura de altura completa a la
izquierda y un **topbar** claro (`bg-card`) sticky sobre el contenido.

- La sidebar
  ([`app-sidebar.tsx`](../hub-frontend/app/components/app-sidebar.tsx)) contiene
  la marca y dos secciones: **Navegación** (Inicio, Proyectos, Proponer) y
  **Acciones de usuario** (Administración, Rúbricas, Indicadores, Mi perfil).
  La segunda se calcula con `navigation-links.ts` según los roles.
- La ruta activa se marca con una píldora `bg-utb-blue`; es el único elemento
  con ese tratamiento.
- En escritorio (`lg`) la sidebar queda fija y expandida. Por debajo de `lg` se
  monta en un drawer que se cierra al navegar o con el botón **Cerrar menú**.
- El topbar
  ([`navbar.tsx`](../hub-frontend/app/components/navbar.tsx)) muestra el
  `ModuleHeader` del módulo activo y el widget de sesión (`AuthNav`). El
  dropdown de perfil conserva **Mi perfil** y **Cerrar sesión**.
- En login y registro no hay sidebar: el topbar recupera la marca a la izquierda
  y deja el formulario a ancho completo.

## Header de módulo y contenido

[`app/components/page-frame.tsx`](../hub-frontend/app/components/page-frame.tsx)
registra la categoría, el título, el acento y el tamaño del equipo en
`page-header-context.tsx`; el topbar los consume. Ya no hay statusbar ni
pestañas de usuario dentro del cuerpo: la navegación vive solo en la sidebar.

La home mantiene su hero y no publica header. Las pantallas cargadas sin
`PageFrame` (login, registro y algunos estados de carga) dejan el topbar sin
título de módulo.

## Convenciones para pantallas nuevas

```tsx
<PageFrame
  eyebrow="Administración"
  title="Rúbricas"
  accentColor="rgba(129,140,248,0.38)"
  maxWidth="max-w-6xl"
>
  {/* contenido */}
</PageFrame>
```

- El fondo de plataforma lo pone `<body>` (`bg-muted/40`); no poner
  `bg-background` ni `min-h-screen` en los `main`.
- Ancho: `max-w-6xl` salvo el detalle de proyecto (`max-w-7xl`) y los
  formularios (`max-w-4xl`).
- Tarjetas: usar `Card` de `components/ui`. Suelta se replica con
  `rounded-2xl bg-card p-5 shadow-sm ring-1 ring-utb-blue/10`.
- Tablas: envolver en una tarjeta, cabecera `bg-muted/50 hover:bg-muted/50` y
  filas `transition-colors hover:bg-utb-blue/[0.04]`.

## Primitivas de shadcn/ui ajustadas

Se editaron para heredar el lenguaje; el resto sigue igual y toma los tokens
automáticamente.

| Componente | Cambio |
| --- | --- |
| `card.tsx` | `rounded-2xl`, `shadow-sm ring-1 ring-utb-blue/10`, hover a `shadow-md`. |
| `tabs.tsx` | Lista en tarjeta blanca; pestaña activa en píldora `bg-utb-blue`. En pantallas pequeñas la lista se envuelve en filas (`flex-wrap`) en vez de recortarse. |
| `sidebar.tsx` | Breakpoint `lg`, tokens oscuros alineados con `utb-deep-blue` y el ítem activo en `bg-utb-blue`. |
| `button.tsx` | Radio a `rounded-xl`. |
| `input.tsx`, `textarea.tsx`, `select.tsx` | Radio a `rounded-xl`. |

Al añadir componentes con el CLI de shadcn vendrán con los radios por defecto
(`rounded-lg`); alinearlos a `rounded-xl` si quedan junto a los anteriores.
