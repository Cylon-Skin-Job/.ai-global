# Universal Design Spec

This is the architectural standard for all projects. Any new project or
refactored project should conform to this spec. The goal is portability:
shared components move between projects without rewiring.

---

## The Rule

```
Every project is a thin HTML shell + bundled JS + structural CSS.

  · HTML defines permanent layout. Nothing else.
  · JavaScript creates, renders, and destroys all dynamic UI.
  · CSS handles structural layout + design tokens. Nothing else.
  · Components are portable JS modules that carry their own
    templates and styles. They work in any project that provides
    CSS variables (or they fall back to defaults).
```

---

## Architecture Layers

Every project has these layers. Data flows down. Events flow up.
Nothing skips a layer.

```
┌──────────────────────────────────────────────────────────┐
│  LAYER 0: LOCALSTORAGE CACHE                             │
│  Runs before auth, before modules load.                  │
│  Applies theme instantly — no flash.                     │
│                                                          │
│  Stores:                                                 │
│  · Theme preference (light/dark)                         │
│  · Device-level settings (font size, reduced motion)     │
│  · Auth token cache (managed by Firebase SDK)            │
│                                                          │
│  Rule: These apply BEFORE JavaScript modules load.       │
│  A <script> in <head> reads and applies them.            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                      VIEW LAYER                          │
│  Pure presentation. Renders state. Emits user events.    │
│  NEVER calls services or APIs directly.                  │
│  NEVER imports controllers or services.                  │
│                                                          │
│  Contains:                                               │
│  · Structural HTML shell (minimal, permanent layout)     │
│  · View modules (listen to events, update DOM)           │
│  · Portable components (create their own DOM + styles)   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ VIEW CACHE (local to View, never in Event Bus)     │  │
│  │                                                    │  │
│  │ Rule: If losing it on page refresh is fine,        │  │
│  │       it's View cache. If it matters, it's         │  │
│  │       application state.                           │  │
│  │                                                    │  │
│  │ Cached locally:              Flows through bus:    │  │
│  │ · Drawer open/closed         · Active record       │  │
│  │ · Scroll position            · Data from server    │  │
│  │ · Textarea mid-typing        · Auth status         │  │
│  │ · Animation states           · User preferences    │  │
│  │ · Last-rendered list cache   · Fresh list data     │  │
│  │                                                    │  │
│  │ View cache enables instant UI (no flicker).        │  │
│  │ Stale data updates silently via event listeners.   │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────┘
                         │ emits events
                         ↓
┌──────────────────────────────────────────────────────────┐
│                      EVENT BUS                           │
│  Central nervous system. All communication flows here.   │
│                                                          │
│  event-bus.js                                            │
│  ├── emit(type, data)       → routes to handlers         │
│  ├── on(type, handler)      → register listeners         │
│  ├── off(type, handler)     → remove listeners           │
│  └── Every emit() writes to Event Log automatically      │
│                                                          │
│  Event Schema:                                           │
│  {                                                       │
│    id:        "evt-<uuid>",                              │
│    type:      "user.action.name",                        │
│    data:      { ... },                                   │
│    timestamp: ISO-8601,                                  │
│    source:    "view" | "controller" | "system"           │
│  }                                                       │
│                                                          │
│  Naming convention:                                      │
│    user.*      → user initiated (view emits)             │
│    system.*    → system initiated (controller/backend)   │
│    state.*     → state changed (state layer emits)       │
└────────────────────────┬─────────────────────────────────┘
                         │ routes events
                         ↓
┌──────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                       │
│  Handles events. Orchestrates services. Never touches     │
│  DOM directly. Emits result events back to bus.          │
│                                                          │
│  Rules:                                                  │
│  · One controller per domain (auth, data, settings...)   │
│  · Max 3 dependencies (event-bus, app-state, 1 service)  │
│  · Never imports a View module                           │
│  · Never touches document or DOM                         │
│  · Emits result events for the View to pick up           │
└────────────────────────┬─────────────────────────────────┘
                         │ calls services
                         ↓
┌──────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                         │
│  Pure data access. No DOM, no events, no state.          │
│  Called by controllers only. Returns data.                │
│                                                          │
│  · api-client.js (authenticatedFetch, headers)           │
│  · Any project-specific data clients                     │
│  · Firebase/Supabase/backend SDK wrappers                │
│                                                          │
│  ── Only these modules talk to the network ──            │
└────────────────────────┬─────────────────────────────────┘
                         │ reads/writes
                         ↓
┌──────────────────────────────────────────────────────────┐
│                      STATE LAYER                         │
│  Single source of truth. Read-only from View.            │
│  Written only by controllers via events.                 │
│                                                          │
│  app-state.js                                            │
│  ├── getState(path)         → read any state             │
│  ├── setState(path, value)  → write (emits state.changed)│
│  └── subscribe(path, fn)    → react to state changes     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                      EVENT LOG                           │
│  Immutable append-only log. Written by event bus.        │
│  Queryable for audit, replay, and debugging.             │
│                                                          │
│  event-log.js                                            │
│  ├── append(event)          → write to log               │
│  ├── query(filters)         → search events              │
│  └── replay(fromId)         → replay events from point   │
│                                                          │
│  Storage: IndexedDB (local) + optional server sync       │
└──────────────────────────────────────────────────────────┘
```

---

## Real-Time: Backend → Frontend Push

Every project that has a backend uses a single SSE connection as a
"whisper line." The backend pushes invalidation signals, not full data.

```
┌──────────────────────────────────────────────────────────┐
│                    SSE WHISPER LINE                       │
│                                                          │
│  One persistent SSE connection per session.               │
│  Backend speaks only when something changes.             │
│  Frontend never polls.                                   │
│                                                          │
│  Backend (Express):                                      │
│  ├── Firestore onSnapshot() watches for changes          │
│  ├── On change: res.write("event: data.stale\n\n")      │
│  └── On disconnect: unsubscribe all listeners            │
│                                                          │
│  Frontend:                                               │
│  ├── EventSource opens on app load                       │
│  ├── Listens for invalidation signals                    │
│  ├── Marks relevant caches as stale                      │
│  └── Auto-reconnects on drop (browser-native)            │
│                                                          │
│  On reconnect:                                           │
│  └── emit("system.reconnected")                          │
│      └── All controllers mark caches stale               │
│      └── Next user action fetches fresh data             │
│                                                          │
│  What flows over the whisper line:                        │
│  · Invalidation pings     (tiny, ~4-30 bytes)            │
│  · NOT full data payloads (fetched on demand)            │
│  · NOT JavaScript code    (already loaded)               │
│                                                          │
│  What uses standard request/response instead:            │
│  · Drawer contents (fetch when opened)                   │
│  · Full records (fetch when accessed)                    │
│  · Form submissions (POST when submitted)               │
└──────────────────────────────────────────────────────────┘
```

---

## HTML: The Thin Shell

The HTML file contains ONLY permanent structural layout.
Everything dynamic is created by JavaScript on demand.

```html
<!-- This is ALL the HTML a project needs -->
<html>
<head>
  <!-- Layer 0: Apply theme before paint -->
  <script>
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  </script>

  <!-- Structural CSS only (layout, not components) -->
  <link rel="stylesheet" href="css/variables.css">
  <link rel="stylesheet" href="css/themes.css">
  <link rel="stylesheet" href="css/layout.css">
  <!-- Project-specific structural CSS -->
  <link rel="stylesheet" href="css/responsive.css">
</head>
<body>

  <!-- Permanent structure — what's ALWAYS visible -->
  <header id="app-header"></header>
  <main id="app-content"></main>
  <footer id="app-footer"></footer>

  <!-- No hidden divs. No invisible modals. No popup shells. -->
  <!-- JavaScript creates all dynamic UI on demand. -->

  <script type="module" src="js/app.bundle.js"></script>
</body>
</html>
```

What lives in HTML:
- Page grid (header, main, footer)
- Permanent containers
- CSS/JS imports

What does NOT live in HTML:
- Drawers (JS creates on first open)
- Modals (JS creates when triggered)
- Popups (JS creates when triggered)
- Toasts (JS creates when shown)
- Context menus (JS creates on right-click/tap)
- Any overlay or temporary UI

---

## CSS: Structural Only

CSS files handle layout and design tokens. Component styles live
inside JS component modules (injected once via `<style>` tag).

### What stays in CSS files

```
css/
├── variables.css       ← All design tokens (colors, spacing, shadows, z-index)
├── themes.css          ← Theme overrides ([data-theme="dark"] swaps tokens)
├── layout.css          ← Page grid, structural containers, safe areas
└── responsive.css      ← Media queries / breakpoints (always last)
```

### What moves into JS components

Everything that belongs to a dynamic UI element:
- Toast styles → inside toast.js
- Modal styles → inside modal.js
- Context menu styles → inside context-menu.js
- Drawer styles → inside drawer.js

### Design Tokens (variables.css)

Every project defines the same token categories:

```css
:root {
  /* ── Palette (raw colors) ── */
  --palette-primary:     #...;
  --palette-accent:      #...;
  --palette-error:       #...;
  --palette-success:     #...;

  /* ── Semantic Colors (what things MEAN) ── */
  --bg-primary:          var(--palette-...);
  --bg-surface:          var(--palette-...);
  --text-primary:        var(--palette-...);
  --text-secondary:      var(--palette-...);
  --border-default:      var(--palette-...);

  /* ── Spacing Scale ── */
  --space-xs:            4px;
  --space-sm:            8px;
  --space-md:            16px;
  --space-lg:            24px;
  --space-xl:            32px;

  /* ── Typography ── */
  --font-base:           16px;
  --font-sm:             14px;
  --font-lg:             18px;

  /* ── Shadows ── */
  --shadow-soft:         0 2px 8px rgba(0,0,0,0.1);
  --shadow-medium:       0 4px 16px rgba(0,0,0,0.15);

  /* ── Z-Index Scale ── */
  --z-drawer:            100;
  --z-modal:             200;
  --z-popup:             300;
  --z-toast:             400;

  /* ── Transitions ── */
  --transition-fast:     150ms ease;
  --transition-normal:   250ms ease;
  --transition-slow:     400ms ease;
}
```

### Rules

- NEVER hardcode colors. Always use var(--token-name).
- NEVER put component styles in CSS files. Components own their styles.
- EVERY color value traces back to variables.css.
- Theme switching only swaps variable values via data attributes.

---

## JavaScript Components: The Portable UI Kit

Dynamic UI elements are self-contained JS modules. They create their
own DOM, inject their own styles (once), and clean up after themselves.

### Component Structure

```
components/
├── toast/
│   ├── index.js            ← Public API: showToast()
│   ├── toast.styles.js     ← CSS string (injected once)
│   └── toast.template.js   ← DOM builder function
│
├── confirmation/
│   ├── index.js            ← Public API: showConfirmation()
│   ├── confirmation.styles.js
│   └── confirmation.template.js
│
├── context-menu/
│   ├── index.js            ← Public API: showContextMenu()
│   ├── context-menu.styles.js
│   └── context-menu.template.js
│
├── drawer/
│   ├── index.js            ← Public API: createDrawer()
│   ├── drawer.styles.js
│   ├── drawer.template.js
│   └── drawer-item.js      ← Sub-template for list items
│
├── modal/
│   ├── index.js            ← Public API: showModal()
│   ├── modal.styles.js
│   └── modal.template.js
│
└── audio-island/
    ├── index.js
    ├── audio-island.styles.js
    └── audio-island.template.js
```

### Component Pattern

Every component follows this exact pattern:

```js
// components/toast/toast.styles.js
export const STYLES = `
  .rv-toast {
    position: fixed;
    bottom: var(--space-md, 16px);
    right: var(--space-md, 16px);
    background: var(--bg-surface, #1a1a1a);
    color: var(--text-primary, #ffffff);
    border: 1px solid var(--border-default, #333);
    border-radius: 8px;
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    box-shadow: var(--shadow-medium, 0 4px 16px rgba(0,0,0,0.15));
    z-index: var(--z-toast, 400);
    transition: opacity var(--transition-normal, 250ms ease);
  }
  .rv-toast.success { border-color: var(--palette-success, #4CAF50); }
  .rv-toast.error   { border-color: var(--palette-error, #f44336); }
`;

// components/toast/toast.template.js
export function toastTemplate({ message, type = "info" }) {
  return `
    <div class="rv-toast ${type}">
      <span class="rv-toast-message">${message}</span>
    </div>
  `;
}

// components/toast/index.js
import { STYLES } from './toast.styles.js';
import { toastTemplate } from './toast.template.js';

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  const tag = document.createElement('style');
  tag.textContent = STYLES;
  document.head.appendChild(tag);
  stylesInjected = true;
}

export function showToast({ message, type = "info", duration = 3000 }) {
  injectStyles();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = toastTemplate({ message, type });
  const el = wrapper.firstElementChild;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; }, duration - 300);
  setTimeout(() => { el.remove(); }, duration);
  return el;
}
```

### Key Rules

```
1. EVERY component uses CSS variables with fallback defaults.
   var(--token, fallback)
   → Project provides tokens? Uses them.
   → No tokens? Falls back to defaults. Still works.

2. EVERY style class is prefixed: .rv-toast, .rv-modal, .rv-drawer
   → No collisions with project-specific CSS.
   → "rv" = Raven UI (or whatever prefix you choose).

3. EVERY component is a pure function.
   → Input: config object
   → Output: DOM element or handle
   → No side effects beyond DOM insertion

4. Styles inject ONCE, on first use.
   → stylesInjected flag prevents duplicate <style> tags.

5. Templates are FUNCTIONS, not HTML files.
   → Composable: sub-templates build up larger templates.
   → Testable: pass data in, get HTML string out.

6. Components NEVER import controllers or services.
   → They emit events via the event bus.
   → Or they accept callback functions.
```

---

## Shared Library: FUTURE (Not Yet Built)

There is NO shared component library yet. Do NOT import from raven-ui
or any shared package. It does not exist.

### What Each Project Does NOW

Each project builds its OWN components following the pattern above.
Same structure, same conventions, but local to the project.

```
Project A (e.g., Raven OS):
  js/components/
  ├── toast/
  ├── confirmation/
  ├── drawer/
  └── modal/

Project B (e.g., other project):
  js/components/
  ├── toast/          ← Its own toast, same pattern
  ├── confirmation/   ← Its own confirmation, same pattern
  ├── drawer/         ← Its own drawer, same pattern
  └── modal/          ← Its own modal, same pattern
```

Both projects follow the SAME component pattern:
  · Same file structure (index.js + styles.js + template.js)
  · Same CSS variable usage with fallbacks
  · Same class prefix convention
  · Same dependency rules

But they are INDEPENDENT implementations. Each project may have
different features, different styling details, different behaviors.

### What Happens LATER (The Merge)

Once both projects have refactored their components:

```
1. Compare components side by side
   → Project A's toast vs Project B's toast
   → Pick the better one, or merge the best of both

2. Extract winners into a shared repo (raven-ui)
   raven-ui/
   ├── components/     ← Best-of from all projects
   ├── core/           ← event-bus, app-state, inject-styles
   ├── tokens/         ← Default design token values
   └── package.json

3. Both projects switch to importing from raven-ui
   import { showToast } from 'raven-ui';

4. Project-specific components stay local
   → Only shared/common UI goes into raven-ui
```

### Why This Order Matters

```
❌ WRONG: Build shared library first, then refactor projects
   → You don't know what the components need yet
   → You'll redesign the library 5 times

✅ RIGHT: Refactor each project independently, then merge
   → Each project discovers its own needs
   → The merge picks the best solutions
   → The shared library is battle-tested from day one
```

---

## Project File Structure

Every project following this spec has this shape:

```
project/
├── index.html              ← Thin shell (see HTML section above)
│
├── css/                    ← Structural CSS only
│   ├── variables.css       ← Design tokens
│   ├── themes.css          ← Theme overrides
│   ├── layout.css          ← Page grid
│   └── responsive.css      ← Breakpoints
│
├── js/
│   ├── core/               ← Shared infrastructure
│   │   ├── event-bus.js
│   │   ├── event-log.js
│   │   └── app-state.js
│   │
│   ├── views/              ← Presentation modules
│   │   ├── [feature]-view.js
│   │   └── ...
│   │
│   ├── controllers/        ← Event handlers, orchestration
│   │   ├── [feature]-controller.js
│   │   └── ...
│   │
│   ├── services/           ← Network/data access
│   │   ├── api-client.js
│   │   └── ...
│   │
│   ├── components/         ← Portable UI (or imported from raven-ui)
│   │   ├── toast/
│   │   ├── confirmation/
│   │   ├── drawer/
│   │   ├── modal/
│   │   └── context-menu/
│   │
│   └── app.js              ← Entry point, wires everything together
│
├── server.js               ← Express backend
├── routes/                 ← API routes
├── services/               ← Backend business logic
└── middleware/              ← Auth, CORS, logging, errors
```

---

## Dependency Rules

These rules prevent spaghetti. They are absolute.

```
VIEW modules may:
  ✅ Import from: event-bus, app-state (read-only), components
  ✅ Emit events
  ✅ Listen to events
  ✅ Read state
  ❌ NEVER import: controllers, services, firebase, api-client
  ❌ NEVER write state directly
  ❌ NEVER make network requests

CONTROLLER modules may:
  ✅ Import from: event-bus, app-state, services
  ✅ Listen to events
  ✅ Emit result events
  ✅ Read and write state
  ❌ NEVER import: view modules, components
  ❌ NEVER touch DOM (document, getElementById, querySelector)

SERVICE modules may:
  ✅ Import from: api-client, firebase-client
  ✅ Make network requests
  ✅ Return data
  ❌ NEVER import: event-bus, app-state, controllers, views
  ❌ NEVER emit events
  ❌ NEVER touch DOM

COMPONENTS may:
  ✅ Create DOM elements
  ✅ Inject their own styles (once)
  ✅ Accept config objects and callbacks
  ✅ Use CSS variables with fallback defaults
  ❌ NEVER import: controllers, services, app-state
  ❌ NEVER make network requests
  ❌ NEVER know what project they're in
```

### Dependency Diagram

```
  ┌───────────────────────────────────────────────────┐
  │                  VIEW LAYER                       │
  │  views + components (portable UI)                 │
  └──────────────┬────────────────────┬───────────────┘
          emits events          listens to events
                 │                    ↑
                 ↓                    │
  ┌──────────────────────────────────────────────────┐
  │              EVENT BUS + EVENT LOG               │
  └──────────────┬────────────────────┬──────────────┘
          routes to              emits results
                 │                    ↑
                 ↓                    │
  ┌──────────────────────────────────────────────────┐
  │              CONTROLLER LAYER                    │
  └──────────────────────┬───────────────────────────┘
                         │ calls
                         ↓
  ┌──────────────────────────────────────────────────┐
  │          SERVICE LAYER + APP STATE               │
  └──────────────────────────────────────────────────┘
```

---

## File Size Guidance

The rule is ONE JOB PER FILE, not a line count. But if a file is
growing, use these as signals to check whether it's doing too much:

```
Under 200 lines:  You're fine. Don't think about it.
200 - 400 lines:  Check: is this still one job? If yes, it's fine.
Over 400 lines:   Almost certainly doing too much. Split it.

Component index.js: ~50-100 lines (delegates to sub-modules)
Template function:  ~20-60 lines (split into sub-templates if larger)
Style string:       ~40-100 lines
Controller:         ~100-250 lines (complex domains may be larger)
Service:            ~50-150 lines
```

A 350-line streaming controller that handles SSE parsing, chunk
buffering, and error recovery is fine — that's one job.

A 250-line file that renders UI AND calls APIs AND manages state
is not fine — that's three jobs in a trench coat.

---

## Naming Conventions

```
Files:
  [feature]-view.js         ← View module
  [feature]-controller.js   ← Controller module
  [feature]-client.js       ← Service/API client
  [feature].styles.js       ← Component styles
  [feature].template.js     ← Component template

Events:
  user.[domain].[action]    ← user.thread.created
  system.[domain].[action]  ← system.stream.completed
  state.changed             ← state.changed { path, old, new }

CSS Variables:
  --palette-[name]          ← Raw color: --palette-sunset
  --bg-[name]               ← Background: --bg-primary
  --text-[name]             ← Text color: --text-secondary
  --space-[size]            ← Spacing: --space-md
  --z-[layer]               ← Z-index: --z-modal
  --shadow-[weight]         ← Shadow: --shadow-soft
  --transition-[speed]      ← Timing: --transition-fast

Component CSS Classes:
  .rv-[component]           ← .rv-toast, .rv-modal, .rv-drawer
  .rv-[component]-[part]    ← .rv-toast-message, .rv-drawer-header
```

---

## User Customization via CSS Variables

Users can override specific design tokens at runtime. No new CSS
files, no custom stylesheets — just variable overrides.

```
Stored in database:
  users/{uid}/preferences: {
    customTokens: {
      "--palette-accent": "#FF6B35",
      "--font-base": "18px"
    }
  }

Applied on load:
  Object.entries(customTokens).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

Saved on change:
  emit("user.settings.changed", { key, value })
  → settings-controller persists to server
  → localStorage caches for instant next load
```

---

## Refactoring Checklist: Bringing a Project Into Alignment

When refactoring an existing project to match this spec:

```
PHASE 1: Establish Foundation
  □ Create variables.css with all design tokens
  □ Create themes.css with only theme overrides
  □ Create event-bus.js (~50 lines)
  □ Create app-state.js with get/set/subscribe
  □ No behavior changes — just add infrastructure

PHASE 2: Split Large Files
  □ Identify files > 300 lines
  □ Split by concern (one file = one job)
  □ No behavior changes — just reorganizing

PHASE 3: Separate View from Logic
  □ For each file, ask: "Does this touch DOM AND call APIs?"
  □ If yes: split into view (DOM) + controller (logic)
  □ Views emit events instead of calling functions directly
  □ Controllers listen to events instead of being called

PHASE 4: Extract Components
  □ Identify all dynamic UI (modals, popups, toasts, drawers)
  □ Move each into a component module (template + styles + behavior)
  □ Remove corresponding HTML from the shell
  □ Remove corresponding CSS from stylesheet files

PHASE 5: Enforce Dependency Rules
  □ Views don't import services or controllers
  □ Controllers don't touch DOM
  □ Services don't know about events or state
  □ Components don't know what project they're in

PHASE 6: Replace Hardcoded Values
  □ All colors → var(--token)
  □ All spacing → var(--space-*)
  □ All z-index → var(--z-*)
  □ Single source of truth for every value

PHASE 7: Bundle for Production
  □ Bundle JS into single minified file
  □ Bundle CSS into single minified file
  □ Source maps OFF in production
  □ Users see thin HTML + two opaque bundles
```

---

## Anti-Patterns (Don't Do This)

```
❌ Hidden div in HTML that JS toggles visible
   → JS creates the element when needed

❌ CSS file with 1,000+ lines
   → Split by component, or move styles into JS component

❌ View module that calls authenticatedFetch()
   → View emits event, controller calls the service

❌ Controller that does document.getElementById()
   → Controller emits event, view updates DOM

❌ Hardcoded color: background: #FF6B35
   → background: var(--palette-accent, #FF6B35)

❌ Component that imports app-state or api-client
   → Component accepts config, project wires it up

❌ One giant app.js that does everything
   → Split into view + controller + service

❌ Frontend polling backend every N seconds
   → SSE whisper line, backend pushes when needed

❌ Sending full data over SSE stream
   → Send invalidation pings, fetch data on demand

❌ Inline styles on individual elements
   → Component injects scoped <style> tag once
```

---

## Summary

```
The project is a thin HTML shell.
JavaScript creates all dynamic UI.
CSS defines tokens and layout.
Components are portable — they work anywhere.
Events are the nervous system — nothing calls directly.
Backend whispers — frontend listens.
State flows down — events flow up.
One file, one job.
No spaghetti.
```
