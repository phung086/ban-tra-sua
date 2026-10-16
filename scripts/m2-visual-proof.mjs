// Reproducible production-only M2 screenshots and software-WebGL measurements.
// Run after building/serving baseline and candidate at 5189/5190.
// Requires a temporary Playwright install in CI; no game runtime dependency.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const out = process.env.M2_OUTPUT ?? 'm2-visual-artifacts';
const versions = [
  { name: 'main', url: process.env.M2_BEFORE_URL ?? 'http://127.0.0.1:5189' },
  { name: 'candidate', url: process.env.M2_AFTER_URL ?? 'http://127.0.0.1:5190' }
];
const viewports = [
  { width: 360, height: 800 }, { width: 390, height: 844 },
  { width: 844, height: 390 }, { width: 1280, height: 800 }
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const p95 = values => {
  const sorted = [...values].sort((a,b) => a-b);
  return sorted.length ? sorted[Math.ceil(sorted.length * 0.95)-1] : null;
};
const mean = values => values.length ? values.reduce((a,b) => a+b,0)/values.length : null;
const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
] });
const results = [], failures = [];
await mkdir(out, { recursive: true });
try {
  for (const version of versions) {
    for (const viewport of viewports) {
      const id = `${version.name}-light-overview-${viewport.width}x${viewport.height}`;
      const context = await browser.newContext({
        viewport, deviceScaleFactor: 1, reducedMotion: 'reduce'
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      try {
        await page.addInitScript(() => {
          localStorage.setItem('tiem-tra-chibi-ui-v1', JSON.stringify({
            renderEngine: 'three', graphics: 'light',
            coachCompleted: true, motion: false, sound: false, music: false
          }));
        });
        await page.goto(version.url + '/?m1bench=1', {
          waitUntil: 'networkidle', timeout: 120000
        });
        await page.waitForFunction(() => window.__m1Runtime?.renderer?.name === 'Three.js',
          null, { timeout: 90000 });
        await page.getByRole('button', { name: /Khám phá khu phố/ }).click({ timeout: 20000 });
        await page.waitForFunction(() => window.__m1Runtime?.input.exploring === true,
          null, { timeout: 20000 });
        await page.evaluate(() => {
          const r = window.__m1Runtime;
          r.player = { x: 0, z: -7 }; r.path = []; r.overview = true;
          r.yaw = 0; r.pitch = -0.23; r.cameraFocus.set(0, 0, -7);
        });
        await sleep(10000);
        const png = path.join(out, id + '.png');
        let screenshot = 'full-page';
        try {
          await page.screenshot({ path: png, animations: 'disabled', timeout: 20000 });
        } catch (error) {
          // Software WebGL sometimes stalls Chromium's page compositor.
          screenshot = 'webgl-canvas-only';
          await page.evaluate(() => {
            const r = window.__m1Runtime;
            r.m1ScreenshotDataUrl = null; r.m1ScreenshotError = null;
            r.m1ScreenshotPending = true;
          });
          await page.waitForFunction(() => {
            const r = window.__m1Runtime;
            return !!(r?.m1ScreenshotDataUrl || r?.m1ScreenshotError);
          }, null, { timeout: 90000 });
          const capture = await page.evaluate(() => ({
            data: window.__m1Runtime.m1ScreenshotDataUrl,
            error: window.__m1Runtime.m1ScreenshotError
          }));
          if (capture.error || !capture.data?.startsWith('data:image/png;base64,'))
            throw new Error('Canvas screenshot failed: ' + capture.error);
          await writeFile(png, Buffer.from(capture.data.split(',')[1], 'base64'));
        }
        const entry = { id, viewport, screenshot, file: png, errors };
        if (viewport.width === 390) {
          await page.evaluate(() => { window.__m1Runtime.m1Frames.length = 0; });
          await sleep(30000);
          const frames = await page.evaluate(() => window.__m1Runtime.m1Snapshot().frames);
          if (!frames?.length) throw new Error('No rendered frame samples');
          entry.measurement = {
            samples: frames.length, p95FrameIntervalMs: p95(frames.map(f => f.intervalMs)),
            meanDrawCalls: mean(frames.map(f => f.calls)),
            meanTriangles: mean(frames.map(f => f.triangles)),
            slowFramesOver100Percent: 100 * frames.filter(f => f.intervalMs > 100).length / frames.length
          };
        }
        results.push(entry);
        console.log('M2 VISUAL ' + JSON.stringify(entry));
      } catch (error) {
        failures.push({ id, error: String(error) });
        console.error('M2 VISUAL FAILED ' + id + ' ' + error);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
const before = results.find(r => r.id === 'main-light-overview-390x844')?.measurement;
const after = results.find(r => r.id === 'candidate-light-overview-390x844')?.measurement;
const comparison = before && after ? {
  drawCallsChangePercent: 100 * (after.meanDrawCalls / before.meanDrawCalls - 1),
  p95ChangePercent: 100 * (after.p95FrameIntervalMs / before.p95FrameIntervalMs - 1)
} : null;
await writeFile(path.join(out, 'report.json'), JSON.stringify({
  environment: 'GitHub Actions headless Chromium SwiftShader, NOT a physical phone',
  scene: 'fresh context, light overview, x=0 z=-7 yaw=0 pitch=-0.23',
  warmupSeconds: 10, sampleSeconds: 30,
  results, comparison, failures
}, null, 2));
if (failures.length || !comparison) process.exitCode = 1;
