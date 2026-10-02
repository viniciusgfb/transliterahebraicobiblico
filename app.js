const state = {
  names: [], letters: [], marks: [], current: null, relatedParent: null,
  units: [], unitIndex: 0, phase: "letter", markIndex: 0,
  completed: new Set(JSON.parse(localStorage.getItem("translit-round-completed") || "[]")),
  score: 0,
  totalCompleted: Number(localStorage.getItem("translit-total-completed") || "0")
};
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const normalize = s => s.normalize("NFC");

async function loadData(){
  const [names, letters, marks] = await Promise.all([
    fetch("data/banco.json").then(r=>r.json()), fetch("data/letters.json").then(r=>r.json()), fetch("data/marks.json").then(r=>r.json())
  ]);
  state.names=names; state.letters=letters; state.marks=marks; state.score=state.completed.size;
  updateCounter(); renderStudy();
}
function updateCounter(){ $("#score").textContent=state.score; $("#total").textContent=state.names.length; $("#totalHistory").textContent=state.totalCompleted; }
function showView(id){ $$(".view").forEach(v=>v.classList.toggle("active",v.id===id+"View")); closeDrawer(); window.scrollTo({top:0,behavior:"smooth"}); }
function openDrawer(){ $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden","false"); }
function closeDrawer(){ $("#drawer").classList.remove("open"); $("#drawer").setAttribute("aria-hidden","true"); }

function renderStudy(){
  const sorted=[...state.names].sort((a,b)=>a.pt.localeCompare(b.pt,"pt-BR"));
  $("#namesList").innerHTML=sorted.map(n=>`<div class="name-row"><div><strong>${n.pt}</strong><small>Strong ${n.strong} · ${n.translit}</small></div><span dir="rtl">${n.he}</span></div>`).join("");
  $("#lettersGrid").innerHTML=state.letters.map(l=>`<div class="study-card"><div class="he" dir="rtl">${l.he}</div><strong>${l.name_pt}</strong><div class="tr">${l.game||l.translit}</div>${l.final?'<small>forma final</small>':''}</div>`).join("");
  $("#marksGrid").innerHTML=state.marks.filter(m=>m.category==="vowel").map(m=>`<div class="study-card"><div class="mark-holder ${markPositionClass(m)}" dir="ltr"><span class="mark-square">□</span><span class="isolated-mark">${m.he}</span></div><strong>${m.name_pt}</strong><div class="tr">${m.game||m.translit}</div></div>`).join("");
}
function markPositionClass(m){
  if(m.id.includes("shin-dot")||m.id.includes("sin-dot")||m.id==="holam"||m.id==="holam-haser") return "above";
  if(m.id==="hiriq") return "below-left";
  if(m.category==="vowel") return "below";
  return "below";
}

function pickNext(){
  const available=state.names.filter(n=>!state.completed.has(n.id));
  if(!available.length){showAllDone();return;}
  startNameGame(available[Math.floor(Math.random()*available.length)]);
}
function startNameGame(name){ state.current=name; state.relatedParent=null; prepareGame(name.he); }
function startRelatedGame(rel,parent){ state.current=rel; state.relatedParent=parent; prepareGame(rel.he); }
function prepareGame(word){ state.units=buildUnits(word); state.unitIndex=0; state.phase=isFurtiveUnit(0)?"mark":"letter"; state.markIndex=0; showView("game"); renderGame(); }
function isFurtiveUnit(i){ const u=state.units[i]; return !!u && i===state.units.length-1 && ["ח","ע","ה"].includes(u.base) && playableMarks(u).includes("ַ"); }

function buildUnits(word){
  const chars=[...normalize(word)], units=[];
  for(const ch of chars){
    if(/\p{M}/u.test(ch) && units.length) units[units.length-1].marks.push(ch);
    else if(!["־","׃"].includes(ch)) units.push({base:ch,marks:[]});
  }
  return units;
}
function getLetter(base){
  const key={"ך":"כ","ם":"מ","ן":"נ","ף":"פ","ץ":"צ"}[base]||base;
  return state.letters.find(l=>l.he===key);
}
function markInfo(mark){ return state.marks.find(m=>m.he===mark); }
function hasMark(unit,mark){ return unit.marks.includes(mark); }
function effectiveLetter(unit){
  const l=getLetter(unit.base); if(!l) return "";
  if(unit.base==="ו" && hasMark(unit,"ּ") && unit.marks.filter(m=>m!=="ּ").every(m=>!markInfo(m)||markInfo(m).category!=="vowel")) return "u";
  if(unit.base==="ו" && (hasMark(unit,"ֹ")||hasMark(unit,"ֺ"))) return "o";
  if(unit.base==="ש" && hasMark(unit,"ׂ")) return "s";
  if(unit.base==="ש" && hasMark(unit,"ׁ")) return "sh";
  return l.game || l.translit;
}
function playableMarks(unit){
  return unit.marks.filter(m=>{
    const x=markInfo(m); return x && x.category==="vowel" && !(unit.base==="ו" && (m==="ּ"||m==="ֹ"||m==="ֺ"));
  });
}
function currentTarget(){
  const u=state.units[state.unitIndex];
  if(state.phase==="letter") return {kind:"letter",value:effectiveLetter(u),display:u.base};
  const m=playableMarks(u)[state.markIndex]; return {kind:"mark",value:markInfo(m)?.game||"",display:m};
}
function targetHTML(target){
  if(target.kind!=="mark") return target.display;
  return `<span class="vowel-box" dir="ltr"><span class="vowel-base">□</span><span class="vowel-mark">${target.display}</span></span>`;
}
function renderHebrew(){
  const word=$("#hebrewWord"); word.innerHTML="";
  state.units.forEach((u,i)=>{
    const span=document.createElement("span");
    span.className="unit";
    const isActive=i===state.unitIndex;
    const vowelSet=new Set(playableMarks(u));
    const activeMark=isActive && state.phase==="mark" ? vowelSet.has(u.marks[state.markIndex]) ? u.marks[state.markIndex] : null : null;
    // Keep the consonant and marks in one visual unit; only the requested part receives the accent color.
    const base=document.createElement("span");
    base.className="base"+(isActive&&state.phase==="letter"?" current":"");
    base.textContent=u.base;
    span.appendChild(base);
    u.marks.forEach(m=>{
      const ms=document.createElement("span");
      ms.className="mark"+(m===activeMark?" current":"");
      ms.textContent=m;
      span.appendChild(ms);
    });
    word.appendChild(span);
  });
}
function completedTranslit(){
  let out="";
  for(let i=0;i<state.unitIndex;i++) out+=unitTranslit(state.units[i]);
  if(state.unitIndex<state.units.length){ const u=state.units[state.unitIndex]; if(state.phase==="mark"){ const done=playableMarks(u).slice(0,state.markIndex).map(m=>markInfo(m).game||"").join(""); out += (u.base!=="ח"&&u.base!=="ע"&&u.base!=="ה") ? effectiveLetter(u)+done : done+effectiveLetter(u); } }
  return out||"—";
}
function unitTranslit(u){
  const marks=playableMarks(u).map(m=>markInfo(m)?.game||"").join("");
  if(u.base==="ח" || u.base==="ע" || u.base==="ה"){
    const vp=playableMarks(u).find(m=>m==="ַ");
    if(vp && state.units.indexOf(u)===state.units.length-1) return marks+effectiveLetter(u);
  }
  return effectiveLetter(u)+marks;
}
function renderGame(){
  const u=state.units[state.unitIndex], marks=playableMarks(u), target=currentTarget();
  $("#gameStep").textContent=state.phase==="letter"?"Letra":"Sinal";
  $("#questionLabel").textContent=state.phase==="letter"?"Qual é a transliteração desta letra?":"Qual é a transliteração deste sinal?";
  $("#targetDisplay").textContent=target.display; $("#translitPreview").textContent=completedTranslit(); renderHebrew(); makeOptions(target,4);
}
function optionPool(correct,kind,count=4){
  const source=kind==="letter"?state.letters.map(l=>l.game||l.translit).filter(Boolean):state.marks.filter(m=>m.category==="vowel").map(m=>m.game).filter(Boolean);
  const unique=[...new Set(source)], wrong=unique.filter(x=>x!==correct), selected=[];
  while(selected.length<count-1&&wrong.length){selected.push(wrong.splice(Math.floor(Math.random()*wrong.length),1)[0]);}
  return [correct,...selected].sort(()=>Math.random()-0.5);
}
function makeOptions(target,count=4){
  const box=$("#options"); box.innerHTML=""; $("#feedback").textContent=""; $("#feedback").className="feedback";
  optionPool(target.value,target.kind,count).forEach(v=>{const b=document.createElement("button");b.className="option";b.textContent=v;b.addEventListener("click",()=>answer(v,target.value,b));box.appendChild(b);});
}
function answer(value,correct,btn){
  if(value!==correct){btn.classList.add("wrong");$("#feedback").textContent="Ainda não. Tente outra opção.";$("#feedback").className="feedback bad";setTimeout(()=>btn.classList.remove("wrong"),450);return;}
  btn.classList.add("correct");$$(".option").forEach(b=>b.disabled=true);$("#feedback").textContent="Correto!";$("#feedback").className="feedback good";setTimeout(nextStep,350);
}
function isFurtive(u){ return state.units.indexOf(u)===state.units.length-1 && ["ח","ע","ה"].includes(u.base) && playableMarks(u).includes("ַ"); }
function nextStep(){
  const u=state.units[state.unitIndex], marks=playableMarks(u);
  if(state.phase==="letter"){
    if(isFurtive(u) && marks.length){ state.phase="mark"; state.markIndex=0; renderGame(); }
    else if(marks.length){ state.phase="mark"; state.markIndex=0; renderGame(); }
    else { state.unitIndex++; if(state.unitIndex>=state.units.length) finishCurrent(); else renderGame(); }
  } else {
    state.markIndex++;
    if(state.markIndex>=marks.length){ state.unitIndex++; if(state.unitIndex>=state.units.length) finishCurrent(); else { state.phase="letter"; renderGame(); } } else renderGame();
  }
}
function finishCurrent(){ if(state.relatedParent){showRelatedResult(state.current,state.relatedParent);return;} finishName(state.current); }

function finishName(n){
  state.completed.add(n.id); state.totalCompleted++; localStorage.setItem("translit-round-completed",JSON.stringify([...state.completed])); localStorage.setItem("translit-total-completed",String(state.totalCompleted)); state.score=state.completed.size; updateCounter(); showNameResult(n);
}
function showNameResult(n){
  $("#resultEyebrow").textContent="PALAVRA CONCLUÍDA";$("#resultHebrew").textContent=n.he;$("#resultTranslit").textContent=n.translit;$("#resultName").textContent=n.pt;$("#resultMeaning").textContent=n.meaning;$("#resultRefs").textContent=n.refs.join(" · ");
  $("#relatedSection").classList.toggle("hidden",!n.related?.length);$("#relatedList").innerHTML=(n.related||[]).map((r,i)=>`<button class="related-item related-button" data-related="${i}"><div class="related-he" dir="rtl">${r.he}</div><div class="related-main"><strong>${r.pt}</strong><span>${r.translit} · ${r.meaning}</span></div><div class="strong">H${r.strong}</div></button>`).join("");
  $$("[data-related]").forEach(b=>b.addEventListener("click",()=>startRelatedGame(n.related[Number(b.dataset.related)],n)));
  $("#nextBtn").classList.remove("hidden");$("#returnParentBtn").classList.add("hidden");showView("result");
}
function showRelatedResult(r,parent){
  $("#resultEyebrow").textContent="PALAVRA RELACIONADA CONCLUÍDA";$("#resultHebrew").textContent=r.he;$("#resultTranslit").textContent=r.translit;$("#resultName").textContent=r.pt;$("#resultMeaning").textContent=r.meaning;$("#resultRefs").textContent="";$("#relatedSection").classList.add("hidden");$("#nextBtn").classList.add("hidden");$("#returnParentBtn").classList.remove("hidden");$("#returnParentBtn").onclick=()=>showNameResult(parent);showView("result");
}
function showAllDone(){
  $("#roundComplete").classList.remove("hidden");
  showView("home");
}

$("#startBtn").addEventListener("click",pickNext);$("#nextBtn").addEventListener("click",pickNext);
$("#newRoundBtn").addEventListener("click",()=>{ state.completed=new Set(); state.score=0; localStorage.setItem("translit-round-completed","[]"); $("#roundComplete").classList.add("hidden"); updateCounter(); pickNext(); });
$("#resetProgressBtn").addEventListener("click",()=>{ if(!confirm("Isso apagará o histórico e o progresso salvo neste navegador. Deseja continuar?")) return; state.completed=new Set(); state.score=0; state.totalCompleted=0; localStorage.removeItem("translit-round-completed"); localStorage.removeItem("translit-total-completed"); $("#roundComplete").classList.add("hidden"); updateCounter(); showView("home"); });$("#resultHomeBtn").addEventListener("click",()=>showView("home"));$("#backHomeBtn").addEventListener("click",()=>showView("home"));$("#menuBtn").addEventListener("click",openDrawer);$("#closeMenu").addEventListener("click",closeDrawer);$("#drawer").addEventListener("click",e=>{if(e.target===$("#drawer"))closeDrawer()});$$('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));$$('.home-nav').forEach(b=>b.addEventListener('click',()=>showView('home')));
loadData().catch(err=>{console.error(err);document.body.innerHTML='<main style="padding:30px;font-family:system-ui"><h2>Não foi possível carregar o banco.</h2><p>Abra o projeto por um servidor HTTP, como o GitHub Pages ou um servidor local.</p></main>';});
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
