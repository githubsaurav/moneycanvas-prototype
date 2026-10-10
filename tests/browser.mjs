import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.BASE_URL||'http://127.0.0.1:4173';
await mkdir('test-results/screenshots',{recursive:true});
await page.goto(base);
const idle=()=>page.waitForFunction(()=>document.querySelector('#conversation').getAttribute('aria-busy')==='false');
async function path(id,choices=[0,0,0]){await page.locator(`.nav-item[data-scenario="${id}"]`).click();await idle();for(const n of choices){await page.locator(`[data-answer="${n}"]`).click();await idle();}}
let count=0;
for(const [id,sizes] of [['bonus',[3,2,2]],['home',[3,2,2]],['emergency',[3,3,2]],['card',[3,2,2]]]){
 for(let a=0;a<sizes[0];a++)for(let b=0;b<sizes[1];b++)for(let c=0;c<sizes[2];c++){
  await path(id,[a,b,c]);assert.equal(await page.locator('#decision-canvas').count(),1);
  assert.ok(!(await page.locator('#decision-canvas').innerText()).match(/NaN|undefined|Infinity/),id);count++;
 }
 await page.locator('[data-followup="summary"]').click();await idle();assert.ok((await page.locator('#followup-area .bubble').innerText()).length>100);
 await page.locator('[data-followup="changes"]').click();await idle();
 if(id==='bonus'){
  await page.locator('[data-setting="plan"][data-value="repay"]').click();assert.ok((await page.locator('.allocation-legend').innerText()).includes('₹3,00,000'));
  const slider=page.locator('#rate');await slider.focus();const before=await slider.inputValue();await page.keyboard.press('ArrowRight');assert.notEqual(await slider.inputValue(),before);
  const box=await slider.boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+10);await page.mouse.down();await page.mouse.move(box.x+box.width*.85,box.y+10,{steps:8});await page.mouse.up();assert.ok(Number(await slider.inputValue())>Number(before));
 }else if(id==='home'){
  await page.locator('[data-setting="years"][data-value="3"]').click();assert.equal(await page.locator('[data-setting="years"][data-value="3"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-setting="growth"][data-value="8"]').click();assert.equal(await page.locator('.forecast svg').count(),1);
 }else if(id==='emergency'){
  await page.locator('[data-setting="plan"][data-value="savings"]').click();await page.locator('[data-setting="delay"][data-value="6"]').click();assert.ok((await page.locator('.insight').innerText()).includes('cash gap'));
 }else{
  for(const bank of ['hdfc','sbi','icici']){await page.locator(`[data-setting="card"][data-value="${bank}"]`).click();assert.equal(await page.locator(`[data-setting="card"][data-value="${bank}"]`).getAttribute('aria-pressed'),'true');}
  await page.locator('[data-setting="year"][data-value="renewal"]').click();assert.ok((await page.locator('.card-detail').innerText()).includes('Renewal fee'));
 }
 assert.equal(await page.locator('#followup-area .user-message').count(),0);
 await page.setViewportSize({width:1440,height:1800});await page.locator('#result-message').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`test-results/screenshots/${id}-workspace.png`});await page.setViewportSize({width:1440,height:1100});
 await page.locator('#back').click();assert.equal(await page.locator('#decision-canvas').count(),0);assert.ok((await page.locator('#active-step').innerText()).includes('3 OF 3'));
 await page.getByRole('button',{name:'Restart conversation',exact:true}).click();await idle();assert.ok((await page.locator('#active-step').innerText()).includes('1 OF 3'));
 console.log('Passed '+id+' branches and workspace controls');
}
await page.getByRole('button',{name:'Scenarios',exact:true}).click();await page.screenshot({path:'test-results/screenshots/welcome-desktop.png'});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/screenshots/welcome-mobile.png'});
for(const id of ['bonus','home','emergency','card']){
 await page.locator(`.scenario-card[data-scenario="${id}"]`).click();await idle();for(let i=0;i<3;i++){await page.locator('[data-answer="0"]').click();await idle();}
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('#decision-canvas').evaluate(e=>e.scrollWidth<=e.clientWidth+2));
 await page.locator('#decision-canvas').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`test-results/screenshots/${id}-mobile.png`});
 if(id==='card'){await page.locator('[data-setting="card"][data-value="hdfc"]').click();assert.equal(await page.locator('[data-setting="card"][data-value="hdfc"]').getAttribute('aria-pressed'),'true');}
 await page.getByRole('button',{name:'Scenarios',exact:true}).click();
}
// Real-time checks use normal motion: a two-second pause, streaming, skip, and cancellation.
const animated=await browser.newPage({viewport:{width:1280,height:1000}});animated.on('pageerror',e=>errors.push(e.message));await animated.goto(base);
await animated.locator('.scenario-card[data-scenario="bonus"]').click();
assert.equal(await animated.locator('.thinking').count(),1);
await animated.waitForTimeout(1000);assert.equal(await animated.locator('.thinking').count(),1);
await animated.waitForTimeout(1150);assert.equal(await animated.locator('.streaming').count(),1);
const partial=await animated.locator('.streaming').textContent();assert.ok(partial.length>0&&partial.length<200);
await animated.locator('#skip-response').click();await animated.waitForFunction(()=>document.querySelector('#conversation').getAttribute('aria-busy')==='false');
for(let i=0;i<3;i++){
 await animated.locator('[data-answer="0"]').dblclick();
 if(i<2){await animated.locator('#skip-response').click();await animated.waitForFunction(()=>document.querySelector('#conversation').getAttribute('aria-busy')==='false');}
}
await animated.locator('.analysis-progress').waitFor({state:'visible',timeout:15000});assert.equal(await animated.locator('#decision-canvas').isVisible(),false);
await animated.screenshot({path:'test-results/screenshots/analysis-state.png'});
await animated.waitForTimeout(1000);assert.equal(await animated.locator('.analysis-progress').isVisible(),true);
await animated.waitForFunction(()=>document.querySelector('#conversation').getAttribute('aria-busy')==='false');assert.equal(await animated.locator('#decision-canvas').isVisible(),true);
await animated.locator('[data-followup="summary"]').click();assert.equal(await animated.locator('#followup-area .thinking').isVisible(),true);await animated.locator('#skip-response').click();await animated.waitForFunction(()=>document.querySelector('#conversation').getAttribute('aria-busy')==='false');
await animated.locator('.nav-item[data-scenario="bonus"]').click();await animated.locator('.nav-item[data-scenario="card"]').click();await animated.getByRole('button',{name:'Scenarios',exact:true}).click();await animated.waitForTimeout(2200);assert.equal(await animated.locator('.scenario-card').count(),4);assert.equal(await animated.locator('.thinking').count(),0);
assert.deepEqual(errors,[]);
console.log(JSON.stringify({branches:count,mobile:4,distinctWorkspaces:4,thinkingDelay:true,streaming:true,analysisProgress:true,skip:true,cancel:true,doubleClickGuard:true,errors}));
await browser.close();
