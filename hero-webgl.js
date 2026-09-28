/* AUC Hero — Educational Academic Constellation Engine
   Inspiring, university-focused interactive canvas visualizing 
   Pan-African knowledge exchange, academic innovation hubs, and educational breakthroughs. */
(function () {
  'use strict';
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0, height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let mouse = { x: -1000, y: -1000, active: false };

  function resize() {
    width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
    height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.active = false; }, { passive: true });

  // Key African University Knowledge Centers
  const UNIVERSITIES = [
    { name: 'Addis Ababa Univ', x: 0.65, y: 0.44, country: 'Ethiopia' },
    { name: 'Univ of Ibadan', x: 0.38, y: 0.46, country: 'Nigeria' },
    { name: 'Univ of Ghana', x: 0.34, y: 0.48, country: 'Ghana' },
    { name: 'Makerere Univ', x: 0.60, y: 0.52, country: 'Uganda' },
    { name: 'Univ of Nairobi', x: 0.64, y: 0.53, country: 'Kenya' },
    { name: 'Univ of Cape Town', x: 0.52, y: 0.84, country: 'South Africa' },
    { name: 'Cairo University', x: 0.58, y: 0.22, country: 'Egypt' },
    { name: 'Univ of Rwanda', x: 0.58, y: 0.55, country: 'Rwanda' },
    { name: 'Cheikh Anta Diop', x: 0.24, y: 0.43, country: 'Senegal' },
    { name: 'Mohammed V Univ', x: 0.32, y: 0.22, country: 'Morocco' },
    { name: 'Univ of Dar es Salaam', x: 0.63, y: 0.59, country: 'Tanzania' },
    { name: 'Univ of Yaoundé I', x: 0.44, y: 0.50, country: 'Cameroon' }
  ];

  // Floating Educational Knowledge Symbols
  const ICONS = ['🎓', '📚', '⚛️', '💡', '🌱', '🌍', '📐', '🔬', '🏛️', '🚀'];
  const educationalGlyphs = [];
  for (let i = 0; i < 16; i++) {
    educationalGlyphs.push({
      icon: ICONS[i % ICONS.length],
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00035,
      vy: (Math.random() - 0.5) * 0.00035,
      size: 16 + Math.random() * 12,
      opacity: 0.25 + Math.random() * 0.35,
      pulse: Math.random() * Math.PI * 2
    });
  }

  // Academic Neural Nodes (Universities + Student Clusters)
  class Node {
    constructor(baseX, baseY, label, isUni = false) {
      this.baseX = baseX;
      this.baseY = baseY;
      this.label = label;
      this.isUni = isUni;
      this.x = baseX * width;
      this.y = baseY * height;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.radius = isUni ? (4 + Math.random() * 2) : (2 + Math.random() * 1.8);
      this.pulse = Math.random() * Math.PI * 2;
    }

    update() {
      this.pulse += 0.035;
      this.x += this.vx;
      this.y += this.vy;

      // Gentle bounds
      const targetX = this.baseX * width;
      const targetY = this.baseY * height;
      this.vx += (targetX - this.x) * 0.001;
      this.vy += (targetY - this.y) * 0.001;

      // Mouse gentle interaction
      if (mouse.active) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140 && dist > 0) {
          const force = (140 - dist) / 140 * 0.8;
          this.x += (dx / dist) * force;
          this.y += (dy / dist) * force;
        }
      }
    }

    draw() {
      const glow = Math.sin(this.pulse) * 0.3 + 0.7;
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

      if (this.isUni) {
        ctx.fillStyle = `rgba(0, 255, 135, ${0.8 * glow})`;
        ctx.shadowColor = '#00ff87';
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = `rgba(0, 229, 255, ${0.65 * glow})`;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
      }
      ctx.fill();
      ctx.restore();

      // University subtle title on high res
      if (this.isUni && width > 768) {
        ctx.save();
        ctx.font = '10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = 'rgba(230, 240, 255, 0.45)';
        ctx.fillText(this.label, this.x + 8, this.y + 3);
        ctx.restore();
      }
    }
  }

  // Knowledge Packets / Breakthrough Pulses
  class KnowledgePulse {
    constructor(startNode, endNode) {
      this.start = startNode;
      this.end = endNode;
      this.progress = Math.random();
      this.speed = 0.004 + Math.random() * 0.006;
      this.color = Math.random() > 0.5 ? '#00ff87' : '#00e5ff';
    }
    update() {
      this.progress += this.speed;
      if (this.progress >= 1) {
        this.progress = 0;
      }
    }
    draw() {
      const px = this.start.x + (this.end.x - this.start.x) * this.progress;
      const py = this.start.y + (this.end.y - this.start.y) * this.progress;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }
  }

  resize();

  const nodes = [];
  // Add university hubs
  UNIVERSITIES.forEach(u => {
    nodes.push(new Node(u.x, u.y, u.name, true));
  });

  // Add campus student innovation satellites
  for (let i = 0; i < 45; i++) {
    const cluster = UNIVERSITIES[i % UNIVERSITIES.length];
    const offsetX = (Math.random() - 0.5) * 0.18;
    const offsetY = (Math.random() - 0.5) * 0.18;
    nodes.push(new Node(cluster.x + offsetX, cluster.y + offsetY, 'Innovation Cell', false));
  }

  // Create pulses along close academic connections
  const pulses = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].baseX - nodes[j].baseX;
      const dy = nodes[i].baseY - nodes[j].baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.16 && pulses.length < 32) {
        pulses.push(new KnowledgePulse(nodes[i], nodes[j]));
      }
    }
  }

  // Main educational render loop
  function render() {
    ctx.clearRect(0, 0, width, height);

    // 1. Draw floating educational knowledge glyphs
    educationalGlyphs.forEach(g => {
      g.x += g.vx;
      g.y += g.vy;
      if (g.x < 0) g.x = 1; if (g.x > 1) g.x = 0;
      if (g.y < 0) g.y = 1; if (g.y > 1) g.y = 0;
      g.pulse += 0.02;

      const px = g.x * width;
      const py = g.y * height;
      const alpha = g.opacity * (Math.sin(g.pulse) * 0.2 + 0.8);

      ctx.save();
      ctx.font = `${g.size}px sans-serif`;
      ctx.globalAlpha = alpha;
      ctx.fillText(g.icon, px, py);
      ctx.restore();
    });

    // 2. Draw knowledge network pathways between nodes
    ctx.lineWidth = 0.8;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 130;
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.24;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = nodes[i].isUni || nodes[j].isUni
            ? `rgba(0, 255, 135, ${alpha})`
            : `rgba(0, 229, 255, ${alpha * 0.8})`;
          ctx.stroke();
        }
      }
    }

    // 3. Draw knowledge packets moving between universities
    pulses.forEach(p => {
      p.update();
      p.draw();
    });

    // 4. Update and draw nodes
    nodes.forEach(n => {
      n.update();
      n.draw();
    });

    requestAnimationFrame(render);
  }

  render();
})();
