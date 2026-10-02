/* Translitera - Hebraico bíblico v5
   Banco oficial: data/banco.json
   Campos do banco: id, he, hePlain, pt, translit, strong, meaning, related, refs
*/
const state={names:[],current:null,units:[],unitIndex:0,
 roundCompleted:Number(localStorage.getItem("tb-round-completed")||0),
 totalCompleted:Number(localStorage.getItem("tb-total-completed")||0),
 doneIds:new Set(JSON.parse(localStorage.getItem("tb-done-ids")||"[]")),
 relatedReturn:null,letters:[],marks:[]};

const $=s=>document.querySelector(s);
const screens={home:$("#home"),game:$("#game"),result:$("#result"),names:$("#names"),letters:$("#letters"),vowels:$("#vowels")};
function show(n){Object.values(screens).forEach(s=>s?.classList.remove("active"));screens[n]?.classList.add("active");scrollTo(0,0)}
function hebrew(x){return x?.he||""}
function namePt(x){return x?.pt||""}
function translit(x){return x?.translit||""}
function strong(x){return x?.strong??""}
function related(x){return Array.isArray(x?.related)?x.related:[]}
function refs(x){return Array.isArray(x?.refs)?x.refs:[]}
function keyFor(x){return String(x?.id??x?.strong??x?.he??"")}

function saveProgress(){
 localStorage.setItem("tb-round-completed",String(state.roundCompleted));
 localStorage.setItem("tb-total-completed",String(state.totalCompleted));
 localStorage.setItem("tb-done-ids",JSON.stringify([...state.doneIds]));
 updateCounter();
}
function updateCounter(){
 document.querySelectorAll("[data-round-counter]").forEach(e=>e.textContent=state.roundCompleted);
 document.querySelectorAll("[data-total-counter]").forEach(e=>e.textContent=state.totalCompleted);
 document.querySelectorAll("[data-round-total]").forEach(e=>e.textContent=state.names.length);
}

function isCombining(ch){
 const cp=ch.codePointAt(0);
 return(cp>=0x0591&&cp<=0x05BD)||cp===0x05BF||(cp>=0x05C1&&cp<=0x05C5)||cp===0x05C7;
}
const vowelMap={"ַ":"a","ָ":"a","ֶ":"e","ֵ":"e","ִ":"i","ֹ":"o","ֻ":"u","ְ":"e","ֲ":"a","ֱ":"e","ֳ":"o"};
const baseMap={"א":"'","ב":"b","ג":"g","ד":"d","ה":"h","ו":"v","ז":"z","ח":"ch","ט":"t","י":"y","כ":"kh","ך":"kh","ל":"l","מ":"m","ם":"m","נ":"n","ן":"n","ס":"s","ע":"'","פ":"p","ף":"p","צ":"ts","ץ":"ts","ק":"q","ר":"r","ש":"sh","ת":"t"};

function parseWord(word){
 const chars=[...word],clusters=[];
 for(let i=0;i<chars.length;){
  if(isCombining(chars[i])){i++;continue}
  let c=chars[i++];while(i<chars.length&&isCombining(chars[i]))c+=chars[i++];clusters.push(c);
 }
 const units=[];
 clusters.forEach((cluster,idx)=>{
  const cs=[...cluster],consonant=cs.find(c=>!isCombining(c))||"",marks=cs.filter(c=>c!==consonant);
  const sin=marks.includes("ׂ"), vowel=marks.find(m=>Object.hasOwn(vowelMap,m))||"";
  let ctrans=baseMap[consonant]||""; if(consonant==="ש")ctrans=sin?"s":"sh";
  const final=idx===clusters.length-1, furtive=final&&vowel==="ַ"&&["ח","ע","ה"].includes(consonant);
  units.push({kind:"consonant",cluster,attachedTo:cluster,answer:ctrans,furtive});
  if(vowel)units.push({kind:"vowel",cluster:vowel,attachedTo:cluster,answer:vowelMap[vowel],furtive});
 });
 return units;
}
function renderWord(){
 const clusters=[];for(const ch of [...hebrew(state.current)]){
  if(clusters.length&&isCombining(ch))clusters[clusters.length-1]+=ch;else clusters.push(ch);
 }
 const active=state.units[state.unitIndex];
 $("#hebrew-word").innerHTML=clusters.map(c=>`<span class="${active&&(c===active.attachedTo||c===active.cluster)?"active-hebrew":""}">${c}</span>`).join("");
}
function uniqueOptions(correct,pool,n=4){
 const rest=[...new Set(pool.filter(Boolean).filter(x=>x!==correct))].sort(()=>Math.random()-.5);
 return [correct,...rest.slice(0,n-1)].sort(()=>Math.random()-.5);
}
function renderGameUnit(){
 if(state.unitIndex>=state.units.length){finishWord();return}
 renderWord();
 const u=state.units[state.unitIndex];
 $("#prompt").textContent=u.kind==="vowel"?"Qual é a transliteração deste sinal vocálico?":"Qual é a transliteração desta letra?";
 $("#isolated-vowel").innerHTML=u.kind==="vowel"?`<span class="vowel-box" dir="ltr">□${u.cluster}</span>`:"";
 $("#isolated-vowel").classList.toggle("visible",u.kind==="vowel");
 const pool=u.kind==="vowel"?Object.values(vowelMap):Object.values(baseMap);
 const box=$("#options");box.innerHTML="";
 uniqueOptions(u.answer,pool,4).forEach(opt=>{
  const b=document.createElement("button");b.className="answer";b.textContent=opt;
  b.onclick=()=>{
   if(opt!==u.answer){b.classList.add("wrong");return}
   b.classList.add("correct");$("#built").textContent+=u.answer;
   setTimeout(()=>{state.unitIndex++;renderGameUnit()},220);
  };box.appendChild(b);
 });
}
function startGame(item,returnToResult=null){
 state.current=item;state.units=parseWord(hebrew(item));state.unitIndex=0;state.relatedReturn=returnToResult;
 $("#built").textContent="";$("#round-complete").classList.add("hidden");show("game");renderGameUnit();
}
function finishWord(){
 const id=keyFor(state.current);
 if(!state.doneIds.has(id)){state.doneIds.add(id);state.roundCompleted++;state.totalCompleted++;saveProgress()}
 renderResult();
}
function renderResult(){
 const x=state.current;
 $("#result-hebrew").textContent=hebrew(x);$("#result-translit").textContent=translit(x);
 $("#result-name").textContent=namePt(x);$("#result-meaning").textContent=x.meaning||"—";
 $("#result-strong").textContent=strong(x)?`Strong: ${strong(x)}`:"";$("#result-refs").textContent=refs(x).join(", ");
 const box=$("#related-list");box.innerHTML="";
 related(x).forEach(r=>{
  const b=document.createElement("button");b.className="related-card";
  b.innerHTML=`<strong dir="rtl">${r.he||""}</strong><span>${r.translit||""}</span><small>${r.pt||""}${r.meaning?" — "+r.meaning:""}${r.strong?` · Strong ${r.strong}`:""}</small>`;
  b.onclick=()=>startGame(r,x);box.appendChild(b);
 });
 show("result");
}
function renderNames(){
 $("#names-list").innerHTML=[...state.names].sort((a,b)=>namePt(a).localeCompare(namePt(b),"pt")).map(x=>`<li>${namePt(x)}</li>`).join("");
 show("names");
}
function renderLetters(){
 $("#letters-grid").innerHTML=state.letters.map(x=>`<div class="study-card"><div class="study-hebrew">${x.hebrew||x.letter||x.char||""}</div><strong>${x.name||x.nome||""}</strong><span>${x.transliteration||x.translit||""}</span></div>`).join("");show("letters");
}
function renderVowels(){
 $("#vowels-grid").innerHTML=state.marks.map(x=>{const m=x.hebrew||x.mark||x.char||x.symbol||"";return `<div class="study-card"><div class="study-hebrew vowel-box">□${m}</div><strong>${x.name||x.nome||""}</strong><span>${x.transliteration||x.translit||""}</span></div>`}).join("");show("vowels");
}
async function init(){
 const [b,l,m]=await Promise.all([fetch("data/banco.json").then(r=>r.json()),fetch("data/letters.json").then(r=>r.json()),fetch("data/marks.json").then(r=>r.json())]);
 state.names=b;state.letters=l;state.marks=m;updateCounter();
 $("#play").onclick=()=>{
  const available=state.names.filter(x=>!state.doneIds.has(keyFor(x)));
  if(!available.length){$("#round-complete").classList.remove("hidden");return}
  startGame(available[Math.floor(Math.random()*available.length)]);
 };
 $("#new-round").onclick=()=>{
  state.doneIds=new Set();state.roundCompleted=0;saveProgress();$("#round-complete").classList.add("hidden");
  startGame(state.names[Math.floor(Math.random()*state.names.length)]);
 };
 $("#reset-progress").onclick=()=>{
  if(!confirm("Isso apagará o histórico e o progresso salvo neste navegador. Deseja continuar?"))return;
  state.doneIds=new Set();state.roundCompleted=0;state.totalCompleted=0;saveProgress();$("#round-complete").classList.add("hidden");show("home");
 };
 $("#names-menu").onclick=renderNames;$("#letters-menu").onclick=renderLetters;$("#vowels-menu").onclick=renderVowels;
 $("#home-from-result").onclick=()=>show("home");$("#back-home").onclick=()=>show("home");
 $("#back-result").onclick=()=>{if(state.relatedReturn){const original=state.relatedReturn;state.relatedReturn=null;state.current=original;renderResult()}else show("home")};
 show("home");
}
init().catch(e=>{console.error(e);alert("Não foi possível carregar o banco de dados.");});
