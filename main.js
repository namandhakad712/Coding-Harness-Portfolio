/* ══════════════════════════════════════════════════════════
   main.js — slash commands, menu, plan/act, reveal
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const input = document.getElementById("cmd");
  const menu = document.getElementById("menu");
  const toggle = document.getElementById("toggle");
  if (!input || !menu) return;

  // ── slash command registry ──
  const COMMANDS = [
    { cmd: "/work",     desc: "Show shipped projects" },
    { cmd: "/craft",    desc: "Tools & stack I use" },
    { cmd: "/about",    desc: "Who is behind the code" },
    { cmd: "/contact",  desc: "Send a message" },
    { cmd: "/resume",   desc: "Download résumé (PDF)" },
    { cmd: "/theme",    desc: "Toggle light / dark" },
    { cmd: "/github",   desc: "Open GitHub profile" },
    { cmd: "/linkedin", desc: "Open LinkedIn profile" },
    { cmd: "/clear",    desc: "Clear the input" },
    { cmd: "/help",     desc: "List all commands" },
  ];
  const HIDDEN_COUNT = 19;

  let active = -1;
  let filtered = [];

  function render(list, moreCount) {
    menu.innerHTML = "";
    if (!list.length) { menu.hidden = true; return; }
    list.forEach((c, i) => {
      const row = document.createElement("div");
      row.className = "menu__i" + (i === active ? " on" : "");
      row.setAttribute("role", "option");
      row.innerHTML = '<span class="cmd">' + c.cmd + '</span><span class="desc">' + c.desc + "</span>";
      row.addEventListener("click", () => { input.value = c.cmd; run(c.cmd); });
      row.addEventListener("pointerenter", () => { active = i; paint(); });
      menu.appendChild(row);
    });
    if (moreCount > 0) {
      const m = document.createElement("div");
      m.className = "menu__more";
      m.innerHTML = "▼ " + moreCount + " more";
      menu.appendChild(m);
    }
    menu.hidden = false;
  }

  function paint() {
    [...menu.querySelectorAll(".menu__i")].forEach((el, i) =>
      el.classList.toggle("on", i === active));
  }

  function openMenu() {
    const q = input.value.trim().toLowerCase();
    const base = q.startsWith("/")
      ? COMMANDS.filter((c) => c.cmd.startsWith(q))
      : COMMANDS;
    filtered = base;
    active = base.length ? 0 : -1;
    render(base, q.startsWith("/") ? 0 : HIDDEN_COUNT);
  }

  function closeMenu() { menu.hidden = true; active = -1; }

  // ── execute ──
  function run(raw) {
    const v = (raw || "").trim().toLowerCase();
    if (!v) return;

    const go = (id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    switch (v) {
      case "/work": case "/projects": go("work"); break;
      case "/craft": case "/stack": go("craft"); break;
      case "/about": go("about"); break;
      case "/contact": case "/email": go("contact"); break;
      case "/github":
        window.open("https://github.com/namandhakad712", "_blank", "noopener"); break;
      case "/linkedin":
        window.open("https://linkedin.com/in/namandhakad/", "_blank", "noopener"); break;
      case "/resume":
        window.open("https://naman.is-a.dev", "_blank", "noopener"); break;
      case "/clear": input.value = ""; break;
      case "/theme": document.body.classList.toggle("light"); break;
      case "/help": go("work"); break;
      default:
        // Unknown command → gentle nudge, keep it friendly
        input.value = "";
        input.placeholder = "Unknown command — try /help";
        setTimeout(() => { input.placeholder = modePlaceholder(); }, 2200);
        return;
    }
    closeMenu();
    if (v !== "/clear") input.value = "";
  }

  // ── input events ──
  input.addEventListener("input", () => {
    if (input.value.startsWith("/")) openMenu();
    else closeMenu();
  });

  input.addEventListener("keydown", (e) => {
    if (!menu.hidden && filtered.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault(); active = (active + 1) % filtered.length; paint();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault(); active = (active - 1 + filtered.length) % filtered.length; paint();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (active >= 0) { input.value = filtered[active].cmd; run(filtered[active].cmd); }
        return;
      }
      if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
    }
    if (e.key === "Enter") { run(input.value); }
    if (e.key === "Escape") { input.value = ""; closeMenu(); }
  });

  // Ctrl+P opens menu (as advertised in the hint)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
      e.preventDefault(); input.focus(); openMenu();
    }
    // Tab cycles Plan/Act — but only when not typing in input
    if (e.key === "Tab" && document.activeElement !== input) {
      e.preventDefault(); cycleMode();
    }
    // Any key focuses input for that "terminal" feel
    if (e.key === "/" && document.activeElement !== input && !e.ctrlKey && !e.metaKey) {
      input.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".prompt")) closeMenu();
  });

  // ── Plan / Act toggle ──
  let mode = "act";
  function modePlaceholder() {
    return mode === "plan" ? "Plan something..." : "What can I do for you?";
  }
  function cycleMode() {
    mode = mode === "act" ? "plan" : "act";
    toggle.querySelectorAll(".opt").forEach((o) =>
      o.classList.toggle("is-on", o.dataset.mode === mode));
    input.placeholder = modePlaceholder();
  }
  toggle.addEventListener("click", (e) => {
    const o = e.target.closest(".opt");
    if (!o) return;
    mode = o.dataset.mode;
    toggle.querySelectorAll(".opt").forEach((x) =>
      x.classList.toggle("is-on", x.dataset.mode === mode));
    input.placeholder = modePlaceholder();
  });

  // ── scroll reveal ──
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
