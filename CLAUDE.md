# Studio (fork of GDevelop)

This repo is a fork of GDevelop (MIT). It is our creators' editor.
Full spec: ../docs/SPEC.md (the canonical copy lives in the young-creators repo).

## Rules for changing the fork
- Keep upstream code untouched where possible. Put our features in
  newIDE/app/src/YoungCreators/ and wire them in with small, commented
  hooks marked // YC-HOOK so upstream merges stay easy.
- Never use the GDevelop name or logo in anything a user sees.
- Remove or disable calls to GDevelop's online services (accounts, cloud
  projects, AI, asset store, build service, game hosting). All network
  calls go through YoungCreators/bridge (see Bridge API in the spec).
- Age modes are a feature-flag layer: hide or simplify panels, never fork
  whole components.
- Extensions: only the approved list in YoungCreators/extensions.json.
- JavaScript events are disabled in Little, Junior and Creator modes.
- Little mode replaces the editor with the game-box screen; the full
  editor is never shown to a Little creator.
- All new UI strings in Arabic and English; check right-to-left layout.

## Commands
Follow newIDE/README.md for setup and tests. Run from newIDE/app:
npm run build && node scripts/copy-GDJS-Runtime-to-build.js
npx react-app-rewired test --env=jsdom --watchAll=false src/YoungCreators
npx flow check | npx eslint --max-warnings=0 <changed files> | npx prettier --list-different <changed files>
Never commit with --no-verify.

## Network and export rules
- The editor talks only to its own origin (YoungCreators/networkGuard plus the
  host's CSP). Prove it with the egress recorder, not only page-level request logs.
- Exported games carry no GDevelop project UUID (it enables GDevelop analytics),
  no GDevelop watermark and no GDevelop loading logo.
- The age mode comes only from the bridge session in production; yc_ URL
  parameters are accepted in development builds only.

## Upstream
Merge GDevelop releases on the schedule in docs/SPEC.md; run the full
test suite and the YC e2e suite before merging.
