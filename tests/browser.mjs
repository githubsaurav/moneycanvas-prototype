import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results/screenshots',{recursive:true});
await page.goto('http://127.0.0.1:4173');
await page.screenshot({path:'test-results/screenshots/welcome-desktop.png'});
let count=0;
const scenarios=[['bonus',[3,2,2],'rate'],['home',[3,2,2],'growth'],['emergency',[3,3,2],'delay'],['card',[3,2,2],'travel']];
for(const [id,sizes,control] of scenarios){
 for(let a=0;a<sizes[0];a++)for(let b=0;b<sizes[1];b++)for(let c=0;c<sizes[2];c++){
  await page.locator(`.nav-item[data-scenario="${id}"]`).click();
  for(const index of [a,b,c])await page.locator(`[data-answer="${index}"]`).click();
  assert.equal(await page.locator('#decision-canvas').count(),1);
  assert.ok(!(await page.locator('#decision-canvas').innerText()).match(/NaN|undefined|Infinity/),id+' '+[a,b,c]+' '+await page.locator('#decision-canvas').innerText());
  count++;
 }
 await page.locator('[data-followup="summary"]').click();
 assert.ok((await page.locator('#followup-area').innerText()).length>150);
 await page.locator('[data-followup="changes"]').click();
 await page.locator('#'+control).focus();
 const before=await page.locator('#'+control).inputValue();
 await page.keyboard.press('ArrowRight');
 const after=await page.locator('#'+control).inputValue();
 assert.notEqual(after,before);
 const range=page.locator('#'+control), box=await range.boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.85,box.y+box.height/2,{steps:8});await page.mouse.up();
 assert.ok(Number(await range.inputValue())>Number(before),'slider supports continuous pointer drag');
 assert.equal(await page.locator('#followup-area .user-message').count(),0,'old summaries clear when assumptions change');
 console.log('Checked '+id+' conversation branches, controls and follow-ups');
 await page.locator('#decision-canvas').screenshot({path:`test-results/screenshots/${id}-canvas.png`});
 await page.locator('#back').click();
 assert.equal(await page.locator('#decision-canvas').count(),0);
 assert.equal(await page.locator('#active-step .step-label').innerText(),'QUESTION 3 OF 3');
 await page.locator('[data-answer="0"]').click();
 await page.getByRole('button',{name:'Restart conversation',exact:true}).click();
 assert.equal(await page.locator('#active-step .step-label').innerText(),'QUESTION 1 OF 3');
}
await page.getByRole('button',{name:'Scenarios',exact:true}).click();
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'test-results/screenshots/welcome-mobile.png'});
for(const [id,,control] of scenarios){
 await page.locator(`.scenario-card[data-scenario="${id}"]`).click();
 for(let i=0;i<3;i++)await page.locator('[data-answer="0"]').click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const overflow=await page.locator('#decision-canvas').evaluate(e=>e.scrollWidth>e.clientWidth+2);assert.equal(overflow,false,id+' mobile canvas overflows');
 if(id==='emergency')await page.screenshot({path:'test-results/screenshots/emergency-mobile.png'});
 await page.getByRole('button',{name:'Scenarios',exact:true}).click();
}
// Optional WebMCP API: a supported stub verifies registration, real actions, and error handling.
const agentPage=await browser.newPage();
await agentPage.addInitScript(()=>{window.registeredTools={};Object.defineProperty(document,'modelContext',{value:{registerTool(tool){window.registeredTools[tool.name]=tool;}}});});
await agentPage.goto('http://127.0.0.1:4173');
await agentPage.waitForFunction(()=>Object.keys(window.registeredTools).length===2);
const agentResult=await agentPage.evaluate(()=>{const t=window.registeredTools;t.start_moneycanvas_scenario.execute({scenario:'bonus'});t.choose_moneycanvas_reply.execute({index:0});t.choose_moneycanvas_reply.execute({index:0});return t.choose_moneycanvas_reply.execute({index:0});});
assert.equal(agentResult.complete,true);assert.equal(await agentPage.locator('#decision-canvas').count(),1);
const invalid=await agentPage.evaluate(()=>{try{window.registeredTools.start_moneycanvas_scenario.execute({scenario:'missing'});return false;}catch{return true;}});assert.equal(invalid,true);
assert.deepEqual(errors,[]);
console.log(JSON.stringify({desktopBranches:count,mobileScenarios:4,sliderControls:4,followups:true,backAndRestart:true,webMcpAdapter:true,runtimeErrors:errors}));
await browser.close();
