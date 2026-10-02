
const state = {
  names: [],
  letters: [],
  marks: [],
  current: null,
  units: [],
  unitIndex: 0,
  phase: "letter",
  completed: new Set(JSON.parse(localStorage.getItem("translit-completed") || "[]")),
  score: 0
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function normalize(s){ return s.normalize("NFC"); }

async function loadData(){
  const [names, letters, marks] = await Promise.all([
    fetch("data/banco.json").then(r=>r.json()),
    fetch("data/letters.json").then(r=>r.json()),
    fetch("data/marks.json").then(r=>r.json())
  ]);
  state.names = names;
  state.letters = letters;
  state.marks = marks;
  state.score = state.completed.size;
  $("#score").textContent = state.score;
  $("#total").textContent = state.names.length;
  renderStudy();
}

function showView(id){
  $$(".view").forEach(v=>v.classList.toggle("active", v.id === id+"View"));
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden","true");
  window.scrollTo({top:0,behavior:"smooth"});
}

function openDrawer(){ $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden","false"); }
function closeDrawer(){ $("#drawer").classList.remove("open"); $("#drawer").setAttribute("aria-hidden","true"); }

function renderStudy(){
  const sorted = [...state.names].sort((a,b)=>a.pt.localeCompare(b.pt,"pt-BR"));
  $("#namesList").innerHTML = sorted.map(n => `
    <div class="name-row">
      <div><strong>${n.pt}</strong><small>Strong ${n.strong} · ${n.translit}</small></div>
      <span dir="rtl">${n.he}</span>
    </div>`).join("");

  $("#lettersGrid").innerHTML = state.letters.map(l => `
    <div class="study-card">
      <div class="he" dir="rtl">${l.he}</div>
      <strong>${l.name_pt}</strong>
      <div class="tr">${l.translit}</div>
      <small>jogo: ${l.game || l.translit}</small>
    </div>`).join("");

  $("#marksGrid").innerHTML = state.marks.map(m => `
    <div class="study-card">
      <div class="he" dir="rtl">${m.he}</div>
      <strong>${m.name_pt}</strong>
      <div class="tr">${m.translit}</div>
      <small>${m.category}</small>
    </div>`).join("");
}

function pickNext(){
  const available = state.names.filter(n => !state.completed.has(n.id));
  if(!available.length){
    showAllDone();
    return;
  }
  const n = available[Math.floor(Math.random()*available.length)];
  startGame(n);
}

function startGame(name){
  state.current = name;
  state.units = buildUnits(name.he);
  state.unitIndex = 0;
  state.phase = "letter";
  $("#meaningHint").textContent = `Nome: ${name.pt}`;
  showView("game");
  renderGame();
}

function buildUnits(word){
  const chars = [...normalize(word)];
  const units=[];
  for(let i=0;i<chars.length;i++){
    const ch=chars[i];
    const cp=ch.codePointAt(0);
    // combining Hebrew marks are Unicode Mn; keep them with the preceding base
    if(/\p{M}/u.test(ch) && units.length){
      units[units.length-1].marks.push(ch);
    } else if(ch !== "\u05BE" && ch !== "\u05C3"){
      units.push({base:ch,marks:[]});
    }
  }
  return units;
}

function getLetter(base){
  const finalMap={"ך":"כ","ם":"מ","ן":"נ","ף":"פ","ץ":"צ"};
  const key=finalMap[base] || base;
  return state.letters.find(l=>l.he===key);
}

function markInfo(mark){
  return state.marks.find(m=>m.he===mark);
}

function effectiveLetter(unit){
  const letter=getLetter(unit.base);
  let t=letter?.game || letter?.translit || "";
  for(const m of unit.marks){
    if(m==="ׂ") t="s";
    if(m==="ׁ") t="sh";
  }
  return t;
}

function playableMarks(unit){
  // Vowels plus shin/sin dots affect the displayed transliteration.
  return unit.marks.filter(m => {
    const x=markInfo(m);
    return x && (x.category==="vowel" || m==="ׂ" || m==="ׁ");
  });
}

function currentTarget(){
  const unit=state.units[state.unitIndex];
  if(state.phase==="letter") return {kind:"letter", value:getLetter(unit.base)?.game || effectiveLetter(unit), display:unit.base};
  const marks=playableMarks(unit);
  return {kind:"mark", value:markInfo(marks[state.markIndex]).game, display:marks[state.markIndex]};
}

function renderHebrew(){
  const word=$("#hebrewWord");
  word.innerHTML="";
  state.units.forEach((u,i)=>{
    const span=document.createElement("span");
    span.className="unit";
    if(i===state.unitIndex) span.classList.add("current");
    const base=document.createElement("span");
    base.className="base";
    base.textContent=u.base;
    if(i===state.unitIndex && state.phase==="letter") base.classList.add("current");
    span.appendChild(base);
    u.marks.forEach(m=>{
      const mk=document.createElement("span");
      mk.className="mark";
      mk.textContent=m;
      const playable=playableMarks(u).includes(m);
      if(i===state.unitIndex && state.phase==="mark" && m===playableMarks(u)[state.markIndex]) mk.classList.add("current");
      span.appendChild(mk);
    });
    word.appendChild(span);
  });
}

function completedTranslit(){
  let out="";
  for(let i=0;i<state.unitIndex;i++){
    const u=state.units[i];
    out += effectiveLetter(u);
    playableMarks(u).forEach(m=>out += markInfo(m).game === "·" ? "" : markInfo(m).game);
  }
  if(state.phase==="mark" && state.unitIndex < state.units.length){
    const u=state.units[state.unitIndex];
    out += effectiveLetter(u);
    for(let j=0;j<state.markIndex;j++){
      const mi=markInfo(playableMarks(u)[j]);
      if(mi && mi.game!=="·") out += mi.game;
    }
  }
  return out || "—";
}

function renderGame(){
  const u=state.units[state.unitIndex];
  const marks=playableMarks(u);
  $("#gameStep").textContent = state.phase==="letter" ? "Letra" : "Sinal";
  $("#questionLabel").textContent = state.phase==="letter"
    ? "Qual é a transliteração desta letra?"
    : "Qual é a transliteração deste sinal?";
  $("#targetDisplay").textContent = state.phase==="letter" ? u.base : marks[state.markIndex];
  $("#translitPreview").textContent = completedTranslit();
  renderHebrew();
  makeOptions();
}

function optionPool(correct, kind){
  const source = kind==="letter"
    ? state.letters.map(l=>l.game || l.translit).filter(Boolean)
    : state.marks.filter(m=>m.category==="vowel" || m.he==="ׂ" || m.he==="ׁ").map(m=>m.game).filter(Boolean);
  const unique=[...new Set(source)];
  const wrong=unique.filter(x=>x!==correct);
  const selected=[];
  while(selected.length<3 && wrong.length){
    const idx=Math.floor(Math.random()*wrong.length);
    selected.push(wrong.splice(idx,1)[0]);
  }
  while(selected.length<3){
    selected.push(kind==="letter" ? ["b","d","g"][selected.length] : ["a","e","i"][selected.length]);
  }
  return [correct,...selected].sort(()=>Math.random()-0.5);
}

function makeOptions(){
  const target=currentTarget();
  const box=$("#options");
  box.innerHTML="";
  $("#feedback").textContent="";
  $("#feedback").className="feedback";
  optionPool(target.value,target.kind).forEach(v=>{
    const b=document.createElement("button");
    b.className="option";
    b.textContent=v;
    b.addEventListener("click",()=>answer(v,target.value,b));
    box.appendChild(b);
  });
}

function answer(value, correct, btn){
  if(value!==correct){
    btn.classList.add("wrong");
    $("#feedback").textContent="Ainda não. Tente outra opção.";
    $("#feedback").className="feedback bad";
    setTimeout(()=>btn.classList.remove("wrong"),450);
    return;
  }
  btn.classList.add("correct");
  $$(".option").forEach(b=>b.disabled=true);
  $("#feedback").textContent="Correto!";
  $("#feedback").className="feedback good";
  setTimeout(nextStep,420);
}

function nextStep(){
  const u=state.units[state.unitIndex];
  if(state.phase==="letter"){
    const marks=playableMarks(u);
    if(marks.length){
      state.phase="mark";
      state.markIndex=0;
      renderGame();
    } else {
      state.unitIndex++;
      if(state.unitIndex>=state.units.length) finishGame();
      else { state.phase="letter"; renderGame(); }
    }
    return;
  }
  state.markIndex++;
  const marks=playableMarks(u);
  if(state.markIndex>=marks.length){
    state.unitIndex++;
    if(state.unitIndex>=state.units.length) finishGame();
    else {state.phase="letter";renderGame();}
  } else renderGame();
}

function finishGame(){
  const n=state.current;
  state.completed.add(n.id);
  localStorage.setItem("translit-completed",JSON.stringify([...state.completed]));
  state.score=state.completed.size;
  $("#score").textContent=state.score;
  $("#resultHebrew").textContent=n.he;
  $("#resultTranslit").textContent=n.translit;
  $("#resultName").textContent=n.pt;
  $("#resultMeaning").textContent=n.meaning;
  $("#resultRefs").textContent=n.refs.join(" · ");
  $("#relatedList").innerHTML=n.related.map(r=>`
    <div class="related-item">
      <div class="related-he" dir="rtl">${r.he}</div>
      <div class="related-main"><strong>${r.pt}</strong><span>${r.translit} · ${r.meaning}</span></div>
      <div class="strong">H${r.strong}</div>
    </div>`).join("");
  showView("result");
}

function transliterateWord(word){
  return buildUnits(word).map(u=>{
    let s=effectiveLetter(u);
    playableMarks(u).forEach(m=>{const x=markInfo(m);if(x?.game && x.game!=="·")s+=x.game});
    return s;
  }).join("");
}

function showAllDone(){
  $("#resultHebrew").textContent="✓";
  $("#resultTranslit").textContent="Todas concluídas";
  $("#resultName").textContent="Parabéns!";
  $("#resultMeaning").textContent="Você já completou todas as palavras que estão atualmente no banco.";
  $("#relatedList").innerHTML="";
  $("#resultRefs").textContent=`${state.names.length} nomes estudados.`;
  showView("result");
}

$("#startBtn").addEventListener("click",pickNext);
$("#nextBtn").addEventListener("click",pickNext);
$("#resultHomeBtn").addEventListener("click",()=>showView("home"));
$("#backHomeBtn").addEventListener("click",()=>showView("home"));
$("#menuBtn").addEventListener("click",openDrawer);
$("#closeMenu").addEventListener("click",closeDrawer);
$("#drawer").addEventListener("click",e=>{if(e.target===$("#drawer"))closeDrawer()});

$$("[data-view]").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.view)));
$$(".home-nav").forEach(btn=>btn.addEventListener("click",()=>showView("home")));

loadData().catch(err=>{
  console.error(err);
  document.body.innerHTML="<main style='padding:30px;font-family:system-ui'><h2>Não foi possível carregar o banco.</h2><p>Abra o projeto por um servidor HTTP, como o GitHub Pages ou um servidor local. Arquivos JSON não funcionam corretamente via <code>file://</code> em muitos navegadores.</p></main>";
});

if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{})); }
