import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/fraunces/opsz-italic.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@fontsource-variable/lora/index.css';
import '@fontsource-variable/lora/wght-italic.css';
import './style.css';

const WORDS = [
  "kerning","typography","avocado","layout","voyage","tavern","wavelength","folio","ligature","serif",
  "italic","baseline","descender","glyph","widow","orphan","toronto","lavinia","woven","zephyr",
  "avatar","wavy","volta","taxi","pavlova","kayak","away","vortex","yawn","tawny","wary","lava",
  "office","finish","first","fist","flower","coffin","affinity","staff","shift","waffle","suffice",
  "stiff","fiction","official","profile","flavor","reflex","stylist","artist","castle","honest",
  "mostly","forest","frost","twist","lofty","drift","fifty","difficult","effect","cliff","sniff",
  "action","doctor","factor","victory","perfect","strict","instinct","traffic","griffin","muffin",
  "waverly","wayward","tally","yvonne","tatiana","lyric","vowel","trove","aviary","ravioli",
  "favorite","pavement","leverage","juvenile","novelty","velvet","tavola","lavish","gravity","swivel"
];
const LIG = ["ffi","ffl","ff","fi","fl","st","ct"];
const FONTS = [
  ['"Fraunces Variable",serif',400],['"Fraunces Variable",serif',700],['"Space Grotesk",sans-serif',500],
  ['"Libre Baskerville",serif',400],['"Lora Variable",serif',500]
];
const TOTAL=30;
const $ = id => document.getElementById(id);
const wordEl=$('word'), bar=$('bar'), verdict=$('verdict'), hint=$('hint');
let score=0, streak=0, best=0, lives=3, round=0, answered=false, timer=null, deadline=0;
let gapIdx=0, delta=0, curWord='', n=0, live=-1, liveDelta=0, fixed=false;
let sel=-1;   // the gap under the mouse or picked with the keys, marked with a caret; -1 when none
const touch=matchMedia('(pointer: coarse)').matches;
try{ best = +localStorage.getItem('kh-best') || 0; }catch(e){}

function sizeWord(){
  const land=window.innerWidth>window.innerHeight;
  const vw=Math.min(window.innerWidth, land?1100:560), cap=land?Math.min(220,window.innerHeight*0.42):118;
  wordEl.style.fontSize=Math.max(34, Math.min(cap, (vw*0.92)/((n||8)*0.62)))+'px';
}
window.addEventListener('resize',()=>{ if(n) sizeWord(); });
function setStats(){
  $('score').textContent=score; $('streak').textContent=streak; $('rnd').textContent=Math.min(round,TOTAL);
  $('lives').textContent='●'.repeat(lives)+'○'.repeat(3-lives);
}
function difficulty(){ const t=(round-1)/(TOTAL-1); return { mag: 0.20 - 0.13*t, time: 7000 - 3500*t, lig: t>0.2 ? 0.5 : 0 }; }

// ---- rendering: the word is text runs split only where a gap is being adjusted, so ligatures survive ----
function render(){
  const marks=[...wordEl.querySelectorAll('.mark')];
  const cuts=new Set([gapIdx]); if(live>=0) cuts.add(live);
  wordEl.querySelectorAll('.run').forEach(r=>r.remove());
  let from=0; const sorted=[...cuts].sort((a,b)=>a-b);
  for(const c of [...sorted, n-1]){
    const sp=document.createElement('span'); sp.className='run'; sp.textContent=curWord.slice(from,c+1); sp.dataset.from=from;
    const m = c===live ? liveDelta : (c===gapIdx ? (fixed?0:delta) : 0);   // liveDelta already includes the gap's base error
    sp.style.marginRight=m+'em';
    wordEl.insertBefore(sp, marks[0]||null); from=c+1;
    if(from>=n) break;
  }
  wordEl.querySelector('.caret')?.remove();
  if(sel>=0 && !answered) placeMark(sel,'caret');
}
function charRect(j){
  for(const r of wordEl.querySelectorAll('.run')){
    const f=+r.dataset.from, t=r.firstChild;
    if(j>=f && j<f+t.length){ const rg=document.createRange(); rg.setStart(t,j-f); rg.setEnd(t,j-f+1); return rg.getBoundingClientRect(); }
  }
  return wordEl.getBoundingClientRect();
}
function gapMid(i){ return (charRect(i).right+charRect(i+1).left)/2; }
function gapAt(clientX){
  let bestI=0,bestD=1e9;
  for(let i=0;i<n-1;i++){ const d=Math.abs(clientX-gapMid(i)); if(d<bestD){bestD=d;bestI=i;} }
  return bestI;
}
function pair(i){ return curWord[i]+'|'+curWord[i+1]; }
function placeMark(i,cls){
  const m=document.createElement('span'); m.className='mark '+cls;
  m.style.left=(gapMid(i)-wordEl.getBoundingClientRect().left)+'px';
  wordEl.appendChild(m);
}

function pickWord(){
  const {lig}=difficulty();
  if(Math.random()<lig){
    const cands=WORDS.filter(w=>LIG.some(l=>w.includes(l)));
    const w=cands[Math.floor(Math.random()*cands.length)];
    // target a gap inside the ligature
    const spots=[]; for(const l of LIG){ let i=-1; while((i=w.indexOf(l,i+1))>=0){ for(let k=i;k<i+l.length-1;k++) spots.push(k); } }
    return [w, spots[Math.floor(Math.random()*spots.length)]];
  }
  const w=WORDS[Math.floor(Math.random()*WORDS.length)];
  return [w, 1+Math.floor(Math.random()*(w.length-2))];
}

function nextRound(){
  round++; answered=false; fixed=false; live=-1; sel=-1;
  const {mag,time}=difficulty();
  [curWord,gapIdx]=pickWord(); n=curWord.length;
  const [fam,wt]=FONTS[Math.floor(Math.random()*FONTS.length)];
  const tight=Math.random()<0.5;
  delta=(tight?-1:1)*(mag*(0.85+Math.random()*0.3));
  wordEl.className='word pop';
  wordEl.style.fontFamily=fam; wordEl.style.fontWeight=wt;
  wordEl.style.fontStyle = Math.random()<0.2 ? 'italic':'normal';
  sizeWord();
  wordEl.innerHTML=''; render();
  verdict.textContent=''; verdict.className='verdict';
  hint.textContent = round>2 ? '' : touch ? 'Pinch or spread on the gap that looks wrong.' : 'Click on the gap that looks wrong.';
  setStats();
  clearTimeout(timer);
  deadline=performance.now()+time;
  bar.style.transition='none'; bar.style.transform='scaleX(1)';
  requestAnimationFrame(()=>{ bar.style.transition=`transform ${time}ms linear`; bar.style.transform='scaleX(0)'; });
  timer=setTimeout(()=>resolve(-1,0),time);
}

let lastGuess=-1,lastDir=0;
function resolve(guess,dir){
  if(answered) return; answered=true;
  clearTimeout(timer); bar.style.transition='none';
  const remain=Math.max(0,deadline-performance.now());
  lastGuess=guess; lastDir=dir; live=-1;
  const needDir = delta>0 ? -1 : 1;
  const ok = guess===gapIdx && dir===needDir;
  wordEl.classList.add('answered');
  const which = delta<0 ? 'too tight' : 'too loose', tgt=pair(gapIdx);
  if(ok){
    streak++;
    const gain=100+Math.round(remain/100)*Math.min(streak,10); score+=gain;
    verdict.textContent=`+${gain}. ${tgt} was ${which}.`; verdict.className='verdict ok';
    fixed=true; render();
  }else{
    streak=0; lives--;
    verdict.textContent = guess<0 ? `Out of time. ${tgt} was ${which}.`
      : guess===gapIdx ? `Right gap, wrong way. ${tgt} was ${which}.`
      : `You called ${pair(guess)}. It was ${tgt}, ${which}.`;
    verdict.className='verdict bad'; wordEl.classList.add('shake');
    fixed=false; render();
    placeMark(gapIdx, delta<0?'space':'closeup');
    if(guess>=0 && guess!==gapIdx) placeMark(guess,'guess '+(dir<0?'closeup':'space'));
  }
  setStats(); hint.textContent='';
  const hold = ok ? 350 : 1100, fly = 650;
  setTimeout(()=>{
    wordEl.classList.add('leave');
    setTimeout(()=>{ wordEl.classList.remove('leave'); if(lives<=0||round>=TOTAL) gameOver(); else nextRound(); }, fly);
  }, hold);
}

// ---- live adjustment of a gap during a gesture ----
function setLive(i,px){
  if(i<0){ live=-1; render(); return; }
  const fs=parseFloat(wordEl.style.fontSize);
  const base = i===gapIdx ? delta : 0;
  let v=base+px/fs;
  if(i===gapIdx && (delta>0 && v<=0 || delta<0 && v>=0)){ // reached proper kerning: settles the round
    pts.clear(); origin.clear(); mode=''; resolve(i, delta>0?-1:1); return;
  }
  live=i; liveDelta=Math.max(-0.45, Math.min(0.9, v)); render();
}

// ---- input: two-finger pinch/spread (gap = where the motion converges), one-finger drag, mouse click ----
const pts=new Map(), origin=new Map(); let mode='', startX=0, startDist=0, dirLocked=0;
function TH(){ return Math.max(14, parseFloat(wordEl.style.fontSize)*0.18); }
function convergeX(){
  const ids=[...pts.keys()].slice(0,2);
  const [a0,b0]=ids.map(k=>origin.get(k)), [a1,b1]=ids.map(k=>pts.get(k));
  const va=a1.x-a0.x, vb=b1.x-b0.x, rel=va-vb;
  if(Math.abs(rel)<2) return (a1.x+b1.x)/2;
  const t=(b1.x-a1.x)/rel; return a1.x+va*t;
}
wordEl.addEventListener('contextmenu',e=>e.preventDefault());
wordEl.addEventListener('pointerdown',e=>{
  if(answered) return;
  if(e.pointerType==='mouse'){            // left click adds space, right click closes up
    e.preventDefault();
    push(gapAt(e.clientX), e.button===2 ? -1 : 1);
    return;
  }
  wordEl.setPointerCapture(e.pointerId);
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); origin.set(e.pointerId,{x:e.clientX,y:e.clientY});
  dirLocked=0;
  if(pts.size===1){ mode='drag'; startX=e.clientX; setLive(gapAt(e.clientX),0); }
  else if(pts.size===2){ mode='pinch'; const [a,b]=[...pts.values()]; startDist=Math.hypot(a.x-b.x,a.y-b.y); setLive(gapAt((a.x+b.x)/2),0); }
});
// animate a push on gap i (dir 1 adds space, -1 closes up), then resolve
function push(i,dir){
  const base=(i===gapIdx?delta:0);
  live=i; liveDelta=Math.max(-0.45,Math.min(0.9, base + dir*0.12)); render();
  setTimeout(()=>{ live=-1; resolve(i,dir); }, 120);
}
wordEl.addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse'){ if(!answered){ const i=gapAt(e.clientX); if(i!==sel){ sel=i; render(); } } return; }
  if(answered||!pts.has(e.pointerId)) return;
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(mode==='pinch' && pts.size>=2){
    const [a,b]=[...pts.values()];
    const d=Math.hypot(a.x-b.x,a.y-b.y)-startDist;
    if(Math.abs(d)>TH()) dirLocked = d<0?-1:1;
    setLive(gapAt(convergeX()), d*0.5);
  }else if(mode==='drag' && pts.size===1){
    const dx=e.clientX-startX;
    if(Math.abs(dx)>TH()) dirLocked = dx<0?-1:1;
    setLive(gapAt(e.clientX), dx*0.6);
  }
});
function endPtr(e){
  if(!pts.has(e.pointerId)) return;
  const commit = (mode==='pinch' && pts.size===2) || (mode==='drag' && pts.size===1);
  pts.delete(e.pointerId); origin.delete(e.pointerId);
  if(answered){ pts.clear(); origin.clear(); return; }
  if(commit && dirLocked){ const sel=live, dir=dirLocked; pts.clear(); origin.clear(); mode=''; dirLocked=0; live=-1; resolve(sel,dir); return; }
  if(pts.size===0){ mode=''; dirLocked=0; setLive(-1,0); }
}
wordEl.addEventListener('pointerup',endPtr); wordEl.addEventListener('pointercancel',endPtr);

wordEl.addEventListener('pointerleave',e=>{ if(e.pointerType==='mouse' && sel>=0){ sel=-1; render(); } });

// keyboard: ← → or A D pick a gap, ↑ or W adds space, ↓ or S closes up
const KEYS={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',w:'up',arrowdown:'down',s:'down'};
document.addEventListener('keydown',e=>{
  const k=KEYS[e.key.toLowerCase()];
  if(!k || e.ctrlKey || e.metaKey || e.altKey || answered || !round || !$('intro').hidden || !$('over').hidden) return;
  e.preventDefault();
  if(sel<0){ sel=Math.floor((n-2)/2); render(); return; }   // the first key shows the caret in the middle of the word
  if(k==='left' || k==='right'){ sel=Math.max(0,Math.min(n-2, sel+(k==='left'?-1:1))); render(); }
  else push(sel, k==='up' ? 1 : -1);
});

function gameOver(){
  const done = lives>0;
  if(score>best){ best=score; try{localStorage.setItem('kh-best',String(best));}catch(e){} $('summary').textContent=(done?'Proof complete. ':'')+`New personal best, ${round} words proofed.`; }
  else $('summary').textContent=(done?'Proof complete. ':'')+`${round} words proofed. Your best is ${best}.`;
  $('final').textContent=score; $('over').hidden=false;
}
async function goLandscape(){
  if(!matchMedia('(pointer: coarse)').matches) return;   // only phones and tablets go full screen
  try{ if(!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); }catch(e){}
  try{ await screen.orientation.lock('landscape'); }catch(e){}
}
function start(){ goLandscape(); score=0;streak=0;lives=3;round=0;setStats(); $('intro').hidden=true; $('over').hidden=true; nextRound(); }
$('start').onclick=start; $('again').onclick=start;
setStats();
