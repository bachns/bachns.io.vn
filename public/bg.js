/* Animated backgrounds — a scene is picked at random on every page visit (never the same one twice in a row).
   Scenes: matrix · network · stars · circuit · radar.  Override with ?bg=<name> or the ◈ button. */
(() => {
  const c = document.getElementById('bg');
  if (!c) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { c.remove(); return; }

  const x = c.getContext('2d');
  const root = document.documentElement;
  const mouse = { x: -9999, y: -9999 };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  let w, h, dpr, scene, name;

  const scenes = {
    /* ---------- matrix: calm, sparse columns ---------- */
    matrix() {
      const size = w < 600 ? 20 : 24;
      const cols = Math.ceil(w / size);
      const GL = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789<>{}[]/$#';
      const WORDS = ['SECURITY', 'LINUX', 'CRYPTO', 'SYSADMIN', 'KERNEL', 'PYTHON', 'BASH', 'TLS', 'ROOT'];
      const mk = (i) => ({ i, y: rnd(-40, 0), row: -1, v: rnd(7, 16), word: Math.random() < 0.07 ? pick(WORDS) : null });
      const drops = [];
      for (let i = 0; i < cols; i++) if (Math.random() < 0.5) drops.push(mk(i));
      x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
      return (dt) => {
        x.fillStyle = 'rgba(0,0,0,0.09)'; x.fillRect(0, 0, w, h);
        x.font = `${size - 4}px "JetBrains Mono", monospace`; x.textBaseline = 'top';
        for (let n = 0; n < drops.length; n++) {
          const d = drops[n]; d.y += d.v * dt / 1000;
          const row = Math.floor(d.y);
          if (row !== d.row && row >= 0) {
            const px = d.i * size, prev = (d.row) * size, py = row * size;
            if (d.row >= 0) { // settle previous head into a calm green trail glyph
              x.shadowBlur = 0; x.fillStyle = '#000'; x.fillRect(px, prev, size, size);
              x.fillStyle = d.word ? 'rgb(0,200,170)' : 'rgb(0,200,60)';
              x.fillText(d.word ? d.word[row % d.word.length] : pick(GL), px, prev);
            }
            x.shadowColor = d.word ? '#00ffcc' : '#00ff41'; x.shadowBlur = 8;
            x.fillStyle = '#c8ffd8'; x.fillText(d.word ? d.word[(row + 1) % d.word.length] : pick(GL), px, py);
            x.shadowBlur = 0; d.row = row;
          }
          if (d.y * size > h + 60 && Math.random() > 0.97) drops[n] = mk(d.i);
        }
      };
    },

    /* ---------- network: drifting nodes linked by distance, reacts to cursor ---------- */
    network() {
      const N = Math.max(40, Math.min(110, Math.floor(w * h / 15000)));
      const L = w < 600 ? 110 : 150;
      const nodes = Array.from({ length: N }, () => ({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-22, 22), vy: rnd(-22, 22), r: rnd(1.2, 2.6) }));
      return (dt) => {
        x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
        const s = dt / 1000;
        for (const n of nodes) {
          n.x += n.vx * s; n.y += n.vy * s;
          if (n.x < 0 || n.x > w) n.vx *= -1; if (n.y < 0 || n.y > h) n.vy *= -1;
        }
        x.lineWidth = 1;
        for (let i = 0; i < N; i++) {
          const a = nodes[i];
          for (let j = i + 1; j < N; j++) {
            const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
            if (d < L * L) { x.strokeStyle = `rgba(0,255,100,${(1 - Math.sqrt(d) / L) * 0.35})`; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
          }
          const mx = a.x - mouse.x, my = a.y - mouse.y, md = Math.hypot(mx, my);
          if (md < 190) { x.strokeStyle = `rgba(0,229,192,${(1 - md / 190) * 0.7})`; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(mouse.x, mouse.y); x.stroke(); }
        }
        x.shadowColor = '#00ff41'; x.shadowBlur = 8; x.fillStyle = '#7dffa8';
        for (const n of nodes) { x.beginPath(); x.arc(n.x, n.y, n.r, 0, 6.2832); x.fill(); }
        x.shadowBlur = 0;
      };
    },

    /* ---------- stars: warp-speed starfield, vanishing point follows the cursor ---------- */
    stars() {
      const N = Math.max(160, Math.min(420, Math.floor(w * h / 5500)));
      const mkStar = (far) => ({ x: rnd(-w, w), y: rnd(-h, h), z: far ? rnd(0.05, 1) : 1, hue: Math.random() < 0.25 ? '0,229,192' : '120,255,160' });
      const stars = Array.from({ length: N }, () => mkStar(true));
      let cx = w / 2, cy = h / 2;
      return (dt) => {
        x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(0, 0, w, h);
        const tx = mouse.x > 0 ? w / 2 + (mouse.x - w / 2) * 0.25 : w / 2, ty = mouse.y > 0 ? h / 2 + (mouse.y - h / 2) * 0.25 : h / 2;
        cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
        const dz = dt / 1000 * 0.32;
        for (let i = 0; i < N; i++) {
          const s = stars[i], z0 = s.z; s.z -= dz;
          if (s.z < 0.03) { stars[i] = mkStar(false); continue; }
          const k = 0.38, x1 = cx + s.x / s.z * k, y1 = cy + s.y / s.z * k, x0 = cx + s.x / z0 * k, y0 = cy + s.y / z0 * k;
          if (x1 < -20 || x1 > w + 20 || y1 < -20 || y1 > h + 20) { stars[i] = mkStar(false); continue; }
          const a = Math.min(1, (1 - s.z) * 1.4);
          x.strokeStyle = `rgba(${s.hue},${a})`; x.lineWidth = 0.6 + (1 - s.z) * 1.8;
          x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
        }
      };
    },

    /* ---------- circuit: PCB traces with data pulses running along them ---------- */
    circuit() {
      const g = 30, cx = Math.ceil(w / g), cy = Math.ceil(h / g);
      const off = document.createElement('canvas'); off.width = w; off.height = h;
      const o = off.getContext('2d');
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      const paths = [];
      const count = Math.floor(w * h / 36000);
      for (let n = 0; n < count; n++) {
        let px = ((Math.random() * cx) | 0) * g, py = ((Math.random() * cy) | 0) * g, d = pick(dirs.slice(0, 4));
        const pts = [[px, py]], len = 6 + ((Math.random() * 12) | 0);
        for (let i = 0; i < len; i++) {
          const run = (1 + ((Math.random() * 4) | 0)) * g; px += d[0] * run; py += d[1] * run; pts.push([px, py]);
          let t; do { t = Math.random() < 0.18 ? pick(dirs.slice(4)) : pick(dirs.slice(0, 4)); } while (t[0] === -d[0] && t[1] === -d[1]); d = t;
        }
        const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        paths.push({ pts, cum, total: cum[cum.length - 1] });
      }
      o.strokeStyle = 'rgba(0,255,65,0.14)'; o.lineWidth = 1.5; o.lineJoin = 'round';
      for (const p of paths) {
        o.beginPath(); p.pts.forEach(([a, b], i) => (i ? o.lineTo(a, b) : o.moveTo(a, b))); o.stroke();
        for (const e of [p.pts[0], p.pts[p.pts.length - 1]]) { o.beginPath(); o.arc(e[0], e[1], 3.2, 0, 6.2832); o.stroke(); }
      }
      const at = (p, dist) => { let i = 1; while (i < p.cum.length - 1 && p.cum[i] < dist) i++; const t = (dist - p.cum[i - 1]) / (p.cum[i] - p.cum[i - 1] || 1), a = p.pts[i - 1], b = p.pts[i]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
      const mkPulse = () => ({ p: pick(paths), d: 0, v: rnd(90, 190), hue: Math.random() < 0.3 ? '0,229,192' : '0,255,65' });
      const pulses = Array.from({ length: Math.max(8, Math.floor(count * 0.6)) }, () => { const q = mkPulse(); q.d = rnd(0, q.p.total); return q; });
      return (dt) => {
        x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.drawImage(off, 0, 0);
        for (let n = 0; n < pulses.length; n++) {
          const q = pulses[n]; q.d += q.v * dt / 1000;
          if (q.d > q.p.total + 60) { pulses[n] = mkPulse(); continue; }
          for (let k = 0; k < 14; k++) {
            const dist = q.d - k * 4; if (dist < 0 || dist > q.p.total) continue;
            const [px, py] = at(q.p, dist);
            x.fillStyle = `rgba(${q.hue},${(1 - k / 14) * 0.9})`; x.beginPath(); x.arc(px, py, 3 - k * 0.12, 0, 6.2832); x.fill();
          }
        }
      };
    },

    /* ---------- radar: rotating sweep with blips that light up when scanned ---------- */
    radar() {
      const wide = w > 820;
      const cx = wide ? w * 0.72 : w / 2, cy = wide ? h * 0.5 : h * 0.34, R = Math.min(h * 0.5, wide ? w * 0.4 : w * 0.46);
      const blips = Array.from({ length: 10 }, () => ({ a: rnd(0, 6.2832), r: rnd(0.2, 0.95) * R, life: 0, tag: '0x' + ((Math.random() * 0xfff) | 0).toString(16).padStart(3, '0') }));
      let ang = rnd(0, 6.2832);
      const TAU = 6.2832;
      return (dt) => {
        x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
        ang = (ang + dt / 1000 * 0.9) % TAU;
        x.strokeStyle = 'rgba(0,255,65,0.2)'; x.lineWidth = 1;
        for (let k = 1; k <= 4; k++) { x.beginPath(); x.arc(cx, cy, R * k / 4, 0, TAU); x.stroke(); }
        x.beginPath(); x.moveTo(cx - R, cy); x.lineTo(cx + R, cy); x.moveTo(cx, cy - R); x.lineTo(cx, cy + R); x.stroke();
        for (let t = 0; t < 72; t++) { const a = t * TAU / 72, l = t % 6 === 0 ? 14 : 6; x.beginPath(); x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.lineTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l)); x.stroke(); }
        for (let i = 0; i < 34; i++) { // sweep trail
          x.fillStyle = `rgba(0,255,65,${(1 - i / 34) * 0.2})`; x.beginPath(); x.moveTo(cx, cy);
          x.arc(cx, cy, R, ang - (i + 1) * 0.03, ang - i * 0.03); x.closePath(); x.fill();
        }
        x.strokeStyle = 'rgba(160,255,190,0.85)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); x.stroke();
        x.font = '11px "JetBrains Mono", monospace';
        for (const b of blips) {
          let diff = (ang - b.a + TAU) % TAU; if (diff < 0.09) b.life = 1; else b.life = Math.max(0, b.life - dt / 1000 * 0.45);
          if (b.life <= 0) continue;
          const px = cx + Math.cos(b.a) * b.r, py = cy + Math.sin(b.a) * b.r;
          x.shadowColor = '#00ff41'; x.shadowBlur = 12; x.fillStyle = `rgba(160,255,190,${b.life})`; x.beginPath(); x.arc(px, py, 3.5, 0, TAU); x.fill(); x.shadowBlur = 0;
          x.fillStyle = `rgba(0,229,192,${b.life * 0.9})`; x.fillText(b.tag, px + 9, py - 4);
        }
      };
    },
  };
  const NAMES = Object.keys(scenes);

  const store = {
    get() { try { return sessionStorage.getItem('bg-scene'); } catch { return null; } },
    set(v) { try { sessionStorage.setItem('bg-scene', v); } catch {} },
  };
  const q = new URLSearchParams(location.search).get('bg');
  const prev = store.get();
  name = NAMES.includes(q) ? q : pick(NAMES.filter((n) => n !== prev)); // new random scene each visit
  store.set(name);

  const btn = document.getElementById('bgbtn');
  const label = () => { if (btn) btn.title = `Background: ${name} (click to change)`; };
  const start = () => { dpr = Math.min(devicePixelRatio || 1, 1.5); w = innerWidth; h = innerHeight; c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); scene = scenes[name](); label(); };
  btn && btn.addEventListener('click', () => { name = NAMES[(NAMES.indexOf(name) + 1) % NAMES.length]; store.set(name); start(); });

  addEventListener('pointermove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    root.style.setProperty('--mx', e.clientX + 'px'); root.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; start(); } }); // ignore mobile address-bar height changes

  let last = performance.now();
  const loop = (t) => {
    requestAnimationFrame(loop);
    const dt = Math.min(t - last, 60);
    if (dt < 22) return;
    last = t;
    if (document.hidden) return;
    scene(dt);
  };
  start();
  requestAnimationFrame(loop);
})();
