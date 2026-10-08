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
// const toggle = $("toggle"), autoBtn = $("autoBtn");  // lol idk why i named it toggle

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&", "<": "<", ">": ">", '"': '"' }[c]));
// sleep: wait for ms milliseconds  // u kno what this does

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── state ────────────────────────────────────────────── */
const S = {
  mode: "act",          // act or plan
  autoAnswer: true,     // auto-stream answers y/n
  history: [],          // last questions asked
  histIdx: -1,          // history idx, duh
  run: null,            // current run object lmao
  menuItems: [],        // menu items, not filled yet
  menuIdx: -1,          // current menu idx, starts at -1
  menuKind: null,       // kind of menu, null by default
  thinking: []          // thinking blocks, open by default
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
  "One more pass then I'll answer…",
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
   ═════════════════════════════════════════════════════ */

/* free text → a short harness-style answer */
async function runFree(run, text) {
  const q = text.toLowerCase();
  const sc = pick(SCRIPTS.free.think);
  const th = thinking(fill(sc[0], { q: JSON.stringify(text) }));
  await sleep(900); if (run.cancelled) return th.hold();

  // simple, honest routing — no fake backend   // lmao no backend obv
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