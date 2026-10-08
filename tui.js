/* ══════════════════════════════════════════════════════════════
   tui.js — the harness
   Slash menu · @ mentions · Ctrl+P palette · Plan/Act · auto-answer
   toggle · thinking (open by default, auto-collapses, click to toggle)
   · streaming replies · tool calls with collapsible output · errors
   · project cards with screenshots · beginner guide with live demo.
   ══════════════════════════════════════════════════════════════ */
"use strict";
(function () {

/* ── refs ─────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const body = document.body;
const input = $("cmd"), menu = $("menu"), transcript = $("transcript");
const toggle = $("toggle"), autoBtn = $("autoBtn");
const guide = $("guide"), toast = $("toast"), toastText = $("toastText"), toastSpin = toast.querySelector(".spin");

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── state ────────────────────────────────────────────── */
const S = {
  mode: "act",
  autoAnswer: true,
  history: [], histIdx: -1,
  run: null,
  menuItems: [], menuIdx: -1, menuKind: null,
  thinking: []            // live thinking blocks of the current run
};

/* ── commands ─────────────────────────────────────────── */
const COMMANDS = [
  { cmd: "/work",    desc: "See the five shipped projects",  run: runWork },
  { cmd: "/craft",   desc: "The tools I actually use",       run: runCraft },
  { cmd: "/about",   desc: "Who is behind the code",         run: runAbout },
  { cmd: "/contact", desc: "How to reach me",                run: runContact },
  { cmd: "/help",    desc: "How this terminal works",        run: runHelp },
  { cmd: "/theme",   desc: "Change the colour theme",        run: runTheme },
  { cmd: "/history", desc: "Everything you asked so far",    run: runHistory },
  { cmd: "/undo",    desc: "Step back one answer",           run: runUndo },
  { cmd: "/clear",   desc: "Start a fresh session",          run: () => newSession() },
];

const FILES = [
  "index.html", "styles.css", "tui.js", "ascii3d.js", "data.js",
  "assets/projects/smart-mailto.webp", "assets/tech/react.webp", ".gitignore"
];

/* ── easter eggs ────────────────────────────────────────
   Not in /help, not in the menu — the way real terminals
   hide things. Found, not told. */
const EGGS = {
  "/coffee": async (run) => {
    const th = thinking("They typed the most important command in computing.");
    await sleep(700); if (run.cancelled) return th.hold();
    th.hold("Brewing… no machine, just ASCII and good intentions.");
    await sleep(300); if (run.cancelled) return;
    panel(
      '<pre class="eggart">' +
"       ( (      \n" +
"        ) )     \n" +
"      ........  \n" +
"      |      |] \n" +
"      \\      /  \n" +
"       `----'   \n" +
"    [][][][]    \n" +
      "</pre>", "ONE COFFEE, HOLD THE CAFFEINE");
    if (run.cancelled) return;
    await streamText(run,
      "That's the one that ships the portfolio. Thanks for asking nicely — " +
      "try `/sudo` next if you're feeling brave.");
  },
  "/sudo": async (run) => {
    const th = thinking("Oh? They're trying to elevate privileges in a portfolio.");
    await sleep(750); if (run.cancelled) return th.hold();
    th.hold("Checking the sudoers file… delicately.");
    await sleep(400); if (run.cancelled) return;
    errLine("naman is not in the sudoers file. This incident will be reported.");
    await sleep(500); if (run.cancelled) return;
    await streamText(run,
      "…reported to the peach. It blinked. You're fine — everything here runs " +
      "in your own browser anyway, so technically you already own the box.");
  },
  "/42": async (run) => {
    const th = thinking("The answer. They know.");
    await sleep(600); if (run.cancelled) return th.hold();
    th.hold("The question is being computed. This may take one conversation.");
    await sleep(400); if (run.cancelled) return;
    await streamText(run,
      "42. Obviously. The real question was `what does Naman build` — and the " +
      "answer is `/work`, five times over.");
  },
  "/xyzzy": async (run) => {
    const th = thinking("A phrase from caves that predate the web.");
    await sleep(600); if (run.cancelled) return th.hold();
    th.hold("Nothing happens here. Which is exactly what happens here.");
    await sleep(350); if (run.cancelled) return;
    await streamText(run,
      "Nothing happens. 🪧 (old-adventurer instinct: correct command, wrong cave.)");
  },
  "/rm": async (run) => {
    const th = thinking("A dangerous little phrase approaches the prompt.");
    await sleep(700); if (run.cancelled) return th.hold();
    th.hold("Nice try. The files are read-only and also I like them.");
    await sleep(350); if (run.cancelled) return;
    errLine("rm: refusing to remove '/' — nice try, though.");
    if (run.cancelled) return;
    await streamText(run,
      "Everything you see lives in one static repo, so no, we're not doing that. " +
      "If you must delete something, `/clear` wipes the transcript and even that's reversible-ish.");
  }
};

/* Konami code: ↑ ↑ ↓ ↓ ← → ← → B A — the oldest cheat in the book */
const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
let kIdx = 0;

/* friendly phrases shown while "thinking" — a fresh random order every run */
const THINK_WORDS = [
  "Wandering through the code…",
  "Gathering the loose threads…",
  "Sharpening the wording…",
  "Lining up the good parts…",
  "Almost ready…",
  "One more pass, then I'll answer…",
  "Polishing the last few words…",
  "Sorting signal from noise…",
  "Warming up the keys…",
  "Counting down to the good bit…",
  "Letting it steep a moment…",
  "Chasing the cleanest sentence…",
  "Trimming the rough edges…",
  "Rehearsing the first line…",
  "Holding the thread steady…",
  "Dusting off the old favourites…",
  "Filing thoughts into columns…",
  "Pouring words out slowly…",
  "Steeping a moment longer…",
  "Checking every letter twice…",
  "Nudging the words into place…",
  "Sharpening one more pencil…",
  "Listening for the echo…",
  "Unstacking the small details…",
  "Wiping the whiteboard clean…",
  "Finding the shortest path…",
  "Brewing something decent…",
  "Hunting for the right opener…",
  "Straightening the picture frame…",
  "Counting the commas…",
  "Walking the beat once more…",
  "Tidying the loose ends…",
  "Saving the best line for last…",
  "Refilling the ink…",
  "Sketching the outline first…",
  "Taking the scenic route…",
  "Twiddling the last knob…",
  "Tapping out a rhythm…",
  "Peeling the first layer…",
  "Gathering the last crumbs…"
];
function shuffled(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* ══════════════════════════════════════════════════════
   SCRIPT POOLS — every command has several complete ways
   of saying it. A fresh one is chosen on every run, so the
   thinking lines, tool output and streamed reply are never
   the same twice.
   ══════════════════════════════════════════════════════ */
const SCRIPTS = {
  work: {
    think: [
      ["You want to see real work. I'll pull the project list and lay out each one with its screenshot.",
       "Five projects, newest first — Smart Mailto and Rankify are the recent ones.",
       "Five shipped projects, 2023 to 2026. Writing them out now."],
      ["Projects — the honest section. Pulling the list, images and links together.",
       "Each card wants a screenshot, a plain description and both links. Laying them side by side.",
       "Everything's gathered. Here comes the work."],
      ["Let's show, not tell. Fetching all five entries from data.js.",
       "Newest first, so Rankify and Smart Mailto lead the way.",
       "Ready — screenshots and links included."],
      ["They asked for proof, not promises. Loading the project shelf.",
       "Five cards: title, year, what it does, and where to try it.",
       "All set — writing the cards out one by one."],
      ["Pulling the five projects and their screenshots into view.",
       "Reading each blurb once so the wording stays human.",
       "Here's everything I've shipped, oldest habit to newest ship."]
    ],
    tool: [
      ["5 projects · images in ./assets/projects/", "copy rewritten in plain English"],
      ["PROJECTS[0..4] loaded", "screenshots resolved · links checked"],
      ["5 entries · titles, years, stacks", "blurb + live/source links ready"]
    ],
    intro: [
      "Here is the work — five things I actually built and shipped, not demos. Each card has a screenshot, a plain description, and links to the live version and the source.",
      "Five real projects, newest first. Screenshot on each one, a short plain-English summary, and both a live link and the source if you want to read the code.",
      "This is the shelf: five shipped projects from 2023 to 2026. Every card carries its own screenshot, what it actually does, and links to try it or fork it.",
      "Everything I've built that's actually live — no mockups, no maybes. Screenshots, honest descriptions, and links to both the demo and the repo."
    ]
  },
  craft: {
    think: [
      ["Load the stack and explain each tool the way I'd explain it to a friend.",
       "Three groups — what the work feels like, what holds it up, and what ships it.",
       "Here's the stack, in plain words instead of buzzwords."],
      ["Tools time. Only the ones that survived real deadlines stay on the list.",
       "Grouped by where they show up: hands, backbone, delivery.",
       "No logo wall — just honest notes on each one."],
      ["Let's keep this grounded — the stack, minus the marketing words.",
       "Frontend is the feel, backend is the bones, deployment is the runway.",
       "Ready to lay it out, one tool at a time."],
      ["They want the toolkit. I'll say what each piece is actually for.",
       "Three shelves: the everyday stuff, the quiet workers, the shipping gear.",
       "Here's the stack as I really use it."]
    ],
    intro: [
      "Tools are opinions. These are the ones I've earned — if something stops helping me ship better work, it stops being on this list.",
      "Here's the honest stack — only what I reach for by default, grouped by where it shows up in the work, with a plain note on each.",
      "Three groups: what the work feels like, what holds it up, and what ships it. No badges, no fan clubs — just the tools that earn their place.",
      "This is the gear behind everything on the shelf above. Each entry says what it's for in normal words, not résumé words."
    ]
  },
  about: {
    think: [
      ["Assemble the bio, the timeline, and the things that matter to me.",
       "Quote first, then the story, then the short facts people skim.",
       "Here's the person behind the commits."],
      ["They want the human, not the headline. Pulling the timeline forward.",
       "Self-taught, shipping since 2023 — the milestones read short and true.",
       "Bio, timeline and quick facts — laying them out now."],
      ["Let's keep it honest: where I started, what I've done, what I'm chasing.",
       "The quote says most of it. The timeline fills in the rest.",
       "Ready — here's who's behind the keyboard."],
      ["Pull the bio and the milestones, keep the fluff out.",
       "Two short paragraphs, a timeline, a few quick facts.",
       "Writing it the way I'd say it out loud."]
    ],
    intro: [
      "The short version: I taught myself to build things for the web, kept shipping, and haven't stopped since. Full story below.",
      "Here's the person behind the code — where I started, what I've shipped along the way, and what I'm aiming at next.",
      "Behind every project above is someone who reads docs at 1am and rewrote this bio four times. This is that someone.",
      "The human page: a couple of honest paragraphs, a short timeline, and the quick facts worth knowing."
    ]
  },
  contact: {
    think: [
      ["Lay out the ways to reach me — email, GitHub, LinkedIn.",
       "Keep it simple: three links, no forms, no funnels.",
       "Here's how to reach me — everything's one click away."],
      ["They want to talk. Making the email the loudest thing on screen.",
       "Reading everything myself — no bot, no autoresponder.",
       "Contact details laid out, links included."],
      ["Make it easy: email first, profiles after, base last.",
       "No contact form to bounce off — just direct lines.",
       "Here are the ways in."],
      ["Time to hand over the keys — email, GitHub, LinkedIn, location.",
       "Fastest route is plain email. I actually read it.",
       "All laid out below."]
    ],
    intro: [
      "Say hello — I read everything myself, no bot on the other end.",
      "Three direct lines below. Email is the fast one; I reply to all of them personally.",
      "No forms, no waiting rooms — pick whichever link suits you. I'm online more than I should be.",
      "Here's where to find me. The email reaches me directly; the profiles show the work while you wait."
    ]
  },
  help: {
    think: [
      ["Explain how this little terminal works, in the friendliest way I can.",
       "Commands first, then the keys worth remembering.",
       "A short tour of the controls."],
      ["New here? Give them the gentle version — no manual-speak.",
       "Type / and pick, click a chip, press Esc to stop. That's the core.",
       "Controls laid out, jargon kept out."],
      ["Walk them through the window like a host, not a spec sheet.",
       "Slash for commands, at-sign for files, question mark for this guide.",
       "Here's everything worth knowing, short and sweet."],
      ["Keep it warm: this terminal is a portfolio wearing a costume.",
       "Streaming answers, collapsible thoughts, a mascot that follows the cursor.",
       "Tour complete — keys below."]
    ],
    intro: [
      "This is my portfolio dressed as a coding terminal. You type a command, I think out loud for a moment, then the answer streams in — thoughts stay readable but fold away once the reply is complete.",
      "Think of it as a chat window with a scripted brain: pick a command (or click a chip), watch the thought process open up, then read the answer as it streams. Nothing you type leaves your browser.",
      "A tiny terminal with a handful of commands. Each one opens a thought block you can watch or collapse, then streams an answer with real screenshots and links.",
      "Everything happens right here in this window — like chatting with a coding assistant, except the answers are about me and my work. Press Esc anytime to stop an answer mid-stream."
    ]
  },
  free: {
    think: [
      ["Reading the request: {q}. Figuring out the best way to answer it.",
       "No command matched directly — finding the closest honest answer.",
       "Answering with what I actually know."],
      ["Free-form question. Weighing which corner of the portfolio fits best.",
       "Somewhere between the project shelf and the contact card.",
       "Giving them the useful version, not a deflection."],
      ["Parsed: {q}. Checking it against what this terminal can do.",
       "Closest match found — keeping the reply short and pointing the rest.",
       "Here's the answer and where to go next."],
      ["They didn't reach for a slash — that's fine, answering directly.",
       "Routing it through the same honest filter as everything else.",
       "Reply shaped and ready."]
    ],
    hire: [
      "Yes — I'm available for freelance and product work, remote worldwide. The fastest way to reach me is {email}, or type /contact and I'll lay everything out.",
      "I'm open to freelance and full-time conversations, remote-friendly from India. Quickest route: {email} — or run /contact for every link at once.",
      "Available, yes — client work, product work, or something in between. Drop me a line at {email} (I read it myself) or type /contact for the full card.",
      "I'm taking on new work right now. Best first move is an email to {email}; /contact also stacks email, GitHub and LinkedIn in one view."
    ],
    project: [
      "Sure — here's everything I've shipped, newest first. Screenshots included.",
      "Below: five real projects with screenshots, plain descriptions and live links. Newest first.",
      "Loading the project shelf — every card has a screenshot and both links.",
      "Here's the work. Five shipped projects, screenshots and links on each."
    ],
    stack: [
      "Happy to. Here's the stack, grouped by where it shows up in the work.",
      "The tools, in three honest groups — what it feels like, what holds it up, what ships it.",
      "Here's the gear I actually use, with a plain-English note on each piece.",
      "Stack below: grouped by role, stripped of the buzzwords."
    ],
    who: [
      "Short version: self-taught web developer from India, shipping since 2023. Type /about for the full timeline.",
      "I'm Naman — I build things for the web and keep shipping them. /about has the whole story if you want it.",
      "A developer who taught himself by building, not by watching. /about lays out the timeline and quick facts.",
      "Someone who likes clean interfaces and honest descriptions — like this one. Full bio via /about."
    ],
    nudge: [
      "I'm a small terminal with a handful of commands rather than a full chatbot, so that one went over my head. Try /work for projects, /craft for the stack, /about for my story, or /contact to say hello.",
      "That one's outside my little vocabulary — I only know a few words. Try /work, /craft, /about or /contact, and I'll show you something good.",
      "Honest answer: I don't have a script for that. I do know /work, /craft, /about and /contact — any of those will get you somewhere.",
      "I'm a scripted terminal, not a real model, so that flew past me. Point me at /work, /craft, /about or /contact instead and I'll deliver."
    ],
    greet: [
      "Hello! 👋 This is my portfolio — a little terminal that answers with real work. Type / (or click a chip) to start: /work, /craft, /about, /contact.",
      "Hey — good to meet you. Poke around: /work shows five shipped projects, /about tells you who I am, /contact hands over the links.",
      "Hi! You're talking to a portfolio pretending to be a coding assistant. Nothing is sent anywhere — try /work or /about to get going.",
      "Welcome in. Type / for the command list, or just click a chip under the mascot. My favourite opening line is /work."
    ]
  }
};

/* fill {q}/{email} placeholders in a picked script line */
function fill(t, map) {
  let s = t;
  for (const k in map) s = s.split("{" + k + "}").join(map[k]);
  return s;
}

/* ══════════════════════════════════════════════════════
   TRANSCRIPT PRIMITIVES
   ══════════════════════════════════════════════════════ */
function toActive() { body.dataset.state = "active"; }
function pin() { transcript.scrollTop = transcript.scrollHeight; }

function echo(text) {
  const d = document.createElement("div");
  d.className = "row row--echo";
  d.innerHTML = '<span class="chev">›</span> ' + esc(text);
  transcript.appendChild(d); pin();
}

function errLine(text) {
  const d = document.createElement("div");
  d.className = "row row--err";
  d.innerHTML = '<span class="mk">✳</span> ' + esc(text);
  transcript.appendChild(d); pin();
  SND.err();
}

/* Thinking block — STARTS OPEN, auto-collapses when the full reply
   has arrived, and stays clickable so the reader can toggle it. */
function thinking(seed) {
  const d = document.createElement("div");
  d.className = "think";
  let text = seed || "";
  let expanded = true;              // open by default
  let finished = false;
  let live = true;

  const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  let fi = 0;
  /* every thinking block gets its OWN shuffled phrase order,
     starting at a random offset — no two runs say the same thing */
  const words = shuffled(THINK_WORDS);
  let wordIdx = Math.floor(Math.random() * words.length);
  let wordTimer = null, spinTimer = null;
  const startWords = setTimeout(() => {                       // pretty words kick in
    if (!live) return;
    wordTimer = setInterval(() => {
      if (!live) return;
      wordIdx = (wordIdx + 1) % words.length;
      const w = d.querySelector(".think__word");
      if (w) { w.style.opacity = "0"; setTimeout(() => { if (w.isConnected) { w.textContent = words[wordIdx]; w.style.opacity = "1"; } }, 160); }
    }, 1500);
  }, 900);

  spinTimer = setInterval(() => {
    if (!live) return;
    fi = (fi + 1) % frames.length;
    const sp = d.querySelector(".spin");
    if (sp) sp.textContent = frames[fi];
  }, 90);

  function paint() {
    if (!text) return;
    if (expanded) {
      d.innerHTML =
        '<span class="think__hd">▼ Thinking:</span>' +
        '<div class="think__body">  ' + esc(text) + "</div>" +
        '<span class="think__hint">click to collapse this thought</span>';
    } else {
      d.innerHTML =
        '<span class="think__arrow">▶</span>' +
        '<span class="think__inline">Thinking: ' + esc(text) + "</span>" +
        '<span class="think__hint">click to read the full thought</span>';
    }
  }

  function stopTimers() {
    live = false;
    clearInterval(spinTimer); clearInterval(wordTimer); clearTimeout(startWords);
  }

  const handle = {
    el: d,
    get cancelled() { return d.dataset.cancelled === "1"; },
    /* stop the spinner, keep it OPEN — the runner collapses it later */
    hold(t) {
      stopTimers();
      if (t != null) text = t;
      if (d.dataset.cancelled === "1") {
        d.innerHTML = '<span class="think__inline" style="color:var(--red)">✳ Cancelled</span>';
        return;
      }
      if (!text) { d.innerHTML = '<span class="think__inline" style="color:var(--dimmer)">✳ (no thought needed)</span>'; finished = true; return; }
      paint(); finished = true;
    },
    /* auto-collapse — used once the whole reply has streamed in */
    collapse() {
      if (d.dataset.cancelled === "1" || !finished || !text) return;
      if (d.dataset.userToggled === "1") return;    // respect a manual toggle
      expanded = false; paint();
    },
    /* user click anywhere on the block toggles it */
    bind() {
      d.onclick = () => {
        expanded = !expanded;
        d.dataset.userToggled = "1";
        paint();
      };
    },
    set(t) { text = t; if (!live && finished) paint(); },
    get text() { return text; }
  };
  d.innerHTML = '<span class="think__live"><span class="spin">⠋</span> Thinking… <span class="esc">(esc to cancel)</span> <span class="think__word" style="transition:opacity .2s;color:var(--dimmer)"></span></span>';
  d.onclick = () => {};   // live blocks ignore clicks
  S.thinking.push(handle);
  transcript.appendChild(d); pin();
  return handle;
}

/* tool call with collapsible output */
function toolCall(name, args, lines) {
  const wrap = document.createElement("div");
  wrap.className = "tool";
  wrap.innerHTML = '<span class="tool__name">' + esc(name) + '</span><span class="tool__args">' + esc(args) + "</span>";
  transcript.appendChild(wrap); pin();

  const out = document.createElement("div");
  out.className = "tool__out";
  wrap.appendChild(out);

  const n = lines.length;
  let open = n <= 4;

  function paintOut() {
    if (open) {
      out.innerHTML = lines.map((l) =>
        '<div class="tool__line"><span class="tool__bracket">⌐</span> ' + esc(l || " ") + "</div>").join("");
    } else {
      out.innerHTML =
        '<div class="tool__line"><span class="tool__bracket">⌐</span> ' + esc(lines[0] || " ") + "</div>" +
        '<div class="tool__more">  ... ' + n + " more lines — click to expand</div>";
    }
    pin();
  }
  paintOut();
  out.onclick = (e) => { e.stopPropagation(); open = !open; paintOut(); };
  return { expand() { if (!open) { open = true; paintOut(); } } };
}

/* assistant text — streams char by char */
async function streamText(run, text) {
  const d = document.createElement("div");
  d.className = "row row--out";
  d.innerHTML = '<span class="mk">✳</span> <span class="tx"></span>';
  transcript.appendChild(d);
  const tx = d.querySelector(".tx");
  let i = 0;
  const step = Math.max(1, Math.round(text.length / 110));
  while (i < text.length) {
    if (run.cancelled) break;
    i = Math.min(text.length, i + step);
    tx.innerHTML = linkify(text.slice(0, i));
    pin();
    await sleep(15);
  }
  tx.innerHTML = linkify(run.cancelled ? text.slice(0, i) + " ⏹" : text);
  pin();
}

function linkify(s) {
  return esc(s).replace(/(https?:\/\/[^\s<"]+)/g, (m) => '<a href="' + m + '" target="_blank" rel="noopener">' + m + "</a>");
}

/* code / markdown block — streams line by line */
async function streamCode(run, code) {
  const pre = document.createElement("div");
  pre.className = "code";
  transcript.appendChild(pre);
  const lines = code.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (run.cancelled) break;
    const row = document.createElement("div");
    row.className = "cl";
    row.innerHTML = hl(lines[i]) || "&nbsp;";
    pre.appendChild(row);
    pin();
    await sleep(30);
  }
  if (run.cancelled) {
    const row = document.createElement("div");
    row.className = "cl";
    row.innerHTML = '<span class="tk-c">// ⏹ stopped</span>';
    pre.appendChild(row);
  }
  pin();
}

function hl(line) {
  let s = esc(line);
  if (/^\s*(\/\/|#)/.test(line)) return '<span class="tk-c">' + s + "</span>";
  s = s.replace(/(&quot;[^&]*?&quot;|"[^"]*?")/g, '<span class="tk-s">$1</span>');
  s = s.replace(/\b(import|export|const|let|var|function|return|type|interface|from|await|async|new|default|true|false|null)\b/g, '<span class="tk-k">$1</span>');
  s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tk-n">$1</span>');
  s = s.replace(/([A-Za-z_$][\w$]*)(\()/g, '<span class="tk-f">$1</span>$2');
  return s;
}

function panel(html, hd) {
  const d = document.createElement("div");
  d.className = "panel";
  d.innerHTML = (hd ? '<div class="panel__hd">' + esc(hd) + "</div>" : "") + html;
  transcript.appendChild(d); pin();
  return d;
}

/* project card — plain-English copy + real screenshot */
function projectCard(p, i) {
  const d = document.createElement("div");
  d.className = "proj";
  d.innerHTML =
    '<div class="proj__hd"><span class="num">' + String(i + 1).padStart(2, "0") + "</span>" +
    "<b>" + esc(p.title) + '</b><span class="yr">' + p.year + "</span>" +
    '<span class="tags">' + esc(p.tags) + "</span></div>" +
    '<div class="proj__body">' +
    '<img class="proj__img" alt="' + esc(p.title) + ' screenshot" loading="lazy" src="' + p.img + '" />' +
    '<div class="proj__info">' +
    '<p class="proj__txt">' + esc(p.blurb) + "</p>" +
    '<div class="proj__stack">↳ ' + esc(p.stack) + "</div>" +
    '<div class="proj__links"><a class="hot" href="' + p.live + '" target="_blank" rel="noopener">live demo ↗</a>' +
    '<a href="' + p.repo + '" target="_blank" rel="noopener">source code</a></div>' +
    "</div></div>";
  transcript.appendChild(d);
  const img = d.querySelector(".proj__img");
  img.addEventListener("load", () => { img.classList.add("in"); pin(); });
  if (img.complete) img.classList.add("in");
  pin();
  return d;
}

/* ══════════════════════════════════════════════════════
   RUNNER
   ══════════════════════════════════════════════════════ */
function newRun() {
  if (S.run) S.run.cancelled = true;
  S.run = { cancelled: false };
  S.thinking = [];
  return S.run;
}

/* ══════════════════════════════════════════════════════
   COMMANDS  (plain-English answers throughout)
   ══════════════════════════════════════════════════════ */

async function runWork(run) {
  const sc = pick(SCRIPTS.work.think);
  const th = thinking(sc[0]);
  await sleep(760); if (run.cancelled) return th.hold();
  th.set(sc[1]);
  await sleep(700); if (run.cancelled) return th.hold();
  th.hold(sc[2]);
  await sleep(240); if (run.cancelled) return;

  const t = toolCall("read", "data.js", pick(SCRIPTS.work.tool));
  await sleep(560); if (run.cancelled) return t.expand();
  t.expand();

  await streamText(run, pick(SCRIPTS.work.intro));
  if (run.cancelled) return;

  for (let i = 0; i < PROJECTS.length; i++) {
    if (run.cancelled) return;
    projectCard(PROJECTS[i], i);
    await sleep(420);
  }
}

async function runCraft(run) {
  const sc = pick(SCRIPTS.craft.think);
  const th = thinking(sc[0]);
  await sleep(740); if (run.cancelled) return th.hold();
  th.set(sc[1]);
  await sleep(640); if (run.cancelled) return th.hold();
  th.hold(sc[2]);
  await sleep(220); if (run.cancelled) return;

  await streamText(run, pick(SCRIPTS.craft.intro));
  if (run.cancelled) return;

  CRAFT.forEach((g) => {
    const rows = g.items.map((i) =>
      '<div class="krow"><img class="ico" src="./assets/tech/' + i.icon + '.webp" alt="" loading="lazy" />' +
      "<b>" + esc(i.name) + "</b><span>" + esc(i.note) + "</span></div>").join("");
    panel(rows, "0" + g.n + " — " + g.title.toUpperCase() + " — " + g.kicker);
  });
}

async function runAbout(run) {
  const sc = pick(SCRIPTS.about.think);
  const th = thinking(sc[0]);
  await sleep(720); if (run.cancelled) return th.hold();
  th.set(sc[1]);
  await sleep(520); if (run.cancelled) return th.hold();
  th.hold(ABOUT.quote);
  await sleep(240); if (run.cancelled) return;

  await streamText(run, pick(SCRIPTS.about.intro));
  if (run.cancelled) return;
  await streamText(run, ABOUT.bio[0]);
  if (run.cancelled) return;
  await streamText(run, ABOUT.bio[1]);
  if (run.cancelled) return;

  const tl = ABOUT.timeline.map((t) =>
    '<div class="krow"><b>' + esc(t.y) + "</b><span>" + esc(t.t) + "</span></div>").join("");
  panel(tl, "HOW IT WENT — TIMELINE");

  const bl = ABOUT.bullets.map((b) => '<div class="krow"><b>→</b><span>' + esc(b) + "</span></div>").join("");
  panel(bl, "QUICK FACTS");
}

async function runContact(run) {
  const sc = pick(SCRIPTS.contact.think);
  const th = thinking(sc[0]);
  await sleep(640); if (run.cancelled) return th.hold();
  th.set(sc[1]);
  await sleep(520); if (run.cancelled) return th.hold();
  th.hold(CONTACT.line);
  await sleep(220); if (run.cancelled) return;

  await streamText(run, pick(SCRIPTS.contact.intro));
  if (run.cancelled) return;

  panel(
    '<div class="krow"><b>email</b><span><a href="mailto:' + CONTACT.email + '">' + CONTACT.email + "</a></span></div>" +
    '<div class="krow"><b>github</b><span><a href="' + CONTACT.github + '" target="_blank" rel="noopener">@' + CONTACT.githubUser + "</a></span></div>" +
    '<div class="krow"><b>linkedin</b><span><a href="' + CONTACT.linkedin + '" target="_blank" rel="noopener">' + CONTACT.linkedinUser + "</a></span></div>" +
    '<div class="krow"><b>based in</b><span>India — working with people anywhere</span></div>',
    "GET IN TOUCH");
}

async function runHelp(run) {
  const sc = pick(SCRIPTS.help.think);
  const th = thinking(sc[0]);
  await sleep(600); if (run.cancelled) return th.hold();
  th.set(sc[1]);
  await sleep(500); if (run.cancelled) return th.hold();
  th.hold(sc[2]);
  await sleep(200); if (run.cancelled) return;

  await streamText(run, pick(SCRIPTS.help.intro));
  if (run.cancelled) return;

  const keys = [
    ["/", "opens the command list — or just click a chip"],
    ["@", "mentions a file, like @index.html"],
    ["Ctrl+P", "shows every command at once"],
    ["Tab", "switches between Plan (talk only) and Act (do things)"],
    ["Shift+Tab", "turns automatic answers on or off"],
    ["Esc", "stops an answer halfway"],
    ["↑ / ↓", "brings back something you typed earlier"],
    ["?", "reopens the beginner guide"]
  ].map((k) => '<div class="krow"><b>' + esc(k[0]) + "</b><span>" + esc(k[1]) + "</span></div>").join("");
  panel(keys, "KEYBOARD");

  const cmds = COMMANDS.map((c) =>
    '<div class="krow"><b>' + esc(c.cmd) + "</b><span>" + esc(c.desc) + "</span></div>").join("");
  panel(cmds, "COMMANDS — " + COMMANDS.length + " TOTAL");
}

/* the full genuine palette set — must match the data-theme blocks in styles.css */
const THEMES = [
  ["harness",        "the default — near black + electric blue"],
  ["abyss",          "deep ocean blue-black"],
  ["ember",          "warm dark with orange sparks"],
  ["dracula",        "the classic purple-pink night"],
  ["nord",           "arctic, muted blue-grey"],
  ["gruvbox",        "retro groove — brown, orange, olive"],
  ["monokai",        "the original editor orange-green"],
  ["solarized-dark", "Ethan Schoonover's blue-green"],
  ["solarized-light","the same, on paper"],
  ["one-dark",       "Atom's familiar grey-blue"],
  ["tokyo-night",    "neon dusk over the city"],
  ["catppuccin",     "soft pastel mocha"],
  ["rose-pine",      "dusk mauve with seafoam"],
  ["everforest",     "mossy green outdoors"],
  ["kanagawa",       "ink wash, sumi-e beige"],
  ["github-dark",    "the one you already stare at"]
];
function applyTheme(name) {
  body.dataset.theme = name;
  try { localStorage.setItem("pt-theme", name); } catch (e) {}
  if (window.__mascotResize) window.__mascotResize();
}
async function runTheme(run, arg) {
  /* /theme <name> jumps straight there */
  const wanted = (arg || "").trim().toLowerCase();
  if (wanted && THEMES.some((t) => t[0] === wanted)) {
    applyTheme(wanted);
    panel('<div class="krow"><b>' + esc(wanted) + "</b><span>applied</span></div>", "COLOUR THEME");
    return;
  }
  const th = thinking("They want a new look — lay out all sixteen palettes as clickable rows.");
  await sleep(520); if (run && run.cancelled) return th.hold();
  th.hold("Click any row — it applies instantly and sticks for next time.");
  await sleep(200); if (run && run.cancelled) return;

  const cur = body.dataset.theme || "harness";
  const rows = THEMES.map(([id, note]) =>
    '<div class="krow thm' + (id === cur ? " is-cur" : "") + '" data-theme="' + id + '" role="button" tabindex="0">' +
    '<span class="sw"><i></i><i></i><i></i></span>' +
    "<b>" + esc(id) + "</b><span>" + esc(note) + (id === cur ? " ✓" : "") + "</span></div>").join("");
  panel(rows, "COLOUR THEMES — CLICK TO SWITCH (" + THEMES.length + ")");
}

async function runHistory() {
  if (!S.history.length) {
    panel('<div class="krow"><b>nothing yet</b><span>ask me something first</span></div>', "YOUR QUESTIONS");
    return;
  }
  const rows = S.history.map((h, i) =>
    '<div class="krow"><span class="num">' + String(i + 1).padStart(2, "0") + "</span><b>" + esc(h) + "</b></div>").join("");
  panel(rows, "EVERYTHING YOU'VE ASKED — " + S.history.length);
}

async function runUndo() {
  if (transcript.children.length <= 1) {
    panel('<div class="krow"><b>nothing to undo</b><span>this is the start of the session</span></div>', "STEP BACK");
    return;
  }
  let removed = 0;
  while (transcript.children.length > 1 && removed < 8) { transcript.removeChild(transcript.lastChild); removed++; }
  panel('<div class="krow"><b>went back</b><span>removed the last ' + removed + " blocks</span></div>", "STEP BACK");
}

/* free text → a short harness-style answer */
async function runFree(run, text) {
  const q = text.toLowerCase();
  const sc = pick(SCRIPTS.free.think);
  const th = thinking(fill(sc[0], { q: JSON.stringify(text) }));
  await sleep(900); if (run.cancelled) return th.hold();

  // simple, honest routing — no fake backend
  if (/^(hi|hello|hey|yo|namaste|sup)\b/.test(q.trim())) {
    th.hold("A greeting — welcome them and point at the commands.");
    await sleep(240); if (run.cancelled) return;
    await streamText(run, pick(SCRIPTS.free.greet));
    return;
  }
  if (/(hire|work with|available|freelance|job)/.test(q)) {
    th.hold("They're asking about availability — point them at the contact block.");
    await sleep(240); if (run.cancelled) return;
    await streamText(run, fill(pick(SCRIPTS.free.hire), { email: CONTACT.email }));
    return;
  }
  if (/(project|built|made|work|portfolio|ship)/.test(q)) {
    th.hold("They want the work — pull up the five projects with screenshots.");
    await sleep(240); if (run.cancelled) return;
    await streamText(run, pick(SCRIPTS.free.project));
    if (run.cancelled) return;
    const t = toolCall("read", "data.js", pick(SCRIPTS.work.tool));
    await sleep(520); t.expand();
    for (let i = 0; i < PROJECTS.length; i++) {
      if (run.cancelled) return;
      projectCard(PROJECTS[i], i);
      await sleep(400);
    }
    return;
  }
  if (/(stack|tool|use|tech|language|framework)/.test(q)) {
    th.hold("Stack question — walk the three groups in plain words.");
    await sleep(240); if (run.cancelled) return;
    await streamText(run, pick(SCRIPTS.free.stack));
    if (run.cancelled) return;
    CRAFT.forEach((g) => {
      const rows = g.items.map((i) =>
        '<div class="krow"><img class="ico" src="./assets/tech/' + i.icon + '.webp" alt="" loading="lazy" />' +
        "<b>" + esc(i.name) + "</b><span>" + esc(i.note) + "</span></div>").join("");
      panel(rows, "0" + g.n + " — " + g.title.toUpperCase());
    });
    return;
  }
  if (/(who|you|yourself|about|naman|bio)/.test(q)) {
    th.hold("A short introduction, in their own voice.");
    await sleep(240); if (run.cancelled) return;
    await streamText(run, pick(SCRIPTS.free.who));
    return;
  }

  th.hold(sc[1]);
  await sleep(240); if (run.cancelled) return;
  await streamText(run, pick(SCRIPTS.free.nudge));
}

/* ══════════════════════════════════════════════════════
   MENU (/ and @ and Ctrl+P)
   ══════════════════════════════════════════════════════ */
function renderMenu() {
  const items = S.menuItems;
  if (!items.length) { menu.hidden = true; return; }
  const MAX = 7;
  const shown = items.slice(0, MAX);
  const rest = items.length - shown.length;

  menu.innerHTML = shown.map((it, i) =>
    '<div class="menu__i' + (i === S.menuIdx ? " on" : "") + '" data-i="' + i + '">' +
    '<span class="mk">›</span><span class="cmd">' + esc(it.a) + "</span>" +
    '<span class="desc">' + esc(it.b) + "</span></div>"
  ).join("") + (rest > 0 ? '<div class="menu__more"><span>▼</span> ' + rest + " more</div>" : "");

  menu.hidden = false;
  [...menu.querySelectorAll(".menu__i")].forEach((el) => {
    el.onpointerenter = () => { S.menuIdx = +el.dataset.i; renderMenu(); };
    el.onclick = () => pickMenu(+el.dataset.i);
  });
}

function openMenu(kind) {
  S.menuKind = kind;
  if (kind === "cmd") {
    const q = input.value.trim().toLowerCase();
    S.menuItems = COMMANDS.filter((c) => c.cmd.startsWith(q)).map((c) => ({ a: c.cmd, b: c.desc }));
  } else {
    const q = input.value.slice(1).toLowerCase();
    S.menuItems = FILES.filter((f) => f.toLowerCase().includes(q)).map((f) => ({ a: "@" + f, b: "file" }));
  }
  S.menuIdx = S.menuItems.length ? 0 : -1;
  renderMenu();
}
function closeMenu() { menu.hidden = true; S.menuIdx = -1; S.menuKind = null; }

function pickMenu(i) {
  const it = S.menuItems[i];
  if (!it) return;
  if (S.menuKind === "cmd") { closeMenu(); input.value = ""; submit(it.a); }
  else { input.value = it.a + " "; closeMenu(); input.focus(); }
}

/* ══════════════════════════════════════════════════════
   MODE / STATUS
   ══════════════════════════════════════════════════════ */
function setMode(m) {
  S.mode = m;
  body.dataset.mode = m;
  toggle.querySelectorAll(".opt").forEach((o) => {
    const on = o.dataset.mode === m;
    o.classList.toggle("is-on", on);
    o.textContent = (on ? "● " : "○ ") + (o.dataset.mode === "plan" ? "Plan" : "Act");
  });
  input.placeholder = m === "plan" ? "Plan something..." : "What can I do for you?";
}
function cycleMode() { setMode(S.mode === "act" ? "plan" : "act"); }

function setAuto(v) {
  S.autoAnswer = v;
  autoBtn.classList.toggle("off", !v);
  autoBtn.innerHTML = v
    ? '⏵⏵ Answers stream automatically <span class="dim">(Shift+Tab)</span>'
    : '○ Paused — press Shift+Tab to resume <span class="dim">(Shift+Tab)</span>';
}

/* ══════════════════════════════════════════════════════
   SESSION / SUBMIT
   ══════════════════════════════════════════════════════ */
function newSession() {
  if (S.run) S.run.cancelled = true;
  transcript.innerHTML = "";
  body.dataset.state = "idle";
  S.history = []; S.histIdx = -1;
  input.value = "";
  input.placeholder = S.mode === "plan" ? "Plan something..." : "What can I do for you?";
  closeMenu();
  requestAnimationFrame(() => { if (window.__mascotResize) window.__mascotResize(); });
  input.focus();
}

/* top-bar ‹ back button — collapse the session and return to the start
   screen. The transcript is kept, so pressing back doesn't lose the
   conversation: typing again picks it right back up. */
function goBack() {
  if (S.run) S.run.cancelled = true;
  if (body.dataset.state !== "active") return;
  body.dataset.state = "idle";
  closeMenu();
  input.value = "";
  requestAnimationFrame(() => { if (window.__mascotResize) window.__mascotResize(); });
  input.focus();
}

async function submit(raw) {
  const text = raw.trim();
  if (!text) return;

  if (text === "/clear") { newSession(); return; }

  /* "/theme dracula" → cmd + trailing arg */
  const parts = text.split(/\s+/);
  const cmd = COMMANDS.find((c) => c.cmd.toLowerCase() === parts[0]);
  const cmdArg = cmd && parts.length > 1 ? parts.slice(1).join(" ") : "";

  if (text.startsWith("/") && !cmd) {
    const egg = EGGS[parts[0]];
    if (egg) {
      S.history.push(text); S.histIdx = S.history.length;
      toActive(); echo(text);
      input.value = ""; closeMenu();
      const run = newRun();
      try { await egg(run); } catch (e) { errLine("Error: " + (e && e.message ? e.message : e)); }
      S.thinking.forEach((h) => { h.bind(); h.collapse(); });
      pin();
      return;
    }
    S.history.push(text); S.histIdx = S.history.length;
    toActive(); echo(text);
    const run = newRun();
    await sleep(320);
    if (!run.cancelled) errLine("Error: no such command — try /help to see the list");
    input.value = ""; closeMenu();
    return;
  }

  S.history.push(text); S.histIdx = S.history.length;
  toActive(); echo(text);
  input.value = ""; closeMenu();
  SND.enter();

  const run = newRun();
  try {
    if (cmd) await cmd.run(run, cmdArg);
    else await runFree(run, text);
  } catch (e) {
    errLine("Error: " + (e && e.message ? e.message : e));
  }
  // reply complete → fold the thoughts away (user can still reopen)
  S.thinking.forEach((h) => { h.bind(); h.collapse(); });
  pin();
}

/* ══════════════════════════════════════════════════════
   BEGINNER GUIDE + live typing demo
   ══════════════════════════════════════════════════════ */
const DEMO_STEPS = [
  { kind: "type", text: "/work" },
  { kind: "enter" },
  { kind: "think", text: "Thinking…  lining up the good parts…" , ms: 1500 },
  { kind: "out", text: "✳ Here is the work — five things I actually built.", ms: 1400 },
  { kind: "card", text: "▸ 01  Smart Mailto   screenshot + live link", ms: 2000 },
  { kind: "clear" }
];

function runDemo() {
  const screen = $("demoScreen");
  if (!screen) return;
  let stopped = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function loop() {
    while (!stopped) {
      for (const step of DEMO_STEPS) {
        if (stopped) return;
        if (step.kind === "type") {
          screen.innerHTML = '<div class="demo__in"><span class="c">&gt;</span> <span class="tv"></span><span class="caret"></span></div>';
          const tv = screen.querySelector(".tv");
          for (let i = 1; i <= step.text.length; i++) {
            if (stopped) return;
            tv.textContent = step.text.slice(0, i);
            await wait(95);
          }
          await wait(420);
        } else if (step.kind === "enter") {
          const cur = screen.innerHTML;
          screen.innerHTML = cur.replace('<span class="caret"></span>', "");
          await wait(320);
        } else if (step.kind === "think") {
          screen.innerHTML += '\n<div class="demo__think">⠹ ' + esc(step.text) + "</div>";
          const el = screen.querySelector(".demo__think");
          const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
          let f = 0;
          const iv = setInterval(() => { if (stopped) return clearInterval(iv); f = (f + 1) % frames.length; el.textContent = frames[f] + " " + step.text; }, 110);
          await wait(step.ms);
          clearInterval(iv);
        } else if (step.kind === "out") {
          screen.innerHTML += '\n<div class="demo__out"><span class="mk">✳</span> <span class="ov"></span></div>';
          const ov = screen.querySelector(".ov");
          const txt = step.text.replace("✳ ", "");
          for (let i = 1; i <= txt.length; i += 2) {
            if (stopped) return;
            ov.textContent = txt.slice(0, i);
            await wait(22);
          }
          await wait(step.ms);
        } else if (step.kind === "card") {
          screen.innerHTML += '\n<div class="demo__out">' + esc(step.text) + "</div>";
          await wait(step.ms);
        } else if (step.kind === "clear") {
          await wait(700);
          if (!stopped) screen.innerHTML = "";
        }
      }
    }
  }
  loop();
  return () => { stopped = true; };
}

let stopDemo = null;
function openGuide() {
  guide.hidden = false;
  $("guideRemember").focus?.();
  if (stopDemo) stopDemo();
  stopDemo = runDemo();
}
function closeGuide(remember) {
  guide.hidden = true;
  if (stopDemo) { stopDemo(); stopDemo = null; }
  try { if (remember) localStorage.setItem("pt-guide-seen", "1"); } catch (e) {}
  input.focus();
}
/* click anywhere outside the box (or ✕, Esc, Close) dismisses it */
guide.addEventListener("click", (e) => {
  if (e.target === guide) closeGuide($("guideRemember").checked);
});

/* ══════════════════════════════════════════════════════
   EVENTS
   ══════════════════════════════════════════════════════ */
input.addEventListener("input", () => {
  const v = input.value;
  if (v.startsWith("/")) openMenu("cmd");
  else if (v.startsWith("@")) openMenu("file");
  else closeMenu();
});

input.addEventListener("keydown", (e) => {
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) SND.key();
  if (!menu.hidden && S.menuItems.length) {
    if (e.key === "ArrowDown") { e.preventDefault(); S.menuIdx = (S.menuIdx + 1) % S.menuItems.length; renderMenu(); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); S.menuIdx = (S.menuIdx - 1 + S.menuItems.length) % S.menuItems.length; renderMenu(); return; }
    if (e.key === "Tab") { e.preventDefault(); S.menuIdx = (S.menuIdx + 1) % S.menuItems.length; renderMenu(); return; }
    if (e.key === "Enter") { e.preventDefault(); pickMenu(S.menuIdx); return; }
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
  }

  if (e.key === "Enter") { e.preventDefault(); submit(input.value); return; }

  if (e.key === "Escape") {
    e.preventDefault();
    if (S.run && !S.run.cancelled) {
      S.run.cancelled = true;
      const live = transcript.querySelector(".think__live");
      if (live) {
        const box = live.closest(".think");
        if (box) { box.dataset.cancelled = "1"; box.innerHTML = '<span class="think__inline" style="color:var(--red)">✳ Cancelled</span>'; }
      }
    } else { input.value = ""; closeMenu(); }
    return;
  }

  if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); cycleMode(); return; }

  if (e.key === "ArrowUp" && !input.value) {
    e.preventDefault();
    if (!S.history.length) return;
    S.histIdx = Math.max(0, S.histIdx - 1);
    input.value = S.history[S.histIdx] || "";
    return;
  }
  if (e.key === "ArrowDown" && S.histIdx >= 0) {
    e.preventDefault();
    S.histIdx = Math.min(S.history.length, S.histIdx + 1);
    input.value = S.history[S.histIdx] || "";
    return;
  }
});

document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (!guide.hidden) {
    if (e.key === "Escape") { e.preventDefault(); closeGuide(true); }
    return;
  }
  if ((e.ctrlKey || e.metaKey) && k === "p") { e.preventDefault(); input.focus(); input.value = "/"; openMenu("cmd"); return; }
  if ((e.ctrlKey || e.metaKey) && k === "l") { e.preventDefault(); newSession(); return; }
  if (e.key === "?" && document.activeElement !== input) { e.preventDefault(); openGuide(); return; }
  if (e.key === "Shift" && e.shiftKey) return;
  if (e.key === "Tab" && e.shiftKey) { e.preventDefault(); setAuto(!S.autoAnswer); return; }
  if (e.key === "/" && document.activeElement !== input && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault(); input.focus(); input.value = "/"; openMenu("cmd");
  }
});

toggle.addEventListener("click", (e) => { const o = e.target.closest(".opt"); if (o) setMode(o.dataset.mode); });
autoBtn.addEventListener("click", () => setAuto(!S.autoAnswer));
autoBtn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAuto(!S.autoAnswer); } });
/* clicking a /theme row switches instantly */
transcript.addEventListener("click", (e) => {
  const row = e.target.closest(".krow.thm");
  if (!row) return;
  applyTheme(row.dataset.theme);
  transcript.querySelectorAll(".krow.thm").forEach((r) => {
    r.classList.toggle("is-cur", r.dataset.theme === body.dataset.theme);
    const note = r.lastElementChild;
    if (note && note.textContent.endsWith(" ✓")) note.textContent = note.textContent.slice(0, -2);
    if (note && r.dataset.theme === body.dataset.theme) note.textContent += " ✓";
  });
});
$("chips").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) submit(b.dataset.cmd); });
$("backBtn").addEventListener("click", goBack);
$("helpBtn").addEventListener("click", openGuide);
$("guideX").addEventListener("click", () => closeGuide($("guideRemember").checked));
$("guideClose").addEventListener("click", () => closeGuide($("guideRemember").checked));
$("guideGo").addEventListener("click", () => { closeGuide($("guideRemember").checked); setTimeout(() => submit("/work"), 180); });
document.addEventListener("click", (e) => { if (!e.target.closest(".prompt")) closeMenu(); });

/* Konami code → a quiet reward (never shown in the menu) */
document.addEventListener("keydown", (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (k === KONAMI[kIdx]) {
    kIdx++;
    if (kIdx === KONAMI.length) {
      kIdx = 0;
      panel(
        '<div class="krow"><b>↑↑↓↓←→←→BA</b><span>cheat code accepted — nothing to cheat, but respect.</span></div>' +
        '<div class="krow"><b>unlock</b><span>type /coffee, /42, /xyzzy or /sudo — the rest are hidden on purpose</span></div>',
        "DEVELOPER MODE");
      if (window.__mascotBounce) window.__mascotBounce();
    }
  } else {
    kIdx = (k === KONAMI[0]) ? 1 : 0;
  }
});

/* ══════════════════════════════════════════════════════
   SOUND — tiny webaudio blips, no files, off by default
   ══════════════════════════════════════════════════════ */
const SND = {
  ctx: null, on: false,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  blip(freq, dur, type, vol) {
    if (!this.on) return;
    const c = this.ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || "square"; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.03, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (dur || 0.05));
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + (dur || 0.05));
  },
  key()   { this.blip(1400 + Math.random() * 600, 0.03, "square", 0.018); },
  enter() { this.blip(880, 0.06, "square", 0.03); },
  ok()    { this.blip(660, 0.05, "sine", 0.035); setTimeout(() => this.blip(990, 0.07, "sine", 0.03), 60); },
  err()   { this.blip(220, 0.12, "sawtooth", 0.03); },
  boot()  { this.blip(440, 0.04, "sine", 0.025); }
};

/* ══════════════════════════════════════════════════════
   BOOT SEQUENCE — fake POST, click to skip
   ══════════════════════════════════════════════════════ */
const BOOT_LINES = [
  ["dim",  "naman@portfolio — bios v2.4.1"],
  ["",     ""],
  ["",     "  cpu ............ 2.4 ghz — ok"],
  ["",     "  memory ......... 16 gb — ok"],
  ["",     "  disk ........... 512 gb — ok"],
  ["",     ""],
  ["",     "  mounting /dev/portfolio ... ok"],
  ["",     "  loading 5 projects ........ ok"],
  ["",     "  loading 16 themes ......... ok"],
  ["",     "  waking the peach ......... ok"],
  ["",     ""],
  ["ok",   "  all good. have fun."]
];
let bootTimers = [];

function runBoot() {
  const el = $("boot"), lines = $("bootLines");
  if (!el || !lines) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.classList.add("gone"); return;
  }
  let i = 0;
  const step = () => {
    if (i >= BOOT_LINES.length) { finishBoot(); return; }
    const [cls, txt] = BOOT_LINES[i++];
    const span = document.createElement("span");
    if (cls) span.className = cls;
    span.textContent = txt + "\n";
    lines.appendChild(span);
    if (cls === "ok") SND.ok(); else SND.boot();
    bootTimers.push(setTimeout(step, 130 + Math.random() * 170));
  };
  const skip = () => { bootTimers.forEach(clearTimeout); finishBoot(); };
  el.addEventListener("click", skip, { once: true });
  bootTimers.push(setTimeout(step, 350));
}

function finishBoot() {
  bootTimers.forEach(clearTimeout); bootTimers = [];
  const el = $("boot");
  if (el) { el.classList.add("gone"); setTimeout(() => el.remove(), 400); }
}

/* sound toggle */
const soundBtn = $("soundBtn");
function setSound(on) {
  SND.on = on;
  if (soundBtn) soundBtn.textContent = on ? "🔊 sound on" : "🔇 sound off";
  try { localStorage.setItem("pt-sound", on ? "1" : "0"); } catch (e) {}
  if (on) SND.ok();
}
if (soundBtn) {
  soundBtn.addEventListener("click", () => setSound(!SND.on));
  soundBtn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSound(!SND.on); } });
}
try { setSound(localStorage.getItem("pt-sound") === "1"); } catch (e) {}

/* boot */
setMode("act");
setAuto(true);
try {                                                  // remember the last theme
  const saved = localStorage.getItem("pt-theme");
  if (saved && THEMES.some((t) => t[0] === saved)) body.dataset.theme = saved;
} catch (e) {}
let seen = false;
try { seen = localStorage.getItem("pt-guide-seen") === "1"; } catch (e) {}
runBoot();
if (!seen) setTimeout(openGuide, 2600);
setTimeout(() => input.focus(), 80);

})();
