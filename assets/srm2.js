document.addEventListener('DOMContentLoaded',()=>{
 const sel=document.getElementById('chapter');if(sel)sel.onchange=()=>location.href=sel.value;
 const EXS=()=>[...document.querySelectorAll('.exercise')];
 const setEx=(ex,f)=>{ex.classList.toggle('folded',f);const r=ex.querySelector('button.reveal');if(r){r.textContent=f?'顯示解答':'隱藏解答';r.setAttribute('aria-expanded',String(!f))}};
 const syncAll=()=>{const open=EXS().some(x=>!x.classList.contains('folded'));document.querySelectorAll('button.toggle-all').forEach(b=>{b.textContent=open?'隱藏全部解答':'顯示全部解答';b.setAttribute('aria-pressed',String(!open))})};
 document.addEventListener('click',e=>{const t=e.target.closest('button.toggle-all');if(t){const open=EXS().some(x=>!x.classList.contains('folded'));EXS().forEach(x=>setEx(x,open));syncAll();return}
  const b=e.target.closest('button.reveal');if(!b)return;const ex=b.closest('.exercise');setEx(ex,!ex.classList.contains('folded'));syncAll()});
 window.mathIssues=[];renderMathInElement(document.querySelector('main'),{delimiters:[{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],strict:'ignore',throwOnError:false,errorCallback:m=>window.mathIssues.push(m)});
 document.querySelectorAll('main table').forEach(t=>{const d=document.createElement('div');d.className='tabwrap';t.before(d);d.append(t)});
 let pop,active,timer;const hide=()=>{if(pop)pop.remove();pop=null;active=null};
 const save=a=>{try{sessionStorage.setItem('srm-return',JSON.stringify({url:location.href,y:scrollY,to:new URL(a.href,location.href).pathname,label:document.title.split('｜')[0]}))}catch{}};
 const open=a=>{clearTimeout(timer);if(active===a)return;hide();active=a;pop=document.createElement('aside');pop.className='pop';const p=document.createElement('p');p.textContent=a.dataset.definition;const g=document.createElement('a');g.href=a.href;g.textContent='前往：'+a.dataset.target;g.onclick=()=>save(a);pop.append(p,g);document.body.append(pop);const r=a.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(r.left,innerWidth-pop.offsetWidth-8))+'px';pop.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-pop.offsetHeight-8))+'px';pop.onmouseenter=()=>clearTimeout(timer);pop.onmouseleave=()=>timer=setTimeout(hide,200)};
 document.querySelectorAll('a.concept').forEach(a=>{a.onmouseenter=()=>{if(matchMedia('(hover:hover)').matches)open(a)};a.onmouseleave=()=>timer=setTimeout(hide,220);a.onclick=e=>{if(matchMedia('(hover:none)').matches&&active!==a){e.preventDefault();open(a)}else save(a)}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});document.addEventListener('pointerdown',e=>{if(pop&&!pop.contains(e.target)&&!e.target.closest('.concept'))hide()});
 try{const o=JSON.parse(sessionStorage.getItem('srm-return')||'null');if(o&&o.to===location.pathname&&o.url!==location.href){const b=document.createElement('button');b.className='back';b.textContent='← 回到'+o.label;b.onclick=()=>{sessionStorage.setItem('srm-restore',JSON.stringify(o));sessionStorage.removeItem('srm-return');location.href=o.url};document.body.append(b)}
  const pos=JSON.parse(sessionStorage.getItem('srm-restore')||'null');if(pos&&pos.url===location.href){sessionStorage.removeItem('srm-restore');document.fonts.ready.then(()=>requestAnimationFrame(()=>scrollTo(0,pos.y)))}}catch{}
 window.srmReady=true;});
