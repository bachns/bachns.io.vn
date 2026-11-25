/* Matrix rain v2 — bright heads with glow, per-column speed, themed word columns, cursor disturbance */
(() => {
  const c = document.getElementById('matrix');
  if (!c) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { c.remove(); return; }

  const x = c.getContext('2d');
  const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>{}[]/\\$#%&*+=';
  const WORDS = ['SECURITY', 'LINUX', 'CRYPTO', 'SYSADMIN', 'KERNEL', 'ENCRYPT', 'PYTHON', 'BASH', 'TLS', 'AES256', 'ROOT', 'SHELL'];
  const mouse = { x: -9999, y: -9999 };
  let size, cols, drops, w, h, dpr;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const mk = (i) => ({
    y: rnd(-60, 0),
    v: rnd(0.35, 1.25),
    word: Math.random() < 0.1 ? WORDS[(Math.random() * WORDS.length) | 0] : null,
    off: (Math.random() * 20) | 0,
  });

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    size = w < 600 ? 18 : 20;
    cols = Math.ceil(w / size);
    drops = Array.from({ length: cols }, mk);
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  }

  function frame() {
    if (document.hidden || document.documentElement.dataset.theme === 'light') return;

    x.fillStyle = 'rgba(0, 0, 0, 0.075)';
    x.fillRect(0, 0, w, h);
    x.font = `bold ${size}px "JetBrains Mono", monospace`;
    x.textBaseline = 'top';

    for (let i = 0; i < cols; i++) {
      const d = drops[i];
      const px = i * size, py = d.y * size;
      const near = Math.abs(px - mouse.x) < 90 && Math.abs(py - mouse.y) < 160;
      const ch = d.word ? d.word[((d.y | 0) + d.off) % d.word.length] : GLYPHS[(Math.random() * GLYPHS.length) | 0];

      // trail glyph (the glyph that just stopped being the head)
      x.shadowBlur = 0;
      x.fillStyle = d.word ? '#00e5c0' : near ? '#9dffb0' : '#00ff41';
      x.fillText(ch, px, py);
      // bright glowing head, one row ahead
      x.shadowColor = d.word ? '#00ffcc' : '#00ff41';
      x.shadowBlur = near ? 22 : 12;
      x.fillStyle = '#eafff0';
      x.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], px, py + size);
      x.shadowBlur = 0;

      d.y += d.v * (near ? 2.2 : 1);
      if (d.y * size > h + 40 && Math.random() > 0.96) drops[i] = mk(i);
      else if (d.y * size > h + 400) drops[i] = mk(i);
    }
  }

  // cursor spotlight + disturbance
  const root = document.documentElement;
  addEventListener('pointermove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    root.style.setProperty('--mx', e.clientX + 'px');
    root.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; resize(); } }); // ignore mobile address-bar height changes
  resize();
  setInterval(frame, 33); // ~30fps
})();
