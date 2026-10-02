/* ══════════════════════════════════════════════════════════════
   ascii3d.js — the cursor-following ASCII mascot (v2, analytic)
   A round peach blob with a sprout, dark ASCII eyes and blush.
   Instead of rasterising thousands of random points (which looked
   like noise), the body is solved ANALYTICALLY per grid cell:
     · silhouette = ellipse (wider at the bottom, flat base)
     · depth      = sqrt(1 - nx² - ny²)  → smooth shading bands
     · face parts = projected shapes painted with priority
   Nothing is random, nothing shimmers. Hover only brightens the
   colour — characters never swap. The creature turns slowly to
   follow your cursor, blinks, breathes and bounces on click.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var cv = document.getElementById("mascot");
  if (!cv) return;
  var ctx = cv.getContext("2d");

  var REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── palette ────────────────────────────────────────── */
  var COL = {
    peach: [255, 157, 133],
    mint:  [196, 244, 222],
    leaf:  [122, 226, 148],
    stem:  [104, 204, 130],
    blush: [255, 96, 122],
    dark:  [24, 14, 12],
    glint: [255, 255, 255]
  };
  var BASES = ["peach", "mint", "leaf", "stem", "blush", "dark", "glint"];
  var STEPS = 6;
  var FLAT = { dark: 1, glint: 1 };         // eyes ignore shading

  /* precomputed colour strings: base × brightness step */
  var COLORS = [];
  (function () {
    for (var b = 0; b < BASES.length; b++) {
      var c = COL[BASES[b]];
      for (var s = 0; s < STEPS; s++) {
        var k = FLAT[BASES[b]] ? 1 : (0.74 + 0.26 * (s / (STEPS - 1)));
        COLORS.push("rgb(" +
          Math.min(255, Math.round(c[0] * k)) + "," +
          Math.min(255, Math.round(c[1] * k)) + "," +
          Math.min(255, Math.round(c[2] * k)) + ")");
      }
    }
  })();
  var BUCKET = {};
  for (var bi = 0; bi < BASES.length; bi++)
    for (var si = 0; si < STEPS; si++)
      BUCKET[BASES[bi] + si] = bi * STEPS + si;

  /* ── creature definition (object space, Y up) ───────── */
  /* eyes are plain dark ASCII areas with a small glint — no mouth */
  var EYES = [[-0.31, 0.27, 0.907], [0.31, 0.27, 0.907]];
  var EYE_R = 0.21;
  var BLUSH = [[-0.62, -0.14, 0.772], [0.62, -0.14, 0.772]];
  var BLUSH_R = 0.14;

  /* ── state ──────────────────────────────────────────── */
  var W = 0, H = 0, DPR = 1, cellW = 7, cellH = 15, fontPx = 12;
  var cols = 0, rows = 0, cx0 = 0, cy0 = 0, s = 90, rect = null;
  var ptr = { x: 0, y: 0, tx: 0, ty: 0, on: false };
  var rot = { x: 0, y: 0, tx: 0, ty: 0 };
  var t = 0, raf = 0;
  var blinkAt = 3.2, blinkStart = -1;
  var bounce = 0, bounceV = 0;
  var occBuf = null;

  /* frame-scoped transforms, filled by frameBody() */
  var cY = 1, sY = 0, cP = 1, sP = 0, sE = 90, cxE = 260, cyE = 160, leanX = 0, leanY = 0;

  function project(X, Y, Z) {
    var x1 = X * cY + Z * sY;
    var z1 = -X * sY + Z * cY;
    var y1 = Y * cP - z1 * sP;
    return [cxE + x1 * sE + leanX, cyE - y1 * sE + leanY];
  }

  function measure() {
    ctx.font = "700 " + fontPx + "px 'JetBrains Mono', ui-monospace, monospace";
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
    cx0 = W / 2;
    s = Math.min((W - 70) / 2.5, (H - 46) / 2.65);
    cy0 = H / 2 + 0.33 * s;                  // centre the bbox (sprout adds height)

    if (REDUCED) requestAnimationFrame(drawStatic);
  }

  /* ── pointer ────────────────────────────────────────── */
  function move(e) {
    if (!rect) resize();
    if (!rect) return;
    ptr.tx = e.clientX - rect.left;
    ptr.ty = e.clientY - rect.top;
    ptr.on = ptr.tx > -60 && ptr.tx < rect.width + 60 &&
             ptr.ty > -60 && ptr.ty < rect.height + 60;
    if (ptr.on) {
      var nx = (ptr.tx / Math.max(1, rect.width)) - 0.5;
      var ny = (ptr.ty / Math.max(1, rect.height)) - 0.5;
      rot.tx = Math.max(-0.55, Math.min(0.55, nx * 1.15));  // turn toward cursor
      rot.ty = Math.max(-0.30, Math.min(0.30, ny * 0.70));
    } else { rot.tx = 0; rot.ty = 0; }
    if (REDUCED) drawStatic();
  }
  function leave() { ptr.on = false; rot.tx = 0; rot.ty = 0; if (REDUCED) drawStatic(); }

  window.addEventListener("pointermove", move, { passive: true });
  cv.addEventListener("pointerleave", leave);
  cv.addEventListener("pointerdown", function () {
    if (!REDUCED) bounceV = -6;
    if (REDUCED) drawStatic();
  });

  /* distance from point to segment — used for the smile + stem */
  function segDist(px, py, ax, ay, bx, by) {
    var vx = bx - ax, vy = by - ay;
    var wx = px - ax, wy = py - ay;
    var len = vx * vx + vy * vy;
    var u = len > 0 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / len)) : 0;
    var dx = wx - u * vx, dy = wy - u * vy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* point-in-polygon (leaves) */
  function inPoly(px, py, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  /* ── draw ───────────────────────────────────────────── */
  function tick() {
    raf = requestAnimationFrame(tick);
    try { frameBody(false); } catch (e) { if (window.console) console.error(e); }
  }
  function drawStatic() {
    try { frameBody(true); } catch (e) { if (window.console) console.error(e); }
  }

  function frameBody(isStatic) {
    if (!cols || !W) return;
    if (!isStatic) t += 0.016;

    /* pointer smoothing */
    ptr.x += (ptr.tx - ptr.x) * 0.10;
    ptr.y += (ptr.ty - ptr.y) * 0.10;
    rot.x += (rot.tx - rot.x) * 0.085;   // rot.x ← horizontal target (yaw)
    rot.y += (rot.ty - rot.y) * 0.085;   // rot.y ← vertical target (pitch)

    /* click squash spring */
    if (!REDUCED) {
      bounceV += (-90 * bounce - 11 * bounceV) * 0.016;
      bounce += bounceV * 0.016;
    }

    /* slow idle sway when the cursor is away */
    var idleYaw = ptr.on ? 0 : Math.sin(t * 0.38) * 0.16;
    var idlePit = ptr.on ? 0 : Math.sin(t * 0.27) * 0.06;
    /* rot.x holds the HORIZONTAL pointer offset → yaw;
       rot.y holds the VERTICAL pointer offset → pitch. (was swapped) */
    var yaw = rot.x + idleYaw;
    var pitch = rot.y + idlePit;
    cY = Math.cos(yaw); sY = Math.sin(yaw);
    cP = Math.cos(pitch); sP = Math.sin(pitch);

    /* breath + bob + click bounce */
    sE = s * (1 + bounce * 0.03 + Math.sin(t * 1.1) * 0.012);
    cyE = cy0 + (REDUCED ? 0 : Math.sin(t * 0.9) * 2.5);
    cxE = cx0;

    /* gentle lean toward the cursor */
    if (ptr.on && rect) {
      leanX = Math.max(-1, Math.min(1, (ptr.x - rect.width / 2) / (rect.width / 2))) * 7;
      leanY = Math.max(-1, Math.min(1, (ptr.y - rect.height / 2) / (rect.height / 2))) * 5;
    } else { leanX = 0; leanY = 0; }

    /* blink */
    var bk = 1;
    if (!REDUCED) {
      if (t > blinkAt) { blinkStart = t; blinkAt = t + 2.6 + Math.random() * 2.4; }
      if (blinkStart > 0 && t - blinkStart < 0.15) {
        bk = 1 - Math.sin(Math.PI * (t - blinkStart) / 0.15) * 0.94;
      }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.font = "700 " + fontPx + "px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    /* ── pre-project face parts once ── */
    var eyePts = [], i;
    for (i = 0; i < EYES.length; i++) eyePts.push(project(EYES[i][0], EYES[i][1], EYES[i][2]));
    var blushPts = [];
    for (i = 0; i < BLUSH.length; i++) blushPts.push(project(BLUSH[i][0], BLUSH[i][1], BLUSH[i][2]));

    /* ── buckets of cells, grouped by colour for few fillStyle changes ── */
    var NB = BASES.length * STEPS;
    var buckets = [];
    for (i = 0; i < NB; i++) buckets.push([]);

    function paint(col, row, base, step, ch) {
      if (col < 0 || col >= cols || row < 0 || row >= rows) return;
      buckets[BUCKET[base + step]].push(col, row, ch.charCodeAt(0));
    }

    /* ── body region ── */
    var ryB = 1.02, rxMax = 1.14;
    var col0 = Math.max(0, Math.floor((cx0 - rxMax * sE - 4) / cellW));
    var col1 = Math.min(cols - 1, Math.ceil((cx0 + rxMax * sE + 4) / cellW));
    var row0 = Math.max(0, Math.floor((cyE - 1.08 * sE) / cellH));
    var row1 = Math.min(rows - 1, Math.ceil((cyE + 1.05 * sE) / cellH));

    /* occupancy: body cells beat sprout cells (buckets flush by index) */
    if (!occBuf || occBuf.length !== cols * rows) occBuf = new Uint8Array(cols * rows);
    var occ = occBuf;
    occ.fill(0);

    var eyeRadX = EYE_R * sE;
    var blushRad = BLUSH_R * sE;
    var hoverR = 2.1 * sE;

    var c, r;
    for (r = row0; r <= row1; r++) {
      var sy = r * cellH + cellH * 0.5;
      var dyN = (sy - cyE) / (ryB * sE);
      if (dyN > 0.94 || dyN < -1) continue;
      var rxF = rxMax * (1 + 0.09 * dyN);       // pear: a touch wider at the base
      for (c = col0; c <= col1; c++) {
        var sx = c * cellW + cellW * 0.5;
        var dxN = (sx - cxE) / (rxF * sE);
        var q = dxN * dxN + dyN * dyN;
        if (q > 1) continue;                     // outside the silhouette
        var nz = Math.sqrt(1 - q);

        /* brightness: rounded depth + soft top light (+ hover glow).
           NEVER exceeds 1.0 — peach must stay peach, not wash to white. */
        var bri = 0.74 + 0.26 * Math.pow(nz, 0.7) - 0.05 * dyN;
        if (ptr.on) {
          var hx = ptr.x - sx, hy = ptr.y - sy;
          var hd = Math.sqrt(hx * hx + hy * hy);
          if (hd < hoverR) {
            var g = 1 - hd / hoverR;
            bri += 0.10 * g * g;
          }
        }
        if (bri > 1.0) bri = 1.0;
        if (bri < 0.74) bri = 0.74;

        /* mint belly: object Y is UP, screen dyN is DOWN → flip the sign */
        var Yobj = (-dyN * ryB + nz * ryB * sP) / (cP || 1);
        var base = Yobj < -0.34 ? "mint" : "peach";

        /* stable bands: char depends only on depth, never on time/hover */
        var ch = nz < 0.28 ? ":" : nz < 0.62 ? "#" : "@";
        var step = Math.max(0, Math.min(STEPS - 1,
          Math.round((bri - 0.74) / 0.26 * (STEPS - 1))));

        /* blush sits under the eyes (ASCII cells) */
        var overlay = false;
        for (i = 0; i < blushPts.length; i++) {
          var bdx = sx - blushPts[i][0], bdy = sy - blushPts[i][1];
          if ((bdx * bdx) / (blushRad * blushRad) + (bdy * bdy) / (blushRad * blushRad) <= 1) {
            base = "blush"; ch = "@"; step = 2; overlay = true; break;
          }
        }
        occ[r * cols + c] = 1;
        paint(c, r, base, step, ch);
      }
    }

    /* ── sprout: stem drawn first (base tucks behind the head) ── */
    var stemA = project(0, 0.82, 0.1), stemB = project(0, 1.40, 0.1);
    var stemR = Math.max(2.5, 0.055 * sE);
    var srow0 = Math.max(0, Math.floor((Math.min(stemA[1], stemB[1]) - stemR) / cellH));
    var srow1 = Math.min(rows - 1, Math.ceil((Math.max(stemA[1], stemB[1]) + stemR) / cellH));
    var scol0 = Math.max(0, Math.floor((Math.min(stemA[0], stemB[0]) - stemR) / cellW));
    var scol1 = Math.min(cols - 1, Math.ceil((Math.max(stemA[0], stemB[0]) + stemR) / cellW));
    for (r = srow0; r <= srow1; r++) {
      for (c = scol0; c <= scol1; c++) {
        if (occ[r * cols + c]) continue;
        var stx = c * cellW + cellW * 0.5, sty = r * cellH + cellH * 0.5;
        if (segDist(stx, sty, stemA[0], stemA[1], stemB[0], stemB[1]) < stemR)
          paint(c, r, "stem", 4, "#");
      }
    }

    /* leaves: two tilted ellipses as projected polygons */
    var LEAVES = [
      { cx: -0.26, cy: 1.50, ux: -0.866, uy: 0.5, a: 0.30, b: 0.115 },
      { cx: 0.26, cy: 1.50, ux: 0.866, uy: 0.5, a: 0.30, b: 0.115 }
    ];
    for (i = 0; i < LEAVES.length; i++) {
      var L = LEAVES[i], poly = [], k;
      for (k = 0; k < 36; k++) {
        var th = (k / 36) * Math.PI * 2;
        var ex = L.cx + L.a * Math.cos(th) * L.ux - L.b * Math.sin(th) * L.uy;
        var ey = L.cy + L.a * Math.cos(th) * L.uy + L.b * Math.sin(th) * L.ux;
        poly.push(project(ex, ey, 0.06));
      }
      var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (k = 0; k < poly.length; k++) {
        if (poly[k][0] < minx) minx = poly[k][0];
        if (poly[k][0] > maxx) maxx = poly[k][0];
        if (poly[k][1] < miny) miny = poly[k][1];
        if (poly[k][1] > maxy) maxy = poly[k][1];
      }
      var lc0 = Math.max(0, Math.floor(minx / cellW)), lc1 = Math.min(cols - 1, Math.ceil(maxx / cellW));
      var lr0 = Math.max(0, Math.floor(miny / cellH)), lr1 = Math.min(rows - 1, Math.ceil(maxy / cellH));
      for (r = lr0; r <= lr1; r++) {
        for (c = lc0; c <= lc1; c++) {
          if (occ[r * cols + c]) continue;
          var lx = c * cellW + cellW * 0.5, ly = r * cellH + cellH * 0.5;
          if (inPoly(lx, ly, poly)) paint(c, r, "leaf", 4, "#");
        }
      }
    }

    /* ── sparkles (slow twinkle, drawn behind everything) ── */
    var SPARKS = [
      [-1.62, 0.90, 0.2], [1.55, 1.00, 0.2], [-1.74, -0.62, 0.2],
      [1.68, -0.74, 0.2], [-1.20, 1.52, 0.1], [1.24, 1.56, 0.1]
    ];
    var SPARK_CH = ["+", "*", "."];
    for (i = 0; i < SPARKS.length; i++) {
      var sp = SPARKS[i];
      var pp = project(sp[0], sp[1], sp[2]);
      var alpha = 0.30 + 0.70 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 1.7));
      var sch = SPARK_CH[Math.floor(t * 0.7 + i * 1.3) % 3];
      ctx.fillStyle = "rgba(255,242,208," + alpha.toFixed(3) + ")";
      ctx.fillText(sch, pp[0], pp[1]);
    }

    /* ── flush body/sprout cells ── */
    for (i = 0; i < NB; i++) {
      var list = buckets[i];
      if (!list.length) continue;
      ctx.fillStyle = COLORS[i];
      for (var j = 0; j < list.length; j += 3) {
        ctx.fillText(String.fromCharCode(list[j + 2]),
          (list[j] + 0.5) * cellW, list[j + 1] * cellH + cellH * 0.5);
      }
    }

    /* ── vector eyes: old rubber-hose cartoon style — a TALL WHITE OVAL
          with a small BLACK OVAL pupil resting LOW inside it (Mickey /
          Cuphead era), not a circle inside a circle. The pupil still
          glances toward the cursor but stays pinned to the lower half. ── */
    var pdx, pdy;
    if (ptr.on && rect) {
      pdx = Math.max(-1, Math.min(1, (ptr.x - cxE) / (W * 0.35)));
      pdy = Math.max(-1, Math.min(1, (ptr.y - cyE) / (H * 0.45)));
    } else {
      pdx = Math.sin(t * 0.50) * 0.32;              // idle wander
      pdy = Math.cos(t * 0.41) * 0.22;
    }
    for (i = 0; i < eyePts.length; i++) {
      var ex = eyePts[i][0], ey = eyePts[i][1];
      var wrx = eyeRadX;                             // oval: taller than wide
      var wry = eyeRadX * 1.30 * bk;                 // blink squashes it flat
      if (wry < 1) continue;

      /* white part — vertical oval */
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(ex, ey, wrx, wry, 0, 0, Math.PI * 2); ctx.fill();

      /* black part — small oval sitting low in the white */
      var prx = wrx * 0.60;
      var pry = Math.max(wry * 0.44, pupMin(bk));
      var px = ex + pdx * (wrx - prx) * 0.85;
      var py = ey + wry * 0.38 + pdy * wry * 0.20;   // low + a gentle glance
      ctx.fillStyle = "#16100e";
      ctx.beginPath(); ctx.ellipse(px, py, prx, pry, 0, 0, Math.PI * 2); ctx.fill();
    }
    function pupMin(b) { return b < 1 ? 1.5 : 0; }   // pupil never fully vanishes
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
