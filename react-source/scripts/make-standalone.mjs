import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const jsPath = html.match(/<script[^>]+src="([^"]+)"/)[1];
const cssPath = html.match(/<link[^>]+href="([^"]+\.css)"/)[1];
let js = await readFile(resolve(root, 'dist', '.' + jsPath), 'utf8');
const css = await readFile(resolve(root, 'dist', '.' + cssPath), 'utf8');
const workerGuard = 'if(!("serviceWorker"in navigator))';
const feedGuard = '?null:new EventSource(';
if (!js.includes(workerGuard) || !js.includes(feedGuard)) throw new Error('Bundle changed. Check standalone guards before packaging.');
js = js.replace(workerGuard, 'if(location.protocol==="file:"||!("serviceWorker"in navigator))')
  .replace(feedGuard, '||location.protocol==="file:"?null:new EventSource(')
  .replaceAll('Server is not available. Retrying in the background.', 'Standalone demo: tracks run in this browser.')
  .replaceAll('No server packet received yet.', 'No server is needed for this file.')
  .replaceAll('Offline reload is not supported here', 'Standalone file: works offline')
  .replaceAll('Offline cache unavailable', 'Standalone file: works offline');
if (/\bimport\.meta\b/.test(js)) throw new Error('Bundle still needs module-only features.');
// Escape HTML-sensitive sequences inside the embedded JavaScript.
js = js.replace(/<(\/?script|!--)/gi, match => '\\x3c' + match.slice(1));
const output = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SKY SHIELD</title>
  <style>
${css}
  </style>
</head>
<body>
  <div id="root"><div style="padding:32px;font:16px Arial;color:#26351e"><h1>SKY SHIELD</h1><p>Starting the local demo…</p><p>If this message stays here, open this file in Microsoft Edge or Chrome.</p></div></div>
  <noscript>JavaScript is disabled. Enable JavaScript to run this demo.</noscript>
  <div id="startup-error" hidden style="padding:24px;border:2px solid #a53c25;background:#fff3e6;font:14px Arial;white-space:pre-wrap"></div>
  <script>
  (function () {
    'use strict';
    function showStartupError(error) {
      var box = document.getElementById('startup-error');
      box.hidden = false;
      box.textContent = 'SKY SHIELD could not start. Please share this error: ' + (error && error.message ? error.message : String(error));
    }
    window.addEventListener('error', function (event) { showStartupError(event.error || event.message); });
    window.addEventListener('unhandledrejection', function (event) { showStartupError(event.reason); });
    try {
${js}
    } catch (error) { showStartupError(error); }
  })();
  </script>
</body>
</html>
`;
await writeFile(resolve(root, 'OPEN-SKY-SHIELD.html'), output);
console.log('Built standalone classic-script HTML with file-origin guards.');
