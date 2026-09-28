/* Portals dropdown — hover + click/tap + keyboard ARIA + mobile */
(function(){
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  if (!dropdowns.length) return;
  let hoverTimer = null;

  function setOpen(dd, open){
    dd.classList.toggle('is-open', open);
    const trig = dd.querySelector('[data-dropdown-trigger]');
    if (trig) trig.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  dropdowns.forEach(dd => {
    const trig = dd.querySelector('[data-dropdown-trigger]');
    if (!trig) return;
    // hover open (desktop only) with small delay to avoid flicker
    dd.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches && window.innerWidth > 980) {
        clearTimeout(hoverTimer);
        dd.classList.add('is-open');
        trig.setAttribute('aria-expanded','true');
      }
    });
    dd.addEventListener('mouseleave', () => {
      if (window.matchMedia('(hover: hover)').matches && window.innerWidth > 980) {
        hoverTimer = setTimeout(() => {
          dd.classList.remove('is-open');
          trig.setAttribute('aria-expanded','false');
        }, 140);
      }
    });
    // click/tap toggle
    trig.addEventListener('click', (e) => {
      e.preventDefault();
      // close others
      dropdowns.forEach(other => { if (other !== dd) setOpen(other, false); });
      const open = !dd.classList.contains('is-open');
      setOpen(dd, open);
      if (open) {
        const first = dd.querySelector('.dropdown-item');
        if (first) first.focus({preventScroll:true});
      }
      trig.focus();
    });
    // keyboard nav inside menu
    dd.querySelectorAll('.dropdown-item').forEach((a, i, all) => {
      a.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); all[(i+1)%all.length].focus(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); all[(i-1+all.length)%all.length].focus(); }
        if (e.key === 'Home')       { e.preventDefault(); all[0].focus(); }
        if (e.key === 'End')        { e.preventDefault(); all[all.length-1].focus(); }
      });
    });
    trig.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { setOpen(dd,false); trig.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(dd,true); dd.querySelector('.dropdown-item')?.focus(); }
    });
  });

  // Esc anywhere closes all
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dropdowns.forEach(dd => setOpen(dd, false));
  });

  // Click outside closes
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) dropdowns.forEach(dd => setOpen(dd, false));
  });

  // Mobile menu toggle
  const mob = document.getElementById('mobileToggle');
  const menu = document.getElementById('navMenu');
  if (mob && menu) {
    mob.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      mob.setAttribute('aria-expanded', open ? 'true' : 'false');
      const ic = mob.querySelector('i');
      if (ic) ic.className = open ? 'fas fa-times' : 'fas fa-bars';
    });
  }
})();
