// Frame renderer: serves the project locally, drives headless Chromium and calls window.seek(t).
//   node tools/render.cjs stills 0.5 2 4.2 ...     → out/stills/s_XX.XX.png
//   node tools/render.cjs frames [workers]          → out/frames/f_0000.png … (every frame at FPS)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.woff2': 'font/woff2', '.css': 'text/css', '.png': 'image/png' };

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(f, (e, d) => {
        if (e) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
        res.end(d);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
async function openPage(browser, port) {
  const context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html?render`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  return page;
}
async function grab(page, t) {
  const b64 = await page.evaluate(tt => { window.seek(tt); return document.getElementById('c').toDataURL('image/png').slice(22); }, t);
  return Buffer.from(b64, 'base64');
}

(async () => {
  const mode = process.argv[2];
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--disable-accelerated-2d-canvas', '--disable-gpu'] });
  try {
    if (mode === 'stills') {
      const dir = path.join(ROOT, 'out', 'stills');
      fs.mkdirSync(dir, { recursive: true });
      const page = await openPage(browser, port);
      for (const a of process.argv.slice(3)) {
        const t = parseFloat(a), t0 = Date.now();
        const buf = await grab(page, t);
        fs.writeFileSync(path.join(dir, `s_${t.toFixed(2).padStart(5, '0')}.png`), buf);
        console.log('still', t.toFixed(2), `${Date.now() - t0} ms`);
      }
    } else if (mode === 'frames') {
      const workers = parseInt(process.argv[3] || '3', 10);
      const dir = path.join(ROOT, 'out', 'frames');
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const first = await openPage(browser, port);
      const { dur, fps } = await first.evaluate(() => ({ dur: window.DURATION, fps: window.FPS }));
      const N = Math.round(dur * fps), pages = [first];
      for (let i = 1; i < workers; i++) pages.push(await openPage(browser, port));
      let next = 0, done = 0;
      const t0 = Date.now();
      await Promise.all(pages.map(async pg => {
        for (;;) {
          const i = next++;
          if (i >= N) break;
          const buf = await grab(pg, i / fps);
          fs.writeFileSync(path.join(dir, `f_${String(i).padStart(4, '0')}.png`), buf);
          if (++done % 60 === 0) console.log(`${done}/${N} frames · ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
        }
      }));
      console.log(`frames done: ${N} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    } else {
      console.log('usage: node tools/render.cjs stills <t...> | frames [workers]');
    }
  } finally {
    await browser.close();
    srv.close();
  }
})();
