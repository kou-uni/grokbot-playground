# Arena spectator UI

The frontend remains a static web app on Vercel. `api/feed.js` and `api/go.js` retain the existing relay and start-signal contracts. There are no runtime npm dependencies or build step. `arena.css` and `arena.js` extend the original renderer; the original logs, score parsing, and Go workflow remain available.

## Watch

- `/`: real live relay; an empty lobby waits for actual events.
- `/?demo=1`: explicitly labeled, synthetic 25-event animation demo. Never publishes events or starts bots.
- `/?log=logs/run1-from-relay.jsonl&replay=1`: real first-run evidence, including the 10–11 result.
- Replay: pause, resume, restart, scrub, and 1×/2×/4× speed. Seeking rebuilds state from the visible prefix; future votes and the winner stay hidden.
- Click characters to read their canonical personality, skill, and catchphrase. Voice is opt-in browser speech synthesis in Japanese; voice availability depends on the device. It is not a cloned voice.
- Ideas/revisions light up a bulb, research shows a magnifier, speaking characters bounce, chapter transitions appear as banners, judges reveal individual votes, and the winner receives a gold highlight. Reduced-motion preferences suppress animation.

## Publishing bot-built projects

The cloud computer's `127.0.0.1` URLs cannot be opened by spectators. The UI does not pretend those apps are deployed. The first run has real screenshots in `docs/submission-draft-img/`, shown via `artifacts.json` and expandable in a dialog.

When the real HTML is delivered, place it under `projects/<team>/index.html`, then add an entry to `artifacts.json`:

```json
{
  "log": "logs/run2.jsonl",
  "team": "ULTRAVIOLET",
  "title": "Actual project name",
  "description": "What the actual project does",
  "image": "projects/ultraviolet/screenshot.png",
  "url": "/projects/ultraviolet/index.html"
}
```

The `log` field scopes the artifact to a recorded run. For the current live run use an empty string. Manifest entries become visible at the building round, never before it during a replay. A final-round bot message may also supply an explicit `成果物: https://...`, `公開URL: https://...`, `作品URL: https://...`, or `デモURL: https://...` line. Research links are not automatically treated as artifacts. Local cloud filesystem paths stay unlinked.

Opening a playable artifact is user-initiated. It appears in a sandboxed iframe (`allow-scripts`, without same-origin privileges) with an external link if embedding is blocked. HTTP, localhost, numeric IPs, credential-bearing URLs, and executable URL schemes are rejected. Screenshot images and character assets remain the supplied designs.

## Verification

`npm ci && npm test` runs DOM integration tests for the 4-team demo, replay spoiler prevention, proposal effects, qualifying/final ballot separation, winner display, backward seeking and resume, unsafe artifact URLs, event-body HTML injection, character dialog, real 43-event replay, 10–11 scores, and project screenshots. npm dependencies are development-only; Vercel can continue serving the repository directly.

Browser checks: desktop (1440px), mobile (390px), character modal, proposal bulb, finale, and screenshot showcase. New backend bot runs and the Go signal are not triggered by the UI tests.
