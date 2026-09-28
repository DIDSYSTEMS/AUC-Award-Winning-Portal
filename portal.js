/* Portal routing — single-page navigation within each portal */
(function(){
  const links = document.querySelectorAll('.side-link');
  const pages = document.querySelectorAll('.page');
  const crumb = document.getElementById('crumbPage');
  const titles = { dashboard: 'Dashboard', team: 'My Team', submission: 'Submission', track: 'Track Details', eligibility: 'Eligibility & KYC', mentors: 'Mentors', resources: 'Resources', schedule: 'Schedule', scoreboard: 'Live Scoreboard', messages: 'Messages', settings: 'Settings' };
  function show(name) {
    pages.forEach(p => p.classList.toggle('active', p.dataset.page === name));
    links.forEach(l => l.classList.toggle('active', l.dataset.page === name));
    if (crumb) crumb.textContent = titles[name] || name;
    // Re-fire counter observers for the active page
    document.querySelectorAll('.kpi-card.reveal:not(.in)').forEach(el => el.classList.add('in'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.dataset.page;
      if (page) {
        show(page);
        history.replaceState(null, '', '#' + page);
      }
    });
  });
  if (location.hash) {
    const target = location.hash.replace('#', '');
    if (titles[target]) show(target);
  }

  // KPI counters
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / 1200, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.floor(eased * target);
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = target;
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-count]').forEach(c => io.observe(c));
  }

  // Submission tabs
  document.querySelectorAll('.submit-tabs .tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.submit-tabs .tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
    });
  });

  // Reveal elements on scroll or immediately
  function initPortalReveals() {
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '50px' });
      reveals.forEach(r => io.observe(r));
    } else {
      reveals.forEach(r => r.classList.add('in'));
    }
    // Also reveal immediately any inside active viewports
    document.querySelectorAll('.page.active .reveal, .active .reveal').forEach(r => r.classList.add('in'));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortalReveals);
  } else {
    initPortalReveals();
  }
})();
