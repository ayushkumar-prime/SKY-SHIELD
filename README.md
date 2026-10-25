# SKY SHIELD

A drone watch demo for a hackathon. All data is fake.

## Start

Use Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open the local link shown by Vite.

## Build and run

```sh
npm run build
npm start
```

Open http://127.0.0.1:3001.

## Main points

- React, TypeScript, Tailwind CSS, and Node.js.
- Watch 20 fake tracks. New data arrives every 250 ms.
- Select a track to see its speed, height, and score.
- Dashed lines show where it may be in 30 seconds.
- Math: next position = position + speed in each direction × time.
- High: score 65 or more. Watch: 40 or more. Low: under 40.
- Score uses distance, unknown ID, approach, and zone entry.
- Low bandwidth sends data every 2 seconds.
- If the server stops, the local demo keeps moving.
- For offline reload, open the built app once. Wait for “Offline app ready”.
- Works on phones. No map downloads, fonts, or CDN needed.
- Zoom in, follow a track, or select the top threat.
- Move the prediction slider from 10 to 60 seconds.
- Watch the radar sweep and moving markers. Pause also stops radar animation.
- Reduced motion settings turn off animation.
- Review tracks and export fake data as JSON.
- No real sensors, military data, or drone control.

## Checks

```sh
npm test
npm run build
```

## Server

- GET /api/health: server status.
- GET /api/snapshot: current fake data.
- GET /api/stream: live event feed.
- GET /api/stream?low=1: slow feed.

The server runs on this computer only. PORT can change the port.
The prediction keeps the same speed and direction. Turns can change it.
The score is demo logic. It does not show real intent.

