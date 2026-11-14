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

 /* 2026/11/14：解答預設隱藏；選擇題點選項即判斷；單一數字答案的題目可以輸入數字核對 */
 EXS().forEach(x=>setEx(x,true));syncAll();
 const keyOf=ex=>{const a=ex.querySelector('.sol-part.答案');if(!a)return null;const m=a.textContent.replace('答案','').trim().match(/^\(?([A-E])\)/);return m?m[1]:null};
 EXS().forEach(ex=>{const opts=ex.querySelector('.prompt .opts');const k=keyOf(ex);
  if(opts&&k){opts.classList.add('mc');const ps=[...opts.querySelectorAll('p')].filter(p=>/^\s*\([A-E]\)/.test(p.textContent));
   const fb=document.createElement('div');fb.className='mc-fb';fb.hidden=true;opts.after(fb);
   ps.forEach(p=>{const L=p.textContent.trim()[1];p.dataset.k=L;p.tabIndex=0;p.setAttribute('role','button');
    const pick=()=>{if(opts.classList.contains('done'))return;opts.classList.add('done');ps.forEach(q=>{if(q.dataset.k===k)q.classList.add('is-key')});
     if(L!==k)p.classList.add('is-wrong');fb.hidden=false;fb.className='mc-fb '+(L===k?'ok':'bad');
     fb.innerHTML=(L===k?'答對了！':'答錯了，你選 ('+L+')，正確答案是 ('+k+')。')+' <button type="button">重新作答</button>';
     fb.querySelector('button').onclick=()=>{opts.classList.remove('done');ps.forEach(q=>q.classList.remove('is-key','is-wrong'));fb.hidden=true;setEx(ex,true);syncAll()};
     setEx(ex,false);syncAll()};
    p.onclick=pick;p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}}});
   const h=document.createElement('p');h.className='mc-hint';h.textContent='點選一個選項作答';opts.before(h);return}
  const a=ex.querySelector('.sol-part.答案');if(!a)return;const cl=a.cloneNode(true);cl.querySelectorAll('.sol-t').forEach(x=>x.remove());cl.querySelectorAll('.katex').forEach(k=>{const an=k.querySelector('annotation');k.replaceWith(document.createTextNode(an?an.textContent:k.textContent))});const raw=cl.textContent.replace(/\\,/g,'').replace(/\{,\}/g,',').trim();
  const m=raw.match(/^約?\s*\$?\\?\(?\s*(−|-)?\s*([\d,]+(?:\.\d+)?)\s*\\?\)?\s*(%)?\s*[。．.]?$/);if(!m)return;
  const v=parseFloat(((m[1]?'-':'')+m[2]).replace(/,/g,'')),d=(m[2].split('.')[1]||'').length;
  const box=document.createElement('div');box.className='num-box';box.innerHTML='<label>輸入你的答案 <input type="text" inputmode="decimal" autocomplete="off"></label><span class="num-tip">'+(d?'四捨五入到小數第 '+d+' 位':'取到整數')+'</span><button type="button">核對</button><span class="num-res"></span>';
  ex.querySelector('button.reveal').before(box);const inp=box.querySelector('input'),res=box.querySelector('.num-res');
  const go=()=>{const s=inp.value.replace(/[−－]/g,'-').replace(/[,\s%＋+]/g,'');if(!s)return;const x=parseFloat(s),tol=.51*Math.pow(10,-d)+1e-9;
   const ok=isFinite(x)&&(Math.abs(x-v)<=tol||(m[3]&&Math.abs(x*100-v)<=tol));box.className='num-box '+(ok?'ok':'bad');res.textContent=ok?'✓ 正確':'✗ 正確答案 '+raw.replace(/[。．]$/,'');setEx(ex,false);syncAll()};
  box.querySelector('button').onclick=go;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}}});
 window.srmReady=true;});
