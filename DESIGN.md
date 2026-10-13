# Finopoly interface

Finopoly is a classroom investing game. Readability and a clear next action take priority over decorative effects. The UI/UX Pro Max and Taste skills informed this pass; the existing React, CSS Modules, and Phosphor icon system remain the foundation.

- IBM Plex Sans is served locally in four weights. IBM Plex Mono is reserved for codes and compact technical values; financial figures use tabular numerals.
- Light mode uses cool neutral surfaces and deep cranberry actions. Dark mode uses navy surfaces and brighter cranberry actions. Each mode defines its own text, border, status, and sector colors in `apps/web/src/tokens.css`.
- Normal text has at least 4.5:1 contrast across the shared surfaces; form borders and focus rings have at least 3:1. Decorative dividers use a quieter border. Disabled controls retain readable text.
- The theme initially follows the device. The accessible header switch stores an explicit choice locally, preserves it across routes and reloads, and synchronizes other tabs. A small bootstrap applies it before the first paint.
- Team symbols remain stable in both themes. Color supports their identities; icons and labels identify them without relying on color alone.
- Phase descriptions explain the host’s next step. Small phone screens show full investment option details below the board instead of shrinking those cards.
- Routes, primary navigation labels, field order, and game rules are preserved. Motion remains subtle and respects reduced-motion preferences.

Theme preference, first-paint behavior, and palette contrast are covered by `theme.test.js`. Desktop and mobile browser checks cover the actual screens and theme switch.
