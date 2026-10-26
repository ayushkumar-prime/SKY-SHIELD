# SKY SHIELD - Start here

## Open the website now

Double-click OPEN-SKY-SHIELD.html.
No npm, Node.js, server, or internet is needed for this local demo.
All fake tracks run in your browser. The menu, team page, and contact draft work too.
Posting a contact draft on GitHub needs internet.

You can also double-click OPEN-WEBSITE.cmd.

## Why is index.html small?

This is a React project. index.html is the entry file, not the whole website.
The real page code is here:

- src/main.tsx: dashboard and track details.
- src/Pages.tsx: navigation, About / Team, and Contact Us.
- src/Radar.tsx: radar, zoom, and animations.
- src/styles.css: website design and mobile layout.
- shared/simulation.ts: fake movement, prediction, and threat scores.
- server/index.ts: Node.js server and live feed.

## Edit in VS Code

For full React development, install Node.js 22 or newer with npm.
Restart VS Code after installing it. Open this folder, then run:

```sh
npm install
npm run dev
```

Open the local link shown by Vite. Do not use Live Server on the React index.html.

## Production build

```sh
npm run build
npm start
```

Open http://127.0.0.1:3001.
To make a new standalone HTML after a build:

```sh
node scripts/make-standalone.mjs
```

## Team

- Namit: team leader, website designer, and UI maker.
- Ayush: frontend developer.
- Lucky and Aniket: backend developers.

Only fake data. No real sensors, military data, or drone control.
