# Finopoly interface

Finopoly is a classroom investing game. Readability and a clear next action take priority over decorative effects. The live application is in `market-masters/`, using React, CSS, and Lucide icons. The UI/UX Pro Max and Taste skills informed this pass. The separate implementation under `apps/` is retained as a reference, not the deployed game's entry point.

- IBM Plex Sans is served locally in four weights. IBM Plex Mono is reserved for codes and compact technical values; financial figures use tabular numerals.
- Light mode uses cool neutral surfaces and deep cranberry actions. Dark mode uses navy surfaces and brighter cranberry actions. Each mode defines its own text, border, status, and sector colors in `market-masters/client/src/index.css`.
- Normal text has at least 4.5:1 contrast across the shared surfaces; form borders and focus rings have at least 3:1. Decorative dividers use a quieter border. Disabled controls retain readable text.
- The theme initially follows the device. The accessible header switch stores an explicit choice locally, preserves it across routes and reloads, and synchronizes other tabs. A small bootstrap applies it before the first paint.
- Team symbols remain stable in both themes. Color supports their identities; icons and labels identify them without relying on color alone.
- Host guidance explains the next step. Investment choices remain below the board at every size, with readable descriptions, native buttons, and an explicit selected state. Small phone screens stack these choices.
- Routes, primary navigation labels, field order, and game rules are preserved. Motion remains subtle and respects reduced-motion preferences.

Real SQLite and Socket.IO tests cover saved turns, stale submissions, and restarting the server. Browser checks cover navigation/reload recovery, saved investment drafts, eight unique symbols, theme switching, rendered text contrast, and page overflow at phone, tablet, and desktop sizes. The legacy rewrite's `theme.test.js` remains scoped to that implementation.
