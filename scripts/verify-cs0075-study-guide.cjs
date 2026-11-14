// Run after a /revhub production build, with playwright-core and Chrome/Edge.
// BASE_URL may point at the deployed site; offline checks use the local artifact.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = process.env.ROOT || process.cwd();
const base = (process.env.BASE_URL || 'http://127.0.0.1:3101/revhub').replace(/\/$/, '');
const shots = path.join(root, 'tmp/cs0075-guide-checks');
fs.mkdirSync(shots, { recursive: true });
const guide = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8')).courses.find(c => c.id === 'cs0075').studyGuides.find(g => g.id === 'study-guide-1');
const ids = ['id3', 'c45', 'cart', 'chaid', 'mars', 'rf', 'gbm', 'svm'];
let checks = 0;
const check = (name, ok) => { assert.ok(ok, name); checks++; console.log(`PASS ${name}`); };

async function exercise(scope, page, label) {
  check(`${label}: eight lessons`, await scope.locator('.lesson').count() === 8);
  check(`${label}: forty answers and optional responses`, await scope.locator('.answer').count() === 40 && await scope.locator('textarea').count() === 40);
  check(`${label}: forty checklist skills`, await scope.locator('.checklist input').count() === 40);
  for (const id of ids) {
    const w = scope.locator(`[data-walk="${id}"]`);
    const previous = w.locator('[data-step="-1"]');
    const next = w.locator('[data-step="1"]');
    check(`${label}: ${id} starts at first step`, await w.getAttribute('data-position') === '0' && await previous.isDisabled());
    const titles = new Set([await w.locator('h4').innerText()]);
    let steps = 1;
    while (await next.isEnabled()) {
      await next.click(); steps++;
      titles.add(await w.locator('h4').innerText());
      assert.ok(steps <= 8, 'walkthrough must terminate');
      assert.ok((await w.locator('.walk-body > p').first().innerText()).length > 50);
      assert.ok(await w.locator('svg[role="img"]').count() === 1);
    }
    check(`${label}: ${id} all ${steps} annotated transitions`, titles.size === steps && steps >= 4);
    await previous.click();
    check(`${label}: ${id} previous`, Number(await w.getAttribute('data-position')) === steps - 2);
    await w.locator('[data-reset]').click();
    check(`${label}: ${id} reset`, await w.getAttribute('data-position') === '0' && await previous.isDisabled());
  }
  for (let i = 0; i < 40; i++) {
    const a = scope.locator('.answer').nth(i);
    await a.locator('summary').click();
    assert.ok(await a.locator('p').isVisible());
    assert.ok((await a.locator('p').innerText()).length > 20);
  }
  check(`${label}: all forty answers reveal independently`, await scope.locator('.answer[open]').count() === 40);
  await scope.locator('textarea').first().fill('My recalled explanation');
  await scope.locator('.checklist input').first().check();
  check(`${label}: checklist count updates`, (await scope.locator('#overall').innerText()).includes('1 / 40'));
  await scope.locator('#contents-search').fill('margin');
  check(`${label}: topic search`, await scope.locator('#toc a:visible').count() === 1 && (await scope.locator('#toc a:visible').innerText()) === 'SVM');
  await scope.locator('#contents-search').fill('no-such-topic');
  check(`${label}: empty search explained`, (await scope.locator('#toc-count').innerText()) === '0 sections found');
  await scope.locator('#contents-search').fill('');
  await scope.locator('#toc a[href="#cart"]').focus();
  await page.keyboard.press('Enter');
  check(`${label}: keyboard topic link stays in guide`, await scope.locator('#cart').evaluate(el => el === document.activeElement));
  check(`${label}: navigation preserves in-memory work`, await scope.locator('textarea').first().inputValue() === 'My recalled explanation' && await scope.locator('.checklist input').first().isChecked());
  await scope.locator('#task-filter').selectOption('Regression');
  check(`${label}: regression filter`, await scope.locator('#comparison tbody tr:visible').count() === 6);
  await scope.locator('#family-filter').selectOption('Single tree');
  check(`${label}: combined comparison filters`, await scope.locator('#comparison tbody tr:visible').count() === 2);
  await scope.locator('#family-filter').selectOption('Spline');
  await scope.locator('#task-filter').selectOption('Classification');
  check(`${label}: empty filter explained`, await scope.locator('#filter-empty').isVisible());
  await scope.locator('#family-filter').selectOption('all');
  await scope.locator('#task-filter').selectOption('all');
  check(`${label}: filters reset`, await scope.locator('#comparison tbody tr:visible').count() === 8);
  await scope.locator('.kernel-gallery > summary').click();
  const captions = new Set();
  for (let i = 0; i < 6; i++) {
    await scope.locator('#svm-kernel').selectOption(String(i));
    captions.add(await scope.locator('#kernel-plot figcaption').innerText());
  }
  check(`${label}: all six generated kernel/C panels`, captions.size === 6);
  for (let i = 0; i < 9; i++) {
    const panel = scope.locator('.code-panel').nth(i);
    await panel.locator('summary').click();
    await panel.locator('[data-copy]').click();
    check(`${label}: code ${i + 1} blocked-copy fallback`, (await panel.locator('.copy-status').innerText()).includes('Code selected'));
    assert.ok(await panel.evaluate(el => window.getSelection().toString() === el.querySelector('code').textContent));
    await panel.locator('[data-select]').click();
    assert.ok(await panel.locator('pre').evaluate(el => el === document.activeElement));
  }
  for (const id of ids) {
    const details = scope.locator(`#${id} > details`).first();
    if (!(await details.getAttribute('open') !== null)) await details.locator('summary').click();
    check(`${label}: ${id} readable math`, await details.locator('.equation').count() >= 2 && await details.locator('.equation').first().isVisible());
  }
  await scope.locator('.plot-panel > summary').evaluateAll(els => els.forEach(el => el.parentElement.open = true));
  for (const width of [320, 390, 700, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    check(`${label}: ${width}px no page overflow with expanded content`, await scope.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  }
  await scope.locator('#toc a[href="#overview"]').click();
  await page.screenshot({ path: path.join(shots, `${label}-desktop.png`) });
  await page.setViewportSize({ width: 390, height: 844 });
  await scope.locator('#toc a[href="#id3"]').click();
  await page.screenshot({ path: path.join(shots, `${label}-mobile.png`) });
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    // Force denied clipboard in both contexts, independent of browser defaults.
    await context.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new DOMException('Blocked', 'NotAllowedError')) } }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const requests = [];
    page.on('request', r => { if (r.frame().parentFrame()) requests.push(r.url()); });
    await page.goto(`${base}/courses/cs0075/?tab=study-guides`);
    await page.getByRole('link', { name: new RegExp(guide.title) }).click();
    await page.frameLocator('iframe').locator('h1').waitFor();
    check('library opens correct reader', new URL(page.url()).searchParams.get('guide') === guide.id);
    check('existing reader keeps opaque sandbox', await page.locator('iframe').getAttribute('sandbox') === 'allow-scripts');
    let frame = page.frames().find(f => f.parentFrame());
    check('sandbox storage is denied', await frame.evaluate(() => { try { return localStorage.length < 0; } catch (e) { return e.name === 'SecurityError'; } }));
    await exercise(page.frameLocator('iframe'), page, 'reader');
    check('guide navigation never nests or reloads reader', page.frames().length === 2);
    check('sandbox guide makes zero subresource/network requests', requests.length === 0);
    await page.reload();
    await page.frameLocator('iframe').locator('h1').waitFor();
    check('reopening resets responses, reveals, checklist and walkthroughs', await page.frameLocator('iframe').locator('textarea').first().inputValue() === '' && await page.frameLocator('iframe').locator('.answer[open]').count() === 0 && await page.frameLocator('iframe').locator('.checklist input:checked').count() === 0 && await page.frameLocator('iframe').locator('[data-position="0"]').count() === 8);
    check('reader has no script errors', errors.length === 0);
    await context.close();

    const offline = await browser.newContext({ offline: true, viewport: { width: 1280, height: 900 } });
    await offline.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }); for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(window, name, { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
    const file = await offline.newPage();
    const offlineErrors = [], network = [];
    file.on('pageerror', e => offlineErrors.push(String(e)));
    file.on('request', r => { if (/^https?:/.test(r.url())) network.push(r.url()); });
    await file.goto(pathToFileURL(path.join(root, 'public', guide.artifactPath)).href);
    await exercise(file, file, 'offline');
    check('offline guide works with denied storage and zero network requests', !offlineErrors.length && !network.length);
    await file.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async t => { window.__copied = t; } } }));
    await file.locator('.code-panel').first().locator('[data-copy]').click();
    check('copy success branch', (await file.locator('.code-panel').first().locator('.copy-status').innerText()) === 'Code copied.' && await file.evaluate(() => window.__copied === document.querySelector('.code-panel code').textContent));
    check('no duplicate embedded SVG or document IDs', await file.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(el => el.id); return ids.length === new Set(ids).size; }));
    console.log(`${checks} CS0075 guide checks passed.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
