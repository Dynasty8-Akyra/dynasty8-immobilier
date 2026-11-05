const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navlinks');
if(toggle&&nav)toggle.addEventListener('click',()=>nav.classList.toggle('open'));

(function(){
  const original=document.getElementById('intro');
  if(!original)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const replay=document.getElementById('replayIntro');
  let active=null, timer=null, closeTimer=null;
  function close(){
    if(!active)return;
    const node=active; active=null;
    clearTimeout(timer);
    node.classList.add('is-closing');
    document.body.classList.remove('intro-active');
    closeTimer=setTimeout(()=>node.remove(),550);
  }
  function play(){
    if(active)close();
    clearTimeout(closeTimer);
    const node=original.cloneNode(true);
    node.id='intro-active';
    node.classList.remove('is-closing');
    if(original.isConnected)original.remove();
    document.body.appendChild(node);
    active=node;
    document.body.classList.add('intro-active');
    node.querySelector('.intro-skip')?.addEventListener('click',close);
    timer=setTimeout(close,reduced?650:4700);
  }
  replay?.addEventListener('click',play);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  play();
})();
