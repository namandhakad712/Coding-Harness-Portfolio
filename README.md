<p align="center">
  <img src="./assets/icon.svg" width="96" height="96" alt="peach mascot" />
</p>

<h1 align="center">Naman Dhakad — a portfolio that thinks it's a terminal</h1>

<p align="center">
  <code>~/portfolio — main</code><br/>
  <a href="https://namandhakad712.github.io/Coding-Harness-Portfolio/">▶ live on github pages</a>
</p>

---

<img width="1603" height="934" alt="image" src="https://github.com/user-attachments/assets/cc765271-385e-4eb2-a7e4-d64c4920d2ab" />

There is no long scrolling page here. You type a command, a thought block
opens and streams its reasoning, then the answer arrives — screenshots,
stack, links — as if a model were generating it live. Everything is local,
scripted and honest about being scripted.

---

## What's actually in the box

| | |
|---|---|
| **Slash commands** | `/work` `/craft` `/about` `/contact` `/help` `/theme` `/history` `/undo` `/clear` |
| **Free text** | Type real sentences. A small router picks a genuine answer — greetings, "are you available", "show me the work", "what do you use". |
| **Thinking blocks** | Open by default, fold themselves away when the reply lands, stay clickable forever after. `Esc` cancels mid-stream. |
| **Tool calls** | Fake-but-honest `read` / `write` / `grep` rows that open into real content, the way a coding agent reports work. |
| **16 colour themes** | harness, abyss, ember, dracula, nord, gruvbox, monokai, solarized dark+light, one dark, tokyo night, catppuccin, rosé pine, everforest, kanagawa, github dark. Click a row, it sticks for next time. |
| **A mascot** | A round peach blob rendered as live ASCII — solved per cell, not faked with noise. It turns to follow your cursor, blinks, breathes, bounces when clicked, and has a solid little highlight in each eye. |
| **A beginner popup** | First visit shows a plain-English guide with a real animated typing demo. No jargon. |

### Commands

```sh
/work      five shipped projects, with screenshots and links
/craft     the tools, in plain words, grouped by job
/about     who is behind the code
/contact   email, github, linkedin — one block
/help      how this terminal works, non-technically
/theme     sixteen palettes, click to switch, remembered
/history   everything you've asked so far
/undo      step back one answer
/clear     start fresh
```

Keyboard: `/` opens the menu · `↑` `↓` browse · `Tab` cycle · `Enter` run ·
`Esc` cancel or close · `?` reopens the guide.

---

## Things you weren't told about

A terminal that hides nothing isn't a terminal. These are **not** in the
help list, the menu, or anywhere else:

```sh
/coffee    the most important command in computing
/sudo      privileges you do not have and do not need
/42        yes, that one
/xyzzy     nothing happens. correct.
/rm        refused, politely
```

And the oldest cheat code in the book still works here:

```
↑ ↑ ↓ ↓ ← → ← → B A
```

---

## Design notes

**No AI slop.** The palettes are the real ones — Dracula's `#282a36`,
Nord's polar night, Gruvbox's `#282828` groove — not "a dark theme" and
"another dark theme". Phrases in the thinking blocks are written to vary:
every block shuffles its own word order from a random offset, so two runs
of the same command never read the same.

**The mascot is analytic.** The first version rasterised thousands of
random points and looked like static. The shipped one solves the body per
grid cell: the silhouette is an ellipse (a touch wider at the base, flat
underneath), depth is `√(1 − nx² − ny²)`, and shading falls into six
deterministic character bands — `:` `#` `@`. Nothing is random, nothing
shimmers. The face is painted over the flush with an occupancy mask, so
the blush and eyes always win against the body.

Hover only brightens colour. It never swaps characters — that's what kept
it from flickering.

**Thinking is a lie you agreed to.** There is no model behind this. The
thought block is a scripted performance with a spinner, rotating phrases
and a hold-and-continue structure — but it's modelled on how real agent
harnesses report work, because that's what the interface *is*. The guide
says so out loud.

**One file owns the content.** `data.js` is the single source of truth:
projects, stack, about, contact. The TUI never hardcodes copy. Change a
blurb there and the whole site agrees with itself.

---

## Run it locally

```sh
git clone https://github.com/namandhakad712/Coding-Harness-Portfolio.git
cd Coding-Harness-Portfolio
python -m http.server 8137
# open http://localhost:8137
```

No build step. No dependencies. No bundler. Five files, two folders of
images, and a browser.

```
index.html    the shell
styles.css    16 themes + the whole layout
tui.js        the harness: commands, streaming, thinking, router, eggs
ascii3d.js    the mascot renderer
data.js       every word of content
assets/       project screenshots + tech icons + favicon
```

---

## Colophon

Built from India by **Naman Dhakad** — five shipped projects, a taste for
zero-dependency TypeScript, and a soft spot for interfaces that pretend to
be harder than they are.

<p align="center">
  <sub>↑ ↑ ↓ ↓ ← → ← → B A — you weren't supposed to read this far.</sub>
</p>
