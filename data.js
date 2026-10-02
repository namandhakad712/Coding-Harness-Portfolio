/* ══════════════════════════════════════════════════════════════
   data.js — portfolio content. Plain English, first person.
   The TUI streams this content out; images live in ./assets.
   ══════════════════════════════════════════════════════════════ */
"use strict";

const PROJECTS = [
  {
    id: "smart-mailto", year: 2026, title: "Smart Mailto", img: "./assets/projects/smart-mailto.webp",
    tags: "zero-dependency · 51 webmails",
    stack: "TypeScript · under 8KB",
    blurb: "Contact forms break all the time because the mailto: link opens the wrong app. This fixes that — it detects where the visitor is and opens a webmail app that actually works for them. It supports 51 webmail services, has no dependencies at all, and tracks nothing. The whole thing is smaller than 8KB.",
    repo: "https://github.com/namandhakad712/smart-mailto",
    live: "https://smart-mailto.vercel.app",
  },
  {
    id: "rankify", year: 2026, title: "Rankify PDF2CBT", img: "./assets/projects/rankify.webp",
    tags: "open source · runs in your browser",
    stack: "Vue 3 · Vite · Cloudflare Worker",
    blurb: "Drop in any exam paper PDF and it becomes a real computer-based test, right in your browser. There is a timer, your answers autosave, and there are five colour modes so it is easy on the eyes during a long paper. It is open source and deliberately light — no server stores your paper.",
    repo: "https://github.com/namandhakad712/Rankify-PDF2CBT",
    live: "https://rankify-pdf2cbt.vercel.app",
  },
  {
    id: "lume", year: 2026, title: "Lume Study Assistant", img: "./assets/projects/lume.webp",
    tags: "hardware · voice · runs offline",
    stack: "TypeScript · Tuya T5AI-Core",
    blurb: "A study companion that lives on a small AI chip instead of a screen. Knock twice on it to wake it up, then just talk — ask a question, start a focus timer, or open a small app. It is meant for exam prep when you want to stay off your phone.",
    repo: "https://github.com/namandhakad712/lume-study-assistant",
    live: "https://github.com/namandhakad712/lume-study-assistant",
  },
  {
    id: "felearn", year: 2024, title: "Felearn AI", img: "./assets/projects/felearn.webp",
    tags: "education · storytelling",
    stack: "React · Node.js · AI",
    blurb: "A learning platform that takes a hard topic and turns it into a short cat-themed story with pictures, so the idea actually sticks. Built for people who find the usual explanations boring.",
    repo: "https://github.com/namandhakad712/felearn",
    live: "https://felearn.vercel.app",
  },
  {
    id: "wordsearch", year: 2023, title: "Infinite Word Search", img: "./assets/projects/wordsearch.webp",
    tags: "AI · endless dictionary",
    stack: "Next.js · React · TypeScript",
    blurb: "Type a word and keep going deeper — every definition opens another one, written by AI as you go. There is no bottom to it. One of my first AI projects, and still the most fun to click around in.",
    repo: "https://github.com/namandhakad712/Infinte-Word-Search",
    live: "https://infinte-word-search.vercel.app",
  },
];

const CRAFT = [
  {
    n: 1, title: "Frontend", kicker: "Where the work is felt",
    items: [
      { name: "React", icon: "react", note: "What I build interfaces in most days. I treat it as a system, not a page-by-page tool." },
      { name: "Next.js", icon: "nextjs", note: "Routing, server rendering and edge — the parts that make a site feel fast." },
      { name: "TypeScript", icon: "typescript", note: "Types everywhere. It catches mistakes before anyone else sees them." },
      { name: "Vue 3 / Nuxt", icon: "vue", note: "What Rankify is built with. Quick to ship with, pairs well with Vite." },
      { name: "Tailwind", icon: "tailwind", note: "Styles built from design tokens, so things stay consistent without thinking about it." },
      { name: "GSAP", icon: "gsap", note: "Scroll and motion. This is where the craft actually shows." },
    ],
  },
  {
    n: 2, title: "Backend / Edge", kicker: "Where the work holds",
    items: [
      { name: "Node.js", icon: "nodejs", note: "My default backend. APIs that do not leak data and are simple to reason about." },
      { name: "Appwrite", icon: "appwrite", note: "Auth, database and storage when I want a backend up quickly." },
      { name: "Supabase", icon: "supabase", note: "Postgres with realtime updates and auth. Good when the data needs to move." },
      { name: "Cloudflare Workers", icon: "cloudflare", note: "Code that runs close to the visitor. Rankify uses it to stay light." },
      { name: "Python", icon: "python", note: "Small AI and hardware jobs — Lume and weekend experiments." },
      { name: "Tuya IoT", icon: "tuya", note: "The chip inside Lume. Voice input and knock-to-wake." },
    ],
  },
  {
    n: 3, title: "Tooling", kicker: "Where the work ships",
    items: [
      { name: "Git", icon: "git", note: "Clean history, not just a push button. Future me says thanks." },
      { name: "Vercel", icon: "vercel", note: "Every push gets a preview link, then production when it looks right." },
      { name: "VS Code", icon: "vscode", note: "Where the work happens. Kept simple on purpose." },
      { name: "Zero dependencies", icon: "javascript", note: "I like small solutions. Smart Mailto ships with none at all." },
    ],
  },
];

const ABOUT = {
  quote: "I build for feel — the micro-interactions that make someone stay, not just visit.",
  name: "Naman Dhakad",
  role: "Web developer — India",
  bio: [
    "I am a web developer who cares about interaction and craft. I like work that is fast, feels good in the hand, and respects the person using it. No dark patterns, no bloat, no \"AI did it\".",
    "I have shipped products with Vue, React, Next and plain good HTML — from exam prep used by thousands to small tools that make everyday things feel personal.",
  ],
  bullets: [
    "Based in India, working with people anywhere",
    "Obsessed with type, motion and performance",
    "Available for freelance and product work",
  ],
  timeline: [
    { y: "2024 — now", t: "Building Rankify and Felearn AI — AI products that genuinely help people learn." },
    { y: "2023", t: "Wish One, T-Share, Infinite — small sharp tools. Each one taught me restraint." },
    { y: "2022", t: "Found the craft: type, motion and systems. Stopped chasing new stacks." },
    { y: "Before", t: "Curiosity, then code, then people. The loop has not changed." },
  ],
};

const CONTACT = {
  email: "hey@naman.is-a.dev",
  github: "https://github.com/namandhakad712",
  githubUser: "namandhakad712",
  linkedin: "https://linkedin.com/in/namandhakad/",
  linkedinUser: "namandhakad",
  site: "https://naman.is-a.dev",
  line: "Based in India, working worldwide. I read every message and usually reply the same day.",
};
