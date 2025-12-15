# tik-tak-toe
learning project

This is a minimal React-based Tic-Tac-Toe demo.

How to run
-----------

- Option 1 — Open locally (no build tools required):

	1. Open `index.html` in your browser (double-click the file or use "Open File" in the browser).

- Option 2 — Serve with a simple static server (recommended for best behavior):

	```bash
	# from the project folder
	npx serve .
	# or with http-server
	npx http-server .
	```

	Then open http://localhost:3000 (or the URL printed by the tool).

Notes
-----

- The app uses React via CDN and Babel in-browser for JSX, so it's intended for development/demos.
- No backend is required. If you want an npm-based build (Vite/CRA), I can scaffold that next.
 
Now there's a proper Vite + React scaffold in this folder.

How to run (Vite)
------------------

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the printed `http://localhost:5173` (or the URL Vite shows).

Build/preview:

```bash
npm run build
npm run preview
```

AI Opponent
-----------

The Vite app includes a simple AI opponent (minimax) you can enable from the UI.

- Open the app (`npm run dev`).
- Select `Human vs AI` in the mode controls and choose whether the AI plays `X` or `O`.
- Use the Reset buttons to start with `X` or `O`.

The AI is an unbeatable minimax implementation for the 3x3 Tic-Tac-Toe board.
