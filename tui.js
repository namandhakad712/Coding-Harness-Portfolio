/*══════════════════════════════════════════════════════════════
  tui.js   the harness basically
  slash menu , @ file picker , ctrl-p palette , plan/act toggle
  thinking blocks that open by default n collapse after
  streaming replies + tool calls + error msgs
  project cards with screenshots + beginner guide w/ live demo

  idk if the blink logic is right but it works on my machine lol
  TODO: maybe add dark mode toggle later? idk
  also i wrote this at 2am so sorry for anything weird
  ══════════════════════════════════════════════════════════════*/
"use strict";
(function() {

/*── dom refs ── shortcuts to elements i use alot*/
const $=id=>document.getElementById(id);  // short alias lol
const body=document.body;
const input=$("cmd"),menu=$("menu"),transcript=$("transcript");
const toggle=$("toggle"),autoBtn=$("autoBtn");
const guide=$("guide"),toast=$("toast"),toastText=$("toastText"),toastSpin=toast.querySelector(".spin");

const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/*── state (app ka poora state yahan h) ──*/
const S={
  mode:"act",
  autoAnswer:true,
  history:[],histIdx:-1,
  run:null,
  menuItems:[],menuIdx:-1,menuKind:null,
  thinking:[] // current run ka live thinking blocks
};

/*── commands that user can type ──*/
const COMMANDS=[
  {cmd:"/work",desc:"dekho meri 5 projects",run:runWork},
  {cmd:"/craft",desc:"kaunse tools use karta hoon",run:runCraft},
  {cmd:"/about",desc:"whoami",run:runAbout},
  {cmd:"/contact",desc:"kaise puchna mujhe",run:runContact},
  {cmd:"/help",desc:"ye terminal kaise chalta h",run:runHelp},
  {cmd:"/theme",desc:"colory theme badal do",run:runTheme},
  {cmd:"/history",desc:"pehle puchha kya tha",run:runHistory},
  {cmd:"/undo",desc:"ek answer piche jao",run:runUndo},
  {cmd:"/clear",desc:"sab fresh karo",run:()=>newSession()},
];

const FILES=[
  "index.html","styles.css","tui.js","ascii3d.js","data.js",
  "assets/projects/smart-mailto.webp","assets/tech/react.webp",".gitignore"
];

/*── easter eggs ── not in /help, not in menu, find karna padega
  real terminal wale secrets aise hi chhupate hain ──*/
const EGGS={
  "/coffee":async run=>{
    const th=thinking("omg they typed the most important command lmao");
    await sleep(700);if(run.cancelled)return th.hold();
    th.hold("brewing... machine nhi h bss yeh ascii aur achhi soch thi");
    await sleep(300);if(run.cancelled)return;
    panel(
      '<pre class="eggart">'+
"       ( (      \n"+
"        ) )     \n"+
"      ........  \n"+
"      |      |] \n"+
"      \\      /  \n"+
"       `----'   \n"+
"    [][][][]    \n"+
"</pre>","EK COFFEE PLZ BINA CAFFEINE KE");
    if(run.cancelled)return;
    await streamText(run,
      "yei vahi command jo portfolio kii shipping karta h. achha sa poocha — "
      + "agar tum brave lag rahe ho toh /sudo try karo aglii baar");
  },
  "/sudo":async run=>{
    const th=thinking("bruhh sudo try kar raha h portfolio mein lol");
    await sleep(750);if(run.cancelled)return th.hold();
    th.hold("sudoers file check kar raha hoon... haath pakad ke");
    await sleep(400);if(run.cancelled)return;
    errLine("naman nhi h sudoers file mei. iska report ho jayega");
    await sleep(500);if(run.cancelled)return;
    await streamText(run,
      "...peach ko report kiya. usne blink maara. tum theek ho — "
      + "yahan sab tumhare browser mei chalta h toh technically tumhi owner ho");
  },
  "/42":async run=>{
    const th=thinking("jaanta h usko. the answer.");
    await sleep(600);if(run.cancelled)return th.hold();
    th.hold("question abhi compute ho raha h. ek baat mei lagega");
    await sleep(400);if(run.cancelled)return;
    await streamText(run,
      "42. obviously. real sawaal ye tha ki `naman kya banaata h` — "
      + "aur answer h /work, paanch baar");
  },
  "/xyzzy":async run=>{
    const th=thinking("bruhh cave se aayi hui ek phrase");
    await sleep(600);if(run.cancelled)return th.hold();
    th.hold("kuchh nhi hota yahan. bilkul bhi nhi. theek hi h");
    await sleep(350);if(run.cancelled)return;
    await streamText(run,
      "kuchh nhi hua. 🪧 (dinosaur game instinct: sahi command galii cave)")
  },
  "/rm":async run=>{
    const th=thinking("risky command aaya h prompt mei");
    await sleep(700);if(run.cancelled)return th.hold();
    th.hold("naa try mat kar. files readonly hain aur maine unhein pasand karo");
    await sleep(350);if(run.cancelled)return;
    errLine("rm: refusing to remove '/' — badiya try kiya tho");
    if(run.cancelled)return;
    await streamText(run,
      "jo bhi yahan h voh ek hi static repo mei h, toh nahi kar sakte. "
      + "agar zaroori h toh /clear se transcript clear hota h aur voh bhi thoda reversible type h")
  }
};

/* konami code: ↑ ↑ ↓ ↓ ← → ← → B A — sabse purana cheat code */
const KONAMI=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
let kIdx=0;

/* "soch raha hoon" ke liye phrases — har run par shuffle hoti hain */
const THINK_WORDS=[
 "code ke andar kho jaa raha hoon...",
 "loose threads dhoondh raha hoon...",
 "wording theek kar raha hoon...",
 "acche hissa line up kar raha hoon...",
 "abhi tak raha hoon...",
 "ek aur pass kar liya, phir answer duunga...",
 "last words polish kar raha hoon...",
 "signal vs noise alagkar raha hoon...",
 "keys warm kar raha hoon...",
 "achche hissa ke liye countdown...",
 "thoda steep kar raha hoon...",
 "sabse achha vakya dhundh raha hoon...",
 "rough edges kat raha hoon...",
 "pehli line practice kar raha hoon...",
 "thread theek kar raha hoon...",
 "purane favourites saaf kar raha hoon...",
 "soch columns mei daal raha hoon...",
 "slowly words nikal raha hoon...",
 "thoda aur steep kar raha hoon...",
 "har letter 2 baar check kar raha hoon...",
 "words ko jagah de raha hoon...",
 "ek aur pencil sharpness karo raha hoon...",
 "echo sun raha hoon...",
 "chhote details nikaal raha hoon...",
 "whiteboard saaf kar raha hoon...",
 "sabse chhota rasta dhundh raha hoon...",
 "achha coffee ban raha hoon...",
 "sahi opener dhoondh raha hoon...",
 "tasawwur frame theek kar raha hoon...",
 "commas count kar raha hoon...",
 "phir se beat pe jaa raha hoon...",
 "bole chhod raha hoon...",
 "best line last mei rakha hoon...",
 "ink refill kar raha hoon...",
 "outline pehle draw kar raha hoon...",
 "scenic route le raha hoon...",
 "last knob twist kar raha hoon...",
 "rhythm tap kar raha hoon...",
 "pehla layer chhina hoon...",
 "last crumbs jama kar raha hoon..."
];
function shuffled(a){
  const b=a.slice();
  for(let i=b.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [b[i],b[j]]=[b[j],b[i]];
  }
  return b;
}
const pick=a=>a[Math.floor(Math.random()*a.length)];

/*═════════════════════════════════════════════════════════════
  SCRIPT POOLS — har command ke paas kai alag tarike se
  kehne ke tareeqe hote hain. Har run par ek accha lagta
  wala chun kar ke use hota hai.
  ══════════════════════════════════════════════════════════════*/

/* SCRIPTS — yeh vaha jata h jahan thinking lines + intro text hote hain
  maine apni bhasha mei likha h all of it bas bro */
const SCRIPTS={
  work:{
    think:[
      ["dikhao real work. main project list pull kar raha hoon aur screenshot ke saath lay raha hoon.","5 projects hain naye se purane tak — smart mailto aur rankify sabse recent hain.","5 shipped projects 2023 se 2026 tak. likh raha hoon abhi.","ok so they want proof not promises. loading the project shelf.","five cards: title, year, kya karta h, kahan try karein.","sab set hai — cards ek ek karke likh raha hoon."],
      ["projects section hai yeh. list, screenshots aur links saare ek saath laa raha hoon.","har card ko chahiye ek screenshot, simple description aur dono links. side by side rakh do.","sab kuch mil gaya. idhar aa gaya kaam.","bas itni si cheez hai — 5 projects with screenshots and links. nothing fancy."],
      ["dikhao rather than bolein. data.js se saare 5 entries nikal raha hoon.","newest first, toh rankify aur smart mailto pehle aayenge.","taiyaar — screenshots aur links included." ],
      ["they asked for proof not promises. project shelf load kar raha hoon.","5 cards: title year kya karta hai aur kahan try karein.","all set cards ek ek karke likhne ke liye."]
    ],
    tool:[
      ["5 projects · images in ./assets/projects/","copy plain english mei likhi"],
      ["PROJECTS[0..4] loaded","screenshots resolve hua · links check hua"],
      ["5 entries · titles, years, stacks","blurb + live/source links taiyar"]
    ],
    intro:[
      "idhar hai kaam mera — 5 cheezein jo maine banayi hain aur ship kar di hain, demos nahi. har card par screenshot hota h, simple description hoti h, aur live version ka link aur source ka bhi.",
      "paanch real projects naye se purane tak. har ek par screenshot hota h, short simple summary hoti h, aur agar tum code padhna chahte ho toh live aur source dono links hote hain.",
      "yehi hai shelf: 5 shipped projects from 2023 to 2026. har card ke paas apna screenshot hota h, kya karta h exactly, aur try karne ya fork karne ke links.",
      "jo bhi maine banaya hain aur actually live hain — koi mockup nahi, koi shay nahi. screenshots, honest descriptions, aur demo aur repo dono ke links."
    ]
  },
  craft:{
    think:[
      ["stack load karke use har tool ko explain kar raha hoon jaise doston se.","teen groups — kya feel karta h, kya hold karta h, kya ship karta h.","yehi h stack plain words mei buzzwords ke bina." ],
      ["tools wala time. sirf wahi rehte hain jo real deadlines se paar nikaale hain.","grouped by jahan par dikhaye deta hain: haath, backbone, delivery."],
      ["samajhne ka koshish kar raha hoon — minus marketing words.","frontend toh feel hota h, backend toh bones hota h, deployment toh runway hoti h." ],
      ["they want the toolkit. main har cheez ke liye kuchh kehta hoon.","three shelves: everyday ka stuff, quiet workers, shipping gear." ]
    ],
    intro:[
      "tools are opinions. yehi hain jo maine earn kiya — agar kuchh shipping mei madad nahi kare toh yeh list se nikal do jata h.",
      "yehi h honest stack — only what I reach for by default, grouped by where it shows up, with a plain note on each.",
      "teen groups: kya feel karta h, kya hold karta h, kya ship karta h. koi badge nahi, koi fan club nahi — sirf tools that earn their place.",
      "yehi h gear jo sabse upar wale shelf ke neeche h. har entry ke paas yeh bataiya h ki kya ke liye h normal words mei, resume ki bajaye."
    ]
  },
  about:{
    think:[
      ["bio, timeline, aur kuchh khaas baatain jod raha hoon.","pehle quote, phir story, phir short facts jo log jaldi padh lete hain.","yehi h woh banda jo commits ke peeche h." ],
      ["they want the human not the headline. timeline ko aage le aaya.","self taught, 2023 se ship kar raha hoon — milestones short aur sachchi hain.","bio, timeline, quick facts — all set." ],
      ["sachchai mei: kahan shuru kiya, kya kiya, kya dhundh raha hoon.","quote bolta h almost sab kuch. timeline puri h.","ready — idhar h woh banda jo keyboard ke paeche baetha h." ],
      ["bio aur milestones jod do, fluff nikal do.","do short paragraphs, timeline, kuchh quick facts.","aawaz se kehne ki koshish kar raha hoon jaise bolun." ]
    ],
    intro:[
      "chhota version: maine apni ko web development sikha li, phir ship karte rhi, ab tak bhi raha hoon. full story neeche h.",
      "yehi h woh banda jo code ke peeche h — kahan se shuru kiya, kya banaya, kya agle level par jaa raha hoon.",
      "har project ke peeche koi aisa banda h jo docs 1am par padhta h aur bio ko 4 baar likh leta h. yehi toh voh banda h.",
      "human page: do honest paragraphs, short timeline, quick facts jo jaane wala h."
    ]
  },
  contact:{
    think:[
      ["reach me ke tarike lay raha hoon — email, GitHub, LinkedIn.","simple rakhna: 3 links, koi forms, koi funnels nahi.","yehi h tarika jo sabse paas h." ],
      ["they want to talk. email ko sabse aage rakha.","main khud padh raha hoon — no bot, no autoresponder.","contact details laya gaya." ],
      ["easy rakh do: email pehle, profiles baad mei.","koi contact form nahi jo bounce kare — bas direct lines.","yehi h raaste." ],
      ["time to hand over the keys — email, GitHub, LinkedIn, location.","fastest route plain email. maine khud padha h.","sab neeche laya gaya." ]
    ],
    intro:[
      "hello kehna — main sab kuchh khud padh raha hoon, koi bot nahi.",
      "teen direct lines neeche hain. email sabse tez h; maine sabhi ko personally reply karta hoon.",
      "koi forms nahi, koi waiting rooms nahi — apna saaf chun lo. main online raha hoon zyada sochne ke liye.",
      "yehi h jahan se mujhe dhoondo sakte hain. email directly reach karta h; profiles work dikhate hain jab tak wait karte hain."
    ]
  },
  help:{
    think:[
      ["isei terminal ko samajhne ka koshish kar raha hoon, sabse mehmaan nawaaz tarah.","commands pehle, phir yaad rakhne ke liye keys.","short tour of the controls."],
      ["new here? gentle version dedo — koi manual-speak mat bolo.","slash dabao aur chuno, chip par click karo, Esc se stop karo. bas itna."],
      ["window ko host ki tarah walkthrough karo, spec sheet nahi.","commands ke liye slash, files ke liye at-sign, guide ke liye question mark." ],
      ["warm raho: yeh terminal ek costume pe portfolio h.","streaming answers, collapsible thoughts, mascot that follows cursor.","tour complete — neeche keys hain." ]
    ],
    intro:[
      "yehh mera portfolio ek coding terminal ki tarah bhidha hua hua h. ek command likho, main ek pal ke liye sochna shuru karta hoon, phir answer stream hoti h — thoughts padhne laayak rehte hain lekin reply poora hone par chhup jayein. kuchh bhi bhejne ki koi zaroorat nahi h.",
      "ek chat window ki tarah socho ek scripted dimaag ke saath: command chun lo (ya chip par click karo), dekho sochne ka process kholte jaye, phir answer ko padho jab tak stream hoti h. tumhara kuchh bhi browser se bhejne ki zaroorat nahi.",
      "ek chhota sa terminal kuchh commands ke saath. har ek soch ka block kholta h jo dekh sakte hain ya collapse kar sakte hain, phir real screenshots aur links ke saath answer dega.",
      "sab kuchh yahi isi window mei hota h — jaise coding assistant se baat kar rahe ho, lekin jawaab mere kaam aur kaam ke baare mei hota h. jab bhi man kare Esc se answer ko beech mei rok sakte hain."
    ]
  },
  free:{
    think:[
      ["Reading the request: {q}. best tarike se jawab dene ki koshish kar raha hoon.","koi command directly match nahi hua — closest honest answer dhundh raha hoon.","jawab de raha hoon jo mujhe pata h." ],
      ["free-form question. portfolio ke kis corner se match hoga.","project shelf and contact card ke beech kuchh." ,"useful version de raha hoon, deflection nahi."],
      ["Parsed: {q}. checking against what this terminal kar sakta h.","closest match mil gaya — reply chhota rakhke baaki point karo.","yehi h answer aur agla kahan jaye." ],
      ["slash nahi try kiya — theek hi h, sidha jawab do.","same honest filter se route kar do.","reply taiyar." ]
    ],
    hire:[
      "haan — main freelance aur product work ke liye available hoon, remote worldwide. sabse tez route {email} par hai, ya /contact try karo aur main sab kuchh lay duonga.","main freelance aur full-time conversations ke liye khul hoon, India se remote-friendly. quickest route: {email} — ya /contact se saare links ek saath.","available, haan — client work, product work, ya kuchh beech ka. {email} par ek line likho (maine khud padha h) ya /contact se poori card.","main abhi hi naye kaam par laga hoon. sabse achha pehla kadam {email} par email bhejna hai; /contact bhi email, GitHub aur LinkedIn ko ek saath dikhata h."
    ],
    project:[
      "sure — yehi h sab kuchh jo maine ship kiya, naye se purane tak. screenshots included.","neeche: paanch real projects screenshots, plain descriptions aur live links ke saath. naye se purane tak.","project shelf load kar raha hoon — har card ke paas screenshot aur dono links.","yehi h kaam. paanch shipped projects, har ek par screenshot aur links."
    ],
    stack:[
      "happy to. yehi h stack, grouped by jahan par kaam dikhaye.","tools, teen honest groups mei — kaisa lagta h, kya hold karta h, kya ship karta h.","yehi h gear jo maine asli mei use karta hoon, har ek ke saath plain english note.","stack neeche — grouped by role, buzzwords nikal doye."
    ],
    who:[
      "chhota version: self taught web developer from India, 2023 se ship kar raha hoon. full timeline ke liye /about dabao.","main Naman hoon — web par cheezein banata hoon aur ship karte raho. /about full story ke liye agar chaheo.","ek aisa developer jo khud banana seekha, dekha nahi sirf. /about timeline aur quick facts ko lay dega.","koi aisa insaan jo clean interfaces aur honest descriptions pasand karta h — jaise yehi. full bio /about se."
    ],
    nudge:[
      "main ek chhota sa terminal hoon sirf kuchh commands ke sath full chatbot ki tarah nahi, isliye yeh command mera dimaag ghusa nahi. /work for projects, /craft for stack, /about for my story, ya /contact to say hello.","yeh command meri chhote vocabulary se bahar hai — main sirf kuchh words jaanta hoon. /work, /craft, /about ya /contact try karo, main tumhe kuchh achha dikhaydu.","sachchai: mujhe iska koi script nahi h. main jaanta hoon /work, /craft, /about aur /contact — inmei se koi bhi tumhe kuchh kaha par le jaayegi.","main ek scripted terminal hoon, ek real model nahi, isliye yeh piche se nikal gaya. /work, /craft, /about ya /contact par istemaal karo aur main deliver kar duonga."
    ],
    greet:[
      "hello! 👋 yehh mera portfolio h — ek chhota sa terminal jo real kaam se jawab deta h. shuru karo / (ya chip par click karo): /work, /craft, /about, /contact.","hey — accha lag kar mila. explore karo: /work dikhata h 5 shipped projects, /about bataata h whoami, /contact deta h links.","hi! main itna ek portfolio h jo coding assistant ki tarah lagta h. kuchh bhi bhejne ki zaroorat nahi h — /work ya /about se shuru karo.","swagat h! / dabao for command list, ya seedha chip par click karo neeche mascot ke. meri pasand wala opening line /work h."
    ]
  }
};

/* fill {q}/{email} placeholders in a picked script line */
function fill(t,map){
  let s=t;
  for(const k in map)s=s.split("{"+k+"}").join(map[k]);
  return s;
}

/*═════════════════════════════════════════════════════════════
  TRANSCRIPT PRIMITIVES (where stuff shows up on screen)
  ══════════════════════════════════════════════════════════════*/
function toActive(){body.dataset.state="active";}
function pin(){transcript.scrollTop=transcript.scrollHeight;}

function echo(text){
  const d=document.createElement("div");
  d.className="row row--echo";
  d.innerHTML='<span class="chev">›</span> '+esc(text);
  transcript.appendChild(d);pin();
}

function errLine(text){
  const d=document.createElement("div");
  d.className="row row--err";
  d.innerHTML='<span class="mk">✳</span> '+esc(text);
  transcript.appendChild(d);pin();
  SND.err();
}

/* thinking block — start open by default, reply poora hone ke baad
   clickable so reader can toggle. maine apni tarah se likha */
function thinking(seed){
  const d=document.createElement("div");
  d.className="think";
  let text=seed||"";
  let expanded=true;              // start open by default
  let finished=false;
  let live=true;

  const frames=["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  let fi=0;
  /* every thinking block gets its OWN shuffled phrase order,
     starting at a random offset — no two runs same kuchh */
  const words=shuffled(THINK_WORDS);
  let wordIdx=Math.floor(Math.random()*words.length);
  let wordTimer=null,spinTimer=null;
  const startWords=setTimeout(()=>{
    if(!live)return;
    wordTimer=setInterval(()=>{
      if(!live)return;
      wordIdx=(wordIdx+1)%words.length;
      const w=d.querySelector(".think__word");
      if(w){w.style.opacity="0";setTimeout(()=>{if(w.isConnected){w.textContent=words[wordIdx];w.style.opacity="1";}},160);}
    },1500);
  },900);

  spinTimer=setInterval(()=>{
    if(!live)return;
    fi=(fi+1)%frames.length;
    const sp=d.querySelector(".spin");
    if(sp)sp.textContent=frames[fi];
  },90);

  function paint(){
    if(!text)return;
    if(expanded){
      d.innerHTML=
      '<span class="think__hd">▼ Soch raha hoon:</span>'+
      '<div class="think__body">  '+esc(text)+"</div>"+
      '<span class="think__hint">click to collapse this thought</span>';
    }else{
      d.innerHTML=
      '<span class="think__arrow">▶</span>'+
      '<span class="think__inline">Soch raha hoon: '+esc(text)+"</span>"+
      '<span class="think__hint">click to read the full thought</span>';
    }
  }

  function stopTimers(){live=false;clearInterval(spinTimer);clearInterval(wordTimer);clearTimeout(startWords);}

  const handle={
    el:d,
    get cancelled(){return d.dataset.cancelled==="1";},
    /* stop the spinner, keep it OPEN — runner collapses it later */
    hold(t){
      stopTimers();
      if(t!=null)text=t;
      if(d.dataset.cancelled==="1"){
        d.innerHTML='<span class="think__inline" style="color:var(--red)">✳ Cancelled</span>';
        return;
      }
      if(!text){d.innerHTML='<span class="think__inline" style="color:var(--dimmer)">✳ (no thought needed)</span>';finished=true;return;}
      paint();finished=true;
    },
    /* auto-collapse — reply poora hone ke baad */
    collapse(){
      if(d.dataset.cancelled==="1"||!finished||!text)return;
      if(d.dataset.userToggled=="1")return;    // manual toggle ko ignore mat karo
      expanded=false;paint();
    },
    /* user click par toggle */
    bind(){
      d.onclick=()=>{
        expanded=!expanded;
        d.dataset.userToggled="1";
        paint();
      };
    },
    set(t){text=t;if(!live&&finished)paint();},
    get text(){return text;}
  };
  d.innerHTML='<span class="think__live"><span class="spin">⠋</span> Soch raha hoon… <span class="esc">(esc to cancel)</span> <span class="think__word" style="transition:opacity .2s;color:var(--dimmer)"></span></span>';
  d.onclick=()=>{};   // live blocks ignore clicks
  S.thinking.push(handle);
  transcript.appendChild(d);pin();
  return handle;
}

/* tool call with collapsible output */
function toolCall(name,args,lines){
  const wrap=document.createElement("div");
  wrap.className="tool";
  wrap.innerHTML='<span class="tool__name">'+esc(name)+'</span><span class="tool__args">'+esc(args)+"</span>";
  transcript.appendChild(wrap);pin();

  const out=document.createElement("div");
  out.className="tool__out";
  wrap.appendChild(out);

  const n=lines.length;
  let open=n<=4;

  function paintOut(){
    if(open){
      out.innerHTML=lines.map(l=>
      '<div class="tool__line"><span class="tool__bracket">⌐</span> '+esc(l||" ")+"</div>").join("");
    }else{
      out.innerHTML=
      '<div class="tool__line"><span class="tool__bracket">⌐</span> '+esc(lines[0]||" ")+"</div>"
      +'<div class="tool__more">  ... '+n+" more lines — click to expand</div>";
    }
    pin();
  }
  paintOut();
  out.onclick=(e)=>{e.stopPropagation();open=!open;paintOut();};
  return{expand(){if(!open){open=true;paintOut();}}};
}

/* assistant text — streams char by char */
async function streamText(run,text){
  const d=document.createElement("div");
  d.className="row row--out";
  d.innerHTML='<span class="mk">✳</span> <span class="tx"></span>';
  transcript.appendChild(d);
  const tx=d.querySelector(".tx");
  let i=0;
  const step=Math.max(1,Math.round(text.length/110));
  while(i<text.length){
    if(run.cancelled)break;
    i=Math.min(text.length,i+step);
    tx.innerHTML=linkify(text.slice(0,i));
    pin();
    await sleep(15);
  }
  tx.innerHTML=linkify(run.cancelled?text.slice(0,i)+" ⏹":text);
  pin();
}

function linkify(s){
  return esc(s).replace(/(https?:\/\/[^\s<"]+)/g,m=>'<a href="'+m+'" target="_blank" rel="noopener">'+m+"</a>");
}

/* code block — streams line by line */
async function streamCode(run,code){
  const pre=document.createElement("div");
  pre.className="code";
  transcript.appendChild(pre);
  const lines=code.split("\n");
  for(let i=0;i<lines.length;i++){
    if(run.cancelled)break;
    const row=document.createElement("div");
    row.className="cl";
    row.innerHTML=hl(lines[i])||"&nbsp;";
    pre.appendChild(row);
    pin();
    await sleep(30);
  }
  if(run.cancelled){
    const row=document.createElement("div");
    row.className="cl";
    row.innerHTML='<span class="tk-c">// ⏹ stopped</span>';
    pre.appendChild(row);
  }
  pin();
}

function hl(line){
  let s=esc(line);
  if(/^\s*(\/\/|#)/.test(line))return '<span class="tk-c">'+s+"</span>";
  s=s.replace(/(&quot;[^&]*?&quot;|"[^"]*?")/g,'<span class="tk-s">$1</span>');
  s=s.replace(/\b(import|export|const|let|var|function|return|type|interface|from|await|async|new|default|true|false|null)\b/g,'<span class="tk-k">$1</span>');
  s=s.replace(/\b(\d+(?:\.\d+)?)\b/g,'<span class="tk-n">$1</span>');
  s=s.replace(/([A-Za-z_$][\w$]*)(\()/g,'<span class="tk-f">$1</span>$2');
  return s;
}

function panel(html,hd){
  const d=document.createElement("div");
  d.className="panel";
  d.innerHTML=(hd?'<div class="panel__hd">'+esc(hd)+"</div>":"")+html;
  transcript.appendChild(d);pin();
  return d;
}

/* project card — screenshot + plain english copy */
function projectCard(p,i){
  const d=document.createElement("div");
  d.className="proj";
  d.innerHTML=
  '<div class="proj__hd"><span class="num">'+String(i+1).padStart(2,"0")+"</span>"+
  "<b>"+esc(p.title)+'</b><span class="yr">'+p.year+"</span>"+
  '<span class="tags">'+esc(p.tags)+"</span></div>"+
  '<div class="proj__body">'+
  '<img class="proj__img" alt="'+esc(p.title)+' screenshot" loading="lazy" src="'+p.img+'" />'+
  '<div class="proj__info">'+
  '<p class="proj__txt">'+esc(p.blurb)+"</p>"+
  '<div class="proj__stack">↳ '+esc(p.stack)+"</div>"+
  '<div class="proj__links"><a class="hot" href="'+p.live+'" target="_blank" rel="noopener">live demo ↗</a>'+
  '<a href="'+p.repo+'" target="_blank" rel="noopener">source code</a></div>'
  +"</div></div>";
  transcript.appendChild(d);
  const img=d.querySelector(".proj__img");
  img.addEventListener("load",()=>{img.classList.add("in");pin();});
  if(img.complete)img.classList.add("in");
  pin();
  return d;
}

/*═════════════════════════════════════════════════════════════
  RUNNER (har command ka controller)
  ══════════════════════════════════════════════════════════════*/
function newRun(){
  if(S.run)S.run.cancelled=true;
  S.run={cancelled:false};
  S.thinking=[];
  return S.run;
}

/*═════════════════════════════════════════════════════════════
  COMMANDS (har ek ke saath real answers)
  ══════════════════════════════════════════════════════════════*/

/* i keep forgetting the exact order of these but whatever */

async function runWork(run){
  const sc=pick(SCRIPTS.work.think);
  const th=thinking(sc[0]);
  await sleep(760);if(run.cancelled)return th.hold();
  th.set(sc[1]);
  await sleep(700);if(run.cancelled)return th.hold();
  th.hold(sc[2]);
  await sleep(240);if(run.cancelled)return;

  const t=toolCall("read","data.js",pick(SCRIPTS.work.tool));
  await sleep(560);if(run.cancelled)return t.expand();
  t.expand();

  await streamText(run,pick(SCRIPTS.work.intro));
  if(run.cancelled)return;

  for(let i=0;i<PROJECTS.length;i++){
    if(run.cancelled)return;
    projectCard(PROJECTS[i],i);
    await sleep(420);
  }
}

async function runCraft(run){
  const sc=pick(SCRIPTS.craft.think);
  const th=thinking(sc[0]);
  await sleep(740);if(run.cancelled)return th.hold();
  th.set(sc[1]);
  await sleep(640);if(run.cancelled)return th.hold();
  th.hold(sc[2]);
  await sleep(220);if(run.cancelled)return;

  await streamText(run,pick(SCRIPTS.craft.intro));
  if(run.cancelled)return;

  CRAFT.forEach(g=>{
    const rows=g.items.map(i=>
    '<div class="krow"><img class="ico" src="./assets/tech/'+i.icon+'.webp" alt="" loading="lazy" />'+
    "<b>"+esc(i.name)+"</b><span>"+esc(i.note)+"</span></div>").join("");
    panel(rows,"0"+g.n+" — "+g.title.toUpperCase()+" — "+g.kicker);
  });
}

async function runAbout(run){
  const sc=pick(SCRIPTS.about.think);
  const th=thinking(sc[0]);
  await sleep(720);if(run.cancelled)return th.hold();
  th.set(sc[1]);
  await sleep(520);if(run.cancelled)return th.hold();
  th.hold(ABOUT.quote);
  await sleep(240);if(run.cancelled)return;

  await streamText(run,pick(SCRIPTS.about.intro));
  if(run.cancelled)return;
  await streamText(run,ABOUT.bio[0]);
  if(run.cancelled)return;
  await streamText(run,ABOUT.bio[1]);
  if(run.cancelled)return;

  const tl=ABOUT.timeline.map(t=>
    '<div class="krow"><b>'+esc(t.y)+"</b><span>"+esc(t.t)+"</span></div>").join("");
  panel(tl,"HOW IT WENT — TIMELINE");

  const bl=ABOUT.bullets.map(b=>'<div class="krow"><b>→</b><span>'+esc(b)+"</span></div>").join("");
  panel(bl,"QUICK FACTS");
}

async function runContact(run){
  const sc=pick(SCRIPTS.contact.think);
  const th=thinking(sc[0]);
  await sleep(640);if(run.cancelled)return th.hold();
  th.set(sc[1]);
  await sleep(520);if(run.cancelled)return th.hold();
  th.hold(CONTACT.line);
  await sleep(220);if(run.cancelled)return;

  await streamText(run,pick(SCRIPTS.contact.intro));
  if(run.cancelled)return;

  panel(
    '<div class="krow"><b>email</b><span><a href="mailto:'+CONTACT.email+'">'+CONTACT.email+"</a></span></div>"+
    '<div class="krow"><b>github</b><span><a href="'+CONTACT.github+'" target="_blank" rel="noopener">@'+CONTACT.githubUser+"</a></span></div>"+
    '<div class="krow"><b>linkedin</b><span><a href="'+CONTACT.linkedin+'" target="_blank" rel="noopener">'+CONTACT.linkedinUser+"</a></span></div>"+
    '<div class="krow"><b>based in</b><span>India — working with people anywhere</span></div>',
    "GET IN TOUCH");
}

async function runHelp(run){
  const sc=pick(SCRIPTS.help.think);
  const th=thinking(sc[0]);
  await sleep(600);if(run.cancelled)return th.hold();
  th.set(sc[1]);
  await sleep(500);if(run.cancelled)return th.hold();
  th.hold(sc[2]);
  await sleep(200);if(run.cancelled)return;

  await streamText(run,pick(SCRIPTS.help.intro));
  if(run.cancelled)return;

  const keys=[
    ["/","opens the command list — or just click a chip"],
    ["@","mentions a file, like @index.html"],
    ["Ctrl+P","shows every command at once"],
    ["Tab","switches between Plan (talk only) and Act (do things)"],
    ["Shift+Tab","turns automatic answers on or off"],
    ["Esc","stops an answer halfway"],
    ["↑ / ↓","brings back something you typed earlier"],
    ["?","reopens the beginner guide"]
  ].map(k=>'<div class="krow"><b>'+esc(k[0])+"</b><span>"+esc(k[1])+"</span></div>").join("");
  panel(keys,"KEYBOARD");

  const cmds=COMMANDS.map(c=>
    '<div class="krow"><b>'+esc(c.cmd)+"</b><span>"+esc(c.desc)+"</span></div>").join("");
  panel(cmds,"COMMANDS — "+COMMANDS.length+" TOTAL");
}

/* 16 genuine palettes — must match styles.css data-theme blocks */
const THEMES=[
  ["harness","the default — near black + electric blue"],
  ["abyss","deep ocean blue-black"],
  ["ember","warm dark with orange sparks"],
  ["dracula","the classic purple-pink night"],
  ["nord","arctic, muted blue-grey"],
  ["gruvbox","retro groove — brown, orange, olive"],
  ["monokai","the original editor orange-green"],
  ["solarized-dark","Ethan Schoonover's blue-green"],
  ["solarized-light","the same, on paper"],
  ["one-dark","Atom's familiar grey-blue"],
  ["tokyo-night","neon dusk over the city"],
  ["catppuccin","soft pastel mocha"],
  ["rose-pine","dusk mauve with seafoam"],
  ["everforest","mossy green outdoors"],
  ["kanagawa","ink wash, sumi-e beige"],
  ["github-dark","the one you already stare at"]
];
function applyTheme(name){
  body.dataset.theme=name;
  try{localStorage.setItem("pt-theme",name);}catch(e){}
  if(window.__mascotResize)window.__mascotResize();
}
async function runTheme(run,arg){
  /* /theme <name> jumps straight there */
  const wanted=(arg||"").trim().toLowerCase();
  if(wanted&&THEMES.some(t=>t[0]===wanted)){
    applyTheme(wanted);
    panel('<div class="krow"><b>'+esc(wanted)+"</b><span>applied</span></div>","COLOUR THEME");
    return;
  }
  const th=thinking("new look chaaiye — saare 16 palettes clickable rows mei lay raha hoon.");
  await sleep(520);if(run&&run.cancelled)return th.hold();
  th.hold("click karo koi bhi row — turant apply hota h aur next time ke liye save bhi hota h.");
  await sleep(200);if(run&&run.cancelled)return;

  const cur=body.dataset.theme||"harness";
  const rows=THEMES.map(([id,note])=>
    '<div class="krow thm'+(id===cur?" is-cur":"")+'" data-theme="'+id+'" role="button" tabindex="0">'+
    '<span class="sw"><i></i><i></i><i></i></span>'+
    "<b>"+esc(id)+"</b><span>"+esc(note)+(id===cur?" ✓":"")+"</span></div>").join("");
  panel(rows,"COLOUR THEMES — CLICK TO SWITCH ("+THEMES.length+")");
}

async function runHistory(){
  if(!S.history.length){
    panel('<div class="krow"><b>nothing yet</b><span>pehle kuchh poocha</span></div>',"YOUR QUESTIONS");
    return;
  }
  const rows=S.history.map((h,i)=>
  '<div class="krow"><span class="num">'+String(i+1).padStart(2,"0")+"</span><b>"+esc(h)+"</b></div>").join("");
  panel(rows,"EVERYTHING YOU'VE ASKED — "+S.history.length);
}

async function runUndo(){
  if(transcript.children.length<=1){
    panel('<div class="krow"><b>nothing to undo</b><span>yeh session ka start hai</span></div>',"STEP BACK");
    return;
  }
  let removed=0;
  while(transcript.children.length>1&&removed<8){transcript.removeChild(transcript.lastChild);removed++;}
  panel('<div class="krow"><b>went back</b><span>last ke '+removed+" blocks hata diye</span></div>","STEP BACK");
}

/* free text → short answer in harness style */
async function runFree(run,text){
  const q=text.toLowerCase();
  const sc=pick(SCRIPTS.free.think);
  const th=thinking(fill(sc[0],{q:JSON.stringify(text)}));
  await sleep(900);if(run.cancelled)return th.hold();

  // simple honest routing — koi fake backend nahi bc
  if(/^(hi|hello|hey|yo|namaste|sup)\b/.test(q.trim())){
    th.hold("greeting mila — unko welcome karo aur command point karo.");
    await sleep(240);if(run.cancelled)return;
    await streamText(run,pick(SCRIPTS.free.greet));
    return;
  }
  if(/(hire|work with|available|freelance|job)/.test(q)){
    th.hold("availability ke baare mei poocha — contact block point karo.");
    await sleep(240);if(run.cancelled)return;
    await streamText(run,fill(pick(SCRIPTS.free.hire),{email:CONTACT.email}));
    return;
  }
  if(/(project|built|made|work|portfolio|ship)/.test(q)){
    th.hold("they want the work — 5 projects with screenshots lao.");
    await sleep(240);if(run.cancelled)return;
    await streamText(run,pick(SCRIPTS.free.project));
    if(run.cancelled)return;
    const t=toolCall("read","data.js",pick(SCRIPTS.work.tool));
    await sleep(520);t.expand();
    for(let i=0;i<PROJECTS.length;i++){
      if(run.cancelled)return;
      projectCard(PROJECTS[i],i);
      await sleep(400);
    }
    return;
  }
  if(/(stack|tool|use|tech|language|framework)/.test(q)){
    th.hold("stack question — teen groups in plain words batao.");
    await sleep(240);if(run.cancelled)return;
    await streamText(run,pick(SCRIPTS.free.stack));
    if(run.cancelled)return;
    CRAFT.forEach(g=>{
      const rows=g.items.map(i=>
      '<div class="krow"><img class="ico" src="./assets/tech/'+i.icon+'.webp" alt="" loading="lazy" />'+
      "<b>"+esc(i.name)+"</b><span>"+esc(i.note)+"</span></div>").join("");
      panel(rows,"0"+g.n+" — "+g.title.toUpperCase());
    });
    return;
  }
  if(/(who|you|yourself|about|naman|bio)/.test(q)){
    th.hold("short intro, unki awaaz mei.");
    await sleep(240);if(run.cancelled)return;
    await streamText(run,pick(SCRIPTS.free.who));
    return;
  }

  th.hold(sc[1]);
  await sleep(240);if(run.cancelled)return;
  await streamText(run,pick(SCRIPTS.free.nudge));
}

/*═════════════════════════════════════════════════════════════
  MENU (/, @, aur Ctrl+P)
  ══════════════════════════════════════════════════════════════*/
function renderMenu(){
  const items=S.menuItems;
  if(!items.length){menu.hidden=true;return;}
  const MAX=7;
  const shown=items.slice(0,MAX);
  const rest=items.length-shown.length;

  menu.innerHTML=shown.map((it,i)=>
  '<div class="menu__i'+(i===S.menuIdx?" on":"")+'" data-i="'+i+'">'+
  '<span class="mk">›</span><span class="cmd">'+esc(it.a)+"</span>"+
  '<span class="desc">'+esc(it.b)+"</span></div>"
  ).join("")+(rest>0?'<div class="menu__more"><span>▼</span> '+rest+" more</div>":"");

  menu.hidden=false;
  [...menu.querySelectorAll(".menu__i")].forEach(el=>{
    el.onpointerenter=()=>{S.menuIdx=+el.dataset.i;renderMenu();};
    el.onclick=()=>pickMenu(+el.dataset.i);
  });
}

function openMenu(kind){
  S.menuKind=kind;
  if(kind==="cmd"){
    const q=input.value.trim().toLowerCase();
    S.menuItems=COMMANDS.filter(c=>c.cmd.startsWith(q)).map(c=>({a:c.cmd,b:c.desc}));
  }else{
    const q=input.value.slice(1).toLowerCase();
    S.menuItems=FILES.filter(f=>f.toLowerCase().includes(q)).map(f=>({a:"@"+f,b:"file"}));
  }
  S.menuIdx=S.menuItems.length?0:-1;
  renderMenu();
}
function closeMenu(){menu.hidden=true;S.menuIdx=-1;S.menuKind=null;}

function pickMenu(i){
  const it=S.menuItems[i];
  if(!it)return;
  if(S.menuKind==="cmd"){closeMenu();input.value="";submit(it.a);}
  else{input.value=it.a+" ";closeMenu();input.focus();}
}

/*═════════════════════════════════════════════════════════════
  MODE / STATUS (plan vs act toggle)
  ══════════════════════════════════════════════════════════════*/
function setMode(m){
  S.mode=m;
  body.dataset.mode=m;
  toggle.querySelectorAll(".opt").forEach(o=>{
    const on=o.dataset.mode===m;
    o.classList.toggle("is-on",on);
    o.textContent=(on?"● ":"○ ")+(o.dataset.mode==="plan"?"Plan":"Act");
  });
  input.placeholder=m==="plan"?"Plan something...":"What can I do for you?";
}
function cycleMode(){setMode(S.mode==="act"?"plan":"act");}

function setAuto(v){
  S.autoAnswer=v;
  autoBtn.classList.toggle("off",!v);
  autoBtn.innerHTML=v
    ?'⏵⏵ Answers stream automatically <span class="dim">(Shift+Tab)</span>'
    :'○ Paused — press Shift+Tab to resume <span class="dim">(Shift+Tab)</span>';
}

/*═════════════════════════════════════════════════════════════
  SESSION / SUBMIT (jab user enter dabate h)
  ══════════════════════════════════════════════════════════════*/
function newSession(){
  if(S.run)S.run.cancelled=true;
  transcript.innerHTML="";
  body.dataset.state="idle";
  S.history=[];S.histIdx=-1;
  input.value="";
  input.placeholder=S.mode==="plan"?"Plan something...":"What can I do for you?";
  closeMenu();
  requestAnimationFrame(()=>{if(window.__mascotResize)window.__mascotResize();});
  input.focus();
}

/* top-bar ‹ back button — collapse the session and return to the
   start screen. transcript is kept so pressing back again picks
   the conversation right back up. maine khud socha ye logic :) */
function goBack(){
  if(S.run)S.run.cancelled=true;
  if(body.dataset.state!=="active")return;
  body.dataset.state="idle";
  closeMenu();
  input.value="";
  requestAnimationFrame(()=>{if(window.__mascotResize)window.__mascotResize();});
  input.focus();
}

async function submit(raw){
  const text=raw.trim();
  console.log("submitted:",text);  // debug lol
  if(!text)return;

  if(text==="/clear"){newSession();return;}

  /* "/theme dracula" → cmd + trailing arg */
  const parts=text.split(/\s+/);
  const cmd=COMMANDS.find(c=>c.cmd.toLowerCase()===parts[0]);
  const cmdArg=cmd&&parts.length>1?parts.slice(1).join(" "):"";

  if(text.startsWith("/")&&!cmd){
    const egg=EGGS[parts[0]];
    if(egg){
      S.history.push(text);S.histIdx=S.history.length;
      toActive();echo(text);
      input.value="";closeMenu();
      const run=newRun();
      try{await egg(run);}catch(e){errLine("Error: "+(e&&e.message?e.message:e));}
      S.thinking.forEach(h=>{h.bind();h.collapse();});
      pin();
      return;
    }
    S.history.push(text);S.histIdx=S.history.length;
    toActive();echo(text);
    const run=newRun();
    await sleep(320);
    if(!run.cancelled)errLine("Error: no such command — try /help to see the list");
    input.value="";closeMenu();
    return;
  }

  S.history.push(text);S.histIdx=S.history.length;
  toActive();echo(text);
  input.value="";closeMenu();
  SND.enter();

  const run=newRun();
  try{
    if(cmd)await cmd.run(run,cmdArg);
    else await runFree(run,text);
  }catch(e){
    errLine("Error: "+(e&&e.message?e.message:e));
  }
  // reply complete → soch chhupao (user phir se open kar sakta h)
  S.thinking.forEach(h=>{h.bind();h.collapse();});
  pin();
}

/*═════════════════════════════════════════════════════════════
  BEGINNER GUIDE + live typing demo (agar pehli baar aaya ho)
  ══════════════════════════════════════════════════════════════*/
const DEMO_STEPS=[
  {kind:"type",text:"/work"},
  {kind:"enter"},
  {kind:"think",text:"Soch raha hoon... lining up the good parts...",ms:1500},
  {kind:"out",text:"✳ Idhar hai kaam — 5 cheezein jo maine banayi hain.",ms:1400},
  {kind:"card",text:"▸ 01  Smart Mailto   screenshot + live link",ms:2000},
  {kind:"clear"}
];

function runDemo(){
  const screen=$("demoScreen");
  if(!screen)return;
  let stopped=false;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  async function loop(){
    while(!stopped){
      for(const step of DEMO_STEPS){
        if(stopped)return;
        if(step.kind==="type"){
          screen.innerHTML='<div class="demo__in"><span class="c">&gt;</span> <span class="tv"></span><span class="caret"></span></div>';
          const tv=screen.querySelector(".tv");
          for(let i=1;i<=step.text.length;i++){
            if(stopped)return;
            tv.textContent=step.text.slice(0,i);
            await wait(95);
          }
          await wait(420);
        }else if(step.kind==="enter"){
          const cur=screen.innerHTML;
          screen.innerHTML=cur.replace('<span class="caret"></span>',"");
          await wait(320);
        }else if(step.kind==="think"){
          screen.innerHTML+='\n<div class="demo__think">⠹ '+esc(step.text)+"</div>";
          const el=screen.querySelector(".demo__think");
          const frames=["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
          let f=0;
          const iv=setInterval(()=>{if(stopped)return clearInterval(iv);f=(f+1)%frames.length;el.textContent=frames[f]+" "+step.text;},110);
          await wait(step.ms);
          clearInterval(iv);
        }else if(step.kind==="out"){
          screen.innerHTML+='\n<div class="demo__out"><span class="mk">✳</span> <span class="ov"></span></div>';
          const ov=screen.querySelector(".ov");
          const txt=step.text.replace("✳ ","");
          for(let i=1;i<=txt.length;i+=2){
            if(stopped)return;
            ov.textContent=txt.slice(0,i);
            await wait(22);
          }
          await wait(step.ms);
        }else if(step.kind==="card"){
          screen.innerHTML+='\n<div class="demo__out">'+esc(step.text)+"</div>";
          await wait(step.ms);
        }else if(step.kind==="clear"){
          await wait(700);
          if(!stopped)screen.innerHTML="";
        }
      }
    }
  }
  loop();
  return()=>{stopped=true;};
}

let stopDemo=null;
function openGuide(){
  guide.hidden=false;
  $("guideRemember").focus?.();
  if(stopDemo)stopDemo();
  stopDemo=runDemo();
}
function closeGuide(remember){
  guide.hidden=true;
  if(stopDemo){stopDemo();stopDemo=null;}
  try{if(remember)localStorage.setItem("pt-guide-seen","1");}catch(e){}
  input.focus();
}
/* click outside the box or ✕ or Esc ya Close se band karo */
guide.addEventListener("click",(e)=>{
  if(e.target===guide)closeGuide($("guideRemember").checked);
});

/*═════════════════════════════════════════════════════════════
  EVENTS (keyboard + clicks + whatever)
  ══════════════════════════════════════════════════════════════*/
input.addEventListener("input",()=>{
  const v=input.value;
  if(v.startsWith("/"))openMenu("cmd");
  else if(v.startsWith("@"))openMenu("file");
  else closeMenu();
});

input.addEventListener("keydown",(e)=>{
  if(e.key.length===1&&!e.ctrlKey&&!e.metaKey)SND.key();
  if(!menu.hidden&&S.menuItems.length){
    if(e.key==="ArrowDown"){e.preventDefault();S.menuIdx=(S.menuIdx+1)%S.menuItems.length;renderMenu();return;}
    if(e.key==="ArrowUp"){e.preventDefault();S.menuIdx=(S.menuIdx-1+S.menuItems.length)%S.menuItems.length;renderMenu();return;}
    if(e.key==="Tab"){e.preventDefault();S.menuIdx=(S.menuIdx+1)%S.menuItems.length;renderMenu();return;}
    if(e.key==="Enter"){e.preventDefault();pickMenu(S.menuIdx);return;}
    if(e.key==="Escape"){e.preventDefault();closeMenu();return;}
  }

  if(e.key==="Enter"){e.preventDefault();submit(input.value);return;}

  if(e.key==="Escape"){
    e.preventDefault();
    if(S.run&&!S.run.cancelled){
      S.run.cancelled=true;
      const live=transcript.querySelector(".think__live");
      if(live){
        const box=live.closest(".think");
        if(box){box.dataset.cancelled="1";box.innerHTML='<span class="think__inline" style="color:var(--red)">✳ Cancelled</span>';}
      }
    }else{input.value="";closeMenu();}
    return;
  }

  if(e.key==="Tab"&&!e.shiftKey){e.preventDefault();cycleMode();return;}

  if(e.key==="ArrowUp"&&!input.value){
    e.preventDefault();
    if(!S.history.length)return;
    S.histIdx=Math.max(0,S.histIdx-1);
    input.value=S.history[S.histIdx]||"";
    return;
  }
  if(e.key==="ArrowDown"&&S.histIdx>=0){
    e.preventDefault();
    S.histIdx=Math.min(S.history.length,S.histIdx+1);
    input.value=S.history[S.histIdx]||"";
    return;
  }
});

document.addEventListener("keydown",(e)=>{
  const k=e.key.toLowerCase();
  if(!guide.hidden){
    if(e.key==="Escape"){e.preventDefault();closeGuide(true);}
    return;
  }
  if((e.ctrlKey||e.metaKey)&&k==="p"){e.preventDefault();input.focus();input.value="/";openMenu("cmd");return;}
  if((e.ctrlKey||e.metaKey)&&k==="l"){e.preventDefault();newSession();return;}
  if(e.key==="?"&&document.activeElement!==input){e.preventDefault();openGuide();return;}
  if(e.key==="Shift"&&e.shiftKey)return;
  if(e.key==="Tab"&&e.shiftKey){e.preventDefault();setAuto(!S.autoAnswer);return;}
  if(e.key==="/"&&document.activeElement!==input&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
    e.preventDefault();input.focus();input.value="/";openMenu("cmd");
  }
});

toggle.addEventListener("click",(e)=>{const o=e.target.closest(".opt");if(o)setMode(o.dataset.mode);});
autoBtn.addEventListener("click",()=>setAuto(!S.autoAnswer));
autoBtn.addEventListener("keydown",(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setAuto(!S.autoAnswer);}});
/* /theme row par click se instantly switch hota h */
transcript.addEventListener("click",(e)=>{
  const row=e.target.closest(".krow.thm");
  if(!row)return;
  applyTheme(row.dataset.theme);
  transcript.querySelectorAll(".krow.thm").forEach(r=>{
    r.classList.toggle("is-cur",r.dataset.theme===body.dataset.theme);
    const note=r.lastElementChild;
    if(note&&note.textContent.endsWith(" ✓"))note.textContent=note.textContent.slice(0,-2);
    if(note&&r.dataset.theme===body.dataset.theme)note.textContent+=" ✓";
  });
});
$("chips").addEventListener("click",(e)=>{const b=e.target.closest(".chip");if(b)submit(b.dataset.cmd);});
$("backBtn").addEventListener("click",goBack);
$("helpBtn").addEventListener("click",openGuide);
$("guideX").addEventListener("click",()=>closeGuide($("guideRemember").checked));
$("guideClose").addEventListener("click",()=>closeGuide($("guideRemember").checked));
$("guideGo").addEventListener("click",()=>{closeGuide($("guideRemember").checked);setTimeout(()=>submit("/work"),180);});
document.addEventListener("click",(e)=>{if(!e.target.closest(".prompt"))closeMenu();});

/* konami code → quiet reward (menu mei kabhi dikhaye nahi) */
document.addEventListener("keydown",(e)=>{
  const k=e.key.length===1?e.key.toLowerCase():e.key;
  if(k===KONAMI[kIdx]){
    kIdx++;
    if(kIdx===KONAMI.length){
      kIdx=0;
      panel(
        '<div class="krow"><b>↑↑↓↓←→←→BA</b><span>cheat code accepted — cheat ke liye kuchh nahi h, but respect.</span></div>'+
        '<div class="krow"><b>unlock</b><span>/coffee, /42, /xyzzy ya /sudo likho — baki intentionally chhupa hua h</span></div>',
        "DEVELOPER MODE");
      if(window.__mascotBounce)window.__mascotBounce();
    }
  }else{
    kIdx=(k===KONAMI[0])?1:0;
  }
});

/*═════════════════════════════════════════════════════════════
  SOUND — tiny webaudio blips, files nahi, off by default
  ══════════════════════════════════════════════════════════════*/
const SND={
  ctx:null,on:false,
  ensure(){
    if(!this.ctx){
      try{this.ctx=new(window.AudioContext||window.webkitAudioContext());}catch(e){return null;}
    }
    if(this.ctx&&this.ctx.state==="suspended")this.ctx.resume();
    return this.ctx;
  },
  blip(freq,dur,type,vol){
    if(!this.on)return;
    const c=this.ensure();if(!c)return;
    const o=c.createOscillator(),g=c.createGain();
    o.type=type||"square";o.frequency.value=freq;
    g.gain.setValueAtTime(vol||0.03,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+(dur||0.05));
    o.connect(g);g.connect(c.destination);
    o.start();o.stop(c.currentTime+(dur||0.05));
  },
  key(){this.blip(1400+Math.random()*600,0.03,"square",0.018);},
  enter(){this.blip(880,0.06,"square",0.03);},
  ok(){this.blip(660,0.05,"sine",0.035);setTimeout(()=>this.blip(990,0.07,"sine",0.03),60);},
  err(){this.blip(220,0.12,"sawtooth",0.03);},
  boot(){this.blip(440,0.04,"sine",0.025);}
};

/*═════════════════════════════════════════════════════════════
  BOOT SEQUENCE — fake POST jaisa lagta h, click se skip
  ══════════════════════════════════════════════════════════════*/
const BOOT_LINES=[
  ["dim","naman@portfolio — bios v2.4.1"],
  [""," "],
  ["","  cpu ............ 2.4 ghz — ok"],
  ["","  memory ......... 16 gb — ok"],
  ["","  disk ........... 512 gb — ok"],
  [""," "],
  ["","  mounting /dev/portfolio ... ok"],
  ["","  loading 5 projects ........ ok"],
  ["","  loading 16 themes ......... ok"],
  ["","  waking the peach ......... ok"],
  [""," "],
  ["ok","  sab theek hain. mazaa aane wala h"]
];
let bootTimers=[];

function runBoot(){
  const el=$("boot"),lines=$("bootLines");
  if(!el||!lines)return;
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    el.classList.add("gone");return;
  }
  let i=0;
  const step=()=>{
    if(i>=BOOT_LINES.length){finishBoot();return;}
    const [cls,txt]=BOOT_LINES[i++];
    const span=document.createElement("span");
    if(cls)span.className=cls;
    span.textContent=txt+"\n";
    lines.appendChild(span);
    if(cls==="ok")SND.ok();else SND.boot();
    bootTimers.push(setTimeout(step,130+Math.random()*170));
  };
  const skip=()=>{bootTimers.forEach(clearTimeout);finishBoot();};
  el.addEventListener("click",skip,{once:true});
  bootTimers.push(setTimeout(step,350));
}

function finishBoot(){
  bootTimers.forEach(clearTimeout);bootTimers=[];
  const el=$("boot");
  if(el){el.classList.add("gone");setTimeout(()=>el.remove(),400);}
}

/* sound toggle */
const soundBtn=$("soundBtn");
function setSound(on){
  SND.on=on;
  if(soundBtn)soundBtn.textContent=on?"🔊 sound on":"🔇 sound off";
  try{localStorage.setItem("pt-sound",on?"1":"0");}catch(e){}
  if(on)SND.ok();
}
if(soundBtn){
  soundBtn.addEventListener("click",()=>setSound(!SND.on));
  soundBtn.addEventListener("keydown",(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSound(!SND.on);}});
}
try{setSound(localStorage.getItem("pt-sound")==="1");}catch(e){}

/* boot */
setMode("act");
setAuto(true);
try{                                                  // remember the last theme
  const saved=localStorage.getItem("pt-theme");
  if(saved&&THEMES.some(t=>t[0]===saved))body.dataset.theme=saved;
}catch(e){}
let seen=false;
try{seen=localStorage.getItem("pt-guide-seen")==="1";}catch(e){}
runBoot();
if(!seen)setTimeout(openGuide,2600);
setTimeout(()=>input.focus(),80);

})();