import {scenarios} from './scenarios.js';
import {canvas,summary,esc} from './views.js';
import {ResponseMotion} from './motion.js';
const $=s=>document.querySelector(s),chat=$('#conversation'),motion=new ResponseMotion();
const initial=id=>({id,answers:[],rate:10,growth:5,delay:2,years:null,plan:null,card:null,year:'first',followups:[],busy:false});
let state=initial(null);
const scenario=()=>scenarios.find(s=>s.id===state.id);
const answers=()=>Object.fromEntries((scenario()?.questions||[]).slice(0,state.answers.length).map((q,i)=>[q.key,q.options[state.answers[i]].value]));
const contexts={bonus:'Allocation guide',home:'Home decision guide',emergency:'Cash-flow guide',card:'Card comparison guide'};
const resultNames={bonus:'allocation planner',home:'home decision workspace',emergency:'cash-flow dashboard',card:'card shortlist'};
const assistant=(html,extra='',id='')=>`<section class="assistant" ${id?`id="${id}"`:''}><div class="avatar" aria-hidden="true">m<span></span></div><div class="message-wrap"><div class="message-name">Mira <span>· ${state.id?contexts[state.id]:'Your money guide'}</span></div><div class="bubble">${html}</div>${extra}</div></section>`;
const user=text=>`<div class="user-message"><div class="user-bubble"><span class="sr-only">You: </span>${esc(text)}</div><span class="you-avatar" aria-hidden="true">You</span></div>`;
const facts=items=>`<div class="fact-list">${items.map(f=>`<span class="fact-chip">${f}</span>`).join('')}</div>`;
const followups=[{id:'changes',label:'What could change this result?'},{id:'summary',label:'Give me the short version'}];
$('#scenario-nav').innerHTML=scenarios.map(c=>`<button class="nav-item" data-scenario="${c.id}"><span class="nav-icon" aria-hidden="true">${c.icon}</span>${c.short}</button>`).join('');
function setBusy(value){state.busy=value;$('#skip-response').hidden=!value;$('#back').disabled=value;chat.setAttribute('aria-busy',String(value));$('#composer-hint').textContent=value?'Mira is preparing your response…':!state.id?'Pick a situation to begin.':state.answers.length<3?'Choose a reply to keep the conversation going.':'Explore your workspace or ask Mira a follow-up.';}
function home(){motion.cancel();state=initial(null);render();$('#chat-scroll').scrollTop=0;}
async function start(id){if(!scenarios.some(s=>s.id===id))throw new Error('Unknown scenario');motion.cancel();state=initial(id);render();$('#chat-scroll').scrollTop=0;await playNew(0);}
async function choose(index){if(state.busy)throw new Error('Wait for the current response');const q=scenario()?.questions[state.answers.length];if(!q||!Number.isInteger(index)||!q.options[index])throw new Error('Reply is not available');const oldCount=chat.querySelectorAll('.assistant').length;state.answers.push(index);state.followups=[];const a=answers();if(a.delay)state.delay=a.delay;render();await playNew(oldCount);}
function loading(analysis=false){return analysis?`<div class="analysis-loading"><div class="analysis-top"><span class="spark-spin">✦</span><div><strong>Building your ${resultNames[state.id]}</strong><span>Using your priorities and the sample numbers</span></div></div><div class="analysis-progress" role="progressbar" aria-label="Preparing comparison" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><div class="analysis-stages"><span>Understand context</span><span>Compare paths</span><span>Shape your view</span></div></div>`:`<div class="thinking" role="status"><span class="typing-dots"><i></i><i></i><i></i></span><span>Mira is thinking</span></div>`;}
async function playNew(count){
 const run=motion.begin(),sections=[...chat.querySelectorAll('.assistant')].slice(count);setBusy(true);
 const records=sections.map(el=>{const bubble=el.querySelector('.bubble'),html=bubble.innerHTML,extras=[...el.querySelector('.message-wrap').children].filter(x=>!x.classList.contains('bubble')&&!x.classList.contains('message-name'));el.hidden=true;extras.forEach(x=>x.hidden=true);return {el,bubble,html,extras};});
 const follow=$('#followup-area .followup-choices');if(follow)follow.hidden=true;
 for(let i=0;i<records.length;i++){
  const {el,bubble,html,extras}=records[i];if(run.cancelled)return;el.hidden=false;
  const analysis=el.id==='result-message';
  if(i===0||analysis){bubble.innerHTML=loading(analysis);el.scrollIntoView({block:'nearest',behavior:run.instant?'instant':'smooth'});$('#response-status').textContent=analysis?'Preparing your '+resultNames[state.id]:'Mira is thinking';
   if(analysis&&!run.instant){for(let step=0;step<4;step++){if(run.cancelled)return;const progress=bubble.querySelector('[role="progressbar"]');progress?.setAttribute('aria-valuenow',String(step*25));await motion.wait(500,run);}}
   else await motion.wait(2000,run);
  }
  if(run.cancelled)return;bubble.innerHTML=html;$('#response-status').textContent='Mira is responding';await motion.type(bubble,run);if(run.cancelled)return;extras.forEach(x=>x.hidden=false);
  if(analysis){el.querySelector('.decision-canvas')?.classList.add('canvas-reveal');el.scrollIntoView({block:'start',behavior:run.instant?'instant':'smooth'});}
 }
 if(run.cancelled)return;if(follow)follow.hidden=false;setBusy(false);$('#response-status').textContent=state.answers.length===3?'Your '+resultNames[state.id]+' is ready.':'Choose a suggested reply.';
 const focus=$('#active-step [data-answer]');if(focus){$('#active-step').scrollIntoView({block:'nearest',behavior:run.instant?'instant':'smooth'});focus.focus({preventScroll:true});}
}
function render(){
 const s=scenario();$('#chat-title').textContent=s?s.short:'Your next money move';$('#chat-subtitle').textContent=s?'Mira · '+contexts[s.id]:'Mira · Your personal money guide';
 document.querySelectorAll('.nav-item').forEach(b=>{b.classList.toggle('active',b.dataset.scenario===state.id);if(b.dataset.scenario===state.id)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
 $('#back').hidden=!state.answers.length;setBusy(false);
 if(!s){chat.innerHTML=`<div class="welcome-kicker">A CONVERSATION. A CLEARER DECISION.</div><h1 class="welcome-title">Let’s make your next<br><span>money move make sense.</span></h1><p class="welcome-text">I’m Mira. Tell me what’s on your mind, and we’ll turn the numbers into a view that fits your decision.</p>${assistant('Where would you like to begin?',`<div class="scenario-grid">${scenarios.map(c=>`<button class="scenario-card" data-scenario="${c.id}"><span class="card-icon" aria-hidden="true">${c.icon}</span><strong>${c.name}</strong><p>${c.description}</p><span class="card-bottom">${c.meta} · ${resultNames[c.id]}</span></button>`).join('')}</div><p class="welcome-foot">✦ &nbsp; A different workspace for every kind of decision.</p>`)}`;return;}
 let html=`<div class="journey-heading"><span class="journey-icon">${s.icon}</span><div><div class="welcome-kicker">YOUR DECISION SPACE</div><h1>${s.short}</h1></div></div>`+user(s.intro)+assistant(s.context+facts(s.facts));
 s.questions.forEach((q,i)=>{if(i>state.answers.length)return;const complete=i<state.answers.length;html+=assistant(`<div class="step-label">A little context · ${i+1} of 3</div><p>${q.text}</p>`,complete?'':`<div class="choices" role="group" aria-label="Suggested replies">${q.options.map((o,j)=>`<button class="choice" data-answer="${j}">${o.label}</button>`).join('')}</div>`,complete?'':'active-step');if(complete){const o=q.options[state.answers[i]];html+=user(o.reply)+assistant(o.response);}});
 if(state.answers.length===3){html+=assistant(`I’ve put together your ${resultNames[state.id]}. Let’s explore what matters most to you.`,`<div class="decision-canvas ${state.id}-canvas" id="decision-canvas">${canvas(state,answers())}</div>`,'result-message');html+=followupSection();}
 chat.innerHTML=html;
}
function followupSection(){return `<div id="followup-area">${state.followups.map(f=>user(followups.find(x=>x.id===f.id).label)+assistant(esc(f.text))).join('')}<div class="followup-choices"><div class="step-label">ASK MIRA</div><div class="choices">${followups.map(f=>`<button class="choice" data-followup="${f.id}">${f.label}</button>`).join('')}<button class="choice" data-restart>Change my answers</button><button class="choice primary" data-home>Explore another situation</button></div></div></div>`;}
const changeText={bonus:'The investment return, your need for cash, loan-rate changes, and prepayment fees can all change the trade-off. Try the allocation buttons as well as a lower return. The higher projected number is not automatically the best fit.',home:'Home appreciation and how long you stay can change the outcome substantially. The forecast also assumes you consistently invest the savings from renting. A different loan rate or renovation cost would change the result.',emergency:'A late client payment or another expense can reduce your breathing room. Click through the months and funding sources to see where a cash shortfall appears. Remaining fixed deposits are shown separately from bank cash.',card:'Where you shop, excluded spending, fee waivers and how you redeem rewards all affect value. First-year and renewal costs can differ. The linked issuer pages contain the actual eligibility and product terms; this comparison is a sample, not a live offer.'};
async function followup(id){if(state.busy)return;const oldCount=chat.querySelectorAll('.assistant').length;state.followups.push({id,text:id==='summary'?summary(state,answers()):changeText[state.id]});render();await playNew(oldCount);}
function setting(key,value){
 if(state.busy||state.answers.length!==3)return;
 const allowed={bonus:{plan:['repay','split','invest','cash']},home:{years:['3','7','12'],growth:['2','5','8']},emergency:{plan:['savings','fd','emi'],delay:['1','2','3','4','5','6']},card:{card:['hdfc','sbi','icici'],year:['first','renewal']}};
 if(!allowed[state.id]?.[key]?.includes(value))return;
 state[key]=['years','growth','delay'].includes(key)?Number(value):value;state.followups=[];$('#decision-canvas').innerHTML=canvas(state,answers());$('#followup-area').outerHTML=followupSection();$(`[data-setting="${key}"][data-value="${value}"]`)?.focus({preventScroll:true});$('#response-status').textContent='Comparison updated.';
}
function updateRange(value){if(state.busy||state.id!=='bonus'||!Number.isFinite(value)||value< -5||value>15)return;state.rate=value;state.followups=[];const template=document.createElement('div');template.innerHTML=canvas(state,answers());const fresh=[...template.children];[...$('#decision-canvas').children].forEach((old,i)=>{if(old.classList.contains('what-if')){old.querySelector('output').textContent=fresh[i].querySelector('output').textContent;old.querySelector('input').setAttribute('aria-valuetext',`${value}% per year`);}else old.replaceWith(fresh[i]);});$('#followup-area').outerHTML=followupSection();}
document.addEventListener('click',e=>{const b=e.target.closest('button,a.brand');if(!b)return;if(b.matches('[data-home],.brand')){e.preventDefault();home();}else if(b.dataset.scenario)void start(b.dataset.scenario);else if(b.id==='skip-response')motion.skip();else if(b.matches('#restart,[data-restart]')){if(state.id)void start(state.id);else home();}else if(state.busy)return;else if(b.dataset.answer!==undefined)void choose(Number(b.dataset.answer));else if(b.id==='back'&&state.answers.length){motion.cancel();state.answers.pop();state.followups=[];state.plan=null;state.card=null;render();$('#active-step')?.scrollIntoView({block:'nearest'});}else if(b.dataset.followup)void followup(b.dataset.followup);else if(b.dataset.setting)setting(b.dataset.setting,b.dataset.value);});
document.addEventListener('input',e=>{if(e.target.dataset.range==='rate')updateRange(Number(e.target.value));});
// Optional browser-agent actions use the same awaited UI transitions.
if(document.modelContext?.registerTool){const lifecycle=new AbortController();const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'start_moneycanvas_scenario',description:'Start a guided sample conversation and wait until replies are ready.',inputSchema:{type:'object',properties:{scenario:{type:'string',enum:scenarios.map(s=>s.id)}},required:['scenario'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{await start(input.scenario);return {scenario:state.id,question:scenario()?.questions[0].text};}});
 register({name:'choose_moneycanvas_reply',description:'Select a zero-based reply index and wait for the guided response.',inputSchema:{type:'object',properties:{index:{type:'integer',minimum:0,maximum:2}},required:['index'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{await choose(input.index);return {scenario:state.id,answers:answers(),complete:state.answers.length===3};}});
 addEventListener('pagehide',()=>{motion.cancel();lifecycle.abort();});
}
home();
