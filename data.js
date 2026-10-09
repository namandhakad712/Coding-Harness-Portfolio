/*═══════════════════════════════════════════════════════════════
  data.js — portfolio content
  plain english, first person, written by me (16 going on 17 lol)
  TUI streams this stuff out, images in ./assets
  ═══════════════════════════════════════════════════════════════*/

//"use strict";  // don't need this actually lol

// TODO: update wordsearch screenshot its from 2023 and looks bad fr
// also i should probably fix the smart mailto repo link idk
// brb sleep deprived as hell rn but shipping anyway fr

// projects i shipped. oldest to newest. nahi toh koi baat nahi
const PROJECTS = [
  {
    id: "smart-mailto",  year: 2026,  title: "Smart Mailto",
    img: "./assets/projects/smart-mailto.webp",

    // zero dependencies matlab zero deps. less bs.
    tags: "zero-dependency · 51 webmails",
    stack: "TypeScript · under 8KB",  // fact: teh under 8KB lmao

    // contact forms break sabse pehle hi kyuki mailto galat app khol deta h.
    // ye fix karta h — detects karta h kahan h visitor aur uss webmail pe
    // open karta h jo sach mei kaam kare. 51 webmails supported, zero deps,
    // tracks nothing. poora project 8KB se chhota hai which is kinda insane tbh
    blurb: "contact forms rly annoying bc the mailto: link opens the wrong app sometimes. this fixes that — it detects where the visitor is and opens a webmail app that actually works for them. supports 51 webmail services, zero deps, and tracks nothing. the whole thing is smaller than 8KB which is kinda insane.",
    repo: "https://github.com/namandhakad712/smart-mailto",
    live: "https://smart-mailto.vercel.app",
  },

  {
    id: "rankify",  year: 2026,  title: "Rankify PDF2CBT",
    img: "./assets/projects/rankify.webp",
    tags: "open source · runs in your browser",  // open source = free real estate
    stack: "Vue 3 · Vite · Cloudflare Worker",

    // koi bhi exam paper PDF daalo, turant CBT ban jaaye browser mei.
    // timer hota h, answers autosave hote hain, 5 colour modes hain
    // jisse aankh no pain karein during long paper. open source + light
    blurb: "drop in any exam paper PDF and it becomes a real computer-based test right in your browser. has a timer, answers autosave, and 5 colour modes so its easy on the eyes during a long paper. open source and deliberately light — no server stores your paper. also its free which is nice i guess.",
    repo: "https://github.com/namandhakad712/Rankify-PDF2CBT",
    live: "https://rankify-pdf2cbt.vercel.app",
  },

  {
    id: "lume",  year: 2026,  title: "Lume Study Assistant",
    img: "./assets/projects/lume.webp",
    tags: "hardware · voice · runs offline",  // offline = good for exams
    stack: "TypeScript · Tuya T5AI-Core",

    // study companion jo ek chhote AI chip par rehta h screen ke bajaye.
    // twice knock karo toh wake hota h, phir bas baat karo. exams ke liye socha
    blurb: "a study companion that lives on a small AI chip instead of a screen. knock twice on it to wake it up, then just talk — ask a question, start a focus timer, or open a small app. its meant for exam prep when you wanna stay off your phone for once lol.",
    repo: "https://github.com/namandhakad712/lume-study-assistant",
    live: "https://github.com/namandhakad712/lume-study-assistant",
  },

  {
    id: "felearn",  year: 2024,  title: "Felearn AI",
    img: "./assets/projects/felearn.webp",
    tags: "education · storytelling",
    stack: "React · Node.js · AI",

    // mushkil topic ko cat-themed story mei badal do with pictures.
    // idea zarur yad rehta h. cat theme optional h but thats the fun part
    blurb: "a learning platform that takes a hard topic and turns it into a short cat-themed story with pictures so the idea actually sticks. built for people who find the usual explanations boring. the cat theme is optional but thats the whole point lol.",
    repo: "https://github.com/namandhakad712/felearn",
    live: "https://felearn.vercel.app",
  },

  {
    id: "wordsearch",  year: 2023,  title: "Infinite Word Search",
    img: "./assets/projects/wordsearch.webp",
    tags: "AI · endless dictionary",  // AI = buzzword lol
    stack: "Next.js · React · TypeScript",

    // ek word type karo, uski definition se aage badho, phir uss word ki
    // definition... koi bottom nahi hota. first AI project tha, ab tak bhi
    // sabse maza aata h click karne mei
    blurb: "type a word and keep going deeper — every definition opens another one, written by AI as you go. theres no bottom to it. one of my first AI projects and still the most fun to click around in honestly.",
    repo: "https://github.com/namandhakad712/Infinte-Word-Search",
    live: "https://infinte-word-search.vercel.app",
  },
];

// tools i use. grouped by kahan par dikhaye.
const CRAFT = [
  {
    n: 1,  title: "Frontend",  kicker: "where the work is felt",

    items: [
      // react hi main kaam aata h most days
      { name: "React",  icon: "react",
        note: "what i build interfaces in most days. i treat it as a system not a page-by-page thing." },

      { name: "Next.js",  icon: "nextjs",
        note: "routing, server rendering and edge — the parts that make a site feel fast." },

      { name: "TypeScript",  icon: "typescript",
        note: "types everywhere. catches mistakes before anyone else sees them which is kinda the whole point." },

      // rankify is built with vue. vite ke saath quickly ship hota h
      { name: "Vue 3 / Nuxt",  icon: "vue",
        note: "what Rankify is built with. quick to ship with, pairs well with Vite." },

      { name: "Tailwind",  icon: "tailwind",
        note: "styles built from design tokens so things stay consistent without me thinking about it." },

      { name: "GSAP",  icon: "gsap",
        note: "scroll and motion. this is where the craft actually shows imo." },
    ],
  },

  {
    n: 2,  title: "Backend / Edge",  kicker: "where the work holds",

    items: [
      { name: "Node.js",  icon: "nodejs",
        note: "my default backend. APIs that dont leak data and are simple to reason about." },

      { name: "Appwrite",  icon: "appwrite",
        note: "auth, database and storage when i want a backend up quickly." },

      { name: "Supabase",  icon: "supabase",
        note: "Postgres with realtime updates and auth. good when the data needs to move." },

      { name: "Cloudflare Workers",  icon: "cloudflare",
        note: "code that runs close to the visitor. Rankify uses it to stay light." },

      { name: "Python",  icon: "python",
        note: "small AI and hardware jobs — Lume and weekend experiments mostly." },

      { name: "Tuya IoT",  icon: "tuya",
        note: "the chip inside Lume. voice input and knock-to-wake." },
    ],
  },

  {
    n: 3,  title: "Tooling",  kicker: "where the work ships",

    items: [
      // git history clean rakhna zaruri h, bas push button hi nahi
      { name: "Git",  icon: "git",
        note: "clean history not just a push button. future me says thanks for once." },

      { name: "Vercel",  icon: "vercel",
        note: "every push gets a preview link then production when it looks right." },

      { name: "VS Code",  icon: "vscode",
        note: "where the work happens. kept simple on purpose thats the whole philosophy." },

      // zero deps hi achha. smart mailto has none at all
      { name: "Zero dependencies",  icon: "javascript",
        note: "i like small solutions. Smart Mailto ships with none at all which is kinda the flex." },
    ],
  },
];

// about me — in my own words. honesty hour fr
const ABOUT = {
  quote: "i build for feel — the micro-interactions that make someone stay not just visit.",
  name: "Naman Dhakad",
  role: "Web developer — India",

  bio: [
    // no dark patterns, no bloat, no ai did it
    "i am a web developer who cares about interaction and craft. i like work that is fast feels good in the hand and respects the person using it. no dark patterns no bloat no AI did it.",
    "i have shipped products with Vue React Next and plain good HTML — from exam prep used by thousands idk maybe to small tools that make everyday things feel personal.",
  ],
  bullets: [
    "based in India working with people anywhere",
    "obsessed with type motion and performance",
    "available for freelance and product work",
  ],
  timeline: [
    { y: "2024 — now",     t: "Building Rankify and Felearn AI — AI products that actually help people learn." },
    { y: "2023",           t: "Wish One T-Share Infinite — small sharp tools. each one taught me something." },
    { y: "2022",           t: "Found the craft: type motion and systems. stopped chasing new stacks." },
    { y: "Before",         t: "curiosity then code then people. the loop has not changed." },
  ],
};

// contact details — reach out plz
const CONTACT = {
  email: "hey@naman.is-a.dev",
  github: "https://github.com/namandhakad712",
  githubUser: "namandhakad712",
  linkedin: "https://linkedin.com/in/namandhakad/",
  linkedinUser: "namandhakad",
  site: "https://naman.is-a.dev",
  line: "based in India working worldwide. i read every message and usually reply the same day.",
};