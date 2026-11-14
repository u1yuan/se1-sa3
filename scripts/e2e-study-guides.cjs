// Needs playwright-core and Chrome/Edge, matching e2e-walkthrough.cjs.
// ROOT selects the catalog belonging to the build; BASE_URL includes any mount.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.ROOT || process.cwd();
const base = (process.env.BASE_URL || 'http://127.0.0.1:3100').replace(/\/$/, '');
const courses = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8')).courses;
const shots = process.env.SCREENSHOTS_DIR || path.join(process.cwd(), 'tmp/study-guide-screenshots');
fs.mkdirSync(shots, { recursive: true });
let checks = 0;
function check(name, value) { assert.ok(value, name); checks++; console.log(`PASS ${name}`); }
const selected = (page, name) => page.getByRole('tab', { name: new RegExp(name) }).getAttribute('aria-selected');
async function waitTab(page, name) {
  await page.waitForFunction((name) => [...document.querySelectorAll('[role=tab]')].some((el) => el.textContent.includes(name) && el.getAttribute('aria-selected') === 'true'), name);
}
const reader = (course, guide = '') => `${base}/courses/${course.id}/study-guides/${guide ? `?guide=${encodeURIComponent(guide)}` : ''}`;
const frame = (page, title) => page.frameLocator(`iframe[title="${title}"]`);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || (process.platform === 'win32' ? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync) : '/usr/bin/google-chrome') });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const page = await context.newPage();
    const errors = [];
    const artifacts = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('request', (request) => { if (/\/study-guides\/[^/]+\/[^/]+\.html$/.test(new URL(request.url()).pathname)) artifacts.push(request.url()); });
    for (const course of courses) {
      await page.goto(`${base}/courses/${course.id}/`);
      await waitTab(page, 'Mock exams');
      check(`${course.id}: default mock exams and existing cards`, await selected(page, 'Mock exams') === 'true' && await page.locator('.card').count() === course.assessments.length);
      check(`${course.id}: both tab counts`, (await page.getByRole('tab', { name: /Mock exams/ }).innerText()).includes(String(course.assessments.length)) && (await page.getByRole('tab', { name: /Study guides/ }).innerText()).includes(String(course.studyGuides.length)));
      await page.getByRole('tab', { name: /Study guides/ }).click();
      await waitTab(page, 'Study guides');
      check(`${course.id}: query-backed guides panel`, new URL(page.url()).searchParams.get('tab') === 'study-guides');
      if (!course.studyGuides.length) check(`${course.id}: empty library`, await page.getByText('No study guides yet.', { exact: true }).isVisible());
      else for (const guide of course.studyGuides) check(`${course.id}: title and description for ${guide.id}`, await page.getByRole('link', { name: new RegExp(guide.title) }).isVisible() && await page.getByText(guide.description, { exact: true }).isVisible());
      await page.reload();
      await waitTab(page, 'Study guides');
      check(`${course.id}: refresh retains tab`, await selected(page, 'Study guides') === 'true');
      await page.getByRole('tab', { name: /Study guides/ }).focus();
      await page.keyboard.press('Home');
      await waitTab(page, 'Mock exams');
      check(`${course.id}: Home selects/focuses first tab`, await page.getByRole('tab', { name: /Mock exams/ }).evaluate((el) => el === document.activeElement));
      await page.keyboard.press('ArrowLeft');
      await waitTab(page, 'Study guides');
      await page.keyboard.press('ArrowRight');
      await waitTab(page, 'Mock exams');
      await page.keyboard.press('End');
      await waitTab(page, 'Study guides');
      await page.keyboard.press('Space');
      check(`${course.id}: arrows wrap, End and Space work`, await selected(page, 'Study guides') === 'true');
      await page.getByRole('tab', { name: /Mock exams/ }).click();
      await waitTab(page, 'Mock exams');
      await page.getByRole('tab', { name: /Study guides/ }).click();
      await waitTab(page, 'Study guides');
      await page.goBack();
      await waitTab(page, 'Mock exams');
      await page.goForward();
      await waitTab(page, 'Study guides');
      check(`${course.id}: browser history retains selected panels`, await selected(page, 'Study guides') === 'true');
      await page.goto(reader(course));
      const missingText = course.studyGuides.length ? 'Choose a study guide.' : 'No study guides yet.';
      await page.getByRole('heading', { name: missingText, exact: true }).waitFor();
      check(`${course.id}: reader statically exists without selection`, await page.locator('iframe').count() === 0);
      await page.goto(reader(course, 'not-registered'));
      await page.getByRole('heading', { name: 'Study guide not found.' }).waitFor();
      check(`${course.id}: unknown guide never loads an iframe`, await page.locator('iframe').count() === 0);
      await page.getByRole('link', { name: '← Back to study guides', exact: true }).click();
      await waitTab(page, 'Study guides');
      check(`${course.id}: reader returns to guides tab`, new URL(page.url()).searchParams.get('tab') === 'study-guides');
    }
    await page.goto(`${base}/courses/${courses[0].id}/?tab=unknown`);
    await waitTab(page, 'Mock exams');
    check('unrecognized tab defaults to Mock exams', await selected(page, 'Mock exams') === 'true');

    const populated = fs.existsSync(path.join(root, '.study-guide-fixture')) && courses.find((course) => course.studyGuides.length > 1);
    if (populated) {
      const [first, second] = populated.studyGuides;
      let release;
      const gate = new Promise((resolve) => { release = resolve; });
      await page.route(`**${first.artifactPath}`, async (route) => { await gate; await route.continue(); });
      await page.goto(`${base}/courses/${populated.id}/?tab=study-guides`);
      await waitTab(page, 'Study guides');
      artifacts.length = 0;
      await page.getByRole('link', { name: new RegExp(first.title) }).click();
      await page.getByRole('status').filter({ hasText: 'Loading study guide…' }).waitFor();
      check('loading state while selected artifact downloads', await page.locator('iframe').count() === 0);
      release();
      await frame(page, first.title).getByRole('heading', { name: 'Interactive visualization' }).waitFor();
      await page.unroute(`**${first.artifactPath}`);
      check('only selected artifact fetched with deployment prefix', artifacts.length === 1 && artifacts[0] === `${base}${first.artifactPath}`);
      check('sandbox allows scripts without same-origin access', await page.locator('iframe').getAttribute('sandbox') === 'allow-scripts');
      check('sidebar starts collapsed', await page.getByRole('button', { name: 'Show guide sidebar' }).getAttribute('aria-expanded') === 'false');
      const guide = frame(page, first.title);
      await guide.getByRole('button', { name: 'Explore', exact: true }).click();
      check('inline JavaScript works', await guide.locator('#count').innerText() === '1');
      await guide.locator('#depth').fill('8');
      check('interactive SVG and canvas work', await guide.locator('#value').innerText() === '8' && await guide.locator('#node').getAttribute('r') === '16' && await guide.locator('canvas').evaluate((el) => el.getContext('2d').getImageData(10, 20, 1, 1).data[3]) === 255);
      check('artifact CSS and embedded image preserved', await guide.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor) === 'rgb(22, 37, 54)' && await guide.locator('img').evaluate((el) => el.complete && el.naturalWidth === 20));
      check('parent document and assessment storage isolated', await guide.locator('#isolation').innerText() === 'Blocked: parent, session, local' && await page.evaluate(() => !document.body.dataset.guideEscape && !sessionStorage.getItem('guide-escape') && !localStorage.getItem('guide-escape')));
      const location = page.url();
      await guide.getByRole('button', { name: 'Try top navigation' }).click();
      check('top navigation blocked', page.url() === location && await guide.locator('#navigation-result').innerText() === 'Navigation blocked');
      await guide.locator('#end').scrollIntoViewIfNeeded();
      check('artifact scroll stays inside viewport', await guide.locator('body').evaluate(() => window.scrollY > 500) && await page.evaluate(() => window.scrollY === 0 && document.documentElement.scrollWidth <= innerWidth));
      await page.getByRole('button', { name: 'Show guide sidebar' }).click();
      check('desktop sidebar docks and highlights selection', await page.locator('#guide-sidebar').isVisible() && await page.locator('#guide-sidebar [aria-current=page]').innerText() === first.title && (await page.locator('iframe').boundingBox()).x >= 280);
      check('sidebar lists only current course guides', await page.locator('#guide-sidebar a').count() === populated.studyGuides.length && await page.getByText('Other course guide', { exact: true }).count() === 0);
      await page.locator('#guide-sidebar').getByRole('link', { name: second.title, exact: true }).click();
      await frame(page, second.title).locator('#count').waitFor();
      check('sidebar switches query and guide', new URL(page.url()).searchParams.get('guide') === second.id);
      await page.goBack();
      await frame(page, first.title).locator('#count').waitFor();
      check('history reopens artifact afresh', await frame(page, first.title).locator('#count').innerText() === '0');
      await page.goForward();
      await frame(page, second.title).locator('#count').waitFor();
      await page.reload();
      await frame(page, second.title).locator('#count').waitFor();
      check('direct refresh retains guide and resets sidebar', new URL(page.url()).searchParams.get('guide') === second.id && await page.getByRole('button', { name: 'Show guide sidebar' }).isVisible());
      await page.screenshot({ path: path.join(shots, 'reader-desktop.png') });

      await page.setViewportSize({ width: 360, height: 780 });
      await page.getByRole('button', { name: 'Show guide sidebar' }).click();
      await page.locator('dialog[open]').waitFor();
      check('mobile drawer is modal with focus inside', await page.locator('dialog').evaluate((el) => el.matches(':modal') && el.contains(document.activeElement)));
      for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
      check('mobile drawer traps keyboard focus', await page.locator('dialog').evaluate((el) => el.contains(document.activeElement)));
      await page.screenshot({ path: path.join(shots, 'reader-mobile-drawer.png') });
      await page.keyboard.press('Escape');
      check('Escape dismisses and restores toggle focus', await page.getByRole('button', { name: 'Show guide sidebar' }).evaluate((el) => el === document.activeElement));
      await page.getByRole('button', { name: 'Show guide sidebar' }).click();
      await page.locator('dialog[open]').waitFor();
      const box = await page.locator('.reader-drawer__panel').boundingBox();
      await page.locator('dialog[open]').click({ position: { x: box.x + box.width + 10, y: 150 } });
      await page.locator('dialog[open]').waitFor({ state: 'hidden' });
      check('mobile backdrop dismisses drawer', await page.getByRole('button', { name: 'Show guide sidebar' }).isVisible());
      await page.getByRole('button', { name: 'Show guide sidebar' }).click();
      await page.locator('dialog[open]').getByRole('link', { name: first.title, exact: true }).click();
      await frame(page, first.title).locator('#count').waitFor();
      await page.locator('dialog[open]').waitFor({ state: 'hidden' });
      check('mobile guide selection closes drawer', new URL(page.url()).searchParams.get('guide') === first.id);
      check('mobile reader fills remaining viewport without overflow', await page.locator('iframe').evaluate((el) => { const b = el.getBoundingClientRect(); return b.width <= innerWidth && Math.abs(b.bottom - innerHeight) < 2; }));
      check('mobile toolbar stays compact', (await page.locator('.reader-toolbar').boundingBox()).height <= 110 && (await page.locator('.reader-toolbar__toggle').boundingBox()).width <= 50);
      await page.screenshot({ path: path.join(shots, 'reader-mobile.png') });
      await page.getByRole('button', { name: 'Show guide sidebar' }).click();
      await page.locator('dialog[open]').getByRole('button', { name: 'Close sidebar' }).click();
      await page.locator('dialog[open]').waitFor({ state: 'hidden' });
      await page.setViewportSize({ width: 1280, height: 860 });

      // A failed request is retryable and cannot leave the previous artifact visible.
      await page.route(`**${first.artifactPath}`, (route) => route.abort());
      await page.goto(reader(populated, first.id));
      await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      check('loading failure removes iframe', await page.locator('iframe').count() === 0);
      await page.unroute(`**${first.artifactPath}`);
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await frame(page, first.title).locator('#count').waitFor();
      check('Retry recovers the selected artifact', await frame(page, first.title).locator('#count').innerText() === '0');
      for (const response of [ { status: 404, contentType: 'text/html', body: '<h1>Not found</h1>' }, { status: 200, contentType: 'text/plain', body: 'not HTML' }, { status: 200, contentType: 'text/html', body: '' } ]) {
        await page.route(`**${first.artifactPath}`, (route) => route.fulfill(response));
        await page.reload();
        await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
        check(`invalid artifact response ${response.status}/${response.contentType}/${response.body.length} is retryable`, await page.locator('iframe').count() === 0);
        await page.unroute(`**${first.artifactPath}`);
      }
      await page.goto(reader(populated, second.id));
      await frame(page, second.title).locator('#count').waitFor();
      artifacts.length = 0;
      await page.goto(reader(populated, 'unknown'));
      await page.getByRole('heading', { name: 'Study guide not found.' }).waitFor();
      check('unknown selection clears existing artifact and performs no artifact fetch', await page.locator('iframe').count() === 0 && artifacts.length === 0);
      const other = courses.find((course) => course.id !== populated.id);
      await page.goto(reader(other, second.id));
      await page.getByRole('heading', { name: 'Study guide not found.' }).waitFor();
      check('guide lookup is course-scoped', await page.locator('iframe').count() === 0);
    } else check('unselected production guides never fetch artifacts', artifacts.length === 0);

    for (const width of [360, 700]) {
      await page.setViewportSize({ width, height: 780 });
      await page.goto(`${base}/courses/${courses[0].id}/?tab=study-guides`);
      await waitTab(page, 'Study guides');
      check(`${width}px library has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.screenshot({ path: path.join(shots, 'library-mobile.png') });
    check('no uncaught browser exceptions', errors.length === 0);
    console.log(`${checks} study-guide browser checks passed (${populated ? 'populated fixture' : 'production catalog'}).`);
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
