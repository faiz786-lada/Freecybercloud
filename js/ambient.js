/**
 * Ambient "data-stream" network background — a lightweight canvas
 * particle field with connecting lines, evoking a live cloud/network.
 * Purely decorative; respects the current theme's accent color.
 */
(function initAmbientCanvas() {
  const canvas = document.getElementById('ambient');
  const ctx = canvas.getContext('2d');
  let w, h;
  const points = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = window.innerWidth < 700 ? 26 : 55;
  for (let i = 0; i < COUNT; i++) {
    points.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25
    });
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.fillStyle = isLight ? 'rgba(8,145,168,0.35)' : 'rgba(0,217,255,0.35)';
    ctx.strokeStyle = isLight ? 'rgba(8,145,168,0.08)' : 'rgba(0,217,255,0.08)';

    for (const p of points) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          ctx.globalAlpha = 1 - dist / 130;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
