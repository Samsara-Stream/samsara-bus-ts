# Dashboard Example (samsara-bus-react)

This example shows a small analytics dashboard powered by `samsara-bus-ts` and the React hooks in `samsara-bus-react`.

## What it demonstrates
- Providing the bus via `SamsaraBusProvider`
- Publishing metric and alert events with `useSamsaraTopic`
- Aggregating and combining multiple streams with `useSamsaraTopology`

## Files
- `App.tsx` – UI for sending metrics/alerts and viewing analytics
- `index.html`, `src/main.tsx` – Vite bootstrap files
- `vite.config.ts` – aliases the local packages for instant dev

## Run locally
- From the repo root:
  ```bash
  npm install
  ```
- Start the dev server:
  ```bash
  cd packages/samsara-bus-react/examples/dashboard
  npm run dev
  ```
- Open http://localhost:5173

## How it works (short)
- Topics registered: `metrics` (PublishSubject), `alerts` (ReplaySubject)
- `useSamsaraTopology` builds nodes:
  - `stats`: running count/sum/peak for metrics
  - `alertStats`: running alert count
  - `combiner`: uses `zip` as a custom combiner to pair stats and alertCount by index
