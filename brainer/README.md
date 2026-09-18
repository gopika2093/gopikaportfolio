# Brainer

A calm practice app for adaptive arithmetic, evidence-based case decisions, and interview explanations.

**App:** https://gopika2093.github.io/gopikaportfolio/brainer/

Choose **Connect private saving**, sign in with the owning ChatGPT account, and keep the small connection window open while practising. A device-only option works without cloud saving; device-only data is not available to weekly ChatGPT reports.

## What is included

- Separate addition/subtraction placement and five levels, with passive active-time measurement, pauses, hints and interruption exclusion.
- Two NASA-sourced cases: Hubble optics and the Apollo 13 carbon-dioxide cartridge adaptation.
- Interview generation before examples, an outline completeness check, and optional self-review.
- Named dated sessions, private cloud checkpoints, offline buffering, exports, weekly comparison and 26-week history.
- Transparent next-session suggestions based on actual comparable evidence.

This is a first release with a small activity bank, not a complete six-month curriculum. Task results are not an IQ score, clinical assessment or validated measure of general cognitive development. No paid AI API is used.

## Hosting and privacy

GitHub Pages serves the static app. The separately deployed, owner-private Sites/D1 service retains its backend source privately. Personal answers and history are stored in that private service, never in this repository. The exact same descriptive analysis code is used in the browser and backend. Browser analysis is provisional while the connection is offline.

The connection uses exact-origin, paired-window postMessage and authenticated same-origin backend requests. The trust boundary includes all pages on this owner's GitHub Pages origin. Concurrent edits are protected by server revisions; finished cloud sessions are immutable. Closing the connection window buffers changes on the device. Export before clearing browser data.

Weekly ChatGPT updates use the private service's compact report rows, with their actual date window and sample sizes. They cannot include device-only or unsynced work.

## Local use

Serve this directory through a local static HTTP server to inspect the UI. The private bridge accepts only the deployed GitHub origin. Backend source and service tests are retained with the private service project.
