/* ══════════════════════════════════════════════════════════════
   ascii3d.js — the cursor-following 3D ASCII mascot
   A round peach blob with a sprout, eyes, a smile, blush and
   sparkles, built as a union-of-primitives point cloud. It is
   rotated in 3D, projected, and rasterised into a character grid
   with a z-buffer — so the result is a SOLID ASCII creature, not
   noise. It blinks, breathes, leans toward your cursor, and the
   cells near the pointer light up.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var cv = document.getElementById("mascot");
  if (!cv) return;
  var ctx = cv.getContext("2d");

  var REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── palette ────────────────────────────────────────── */
  var PEACH = 0, MINT = 1, GREEN = 2, DARK = 3, BLUSH = 4;
  var RGB = [
    [255, 157, 133],   // peach body
    [213, 247, 231],   // mint belly
    [122, 226, 140],   // sprout
    [46, 28, 24],      // eyes / smile
    [255, 104, 133]    // blush
  ];
  var SHADE = [0.68, 0.82, 0.92, 1.0];
  var CH = [":", "=", "#", "@"];          // ramp, dark rim → bright front
  var EXCITE = "*#%@&";

  var NB = RGB.length * SHADE.length;      // normal buckets
  var B_WHITE = NB, B_CYAN = NB + 1;       // excited buckets
  var COLORS = [];
  (function buildColors() {
    for (var c = 0; c < RGB.length; c++) {
      for (var s = 0; s < SHADE.length; s++) {
        var k = SHADE[s], flat = (c === DARK || c === BLUSH);
        var kk = flat ? 1 : k;
        COLORS.push("rgba(" + Math.round(RGB[c][0] * kk) + "," +
          Math.round(RGB[c][1] * kk) + "," + Math.round(RGB[c][2] * kk) + ",1)");
      }
    }
    COLORS.push("rgba(255,255,255,1)");
    COLORS.push("rgba(198,232,255,1)");
  })();

  /* ── geometry helpers ───────────────────────────────── */
  var BODY = { cy: -0.05, sy: 0.98, sz: 0.95 };
  var BODY_BOT = -1.15, BODY_TOP = 1.83;   // rough vertical bounds

  function frontZ(x, y) {
    var ny = (y - BODY.cy) / BODY.sy;
    var v = 1 - x * x - ny * ny;
    return v > 0 ? BODY.sz * Math.sqrt(v) : 0;
  }

  var PTS = [];
  function sph(cx, cy, cz, r, sx, sy, sz, n, col) {
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2;
      var rad = Math.sqrt(Math.max(0, 1 - y * y));
      var th = Math.PI * (3 - Math.sqrt(5)) * i;
      PTS.push({
        x: cx + Math.cos(th) * rad * r * sx,
        y: cy + y * r * sy,
        z: cz + Math.sin(th) * rad * r * sz,
        c: col, f: 0, by: 0
      });
    }
  }

  /* disc that hugs the front of the body (face features) */
  function faceDisc(cx, cy, r, n, col, proud) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var rr = Math.sqrt(Math.random()) * r;
      var x = cx + Math.cos(a) * rr;
      var y = cy + Math.sin(a) * rr;
      PTS.push({
        x: x, y: y, z: frontZ(x, y) + proud,
        c: col, f: 1, by: cy
      });
    }
  }

  /* ── build the creature ─────────────────────────────── */
  // body + wide seated base
  sph(0, -0.05, 0, 1.00, 1.00, 0.98, 0.95, 1000, PEACH);
  sph(0, -0.62, 0.05, 0.82, 1.12, 0.62, 0.95, 420, PEACH);
  // little arms
  sph(-1.02, -0.18, 0.18, 0.30, 1.00, 0.85, 0.85, 130, PEACH);
  sph(1.02, -0.18, 0.18, 0.30, 1.00, 0.85, 0.85, 130, PEACH);
  // mint belly: wraps the bottom, plus a soft patch on the front
  for (var i = 0; i < PTS.length; i++) {
    var p = PTS[i];
    if (p.c !== PEACH) continue;
    var ny = (p.y - BODY.cy) / BODY.sy;
    if (ny < -0.34) p.c = MINT;
    else if (ny < -0.06 && p.z > 0.55) p.c = MINT;
  }
  // sprout stem
  for (var s = 0; s < 70; s++) {
    var t = s / 69, a = Math.random() * Math.PI * 2, rr = 0.075;
    PTS.push({ x: Math.cos(a) * rr, y: 0.86 + t * 0.56, z: Math.sin(a) * rr, c: GREEN, f: 0, by: 0 });
  }
  // two leaves forming a V
  function leaf(cx, cy, ang) {
    for (var i = 0; i < 130; i++) {
      var y = 1 - (i / 129) * 2;
      var rad = Math.sqrt(Math.max(0, 1 - y * y));
      var th = Math.PI * (3 - Math.sqrt(5)) * i;
      var lx = Math.cos(th) * rad * 0.36, ly = y * 0.13, lz = Math.sin(th) * rad * 0.22;
      PTS.push({
        x: cx + lx * Math.cos(ang) - ly * Math.sin(ang),
        y: cy + lx * Math.sin(ang) + ly * Math.cos(ang),
        z: lz, c: GREEN, f: 0, by: 0
      });
    }
  }
  leaf(-0.26, 1.60, Math.PI - 0.60);
  leaf(0.26, 1.60, 0.60);
  // face: eyes, smile, blush (proud of the surface so they win the z-buffer)
  faceDisc(-0.34, 0.24, 0.17, 95, DARK, 0.05);
  faceDisc(0.34, 0.24, 0.17, 95, DARK, 0.05);
  for (var m = 0; m <= 30; m++) {                 // smile arc
    var u = -0.24 + (m / 30) * 0.48;
    var my = -0.20 + 0.26 * (u / 0.24) * (u / 0.24) * 0.55;
    PTS.push({ x: u, y: my, z: frontZ(u, my) + 0.05, c: DARK, f: 1, by: 0 });
    PTS.push({ x: u, y: my - 0.055, z: frontZ(u, my - 0.055) + 0.05, c: DARK, f: 1, by: 0 });
  }
  faceDisc(-0.64, -0.04, 0.13, 45, BLUSH, 0.04);
  faceDisc(0.64, -0.04, 0.13, 45, BLUSH, 0.04);

  for (var q = 0; q < PTS.length; q++) PTS[q].ph = Math.random() * Math.PI * 2;

  /* sparkles orbit the creature (drawn behind it) */
  var SPARKS = [];
  var SPARK_POS = [
    [-1.95, 0.95], [-1.72, -0.95], [1.88, 1.02],
    [1.70, -1.10], [-2.15, -0.10], [2.18, 0.15], [0.15, 2.15]
  ];
  for (var sp = 0; sp < SPARK_POS.length; sp++) {
    SPARKS.push({ x: SPARK_POS[sp][0], y: SPARK_POS[sp][1], ph: Math.random() * Math.PI * 2 });
  }
  var SPARK_CH = ["*", "+", "x", "."];

  /* ── state ──────────────────────────────────────────── */
  var W = 0, H = 0, DPR = 1, cols = 0, rows = 0, cellW = 7, cellH = 15, fontPx = 12;
  var cx0 = 0, cy0 = 0, scale = 80, rect = null;
  var ptr = { x: 0, y: 0, tx: 0, ty: 0, on: false };
  var rot = { x: 0, y: 0, tx: 0, ty: 0 };
  var t = 0, raf = 0;
  var blinkAt = 2.5, blinkStart = -1;        // scheduled blink
  var bounce = 0, bounceV = 0;               // click squash
  var gz, gc, gch;

  function measure() {
    ctx.font = "600 " + fontPx + "px 'JetBrains Mono', ui-monospace, monospace";
    cellW = ctx.measureText("MMMMMMMMMM").width / 10;
    cellH = fontPx * 1.25;
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = r.width; H = r.height; rect = r;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    fontPx = Math.max(8, Math.min(13, Math.round(H / 26)));
    measure();

    cols = Math.max(8, Math.floor(W / cellW));
    rows = Math.max(6, Math.floor(H / cellH));
    // fit the creature (body top → leaf tip) with a small margin,
    // recentred on its own bounding box rather than the origin
    scale = Math.min(W / 4.2, (H - 44) / (BODY_TOP - BODY_BOT));
    cx0 = W / 2;
    cy0 = 22 + BODY_TOP * scale;

    gz = new Float32Array(cols * rows);
    gc = new Int16Array(cols * rows);
    gch = new Int16Array(cols * rows);

    if (REDUCED) requestAnimationFrame(drawStatic);
  }

  /* ── pointer (follows the cursor across the page) ───── */
  function move(e) {
    if (!rect) resize();
    if (!rect) return;
    ptr.tx = e.clientX - rect.left;
    ptr.ty = e.clientY - rect.top;
    ptr.on = ptr.tx > -40 && ptr.tx < rect.width + 40 &&
             ptr.ty > -40 && ptr.ty < rect.height + 40;
    var nx = (ptr.tx / Math.max(1, rect.width)) - 0.5;
    var ny = (ptr.ty / Math.max(1, rect.height)) - 0.5;
    rot.ty = Math.max(-0.62, Math.min(0.62, nx * 1.7));   // yaw follows left/right
    rot.tx = Math.max(-0.38, Math.min(0.38, -ny * 0.9));  // pitch follows up/down
    if (REDUCED) drawStatic();
  }
  function leave() {
    ptr.on = false; rot.tx = 0; rot.ty = 0;
    if (REDUCED) drawStatic();
  }

  window.addEventListener("pointermove", move, { passive: true });
  cv.addEventListener("pointerleave", leave);
  cv.addEventListener("pointerdown", function () {
    bounceV = REDUCED ? 0 : -7;               // little squash on click
    if (REDUCED) drawStatic();
  });

  /* ── frame ──────────────────────────────────────────── */
  /* NOTE: rAF passes a timestamp as arg[0] — never use the first
     parameter to mean "static frame", or the loop kills itself. */
  function tick() {
    raf = requestAnimationFrame(tick);
    try { frameBody(false); } catch (e) { if (window.console) console.error(e); }
  }
  function drawStatic() {
    try { frameBody(true); } catch (e) { if (window.console) console.error(e); }
  }

  function frameBody(staticFrame) {
    if (!cols || !W) return;

    if (!staticFrame) t += 0.016;

    ptr.x += (ptr.tx - ptr.x) * 0.11;
    ptr.y += (ptr.ty - ptr.y) * 0.11;
    rot.x += (rot.tx - rot.x) * 0.07;
    rot.y += (rot.ty - rot.y) * 0.07;

    // click squash spring
    if (!REDUCED) {
      bounceV += (-90 * bounce - 11 * bounceV) * 0.016;
      bounce += bounceV * 0.016;
    }

    // idle sway when the cursor is away
    var idleYaw = ptr.on ? 0 : Math.sin(t * 0.55) * 0.34;
    var yaw = rot.y + idleYaw;
    var pitch = rot.x + Math.sin(t * 0.6) * 0.06;

    // blink
    var bk = 1;
    if (!REDUCED) {
      if (t > blinkAt) { blinkStart = t; blinkAt = t + 2.4 + Math.random() * 2.6; }
      if (blinkStart > 0 && t - blinkStart < 0.17) {
        var bp = (t - blinkStart) / 0.17;
        bk = 1 - Math.sin(Math.PI * bp) * 0.93;
      }
    }

    // breathe + bob + click squash (squash about the base)
    var breathe = 1 + Math.sin(t * 1.7) * 0.016 + bounce * 0.06;
    var bob = Math.sin(t * 1.7) * 0.045;

    var sY = Math.sin(yaw), cY = Math.cos(yaw);
    var sX = Math.sin(pitch), cX = Math.cos(pitch);

    // lean the whole creature toward the cursor (rigid — the face stays intact)
    var leanX = 0, leanY = 0;
    if (ptr.on && rect) {
      leanX = Math.max(-1, Math.min(1, (ptr.x - rect.width / 2) / (rect.width / 2))) * 10;
      leanY = Math.max(-1, Math.min(1, (ptr.y - rect.height / 2) / (rect.height / 2))) * 7;
    }

    gz.fill(-Infinity); gc.fill(-1);

    var i, n = PTS.length;
    for (i = 0; i < n; i++) {
      var p = PTS[i];

      var px = p.x, py = p.y, pz = p.z;
      if (p.f && p.by && bk !== 1) py = p.by + (py - p.by) * bk;   // blink: eyes flatten
      if (!p.f) {
        // living wobble (features stay put so the face reads clean)
        var w = Math.sin(t * 2.1 + p.ph) * 0.012;
        px += w; py += Math.cos(t * 1.7 + p.ph) * 0.010; pz += w;
        py = BODY_BOT + (py - BODY_BOT) * breathe;                 // squash about base
        py += bob;
      }

      // rotate Y then X
      var x1 = px * cY - pz * sY;
      var z1 = px * sY + pz * cY;
      var y1 = py * cX - z1 * sX;
      var z2 = py * sX + z1 * cX;

      var persp = 4.4 / (4.4 + z2);
      var sx = cx0 + x1 * scale * persp + leanX;
      var sy = cy0 - y1 * scale * persp + leanY;

      // cursor proximity → light up (no displacement, geometry stays solid)
      var excite = 0;
      if (ptr.on) {
        var dx = ptr.x - sx, dy = ptr.y - sy;
        var d = Math.sqrt(dx * dx + dy * dy);
        var RAD = scale * 2.4;
        if (d < RAD) excite = Math.pow(1 - d / RAD, 1.7);
      }

      var col = ((sx / cellW) | 0);
      var row = ((sy / cellH) | 0);
      if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

      var idx = row * cols + col;
      var depth = -z2 + (p.f ? 0.9 : 0) + excite * 0.8;   // face always in front
      if (depth > gz[idx]) {
        gz[idx] = depth;
        var b;
        if (excite > 0.62) b = Math.random() < 0.5 ? B_WHITE : B_CYAN;
        else if (excite > 0.22) b = B_WHITE;
        else {
          var raw = (0.9 - z2) / 1.8 + y1 * 0.10;         // depth + soft top light
          var front = 0.30 + 0.70 * (raw < 0 ? 0 : raw > 1 ? 1 : raw);  // floor: belly never goes dark
          front = front > 0.999 ? 0.999 : front;
          var sh = (front * SHADE.length) | 0;
          b = p.c * SHADE.length + sh;
        }
        gc[idx] = b;
        var ch;
        if (b >= NB) ch = EXCITE[(Math.random() * EXCITE.length) | 0];
        else if (p.f) ch = "@";
        else ch = CH[(b % SHADE.length)] || ":";
        gch[idx] = ch.charCodeAt(0);
      }
    }

    /* ── draw ── */
    ctx.clearRect(0, 0, W, H);
    ctx.font = "600 " + fontPx + "px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var baselineY = cellH * 0.5;

    // sparkles first, so the creature occludes any overlap
    for (var sI = 0; sI < SPARKS.length; sI++) {
      var sk = SPARKS[sI];
      var tw = 0.5 + 0.5 * Math.sin(t * 2.6 + sk.ph);
      if (REDUCED) tw = 0.7;
      var ch2 = SPARK_CH[((t * 2 + sI) | 0) % SPARK_CH.length];
      ctx.fillStyle = "rgba(255,242,206," + (0.18 + tw * 0.82).toFixed(3) + ")";
      ctx.fillText(ch2, cx0 + sk.x * scale, cy0 - sk.y * scale);
    }

    // batched by colour bucket
    var arr = [], bkt;
    for (bkt = 0; bkt < NB + 2; bkt++) arr.push([]);

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var gi = r * cols + c;
        var bb = gc[gi];
        if (bb < 0) continue;
        arr[bb].push(c, r, gch[gi]);
      }
    }

    for (bkt = 0; bkt < arr.length; bkt++) {
      var list = arr[bkt];
      if (!list.length) continue;
      ctx.fillStyle = COLORS[bkt];
      for (var k = 0; k < list.length; k += 3) {
        ctx.fillText(String.fromCharCode(list[k + 2]),
          (list[k] + 0.5) * cellW, list[k + 1] * cellH + baselineY);
      }
    }
  }

  function start() {
    resize();
    if (REDUCED) drawStatic();
    else if (!raf) raf = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);

  if (document.readyState === "complete" || document.readyState === "interactive") start();
  else document.addEventListener("DOMContentLoaded", start);

  // the TUI toggles .idle display — re-measure when it comes back
  window.__mascotResize = resize;
})();
