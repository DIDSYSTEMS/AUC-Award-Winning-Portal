// AUC Interactive Core - Award-Winning Behaviors
(function() {
  'use strict';
  
  // Sticky/Scrolled Header
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }, { passive: true });
  }
  
  // Scroll Reveal
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }
  
  // Stats counter animation
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const duration = 1800;
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          const val = Math.floor(eased * target);
          el.textContent = prefix + val.toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = prefix + target.toLocaleString() + suffix;
        }
        requestAnimationFrame(tick);
        counterIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => counterIO.observe(c));
  }
  
  // Live Countdown (Continental Ideation Sprint 2026)
  const cdDays = document.getElementById('count-days');
  const cdHours = document.getElementById('count-hours');
  const cdMins = document.getElementById('count-mins');
  const cdSecs = document.getElementById('count-secs');
  if (cdDays) {
    // Target: 2026-10-15T09:00:00Z (Continental Ideation Sprint Start)
    const target = new Date('2026-10-15T09:00:00Z').getTime();
    function updateCountdown() {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      cdDays.textContent = String(d).padStart(2, '0');
      cdHours.textContent = String(h).padStart(2, '0');
      cdMins.textContent = String(m).padStart(2, '0');
      cdSecs.textContent = String(s).padStart(2, '0');
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }
  
  // Eligibility checker
  const checkerBtns = document.querySelectorAll('.checker-btn');
  const result = document.getElementById('checkerResult');
  const resultText = document.getElementById('checkerResultText');
  if (checkerBtns.length && result) {
    const state = {};
    checkerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const step = btn.dataset.step;
        state[step] = btn.dataset.val;
        // mark active
        document.querySelectorAll(`.checker-btn[data-step="${step}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        evaluate(state);
      });
    });
    function evaluate(s) {
      if (!s.student || !s.african || !s.team) {
        result.style.display = 'none'; return;
      }
      result.style.display = 'block';
      if (s.student === 'no') {
        resultText.innerHTML = '<strong style="color:#FF3B30;">Not Eligible</strong> — AUC is open exclusively to undergraduate students currently enrolled.';
        return;
      }
      if (s.african === 'no') {
        resultText.innerHTML = '<strong style="color:#FF3B30;">Not Eligible</strong> — Your institution must be in an African Union member nation.';
        return;
      }
      if (s.team === 'solo') {
        resultText.innerHTML = '<strong style="color:#FFB800;">Team Formation Required</strong> — AUC requires teams of 2–4 members. Apply as solo and we will match you with peers via the Talent Pool.';
        return;
      }
      resultText.innerHTML = '<strong style="color:#00FF87;">✓ You\'re Eligible!</strong> Proceed to the registration form below to lock in your team\'s preliminary entry.';
    }
  }
  
  // News filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.filterTab;
        document.querySelectorAll('[data-filter-category]').forEach(card => {
          if (tab === 'all' || card.dataset.filterCategory === tab) {
            card.style.display = ''; card.classList.add('reveal', 'in');
          } else { card.style.display = 'none'; }
        });
      });
    });
  }
  
  // FAQ
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      faqItems.forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
  
  // Theme toggle engine (Item 12)
  const toggles = document.querySelectorAll('.theme-toggle, #themeToggle');
  const savedTheme = localStorage.getItem('auc-theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    toggles.forEach(t => t.classList.add('light'));
  }
  toggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isLight = document.body.classList.toggle('light');
      toggles.forEach(t => t.classList.toggle('light', isLight));
      localStorage.setItem('auc-theme', isLight ? 'light' : 'dark');
    });
  });

  // Dynamic Site Content Overrides (Item 1: Content corrections from Admin/CMS)
  try {
    const overrides = JSON.parse(localStorage.getItem('auc_cms_overrides') || '{}');
    const pageKey = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    if (overrides[pageKey]) {
      Object.keys(overrides[pageKey]).forEach(selector => {
        const target = document.querySelector(selector);
        if (target && overrides[pageKey][selector]) {
          target.innerHTML = overrides[pageKey][selector];
        }
      });
    }
  } catch(e) {}
  
  // 3D Tilt on hero cards (subtle)
  document.querySelectorAll('.hero-badge, .countdown-cell').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 8;
      const y = ((e.clientY - r.top) / r.height - 0.5) * -8;
      el.style.transform = `translateY(-4px) rotateX(${y}deg) rotateY(${x}deg)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
  
  // Active nav highlight
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.replace(/\.html?$/, '').includes(path.replace(/\.html?$/, ''))) {
      a.classList.add('active');
    }
  });
  
  // Parallax orbits
  const orbits = document.querySelector('.hero-orbits');
  if (orbits) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      orbits.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    });
  }
  
  // Mobile menu toggle
  const mobToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  if (mobToggle && navMenu) {
    mobToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobToggle.classList.toggle('open', isOpen);
      mobToggle.setAttribute('aria-expanded', isOpen);
      mobToggle.innerHTML = isOpen
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
    });
    // Close menu on nav link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        if (!link.classList.contains('dropbtn')) {
          navMenu.classList.remove('open');
          mobToggle.classList.remove('open');
          mobToggle.setAttribute('aria-expanded', 'false');
          mobToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
      });
    });
  }
})();

