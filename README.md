# yo 👋

so like u ended up here. cool.

this is my portfolio but like... not a normal one lol. koi "scroll down for 40 mins and read my life story" wala nahi h ye. u type stuff, it thinks (pretends to think idk), then gives u the answer. kinda like chatgpt but dumb and honest about being dumb.

**live site:** https://namandhakad712.github.io/Coding-Harness-Portfolio/
**raw README:** https://raw.githubusercontent.com/namandhakad712/Coding-Harness-Portfolio/refs/heads/main/README.md

---

## why did i even make this

boredom mostly. plus har dusre portfolio lagte h same same yaar. hero section, "hi i am X", gradient blob, scroll scroll, footer. i fell asleep mid click on one of those last year and i was like "never again bro".

so this one pretends to be a terminal. u get a blinking cursor thing, u type commands, it responds. thats it. thats the whole gimmick.

oh and there's a peach. a round ascii peach that follows ur mouse around. dont ask why. i was sleep deprived ok 😭

---

## wat can u actually type bro

try these first:

```
/work     <- shows my 5 projects with pics and links
/craft    <- what tools i use in normal person language
/about    <- whoami short version
/contact  <- email + github + linkedin ek saath
/help     <- if u r lost this helps lol
/theme    <- 16 colour schemes click karke switch hota h
/history  <- sab kuchh jo tune poocha
/undo     <- ek answer piche jao
/clear    <- sab erase kar do
```

keyboard stuff:
- `/` opens the menu
- `up` `down` arrows se scroll karo
- `tab` cycles options
- `enter` runs it
- `esc` cancels kuchh bhi jo chal raha h
- `?` opens the beginner guide agar bhool gaye ho

also u can just normal sentences bhi typed like "show me ur work" ya "are u available for hire" and it'll still understand. theres a small router behind it, its not actually ai, dont get too excited 😅

---

## hidden stuff (not in help menu on purpose)

real terminals have secrets. so does this one. i aint listing these in /help u gotta just... know. or read this i guess lol

```
/coffee   -> the most important command humanity ever made
/sudo     -> u dont have permission and u never will 💀
/42       -> yes. that 42.
/xyzzy    -> literally nothing happens. correct response btw
/rm       -> it says no. politely. i like my files
```

and this konami code one bhi still works agar tum real ho:

```
↑ ↑ ↓ ↓ ← → ← → B A
```

try it. i dare u.

---

## how it works (simplified so even i can understand it later)

no backend. no server. no database. kuchh bhi store ya send nahi hota. sab tumhare browser tab ke andar chalta h. tab band karo toh sab kuchh gone forever jaise mera attention span.

"thinking" part jo har answer se pehle open hota h — thats scripted. maine kuchh phrases likh diye hain aur yeh randomly shuffle karta h jisse koi bhi do runs same nahi lagte. its not a real model doing anything, its just vibes. guide popup bhi yehi kehta h so maine kuchh bhi nahi chhipaya.

files basically:

```
index.html     -> page ka shell, sab kuchh start karta h
styles.css     -> colours + layout, 16 themes yehin h
tui.js         -> actual terminal logic, commands, streaming, eggs
ascii3d.js     -> draws the peach mascot thing
data.js        -> saara text content yahi h kahin aur nahi
assets/        -> project screenshots + tech icons
```

agar koi text change karna ho to bas data.js khol lo. kuchh aur touch nahi karne ki zaroorat. maine alag rakh diya taki future mei mera na roye 🥲

---

## running it locally (2 min max)

```bash
git clone https://github.com/namandhakad712/Coding-Harness-Portfolio.git
cd Coding-Harness-Portfolio
python -m http.server 8137
```

then open http://localhost:8137 and done. no npm install, no node_modules folder jo meri backlog jitna bada ho, no build step. literally bas files khadi hain wohi kaam karti hain.

---

## the peach situation 🍑

ok so there's this round peach drawn in ascii characters on the side. it:

- follows ur cursor jab tum mouse chalate ho
- blinks sometimes
- breathes (subtle size change yeah)
- bounces agar tum click karo
- has a little shine in its eyes

first version it tv static jaisa lag raha tha kyuki main random points generate kar raha tha. bahut bura lag raha tha. poori tarah se rewrite kar diya to calculate each cell properly — ellipse shape, depth maths, 6 characters se shading. ab ek real peach lag raha h aur noise nahi. hover sirf colour change karta h kabhi character nahi, warna flicker karta h bahut bura lagta h aur aankh dard hoti h.

---

## things i used

react, next, typescript, vue, tailwind, gsap, node, thoda sa cloudflare workers, python for small stuff. puri list agar tum /craft dabao ge toh milti h.

basically jo bhi kaam kare without me wanting to throw my laptop out the window.

---

## about me short ver

**naman dhakad** — web dev from india. main wohi banna pasand karta h jo use karo toh achha lagta h. main chhote interactions par dhyan deta hoon, jinhe logo notice nahi karte but kuchh aisa banate hain ki website "right" lagti h.

agar tumhara kehna ho: `hey@naman.is-a.dev`

i m usually online lol. mjhe reply fast aata h unless main so raha hoon ya class mei hoon.

---

<p align="center">
  <sub>↑ ↑ ↓ ↓ ← → ← → B A — tum yahan tak padh ke aaye ho par main appreciate kar raha hoon 🫡</sub>
</p>