# yo 👋

so you ended up here. cool.

this is my portfolio. but like.. not a normal one. there is no "scroll down for 40 mins and read my life story" here. u type stuff, it thinks (pretends to think idk), then it gives u the answer. kinda like chatgpt but dumb and honest about beeing dumb.

**live site:** https://namandhakad712.github.io/Coding-Harness-Portfolio/

---

## why did i even make this

boredom mostly. also every other portfolio looks same same yaar. hero section, "hi i am X", gradient blob, scroll scroll, footer. i fell asleep mid click on one of those last year and decided im never making one of those.

so this one pretends to be a terminal. u get a blinking cursor thing, u type commands, it responds. thats it. thats the whole gimmick.

oh and theres a peach. a round ascii peach that follows ur mouse around. dont ask why. i was sleep deprived ok.

---

## wat can u actually type bro

try these first:

```
/work     <- shows my 5 projects, with pics and links
/craft    <- what tools i use, explained normal person style
/about    <- who i am, short version
/contact  <- email + github + linkedin in one go
/help     <- if ur lost, this helps
/theme    <- 16 colour schemes, click n it saves
/history  <- everything u asked till now
/undo     <- go back one answer
/clear    <- wipe it all
```

keyboard stuff:
- `/` opens the menu
- `up` `down` arrows to scroll through stuff
- `tab` cycles options
- `enter` runs it
- `esc` cancels whatever is happening
- `?` opens the beginner guide thing if u forgot

also u can just type normal sentences like "show me ur work" or "are u available for hire" and it will still understand. theres a small router thing behind it, its not actually ai, dont get too excited.

---

## hidden stuff (not in help menu on purpose)

real terminals have secrets. so does this one. i aint listing these in /help, u gotta just... know. or read this i guess lol

```
/coffee   -> the most important command humanity ever made
/sudo     -> u dont have permission and u never will
/42       -> yes. that 42.
/xyzzy    -> literally nothing happens. correct response btw
/rm       -> it says no. politely. i like my files
```

and this one still works if ur a real one:

```
↑ ↑ ↓ ↓ ← → ← → B A
```

try it. i dare u.

---

## how it works (simplified so even i can understand it later)

no backend. no server. no database. nothing is being stored or sent anywhere. everything happens inside ur browser tab and thats it. close the tab and its gone forever like my attention span.

the "thinking" part that opens before every answer — thats scripted. i wrote out a bunch of phrases and it shuffles them randomly so no two runs look same. its not a real model doing anything, its just vibes. the guide popup says this out loud too so im not tricking nobody.

files basically:

```
index.html     -> the page shell, starts everything
styles.css     -> colours + layout, 16 themes in there
tui.js         -> the actual terminal logic, commands, streaming, eggs
ascii3d.js     -> draws the peach mascot thing
data.js        -> all the text content lives here and nowhere else
assets/        -> screenshots of projects + tech icons
```

if u wanna change any text on the site, just open data.js. u dont need to touch anything else. i kept it separate so future me doesnt cry.

---

## running it locally (2 min max)

```bash
git clone https://github.com/namandhakad712/Coding-Harness-Portfolio.git
cd Coding-Harness-Portfolio
python -m http.server 8137
```

then open http://localhost:8137 and thats it. no npm install, no node_modules folder the size of my backlog, no build step. literally just files sitting there being useful.

---

## the peach situation

ok so theres this round peach drawn in ascii characters on the side. it:

- follows ur cursor when u move the mouse
- blinks sometimes
- breathes (subtle size change yeah)
- bounces if u click it
- has a little shine in its eyes

first version of it looked like tv static cause i was generating random points. looked horrible. rewrote the whole thing to calculate each cell properly — ellipse shape, depth maths, shading from 6 characters. now it looks like an actual peach and not noise. hover only changes the colour now, never the character, otherwise it flickers like crazy and hurts ur eyes.

---

## things i used

react, next, typescript, vue, tailwind, gsap, node, some cloudflare workers, python for small stuff. full list if u type `/craft` on the site.

basically whatever gets the job done without me wanting to throw my laptop out the window.

---

## about me short ver

**naman dhakad** — web dev from india. i build stuff that feels good to use. i care about the small interactions, the ones most ppl dont even notice but somehow make a site feel "right".

if u wanna talk: `hey@naman.is-a.dev`

im usually online lol. reply fast unless im sleeping or in class.

---

<p align="center">
  <sub>↑ ↑ ↓ ↓ ← → ← → B A — u were not supposed to read this far but i appreciate u did 🫡</sub>
</p>
