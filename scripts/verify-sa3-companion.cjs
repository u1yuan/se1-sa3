/* Actual-bank verification. Usage: node this.cjs <HTML path> <Playwright package path> [screenshots folder] */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require(path.resolve(process.argv[3]));
const html = path.resolve(process.argv[2]);
const evidence = path.resolve(process.argv[4] || path.join(__dirname, 'concepts-hyperparameters'));
fs.mkdirSync(evidence, {recursive:true});
const payload = JSON.parse(fs.readFileSync(html,'utf8').match(/id="reviewer-data">(.*?)<\/script>/s)[1]);
const B = payload.bank;
const key = 'html-reviewer:v1:'+payload.fingerprint;
const url = pathToFileURL(html).href;
const count = field => B.questions.reduce((a,q)=>(a[q[field]]=(a[q[field]]||0)+1,a),{});
assert.equal(B.questions.length,50);
assert.deepEqual(count('type'),{mcq:20,true_false:10,blank:20});
assert.deepEqual(count('difficulty'),{easy:25,medium:20,hard:5});
assert.deepEqual(count('topic'),{'Decision Trees':13,'Random Forest':12,'Gradient Boosting':13,SVM:12});
assert.deepEqual(B.settings,{durationMinutes:60,shuffleQuestions:true,shuffleChoices:true});
assert.equal(B.questions.filter(q=>q.blankKind==='conceptual identification').length,8);
assert.equal(B.questions.filter(q=>q.blankKind==='hyperparameter').length,12);
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let browser;
const errors=[],requests=[];
async function observe(p){
 p.setDefaultTimeout(10000);
 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
}
const click=(p,name)=>p.getByRole('button',{name,exact:true}).click();
const state=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
async function gotoQ(p,id){
 const s=await state(p),a=s[s.selected];
 const n=a.order.indexOf(id)+1;
 await p.getByRole('button',{name:new RegExp(`^Question ${n}(,|$)`)}).click();
}
async function fill(p,q,correct=true){
 if(q.type==='blank'){
  const a=correct?'  '+q.answer[0].toUpperCase().replace(/ /g,'   ')+'  ':q.answer[0]+'.';
  await p.getByLabel('Your answer',{exact:true}).fill(a);
 } else {
  const id=correct?q.answer:q.choices.find(c=>c.id!==q.answer).id;
  await p.getByRole('radio',{name:q.choices.find(c=>c.id===id).text,exact:true}).check();
 }
}
async function reload(p){await p.reload();await p.locator('#app button').first().waitFor();}
async function filters(p,expected){
 for(const [filter,n] of Object.entries(expected)){
  await p.getByLabel('Review filter').selectOption(filter);
  assert.equal(await p.getByRole('navigation',{name:'Question numbers'}).getByRole('button').count(),n,filter);
 }
 await p.getByLabel('Review filter').selectOption('all');
}
(async()=>{
 browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:fs.existsSync(edge)?{executablePath:edge}:{})});
 const ctx=await browser.newContext({offline:true,viewport:{width:1440,height:1000}});
 const p=await ctx.newPage();await observe(p);
 let accept=true;p.on('dialog',d=>accept?d.accept():d.dismiss());
 await p.goto(url);await p.screenshot({path:path.join(evidence,'desktop-start.png'),fullPage:true});
 await click(p,'Start Prep');
 const initial=await state(p);const shuffled=initial.prep;
 assert.deepEqual([...shuffled.order].sort(),B.questions.map(q=>q.id).sort());
 assert.notDeepEqual(shuffled.order,B.questions.map(q=>q.id),'Question order randomized');
 assert(B.questions.some(q=>q.choices&&JSON.stringify(shuffled.choices[q.id])!==JSON.stringify(q.choices.map(c=>c.id))),'Choices randomized');
 const seen={},prep={correct:0,wrong:0,unanswered:0,flagged:0};
 for(const q of B.questions){
  await gotoQ(p,q.id);const n=seen[q.type]||0;seen[q.type]=n+1;const outcome=n%3;
  await fill(p,q,outcome!==1);
  if(outcome===2){prep.unanswered++;await click(p,'Flag question');prep.flagged++;}
  else {
   prep[outcome===0?'correct':'wrong']++;
   await click(p,'Check Answer');
   assert.match(await p.getByRole('status',{name:'Answer feedback'}).innerText(),outcome===0?/^Correct/:/^Incorrect/);
   assert(await p.locator(q.type==='blank'?'input.blank':'input[type=radio]').first().isDisabled());
  }
  if(q.id==='CH-RF05'){
   const before=await state(p);await reload(p);const after=await state(p);
   assert.deepEqual(before.prep,after.prep,'Answers, checks, flags and shuffled orders survive reload');
  }
 }
 await gotoQ(p,'CH-DT11');await p.screenshot({path:path.join(evidence,'desktop-code-feedback.png'),fullPage:true});
 await click(p,'Finish Prep');
 assert.match(await p.getByRole('region',{name:'Results',exact:true}).innerText(),new RegExp(`${prep.correct}/50`));
 await filters(p,prep);
 await click(p,'Modes');await click(p,'Start Exam');
 const priorPrep=(await state(p)).prep;
 assert.equal(await p.getByRole('button',{name:'Modes',exact:true}).count(),0);
 const exam={correct:0,wrong:0,unanswered:0,flagged:0};Object.keys(seen).forEach(k=>seen[k]=0);
 for(const q of B.questions){
  await gotoQ(p,q.id);const n=seen[q.type]||0;seen[q.type]=n+1;const outcome=n%3;
  if(outcome!==2)await fill(p,q,outcome===0);
  exam[outcome===0?'correct':outcome===1?'wrong':'unanswered']++;
  if(n===0){await click(p,'Flag question');exam.flagged++;}
  assert.equal(await p.locator('.feedback').count(),0,'No active exam keys/explanations/sources');
  if(q.id==='CH-GB05'){
   const before=await state(p);await reload(p);assert.deepEqual((await state(p)).exam,before.exam);
   assert.equal(await p.locator('.feedback').count(),0);
  }
 }
 // Edit a previous incorrect answer before submission.
 const changed=B.questions.find(q=>q.id==='CH-DT02');await gotoQ(p,changed.id);
 await fill(p,changed,true);exam.wrong--;exam.correct++;
 await click(p,'Next');await click(p,'Previous');
 assert.equal(await p.getByRole('radio',{name:changed.choices.find(c=>c.id===changed.answer).text,exact:true}).isChecked(),true);
 await gotoQ(p,'CH-DT11');await p.screenshot({path:path.join(evidence,'desktop-exam.png'),fullPage:true});
 accept=false;await click(p,'Submit exam');assert.equal((await state(p)).exam.ended,null);
 accept=true;await click(p,'Submit exam');assert.notEqual((await state(p)).exam.ended,null);
 assert.match(await p.getByRole('region',{name:'Results',exact:true}).innerText(),new RegExp(`${exam.correct}/50`));
 assert(await p.locator('input.blank').isDisabled());
 await filters(p,exam);await p.screenshot({path:path.join(evidence,'desktop-results.png'),fullPage:true});
 await reload(p);assert.deepEqual((await state(p)).prep,priorPrep,'Separate saved Prep attempt');
 accept=false;const beforeReset=await state(p);await click(p,'Restart / reset');assert.deepEqual(await state(p),beforeReset);
 accept=true;await click(p,'Restart / reset');assert.equal((await state(p)).exam,null);assert.deepEqual((await state(p)).prep,priorPrep);
 await p.getByLabel('Exam duration (minutes)').fill('0.005');await click(p,'Start Exam');
 await p.getByRole('region',{name:'Results',exact:true}).waitFor();assert.match(await p.locator('#app').innerText(),/time expired/);
 await filters(p,{unanswered:50});
 await click(p,'Restart / reset');await p.getByLabel('Exam duration (minutes)').fill('1');await click(p,'Start Exam');
 const deadline=(await state(p)).exam.deadline;await p.close();
 const reopened=await ctx.newPage();await observe(reopened);await reopened.addInitScript(n=>{Date.now=()=>n;},deadline+5000);await reopened.goto(url);
 await reopened.getByRole('region',{name:'Results',exact:true}).waitFor();assert.match(await reopened.locator('#app').innerText(),/time expired/);
 assert.match(await reopened.locator('#timer').innerText(),/01:00/);
 const ns=await browser.newContext({offline:true,viewport:{width:360,height:800},reducedMotion:'reduce'});
 await ns.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}});});
 const mobile=await ns.newPage();await observe(mobile);await mobile.goto(url);
 assert(await mobile.locator('#storage-notice').isVisible());
 await mobile.keyboard.press('Tab');assert.equal(await mobile.locator(':focus').getAttribute('id'),'duration');
 await mobile.keyboard.press('Tab');await mobile.keyboard.press('Enter');
 // Exercise keyboard input for whichever shuffled question appears first.
 const first=await mobile.locator('input.blank').count();
 await mobile.keyboard.press('Tab');
 if(first)await mobile.keyboard.type('test');else await mobile.keyboard.press('Space');
 await click(mobile,'Check Answer');assert.equal(await mobile.locator('.feedback').count(),1);
 // Find a multiline code prompt via the navigator without relying on app internals.
 let found=false;
 for(let n=1;n<=50;n++){
  await mobile.getByRole('button',{name:new RegExp(`^Question ${n}(,|$)`)}).click();
  if((await mobile.locator('#question').innerText()).includes('\n')){found=true;break;}
 }
 assert(found);
 for(const width of [360,375,768,1440]){
  await mobile.setViewportSize({width,height:900});
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page overflow');
  assert(await mobile.locator('#question').evaluate(e=>e.scrollWidth<=e.clientWidth),'Readable wrapped code');
  await mobile.screenshot({path:path.join(evidence,`code-${width}.png`),fullPage:true});
 }
 const wb=await browser.newContext({offline:true});
 await wb.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
 const wp=await wb.newPage();await observe(wp);await wp.goto(url);assert(await wp.locator('#storage-notice').isVisible());await click(wp,'Start Prep');
 if(await wp.locator('input.blank').count())await wp.locator('input.blank').fill('test');else await wp.getByRole('radio').first().check();
 await click(wp,'Check Answer');assert.equal(await wp.locator('.feedback').count(),1);
 // Every key scores, including alternate conceptual names.
 const perfectContext=await browser.newContext({offline:true});
 const perfect=await perfectContext.newPage();await observe(perfect);perfect.on('dialog',d=>d.accept());
 await perfect.goto(url);await click(perfect,'Start Exam');
 for(const q of B.questions){
  await gotoQ(perfect,q.id);
  if(q.type==='blank'&&q.blankKind==='conceptual identification'){
   await perfect.getByLabel('Your answer',{exact:true}).fill('  '+q.answer.at(-1).toUpperCase().replace(/ /g,'   ')+'  ');
  } else await fill(perfect,q,true);
 }
 await click(perfect,'Submit exam');
 assert.match(await perfect.getByRole('region',{name:'Results',exact:true}).innerText(),/50\/50 \(100%\)/);
 await filters(perfect,{correct:50,wrong:0,unanswered:0});
 await perfect.screenshot({path:path.join(evidence,'perfect-results.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 const result={status:'PASS',questions:50,types:count('type'),difficulty:count('difficulty'),prep,exam,externalRequests:requests.length,browserErrors:errors.length,
  checks:['all items in Prep and Exam','perfect run 50/50','correct/wrong/unanswered per type','blank case/whitespace normalization','identifier punctuation strictness','alternate concept aliases','Prep locking','Exam feedback hidden','editable Exam answers','backtracking','flags','submission confirmation','deadline timeout','expired reopen','resume and shuffle persistence','separate attempts','filter totals','reset cancel and confirm','storage read and write failure','keyboard','360/375/768/1440 layouts','offline file://']};
 fs.writeFileSync(path.join(evidence,'verification.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
 await ctx.close();await ns.close();await wb.close();await perfectContext.close();
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>browser?.close());
