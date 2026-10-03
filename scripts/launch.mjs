import {spawn,execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const url='http://127.0.0.1:4173';
const ready=async()=>{try{const r=await fetch(url,{signal:AbortSignal.timeout(700)});return r.ok&&(await r.text()).includes('MoneyCanvas');}catch{return false;}};
if(await ready()){execFile('open',[url]);}else{
 const server=spawn(process.execPath,[fileURLToPath(new URL('./serve.mjs',import.meta.url))],{stdio:'inherit'});
 server.on('exit',code=>process.exit(code??0));
 let launched=false;
 for(let i=0;i<30;i++){if(await ready()){execFile('open',[url]);launched=true;break;}await new Promise(r=>setTimeout(r,150));}
 if(!launched)console.error('The preview could not start. Check the server message above; port 4173 may be in use.');
}
