// Headless walkthrough used to verify the hub (needs playwright-core + Chrome and a static server for `out/` on port 3100).
// Run: node scripts/e2e-walkthrough.cjs  (writes screenshots/)
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const ROOT = process.env.ROOT || process.cwd();
const BASE = process.env.BASE_URL || 'http://localhost:3100';
// Browsers may probe the host root for an icon, outside a mounted Pages app.
const hostFavicon = new URL(BASE).pathname !== '/' ? new URL('/favicon.ico', BASE).href : null;
const SHOTS = process.env.SCREENSHOTS_DIR || path.join(ROOT, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', p), 'utf8'));
const pool = read('pools/devnet.json');
const byId = new Map(pool.questions.map((q) => [q.id, q]));
const bankQs = (bankId) => { const f = read(`assessments/${bankId}.json`); return f.questions ? f.questions : f.questionIds.map((id) => byId.get(id)); };
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: !!ok, extra }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };

async function answer(page, q, { wrong = false } = {}) {
  if (q.type === 'matching') {
    for (let i = 0; i < q.prompts.length; i++) {
      const p = q.prompts[i];
      let v = p.answer;
      if (wrong && i === 0) v = q.options.find((o) => o !== p.answer);
      await page.selectOption(`[id="match-${p.id}"]`, v);
    }
  } else if (q.type === 'fill') {
    await page.fill('.fill__input', wrong ? 'NOPE' : q.acceptedAnswers[0]);
  } else {
    let picks = q.choices.filter((c) => c.correct);
    if (wrong) picks = [q.choices.find((c) => !c.correct)];
    for (const c of picks) await page.locator(`label.choice:has(input[value="${c.id}"])`).click();
  }
}
const submit = (page) => page.click('button[type=submit]:has-text("Submit")');
const next = (page) => page.click('button[type=submit]:has-text("Next"), button[type=submit]:has-text("See results")');
const qText = (page) => page.locator('.qcard__count').innerText();

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || (process.platform === 'win32' ? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p)) : '/usr/bin/google-chrome'), headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && m.location()?.url !== hostFavicon) errors.push(m.text() + ' @ ' + (m.location()?.url || '')); });
  page.on('response', (r) => { if (r.status() >= 400 && r.url() !== hostFavicon) errors.push(`${r.status()} ${r.url()}`); });

  // Hub → DevNet → Module 5
  await page.goto(BASE + '/');
  await page.screenshot({ path: `${SHOTS}/01-hub.png` });
  check('hub lists 3 courses', (await page.locator('.card').count()) === 3);
  await page.click('.card:has-text("DEVNET")');
  await page.waitForURL('**/courses/devnet/');
  check('DevNet course page: 4 assessments', (await page.locator('.card').count()) === 4);
  check('DevNet cards mention 60-minute timer', (await page.locator('.card:has-text("60-minute exam timer")').count()) === 4);
  await page.screenshot({ path: `${SHOTS}/02-course-devnet.png` });
  await page.click('.card:has-text("Module 5")');
  await page.waitForURL('**/courses/devnet/module-5/');
  await page.waitForSelector('.mode-card');
  check('DevNet exam card mentions countdown', (await page.locator('.mode-card:has-text("60-minute countdown")').count()) === 1);
  await page.screenshot({ path: `${SHOTS}/03-start-devnet-m5.png`, fullPage: true });

  // Exam mode
  const m5 = bankQs('devnet-m5');
  await page.click('.mode-card:has-text("Exam mode")'); await page.click('.start-button');
  await page.waitForSelector('.qcard');
  const t0 = await page.locator('.timer').innerText();
  check('exam timer visible', /^\d{2}:\d{2}$/.test(t0), t0);
  check('Submit disabled before picking', await page.locator('button:has-text("Submit")').isDisabled());
  for (let i = 0; i < 5; i++) {
    await answer(page, m5[i], { wrong: i === 2 });
    await submit(page);
    const colors = await page.locator('.is-correct, .is-wrong, .is-missed, .feedback--correct, .feedback--wrong').count();
    if (colors) check(`exam Q${i + 1} no colors`, false);
    await page.waitForSelector('.feedback--locked');
    await next(page);
  }
  check('exam: no correctness colors after submits', true);
  check('on Q6', (await qText(page)).toUpperCase() === 'QUESTION 6 OF 18');
  const states = await page.locator('.qbox').evaluateAll((els) => els.map((e) => e.className.match(/qbox--(\w+)/)[1]));
  check('index: 1-5 locked, 6 current, 7-18 future', JSON.stringify(states) === JSON.stringify([...Array(5).fill('locked'), 'current', ...Array(12).fill('future')]), states.join(','));
  check('index not clickable', (await page.locator('.qindex a, .qindex button').count()) === 0);
  await answer(page, m5[5]);
  await page.screenshot({ path: `${SHOTS}/04-exam-question.png` });
  // Enter submits
  await page.locator('.choice.is-selected input').focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('.feedback--locked');
  check('Enter submits', true);
  await page.goBack();
  await page.waitForSelector('.notice');
  check('browser Back keeps current locked question', (await qText(page)).toUpperCase().includes('6 OF 18'));
  await page.screenshot({ path: `${SHOTS}/05-exam-locked.png` });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('.qcard__count')?.textContent?.includes('7 of'));
  check('Enter advances', true);

  // Refresh mid-attempt
  const before = await page.locator('.timer').innerText();
  await page.waitForTimeout(1500);
  await page.reload();
  await page.waitForSelector('.qcard');
  const after = await page.locator('.timer').innerText();
  check('refresh resumes at Q7', (await qText(page)).toUpperCase() === 'QUESTION 7 OF 18');
  check('refresh keeps 6 locked', (await page.locator('.qbox--locked').count()) === 6);
  check('refresh keeps remaining time', after <= before && after >= '59:00', `${before} -> ${after}`);
  check('resume notice shown', (await page.locator('.notice:has-text("Resumed")').count()) === 1);
  // Back stays put
  await page.goBack();
  await page.waitForTimeout(600);
  check('Back stays on Q7', page.url().endsWith('/courses/devnet/module-5/') && (await qText(page)).toUpperCase() === 'QUESTION 7 OF 18', page.url());
  check('Back notice', (await page.locator('.notice:has-text("Answers are locked")').count()) === 1);
  check('header not navigable mid-attempt', (await page.locator('.statusbar a').count()) === 0);

  for (let i = 6; i < 18; i++) {
    if (i === 8) { await answer(page, m5[i]); await page.screenshot({ path: `${SHOTS}/06-exam-matching.png`, fullPage: true }); }
    else await answer(page, m5[i]);
    await submit(page);
    if (await page.locator('.is-correct, .is-wrong, .feedback--correct, .feedback--wrong').count()) check(`exam Q${i + 1} no colors`, false);
    await next(page);
  }
  await page.waitForSelector('.score__figure');
  const score = await page.locator('.score__figure').innerText();
  check('exam score 17/18 (Q3 wrong)', score.replace(/\s|Score:/g, '') === '17/18', score);
  check('exam pct', (await page.locator('.score__pct').innerText()) === '94.4%');
  check('time used shown', /used of 60:00/.test(await page.locator('.score__line').innerText()));
  check('review has 18 rows, 1 incorrect', (await page.locator('.review__item').count()) === 18 && (await page.locator('.review__item.is-wrong').count()) === 1);
  check('no 17/20 historical score', !(await page.content()).includes('17/20'));
  await page.screenshot({ path: `${SHOTS}/07-results-exam.png` });
  await page.screenshot({ path: `${SHOTS}/07b-results-exam-full.png`, fullPage: true });
  await page.reload();
  await page.waitForSelector('.score__figure');
  check('results survive refresh', (await page.locator('.score__figure').innerText()).includes('17 / 18'));

  await page.getByRole('button', { name: 'Incorrect (1)', exact: true }).click();
  check('incorrect filter retains original question number', (await page.locator('.review__item').count()) === 1 && (await page.locator('.review__num').innerText()) === '3');
  await page.getByRole('button', { name: 'Correct (17)', exact: true }).click();
  check('correct filter', (await page.locator('.review__item').count()) === 17);
  await page.getByRole('button', { name: 'All (18)', exact: true }).click();

  // Another assessment in the same tab: Module 6 prep, 2 answers, then leave by URL
  await page.goto(BASE + '/courses/devnet/module-6');
  await page.click('.mode-card:has-text("Prep mode")'); await page.click('.start-button');
  const m6 = bankQs('devnet-m6');
  for (let i = 0; i < 2; i++) { await answer(page, m6[i]); await submit(page); await next(page); }
  check('prep has no timer', (await page.locator('.timer').count()) === 0);
  await page.goto(BASE + '/courses/devnet');
  await page.waitForSelector('.badge');
  const badges = await page.locator('.badge').allInnerTexts();
  check('course page badges for both attempts', badges.some((b) => b.includes('results ready')) && badges.some((b) => b.includes('question 3 of 15')), badges.join(' | '));
  const keys = await page.evaluate(() => Object.keys(sessionStorage).sort());
  check('separate storage keys', keys.includes('exam-reviewer:attempt:devnet-m5') && keys.includes('exam-reviewer:attempt:devnet-m6'), keys.join(','));
  await page.goto(BASE + '/courses/devnet/module-5');
  await page.waitForSelector('.score__figure');
  check('M5 results intact after M6 attempt', (await page.locator('.score__figure').innerText()).includes('17 / 18'));
  await page.goto(BASE + '/courses/devnet/module-6');
  await page.waitForSelector('.qcard');
  check('M6 resumes at Q3', (await qText(page)).toUpperCase() === 'QUESTION 3 OF 15');
  page.once('dialog', (d) => d.accept());
  await page.click('text=Discard attempt');
  await page.waitForSelector('.mode-card');
  check('discard returns to mode select', true);

  // Restart M5 in prep
  await page.goto(BASE + '/courses/devnet/module-5');
  await page.click('button:has-text("Start a new attempt") >> nth=0');
  await page.waitForSelector('.mode-card');
  check('restart clears to start screen', true);
  await page.click('.mode-card:has-text("Prep mode")'); await page.click('.start-button');
  await answer(page, m5[0], { wrong: true });
  await submit(page);
  await page.waitForSelector('.feedback--wrong');
  check('prep wrong feedback + explanation', (await page.locator('.feedback--wrong dt:has-text("Explanation")').count()) === 1);
  await page.screenshot({ path: `${SHOTS}/08-prep-incorrect.png` });
  await next(page);
  await answer(page, m5[1]);
  await submit(page);
  await page.waitForSelector('.feedback--correct');
  check('prep multi correct tags', (await page.locator('.choice.is-correct').count()) === 2);
  await page.screenshot({ path: `${SHOTS}/09-prep-feedback.png` });
  await next(page);
  for (let i = 2; i < 8; i++) { await answer(page, m5[i]); await submit(page); await next(page); }
  // Q9 matching with exhibit, wrong on one prompt
  check('exhibit shown on Q9', (await page.locator('.exhibit img').count()) === 1);
  check('matching submit disabled until all picked', await page.locator('button:has-text("Submit")').isDisabled());
  await answer(page, m5[8], { wrong: true });
  await submit(page);
  await page.waitForSelector('.feedback--wrong');
  check('matching all-or-nothing: 1 wrong prompt -> incorrect', (await page.locator('.match.is-wrong').count()) === 1 && (await page.locator('.match.is-correct').count()) === 2);
  await page.screenshot({ path: `${SHOTS}/10-prep-matching.png`, fullPage: true });
  await next(page);
  // Q10 matching with repeated Not used
  await answer(page, m5[9]);
  await page.screenshot({ path: `${SHOTS}/11-matching-not-used.png`, fullPage: true });
  await submit(page);
  await page.waitForSelector('.feedback--correct');
  check('m5_q10 repeated Not used grades correct', true);
  await next(page);
  await answer(page, m5[10]); await submit(page); await next(page);
  // Q12 static NAT key
  await answer(page, m5[11]);
  await submit(page);
  check('m5_q12 marked 209.165.202.129 correct', (await page.locator('.feedback--correct').count()) === 1 && (await page.locator('.choice.is-correct:has-text("209.165.202.129")').count()) === 1);
  await next(page);
  check('code block on Q13', (await page.locator('.codeblock').innerText()).includes('Serial0/0/0'));
  for (let i = 12; i < 18; i++) { await answer(page, m5[i]); await submit(page); await next(page); }
  await page.waitForSelector('.score__figure');
  check('prep score 16/18', (await page.locator('.score__figure').innerText()).includes('16 / 18'));
  check('prep results: no time used', !(await page.locator('.score__line').innerText()).includes('used of'));
  await page.screenshot({ path: `${SHOTS}/12-results-prep.png` });

  // SoftEng1 exam untimed, full run
  await page.goto(BASE + '/');
  await page.click('.card:has-text("CS0025")');
  await page.waitForURL('**/courses/cs0025/');
  check('SoftEng1 card no timer', (await page.locator('.card:has-text("timer")').count()) === 0);
  await page.screenshot({ path: `${SHOTS}/13-course-softeng1.png` });
  await page.click('.card:has-text("M6 and M7")');
  await page.waitForSelector('.mode-card');
  check('SoftEng1 exam card no timer', (await page.locator('.mode-card:has-text("countdown")').count()) === 0);
  await page.screenshot({ path: `${SHOTS}/14-start-softeng1.png`, fullPage: true });
  await page.click('.mode-card:has-text("Exam mode")'); await page.click('.start-button');
  await page.waitForSelector('.qcard');
  check('SoftEng1 exam untimed', (await page.locator('.timer').count()) === 0);
  const se = bankQs('cs0025-m3-m6-m7');
  for (let i = 0; i < 20; i++) {
    if (se[i].type === 'fill' && i === 7) { await page.fill('.fill__input', 'statechart diagram'); await page.screenshot({ path: `${SHOTS}/15-softeng1-fill.png` }); }
    else await answer(page, se[i]);
    await page.keyboard.press('Enter');
    await page.waitForSelector('.feedback--locked');
    await page.keyboard.press('Enter');
  }
  await page.waitForSelector('.score__figure');
  check('SoftEng1 perfect 20/20 (Q8 STATECHART)', (await page.locator('.score__figure').innerText()).includes('20 / 20'));

  // Machine Learning: hub navigation, all 60 Prep questions, every code excerpt.
  const mlSets = [
    { title: 'SA3 Mock Set A', bankId: 'cs0075-sa3-mock-exam', route: '/courses/cs0075/sa-3-mock-exam' },
    { title: 'SA3 Mock Set B', bankId: 'cs0075-sa3-mock-set-b', route: '/courses/cs0075/sa3-mock-set-b' },
  ];
  // Preserve the independently hosted companion alongside both assessments.
  await page.goto(BASE + '/courses/cs0075/');
  const companionCard = page.getByRole('link', { name: /SA 3 Concepts & Hyperparameters/ });
  check('CS0075 has separate 50-question offline companion', await companionCard.count() === 1 && (await companionCard.innerText()).includes('50 questions'));
  const companionHref = await companionCard.getAttribute('href');
  check('Companion link preserves deployment base path', new URL(companionHref, BASE).href === BASE + '/reviewers/cs0075-sa3-concepts-hyperparameters-reviewer.html');
  await page.screenshot({ path: `${SHOTS}/26-cs0075-companion-card.png`, fullPage: true });
  const companionPage = await ctx.newPage();
  const companionErrors = [], companionRequests = [];
  companionPage.on('pageerror', (e) => companionErrors.push(String(e)));
  companionPage.on('request', (r) => companionRequests.push(r.url()));
  const companionResponse = await companionPage.goto(new URL(companionHref, BASE).href);
  check('Standalone companion loads from static export', companionResponse.ok() && (await companionPage.locator('body').innerText()).includes('50 questions. Two ways to study.'));
  check('Companion starts with 60-minute timer and both shuffles', (await companionPage.getByLabel('Exam duration (minutes)').inputValue()) === '60' && (await companionPage.locator('body').innerText()).toLowerCase().includes('question shuffle: on / choice shuffle: on'));
  await companionPage.getByRole('button', { name: 'Start Prep', exact: true }).click();
  check('Companion uses independent Prep controls', await companionPage.getByRole('button', { name: 'Check Answer', exact: true }).count() === 1 && await companionPage.getByRole('button', { name: 'Flag question', exact: true }).count() === 1);
  await companionPage.setViewportSize({ width: 360, height: 800 });
  check('Hosted companion fits mobile viewport', await companionPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await companionPage.screenshot({ path: `${SHOTS}/27-cs0075-companion-mobile.png`, fullPage: true });
  check('Hosted companion has no browser errors or subrequests', companionErrors.length === 0 && companionRequests.length === 1);
  await companionPage.close();
  let setAState;
  for (const set of mlSets) {
    const ml = bankQs(set.bankId);
    const mlRoute = set.route;
    await page.goto(BASE + '/');
    await page.click('.card:has-text("CS0075")');
    await page.waitForURL('**/courses/cs0075/');
    check('CS0075 course has Set A then Set B', JSON.stringify(await page.locator('.card[href*="/courses/cs0075/"] .card__title').allTextContents()) === JSON.stringify(mlSets.map((s) => s.title)));
    check('both CS0075 cards have a 60-minute timer', (await page.locator('.card:has-text("60-minute exam timer")').count()) === 2);
    await page.click(`.card:has-text("${set.title}")`);
    await page.waitForURL(`**${mlRoute}/`);
    await page.waitForFunction((title) => document.title.includes(title), set.title);
    check(`${set.title} page title`, (await page.title()).includes(set.title));
    await page.waitForSelector('.mode-card');
    check('CS0075 start shows 60 questions and topic', (await page.locator('.facts').innerText()).includes('60') && (await page.locator('.subhead').innerText()) === 'Decision Trees, Random Forests, Gradient Boosting, and SVM');
    await page.screenshot({ path: `${SHOTS}/${set.bankId}-21-start-cs0075.png`, fullPage: true });
    await page.click('.start-button');
    await page.waitForSelector('.qcard');
    check('CS0075 Prep is untimed', (await page.locator('.timer').count()) === 0);
    let mlCode = 0;
    for (let i = 0; i < ml.length; i++) {
      const q = ml[i];
      check(`CS0075 Prep Q${i + 1} source prompt`, (await page.locator('.prompt').innerText()).replace(/^Question \d+\.\s*/, '') === q.prompt);
      if (q.type !== 'fill') {
        check(`CS0075 Prep Q${i + 1} fixed choice order`, JSON.stringify(await page.locator('.choice__text').allTextContents()) === JSON.stringify(q.choices.map((c) => c.text)));
      }
      if (q.code) {
        mlCode++;
        check(`CS0075 desktop code ${q.id}`, (await page.locator('.codeblock code').textContent()) === q.code.join('\n'));
        check(`CS0075 desktop code ${q.id} fits page`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        if (q.id === 'RF-15') await page.screenshot({ path: `${SHOTS}/${set.bankId}-22-cs0075-desktop-code.png`, fullPage: true });
      }
      if (q.type === 'fill') {
        await page.fill('.fill__input', `  ${q.acceptedAnswers[0].toUpperCase().replace(/ /g, '   ')}  `);
        check(`CS0075 fill ${q.id} instructions`, (await page.locator('.qcard__instr').innerText()) === q.instruction);
      } else await answer(page, q);
      await submit(page);
      await page.waitForSelector('.feedback--correct');
      check(`CS0075 Prep Q${i + 1} explanation and references`, (await page.locator('.feedback__explain').textContent()) === q.explanation);
      if (i === 12) {
        check('CS0075 submitted fill is locked', !(await page.locator('.fill__input').isEditable()));
        await page.reload();
        await page.waitForSelector('.feedback--correct');
        check('CS0075 refresh restores locked code question', (await qText(page)).toUpperCase() === 'QUESTION 13 OF 60' && !(await page.locator('.fill__input').isEditable()) && (await page.locator('.codeblock code').textContent()) === q.code.join('\n'));
        await page.screenshot({ path: `${SHOTS}/${set.bankId}-23-cs0075-prep-feedback.png`, fullPage: true });
      }
      await next(page);
    }
    check('CS0075 desktop checked all ten code excerpts', mlCode === 10);
    await page.waitForSelector('.score__figure');
    check('CS0075 normalized perfect Prep scores 60/60', (await page.locator('.score__figure').innerText()).includes('60 / 60'));
    check('CS0075 results include every explanation and reference', JSON.stringify(await page.locator('.review__explain').allTextContents()) === JSON.stringify(ml.map((q) => q.explanation)));
    await page.screenshot({ path: `${SHOTS}/${set.bankId}-24-cs0075-results.png` });
    await page.reload();
    await page.waitForSelector('.score__figure');
    check('CS0075 results survive refresh', (await page.locator('.score__figure').innerText()).includes('60 / 60'));

    // Independent Exam attempt with a controlled clock, including restoration and expiry.
    const mlCtx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const mlExam = await mlCtx.newPage();
    mlExam.on('pageerror', (e) => errors.push(String(e)));
    await mlExam.clock.install();
    await mlExam.goto(BASE + mlRoute);
    await mlExam.click('.mode-card:has-text("Exam mode")'); await mlExam.click('.start-button');
    await mlExam.waitForSelector('.timer');
    check('CS0075 Exam starts with 60-minute timer', ['60:00', '59:59'].includes(await mlExam.locator('.timer').innerText()));
    await answer(mlExam, ml[0]); await submit(mlExam);
    await mlExam.waitForSelector('.feedback--locked');
    check('CS0075 Exam locks choices and hides correctness and sources', await mlExam.locator('.choice input').first().isDisabled() && (await mlExam.locator('.feedback--correct, .feedback--wrong, .feedback__explain, .is-correct, .is-wrong').count()) === 0 && !(await mlExam.locator('body').innerText()).includes('Sources:'));
    const mlStorageKey = 'exam-reviewer:attempt:' + set.bankId;
    const mlDeadline = await mlExam.evaluate((key) => JSON.parse(sessionStorage.getItem(key)).endsAt, mlStorageKey);
    await mlExam.clock.fastForward('01:00');
    await mlExam.reload();
    await mlExam.waitForSelector('.feedback--locked');
    const mlRemaining = await mlExam.locator('.timer').innerText();
    check('CS0075 Exam restores locked question and original deadline', (await qText(mlExam)).toUpperCase() === 'QUESTION 1 OF 60' && (await mlExam.evaluate((key) => JSON.parse(sessionStorage.getItem(key)).endsAt, mlStorageKey)) === mlDeadline && mlRemaining <= '59:00' && mlRemaining >= '58:50', mlRemaining);
    await next(mlExam);
    await mlExam.clock.fastForward('59:01');
    await mlExam.waitForSelector('.score__figure');
    check('CS0075 Exam expires into results with 59 unanswered', (await mlExam.locator('.score__figure').innerText()).includes('1 / 60') && (await mlExam.locator('.score__note').innerText()).includes('59 unanswered'));
    await mlCtx.close();
    const saved = await page.evaluate(() => ({ ...sessionStorage }));
    if (set.bankId === mlSets[0].bankId) setAState = saved['exam-reviewer:attempt:' + set.bankId];
    else check('Set B results coexist with unchanged saved Set A results', saved['exam-reviewer:attempt:' + mlSets[0].bankId] === setAState && JSON.parse(saved['exam-reviewer:attempt:' + set.bankId]).bankId === set.bankId);
  }

  // Mobile 360
  const mob = await browser.newContext({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await mob.newPage();
  mp.on('pageerror', (e) => errors.push(String(e)));
  await mp.goto(BASE + '/');
  await mp.screenshot({ path: `${SHOTS}/16-mobile-hub.png` });
  await mp.goto(BASE + '/courses/devnet/module-5');
  await mp.tap('.mode-card:has-text("Exam mode")'); await mp.tap('.start-button');
  await mp.waitForSelector('.qcard');
  await answer(mp, m5[0]);
  await mp.screenshot({ path: `${SHOTS}/17-mobile-exam-question.png` });
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check('360px: no horizontal overflow', !overflow);
  check('360px: grid hidden, progress shown', !(await mp.locator('.side').isVisible()) && (await mp.locator('.qcard__progress-mobile .progress-line').isVisible()));
  await mp.goto(BASE + '/courses/devnet/fa-6');
  await mp.tap('.mode-card:has-text("Prep mode")'); await mp.tap('.start-button');
  const fa6 = bankQs('devnet-fa6');
  for (let i = 0; i < 14; i++) { await answer(mp, fa6[i]); await submit(mp); await next(mp); }
  await answer(mp, fa6[14]); // fa6_q15 long options
  await submit(mp);
  await mp.screenshot({ path: `${SHOTS}/18-mobile-prep-matching.png`, fullPage: true });
  const ov2 = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check('360px matching: no horizontal overflow', !ov2);

  // All ten code excerpts for both sets on mobile.
  for (const set of mlSets) {
    const ml = bankQs(set.bankId);
    await mp.goto(BASE + set.route);
    await mp.tap('.start-button');
    await mp.waitForSelector('.qcard');
    let mobileCode = 0;
    for (let i = 0; i < 45; i++) {
      const q = ml[i];
      if (q.code) {
        mobileCode++;
        check(`CS0075 mobile code ${q.id}`, (await mp.locator('.codeblock code').textContent()) === q.code.join('\n') && await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        if (q.id === 'RF-15') await mp.screenshot({ path: `${SHOTS}/${set.bankId}-25-cs0075-mobile-code.png`, fullPage: true });
      }
      await answer(mp, q); await submit(mp); await next(mp);
    }
    check(`${set.title} mobile checked all ten code excerpts`, mobileCode === 10);
  }

  // Timer auto-finish with fake clock: FA 6 exam, Q1 locked, Q2 picked not submitted
  const tctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const tp = await tctx.newPage();
  tp.on('pageerror', (e) => errors.push(String(e)));
  await tp.clock.install();
  await tp.goto(BASE + '/courses/devnet/fa-6');
  await tp.click('.mode-card:has-text("Exam mode")'); await tp.click('.start-button');
  await tp.waitForSelector('.qcard');
  await answer(tp, fa6[0]); await submit(tp); await next(tp);
  await answer(tp, fa6[1]);
  await tp.clock.fastForward('55:30');
  await tp.waitForTimeout(300);
  await tp.screenshot({ path: `${SHOTS}/19-exam-timer-urgent.png` });
  check('timer urgent under 5 min', (await tp.locator('.timer--urgent').count()) === 1, await tp.locator('.timer').innerText());
  check('no reveal near the end', (await tp.locator('.is-correct, .is-wrong').count()) === 0);
  await tp.clock.fastForward('04:40');
  await tp.waitForSelector('.score__figure', { timeout: 5000 });
  const tScore = await tp.locator('.score__figure').innerText();
  check('timeout auto-finishes; draft locked => 2/28', tScore.includes('2 / 28'), tScore);
  check('timeout note', (await tp.locator('.score__note').innerText()).includes('26 unanswered'));
  check('time used 60:00', (await tp.locator('.score__line').innerText()).includes('60:00 used of 60:00'));
  await tp.screenshot({ path: `${SHOTS}/20-results-timeout.png` });
  await tp.reload();
  await tp.waitForSelector('.score__figure');
  check('timeout results survive refresh', (await tp.locator('.score__figure').innerText()).includes('2 / 28'));

  check('no page errors', errors.length === 0, errors.slice(0, 5).join(' || '));
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
