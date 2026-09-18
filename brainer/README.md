# Brainer

A calm practice app for adaptive arithmetic, evidence-based case decisions, and interview explanations.

**Private app:** https://brainer-progress.gopikagopan2093.chatgpt.site

**GitHub/device-only copy:** https://gopika2093.github.io/gopikaportfolio/brainer/

Use the private app for everyday practice: the interface and backend now share one address, so saving needs no connection popup. Sign in with the owning ChatGPT account. Device-only data remains unavailable to weekly ChatGPT reports.

If you already practised on GitHub, connect that copy once to sync it, or export a full backup and import it through Settings in the private app. Review the copies before choosing which checkpoint to keep. Browser-only work does not move between sites automatically.

## What is included

- Separate addition/subtraction placement and five levels, with passive active-time measurement, pauses, hints and interruption exclusion.
- Two NASA-sourced cases: Hubble optics and the Apollo 13 carbon-dioxide cartridge adaptation.
- Interview generation before examples, an outline completeness check, and optional self-review.
- Named dated sessions, private cloud checkpoints, offline buffering, exports, weekly comparison and 26-week history.
- Transparent next-session suggestions based on actual comparable evidence.

This is a first release with a small activity bank, not a complete six-month curriculum. Task results are not an IQ score, clinical assessment or validated measure of general cognitive development. No paid AI API is used.

## Hosting and privacy

GitHub Pages retains the static app code and device-only entry. The owner-private Sites/D1 service now serves both the main interface and its authenticated backend; backend source stays private. Personal answers and history are stored in that private service, never in this repository. The exact same descriptive analysis code is used in the browser and backend. Browser analysis is provisional while the connection is offline.

The main app uses authenticated same-origin backend requests. The legacy GitHub transfer bridge uses exact-origin, paired-window postMessage. The trust boundary includes all pages on this owner's GitHub Pages origin. Concurrent edits are protected by server revisions; finished cloud sessions are immutable. Closing the connection window buffers changes on the device. Export before clearing browser data.

Weekly ChatGPT updates use the private service's compact report rows, with their actual date window and sample sizes. They cannot include device-only or unsynced work.

## Local use

Serve this directory through a local static HTTP server to inspect the UI. The private bridge accepts only the deployed GitHub origin. Backend source and service tests are retained with the private service project.
