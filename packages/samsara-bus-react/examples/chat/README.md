# Chat Example (samsara-bus-react)

This example shows a minimal chat application powered by `samsara-bus-ts` and the React hooks in `samsara-bus-react`.

## What it demonstrates
- Using `SamsaraBusProvider` to provide a bus instance
- `useSamsaraTopic` for reading/emitting topic values (user status, chat rooms, messages)
- `useSamsaraTopology` to build a small processing pipeline that filters room messages and enriches them with room/user data

## Files
- `App.tsx` – main UI and logic using the hooks
- `index.html`, `src/main.tsx` – Vite bootstrap files
- `vite.config.ts` – aliases the local packages for instant dev

## Run locally
- From the repo root:
  ```bash
  npm install
  ```
- Start the dev server:
  ```bash
  cd packages/samsara-bus-react/examples/chat
  npm run dev
  ```
- Open http://localhost:5173

## How it works (short)
- Topics registered: `chat-messages` (ReplaySubject), `user-status` (BehaviorSubject), `chat-rooms` (BehaviorSubject)
- `useSamsaraTopology` builds nodes:
  - `roomMessages`: filter messages for `roomId`
  - `currentRoom`: pick the active room object
  - `enricher`: combine latest of the above with `user-status` to annotate messages with `isUserOnline` and `userCount`
- `MessageComposer` emits new messages into `chat-messages`
