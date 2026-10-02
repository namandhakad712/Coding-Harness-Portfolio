/* ══════════════════════════════════════════════════════════════
   ascii3d.js — 3D ASCII object that follows the cursor
   Renders a wireframe-solid hybrid sphere (point cloud) in 3D,
   rotates toward cursor, and each glyph warps toward the pointer.
   Zero dependencies. One canvas.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const canvas = document.getElementById("mascot");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });

  // Character ramp: dark/dense → light. Used for depth shading.
  const RAMP = " .,:;irsXA253hMHGS#9B&@";
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#*+=-:.?" ;

  // ── Geometry: build a point cloud shaped like a rounded form ──
  // A sphere of points, but pushed through a superformula-ish warp
  // so the silhouette reads as a solid, organic blob (Cline-like).
  function buildPoints(count) {
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle — even spread
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // 1 → -1
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = golden * i;
      let x = Math.cos(th) * r;
      let z = Math.sin(th) * r;

      // Warp: pinch into a slightly egg/creature silhouette
      const warp = 1 + 0.18 * Math.sin(y * 3.0) - 0.10 * Math.cos(y * 5.0);
      x *= warp;
      z *= warp;

      // Ear bumps near the top (gives it a mascot silhouette)
      if (y > 0.55) {
        const t = (y - 0.55) / 0.45;
        const ang = Math.atan2(z, x);
        const lobe = Math.max(0, Math.cos(ang * 2)) * t;
        x *= 1 + lobe * 0.55;
        z *= 1 + lobe * 0.55;
      }
      pts.push({ x, y: y * 1.12, z, ch: CHARS[(Math.random() * CHARS.length) | 0] });
    }
    return pts;
  }

  const POINTS = buildPoints(1400);

  // ── State ──
  let W = 0, H = 0, DPR = 1, R = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, has: false };
  const rot = { x: 0, y: 0, tx: 0, ty: 0 };
  let t = 0;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.max(1, Math.round(W * DPR));
    canvas.height = Math.max(1, Math.round(H * DPR));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    R = Math.min(W, H) * 0.34;
    // Glyph size scales with the object so it always reads as ASCII texture
    FONT = Math.max(7, Math.min(13, R * 0.062));
  }

  let FONT = 10;

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    pointer.tx = cx; pointer.ty = cy; pointer.has = true;
    // Target rotation from pointer offset (object "looks at" cursor)
    rot.tx = ((cy / rect.height) - 0.5) * -1.1;
    rot.ty = ((cx / rect.width) - 0.5) * 2.2;
  }
  function onLeave() { pointer.has = false; rot.tx = 0; rot.ty = 0; }

  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  window.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.clientY >= rect.top && e.clientY <= rect.bottom) onMove(e);
  });

  // ── Render loop ──
  function frame() {
    t += 0.006;
    // Smooth-follow the cursor (spring)
    pointer.x += (pointer.tx - pointer.x) * 0.10;
    pointer.y += (pointer.ty - pointer.y) * 0.10;
    rot.x += (rot.tx - rot.x) * 0.055;
    rot.y += (rot.ty - rot.y) * 0.055;

    // Idle drift so it's alive before the cursor arrives
    const idleY = t * 0.35;
    const yaw = rot.y + (pointer.has ? 0 : idleY);
    const pitch = rot.x + Math.sin(t * 0.7) * 0.12;

    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
    const focal = 3.0;

    // Project each point
    const drawn = [];
    for (let i = 0; i < POINTS.length; i++) {
      const p = POINTS[i];
      // rotate Y
      let x = p.x * cosY - p.z * sinY;
      let z = p.x * sinY + p.z * cosY;
      let y = p.y;
      // rotate X
      const y2 = y * cosX - z * sinX;
      const z2 = y * sinX + z * cosX;
      y = y2; z = z2;

      const s = focal / (focal + z + 2.4);
      let sx = cx + x * R * s * 2.2;
      let sy = cy + y * R * s * 2.2;

      // Depth-based shading (far = dim, near = bright)
      const depth = (z + 2) / 4;           // 0..1
      const shade = Math.max(0, Math.min(1, depth));

      // ── CURSOR ATTRACTION ── warp points toward the pointer
      let pull = 0;
      if (pointer.has) {
        const dx = pointer.x - sx;
        const dy = pointer.y - sy;
        const d = Math.hypot(dx, dy);
        const RAD = R * 2.0;
        if (d < RAD) {
          pull = Math.pow(1 - d / RAD, 2);
          // Stronger pull on the near-facing shell so it "reaches" out
          const f = pull * 46 * (0.35 + shade);
          sx += dx / (d + 0.001) * f;
          sy += dy / (d + 0.001) * f;
        }
      }
      drawn.push({ sx, sy, shade, pull, z });
    }

    // Painter's algorithm — far to near
    drawn.sort((a, b) => a.z - b.z);

    ctx.font = "600 " + FONT + "px 'JetBrains Mono', ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < drawn.length; i++) {
      const d = drawn[i];
      if (d.sx < -20 || d.sx > W + 20 || d.sy < -20 || d.sy > H + 20) continue;

      let ch;
      if (d.pull > 0.06) {
        // Near the cursor the glyph "excites" — cycles characters
        const idx = ((t * 34 + i * 7) | 0) % CHARS.length;
        ch = CHARS[idx];
      } else {
        ch = POINTS[i % POINTS.length].ch;
      }

      // Colour: cyan-white core → violet edges, brightened by cursor pull
      const glow = d.pull;
      const a = 0.16 + d.shade * 0.74 + glow * 0.5;
      if (a < 0.05) continue;

      if (glow > 0.10) {
        const g = Math.min(255, 140 + glow * 220);
        ctx.fillStyle = "rgba(" + ((g | 0)) + "," + ((g * 0.92) | 0) + ",255," + Math.min(1, a) + ")";
      } else {
        // subtle violet → white gradient by depth
        const v = (d.shade * 90) | 0;
        ctx.fillStyle = "rgba(" + (170 + v * 0.7 | 0) + "," + (170 + v * 0.7 | 0) + ",255," + Math.min(1, a) + ")";
      }
      ctx.fillText(ch, d.sx, d.sy);
    }

    requestAnimationFrame(frame);
  }

  // Boot
  function boot() { resize(); }
  window.addEventListener("resize", resize);
  if (document.readyState === "complete" || document.readyState === "interactive") boot();
  else document.addEventListener("DOMContentLoaded", boot);

  requestAnimationFrame(frame);
})();
