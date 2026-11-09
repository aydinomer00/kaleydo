#!/usr/bin/env node
// Kaleydo renderer: serves the repo locally, opens styles/preview.html?s=<slug> in headless Chromium,
// calls window.seek(t) for every frame and streams the frames straight into ffmpeg.
//
//   node tools/render.cjs <slug|all> [--workers=4]          → previews/<slug>.mp4 (540×960) + previews/<slug>.jpg
//   node tools/render.cjs <slug> --stills=0.5,3,6.2          → out/stills/<slug>/<t>.png (full resolution)
//   node tools/render.cjs <slug> --full                      → out/<slug>-1080.mp4 (full resolution master)
//   node tools/render.cjs videos/ari/index.html [--audio=videos/ari/ses.wav] [--out=videos/ari/final.mp4]
//                                                            → any page that uses the SH harness, full resolution, optional audio
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const isPage = s => s.endsWith('.html');
const label = s => (isPage(s) ? path.basename(path.dirname(path.resolve(ROOT, s))) : s);
const args = Object.fromEntries(process.argv.slice(3).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(ROOT, p === '/' ? '/index.html' : p);
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
async function openPage(browser, port, slug) {
  const context = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  let failed = null;
  page.on('pageerror', e => { failed = failed || e; console.error(`[${label(slug)}] pageerror:`, e.message); });
  page.on('console', m => { if (m.type() === 'error') console.error(`[${label(slug)}]`, m.text()); });
  const url = isPage(slug) ? `/${path.relative(ROOT, path.resolve(ROOT, slug)).split(path.sep).join('/')}?render` : `/styles/preview.html?s=${slug}&render`;
  await page.goto(`http://127.0.0.1:${port}${url}`);
  for (let i = 0; i < 1800; i++) {                       // fail fast instead of waiting for a timeout
    if (failed) throw new Error(`${slug}: ${failed.message}`);
    if (await page.evaluate(() => window.__ready === true)) break;
    await new Promise(r => setTimeout(r, 100));
  }
  return page;
}
async function grab(page, t) {
  const b64 = await page.evaluate(tt => { window.seek(tt); return document.getElementById('c').toDataURL('image/png').slice(22); }, t);
  return Buffer.from(b64, 'base64');
}
function ffmpeg(argv) {
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', ...argv], { stdio: ['pipe', 'inherit', 'inherit'] });
  return { ff, done: new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`))))) };
}
async function renderVideo(browser, port, slug, workers, full) {
  if (isPage(slug)) full = true;                          // custom video pages always render at full size
  const pages = [];
  for (let i = 0; i < workers; i++) pages.push(await openPage(browser, port, slug));
  const { dur, fps, poster } = await pages[0].evaluate(() => ({ dur: window.DURATION, fps: window.FPS, poster: window.POSTER }));
  const N = Math.round(dur * fps);
  fs.mkdirSync(path.join(ROOT, full ? 'out' : 'previews'), { recursive: true });
  const out = args.out ? path.resolve(ROOT, String(args.out)) : full ? path.join(ROOT, 'out', `${label(slug)}-1080.mp4`) : path.join(ROOT, 'previews', `${slug}.mp4`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const vf = full ? 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p' : 'scale=540:960:flags=lanczos,format=yuv420p';
  const audio = args.audio ? ['-i', path.resolve(ROOT, String(args.audio))] : [];
  const aout = args.audio ? ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest'] : ['-an'];
  const tags = full ? ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'] : [];
  const { ff, done } = ffmpeg(['-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', ...audio, '-vf', vf, ...tags,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', full ? '17' : '22', '-profile:v', 'high', ...aout, '-movflags', '+faststart', out]);
  const ready = new Map();
  let next = 0, write = 0;
  const t0 = Date.now();
  const flush = async () => {
    while (ready.has(write)) {
      const buf = ready.get(write);
      ready.delete(write); write++;
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
  };
  await Promise.all(pages.map(async pg => {
    for (;;) {
      const i = next++;
      if (i >= N) break;
      ready.set(i, await grab(pg, i / fps));
      await flush();
    }
  }));
  ff.stdin.end();
  await done;
  if (!full) {
    const png = await grab(pages[0], poster ?? dur * 0.6);
    const { ff: f2, done: d2 } = ffmpeg(['-f', 'image2pipe', '-c:v', 'png', '-i', '-', '-vf', 'scale=540:960:flags=lanczos', '-q:v', '3', path.join(ROOT, 'previews', `${slug}.jpg`)]);
    f2.stdin.end(png);
    await d2;
  }
  for (const p of pages) await p.context().close();
  console.log(`${label(slug)}: ${N} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s → ${path.relative(ROOT, out)}`);
}
async function renderStills(browser, port, slug, times) {
  const page = await openPage(browser, port, slug), dir = path.join(ROOT, 'out', 'stills', label(slug));
  fs.mkdirSync(dir, { recursive: true });
  for (const t of times) {
    const s0 = Date.now(), buf = await grab(page, t);
    fs.writeFileSync(path.join(dir, `${t.toFixed(2).padStart(5, '0')}.png`), buf);
    console.log(`${label(slug)} @${t.toFixed(2)}s ${Date.now() - s0} ms`);
  }
  await page.context().close();
}

(async () => {
  const target = process.argv[2];
  if (!target) { console.log('usage: node tools/render.cjs <slug|all|path/to/page.html> [--workers=4] [--stills=t1,t2] [--full] [--out=file.mp4] [--audio=file.wav]'); process.exit(1); }
  const slugs = target === 'all'
    ? fs.readdirSync(path.join(ROOT, 'styles')).filter(d => fs.existsSync(path.join(ROOT, 'styles', d, 'preview.js'))).sort()
    : target.split(',');
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--disable-accelerated-2d-canvas', '--disable-gpu'] });
  try {
    for (const slug of slugs) {
      if (args.stills) await renderStills(browser, port, slug, String(args.stills).split(',').map(Number));
      else await renderVideo(browser, port, slug, parseInt(args.workers || '4', 10), !!args.full);
    }
  } finally {
    await browser.close();
    srv.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
