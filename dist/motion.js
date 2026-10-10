// A cancellable presentation layer; no network request or LLM is involved.
export class ResponseMotion {
  constructor() { this.current = null; }
  cancel() { if(this.current){this.current.cancelled=true;this.current.wake?.();} this.current=null; }
  begin() { this.cancel(); return this.current={cancelled:false,instant:matchMedia('(prefers-reduced-motion: reduce)').matches,wake:null}; }
  skip() { if(this.current){this.current.instant=true;this.current.wake?.();} }
  async wait(ms,run) {
    if(run.cancelled||run.instant)return;
    await new Promise(resolve=>{const timer=setTimeout(resolve,ms);run.wake=()=>{clearTimeout(timer);resolve();};});
    run.wake=null;
  }
  async type(element,run) {
    if(run.cancelled)return;
    if(run.instant)return;
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    const parts=[];
    while(walker.nextNode()){const node=walker.currentNode;if(node.textContent.trim())parts.push({node,text:node.textContent});}
    parts.forEach(({node})=>node.textContent='');
    element.classList.add('streaming');
    for(const {node,text} of parts){
      let accumulated='';
      for(const word of text.match(/\S+\s*|\s+/g)||[]){
        if(run.cancelled)return;
        if(run.instant){node.textContent=text;break;}
        accumulated+=word;node.textContent=accumulated;
        await this.wait(32,run);
      }
    }
    if(!run.cancelled){parts.forEach(({node,text})=>node.textContent=text);element.classList.remove('streaming');}
  }
}
