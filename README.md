# Thunderstep Soundboard

> A browser-based soundboard application built with Next.js and React. Vibe-coded with [Codex](https://github.com/openai/codex).

## Overview

A browser-based soundboard application built with Next.js and React. Organize audio clips into banks, assign hotkeys, control playback volume and looping, and back up or restore your entire configuration.

## Features

- Multiple Sound Banks: group related sounds into named banks
- Hotkey Assignment: bind a single key to each sound (scoped per bank)
- Categories: "sound" and "music" types interrupt same-category playback
- Volume Control: global and per-sound volume sliders
- Loop Toggle: inline loop on/off for each sound
- Keyboard Controls: play sounds or stop all via the Escape key
- Accessible UI: ARIA labels and roles for screen readers
- Persistence: metadata in localStorage; audio files stored in IndexedDB
- Backup & Restore: export/import all banks and audio data as a JSON file

## Tech Stack

- Next.js 15 (App Router)
- React 19 with Client Components
- TypeScript
- IndexedDB for binary file storage
- ESLint & Prettier with husky + lint-staged pre-commit hooks

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/lordluceus/thunderstep-soundboard.git
   cd thunderstep-soundboard
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Initialize Husky hooks (runs automatically on install):

   ```bash
   npm run prepare
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` – start Next.js in development mode
- `npm run build` – build for production
- `npm start` – run the production build
- `npm run lint` – run ESLint
- `npm run prepare` – install Git hooks via Husky

## Backup & Restore

- **Backup**: Click the **Backup** button to download `soundboard-backup.json`, containing all banks and audio data.
- **Restore**: Click **Restore** and select a valid backup JSON to repopulate your soundboard.

## Contributing

1. Fork the repository and create your feature branch.
2. Ensure code is formatted via Prettier and passes ESLint.
3. Commit your changes; the pre-commit hook will auto-run lint-staged.
4. Open a Pull Request.

---

Enjoy building your personalized soundboard! Feel free to open issues or pull requests for improvements. 🚀
