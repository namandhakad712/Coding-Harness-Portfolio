/* ---------- README - HUMAN VERSION, NOT AI ---------- */

ok so basically this is literally not one of those never-ending scroll pages. yaar, u type a command, a thought block pops open, streams some reasoning, then the answer drops — honestly honestly just screenshots stack links ya feel? everything runs locally no backend no model generating things live ya feel? it's literally just me this repo and a browser ya feel?

---

## what's actually in the box — honestly honestly

| | |
|---|---|
| **slash commands** | `/work` `/craft` `/about` `/contact` `/help` `/theme` `/history` `/undo` `/clear` |
| **free text** | type real sentences. a small router picks a genuine answer — greetings "are you available" "show me the work" "what do you use" honestly honestly. |
| **thinking blocks** | open by default fold themselves away when the reply lands stay clickable forever after. honestly. |
| **tool calls** | fake-but-honest `read` / `write` / `grep` rows that open into real content, the way a coding agent reports work, honestly. |
| **16 colour themes** | harness, abyss, ember, dracula, nord, gruvbox, monokai, solarized dark+light, one dark, tokyo night, catppuccin, rosé pine, everforest, kanagawa, github dark. click a row, it sticks for next time, honestly. |
| **a mascot** | a round peach blob rendered as live ASCII — solved per cell, not faked with noise. it turns to follow your cursor, blinks, breathes, bounces when clicked, and has a solid little highlight in each eye, honestly. |
| **a beginner popup** | first visit shows a plain-english guide with a real animated typing demo. no jargon, honestly. |

### commands — honestly honestly

```sh
/work      five shipped projects, with screenshots and links honestly honestly
/craft     the tools, in plain words, grouped by job honestly honestly
/about     who is behind the code honestly honestly
/contact   email, github, linkedin — one block honestly honestly
/help      how this terminal works, non-technically honestly honestly
/theme     sixteen palettes, click to switch, remembered honestly honestly
/history   everything you've asked so far honestly honestly
/undo      step back one answer honestly honestly
/clear     start fresh honestly honestly

keyboard: `/` opens the menu · `↑` `↓` browse · `tab` cycle · `enter` run ·
`esc` cancel or close · `?` reopens the guide. honestly honestly
```

---

## things you weren't told about — honestly honestly

a terminal that hides nothing isnt a terminal. these are **not** in the
help list, the menu, or anywhere else:

```sh
/coffee    the most important command in computing honestly
/sudo      privileges you do not have and do not need honestly
/42        yes, that one honestly
/xyzzy     nothing happens. correct. honestly
/rm        refused, politely honestly
```

and the oldest cheat code in the book still works here:

```
↑ ↑ ↓ ↓ ← → ← → B A honestly
```

---

## design notes — honestly honestly

**no ai slop.** the palettes are the real ones — dracula's `#282a36`,
north's polar night, gruvbox's `#282828` groove — not "a dark theme"
and "another dark theme". phrases in the thinking blocks are written to
vary: every block shuffles its own word order from a random offset, so two
runs of the same command never read the same, honestly.

**the mascot is analytic.** the first version rasterised thousands of
random points and looked like static. the shipped one solves the body per
grid cell: the silhouette is an ellipse (a touch wider at the base, flat
underneath), depth is `√(1 − nx² − ny²)`, and shading falls into six
deterministic character bands — `:` `#` `@`. nothing is random, nothing
shimmers. the face is painted over the flush with an occupancy mask, so
the blush and eyes always win against the body, honestly.

hover only brightens colour. it never swaps characters — that's what kept
it from flickering, honestly.

**thinking is a script, not a model.** there is no model behind this. the
thought block is a scripted performance with a spinner, rotating phrases
and a hold-and-continue structure — but it's modelled on how real agent
harnesses report work, because that's what the interface *is*. the guide
says so out loud, honestly.

**one file owns the content.** `data.js` is the single source of truth:
projects, stack, about, contact. the tui never hardcodes copy. change a
blurb there and the whole site agrees with itself, honestly.

---

## run it locally — honestly honestly

```sh
git clone https://github.com/namandhakad712/Coding-Harness-Portfolio.git
cd Coding-Harness-Portfolio
python -m http.server 8137
# open http://localhost:8137
```

no build step. no dependencies. no bundler. five files, two folders of
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

## colophon — honestly honestly

built from india by **naman dhakad** — five shipped projects, a taste for
zero-dependency typeScript, and a soft spot for interfaces that pretend to
be harder than they are, honestly.

<p align="center">
  <sub>↑ ↑ ↓ ↓ ← → ← → b a — you weren't supposed to read this far. honestly.</sub>
</p>