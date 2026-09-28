// Shared portal enhancer: wires side-links to sections, tabs, smooth scroll, active state, autosave.
(function () {
  function $(s, root) { return (root || document).querySelector(s); }
  function $$(s, root) { return Array.from((root || document).querySelectorAll(s)); }

  // Sidebar links with href="#" → resolve to in-page anchors.
  function wireSideLinks() {
    $$('.side-link').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        // If no real href, swallow placeholder # jumps.
        const href = a.getAttribute('href') || '';
        const id = a.dataset.target || (href && href.startsWith('#') && href !== '#' ? href.slice(1) : null);
        if (!id) return; // intentionally a placeholder; visual feedback handled by panel show
        const el = document.getElementById(id) || document.querySelector('[data-page="' + id + '"]');
        if (el) {
          ev.preventDefault();
          $$('.side-link').forEach(function (s) { s.classList.remove('active'); s.removeAttribute('aria-current'); });
          a.classList.add('active');
          a.setAttribute('aria-current', 'page');
          // Update crumb on portals
          const crumb = $('#crumbPage');
          if (crumb) crumb.textContent = a.textContent.trim();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Bring into view visually
          if (typeof el.classList !== 'undefined' && el.classList.contains('page')) {
            $$('.page').forEach(function (p) { p.classList.remove('active'); });
            el.classList.add('active');
          }
        }
      });
    });
  }

  // Tabs (CMS + Student submission).
  function wireTabs() {
    $$('.submit-tabs').forEach(function (group) {
      const tabs = $$('.tab', group);
      const panelId = group.dataset.target;
      const panels = panelId ? $$('#' + panelId + ' > .tab-panel') : [];
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () {
          tabs.forEach(function (x) { x.classList.remove('active'); });
          t.classList.add('active');
          tabs.forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
          t.setAttribute('aria-selected', 'true');
          if (panels[i]) {
            panels.forEach(function (p) { p.hidden = true; });
            panels[i].hidden = false;
          }
        });
      });
    });
    // CMS pattern-add buttons: insert a block.
    $$('.pattern-add').forEach(function (b) {
      b.addEventListener('click', function () {
        const canvas = $('.editor-canvas .canvas-body');
        if (!canvas) return;
        const type = b.textContent.trim().toLowerCase();
        let html = '';
        if (type.includes('prize')) {
          html = '<div class="canvas-block" data-inserted="prize"><div class="podium"><div class="podium-step gold"><span>🥇 Gold</span><strong>$60,000</strong></div><div class="podium-step silver"><span>🥈 Silver</span><strong>$30,000</strong></div><div class="podium-step bronze"><span>🥉 Bronze</span><strong>$15,000</strong></div></div></div>';
        } else if (type.includes('track')) {
          html = '<div class="canvas-block" data-inserted="tracks"><div class="track-cards-6"><div class="tc-card">Aspiration 1 · FinTech</div><div class="tc-card">Aspiration 2 · Agriculture</div><div class="tc-card">Aspiration 3 · Health</div><div class="tc-card">Aspiration 4 · Climate</div><div class="tc-card">Aspiration 5 · Education</div><div class="tc-card">Aspiration 6 · Governance</div></div></div>';
        } else if (type.includes('timeline')) {
          html = '<div class="canvas-block" data-inserted="timeline"><ol class="timeline-vertical"><li class="active"><span class="dot"></span><div><strong>Stage 1 · Campus Pitch</strong><small>Jan — Feb 2026</small></div></li><li><span class="dot"></span><div><strong>Stage 2 · Nationals</strong><small>Mar — Apr 2026</small></div></li><li><span class="dot"></span><div><strong>Stage 3 · Accelerator</strong><small>May — Aug 2026</small></div></li><li><span class="dot"></span><div><strong>Stage 4 · Continental Finals</strong><small>Oct 2026</small></div></li></ol></div>';
        } else {
          html = '<div class="canvas-block" data-inserted="text"><p>New text block — click to edit, autosaves every 30s.</p></div>';
        }
        const target = canvas.querySelector('.canvas-block.is-selected') || canvas.lastElementChild;
        if (target && target !== canvas) target.insertAdjacentHTML('afterend', html);
        else canvas.insertAdjacentHTML('beforeend', html);
        canvas.scrollIntoView({ behavior: 'smooth', block: 'end' });
        b.classList.add('pulse-once'); setTimeout(function(){ b.classList.remove('pulse-once'); }, 600);
      });
    });
  }

  // CMS: make canvas blocks contenteditable + select.
  function wireCanvas() {
    $$('.editor-canvas .canvas-block').forEach(function (b) {
      b.setAttribute('contenteditable', 'true');
      b.addEventListener('click', function (ev) {
        if (ev.target.closest('a, button')) return;
        $$('.editor-canvas .canvas-block').forEach(function (x) { x.classList.remove('is-selected'); });
        b.classList.add('is-selected');
      });
    });
  }

  // CMS: real autosave with timestamp.
  function wireAutosave() {
    let last = $('#autosaveTime') || $$('.save-status').pop();
    function tick() {
      const d = new Date();
      const stamp = 'Autosaved · ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
      if (last) last.textContent = stamp;
      try {
        const data = $$('.editor-canvas .canvas-block').map(function(b){ return { html: b.innerHTML }; });
        localStorage.setItem('auc_cms_canvas', JSON.stringify({ ts: Date.now(), blocks: data }));
      } catch (e) {}
    }
    setInterval(tick, 30000);
    tick();
    // Manual save button
    const saveBtn = $('[data-action="manual-save"]');
    if (saveBtn) saveBtn.addEventListener('click', tick);
    // Restore last canvas
    try {
      const raw = localStorage.getItem('auc_cms_canvas');
      if (raw) {
        const j = JSON.parse(raw);
        if (j && j.blocks && Array.isArray(j.blocks)) {
          $$('.editor-canvas .canvas-block').forEach(function (b, i) {
            if (j.blocks[i]) b.innerHTML = j.blocks[i].html;
          });
        }
      }
    } catch (e) {}
  }

  // CMS: heading tag select + text color swatches + gradient dropdown.
  function wireInspector() {
    const sel = $('#inspHeadingTag');
    if (sel) sel.addEventListener('change', function () {
      const b = $('.editor-canvas .canvas-block.is-selected');
      if (!b) return;
      const heading = b.querySelector('h1, h2, h3, h4');
      if (heading) {
        const newTag = sel.value.toLowerCase();
        const oldTag = heading.tagName.toLowerCase();
        if (oldTag !== newTag) {
          const repl = document.createElement(newTag);
          repl.innerHTML = heading.innerHTML;
          heading.replaceWith(repl);
        }
      }
    });
    const content = $('#inspContent');
    if (content) content.addEventListener('input', function () {
      const b = $('.editor-canvas .canvas-block.is-selected');
      if (!b) return;
      const target = b.querySelector('h1,h2,h3,h4') || b;
      target.textContent = content.value;
    });
    $$('.swatch').forEach(function (s) {
      s.addEventListener('click', function () {
        const b = $('.editor-canvas .canvas-block.is-selected');
        if (!b) return;
        b.style.color = s.dataset.color || '';
      });
    });
    const grad = $('#inspGradient');
    if (grad) grad.addEventListener('change', function () {
      const b = $('.editor-canvas .canvas-block.is-selected');
      if (!b) return;
      const map = {
        'green-cyan': 'linear-gradient(135deg,#34f5a8,#22c2ff)',
        'gold-orange': 'linear-gradient(135deg,#FDB813,#FF6A3D)',
        'cyan-purple': 'linear-gradient(135deg,#22c2ff,#9D4EDD)',
        'none': ''
      };
      const v = grad.value, bg = map[v];
      b.style.backgroundImage = bg || '';
      b.style.backgroundClip = bg ? 'text' : '';
      b.style.color = bg ? 'transparent' : '';
    });
  }

  // Sidebar filter / Export / Refresh / Open CMS Editor buttons (Admin)
  function wireAdminActions() {
    const ref = $('[data-action="refresh"]');
    if (ref) ref.addEventListener('click', function () { ref.classList.add('spin-once'); setTimeout(function(){ ref.classList.remove('spin-once'); }, 700); });
    const open = $('[data-action="open-cms"]');
    if (open) open.addEventListener('click', function () { location.href = 'cms-editor.html'; });
    const filter = $('[data-action="filter"]');
    if (filter) filter.addEventListener('click', function () { filter.classList.toggle('active'); });
    const xp = $('[data-action="export"]');
    if (xp) xp.addEventListener('click', function () {
      const csv = 'team,score\nTeam NovaPay,84\nTeam GreenGrid,76\n';
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'my_scores.csv'; a.click();
    });
  }

  // Autosave visible timestamp on student submission
  function wireSubmissionTimestamp() {
    const el = $$('.save-status').pop();
    function tick() {
      if (el) {
        const d = new Date();
        el.innerHTML = '<i class="fas fa-check-circle"></i> Auto-saved · ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
      }
    }
    setInterval(tick, 60000);
    tick();
  }

  function init() {
    wireSideLinks();
    wireTabs();
    wireCanvas();
    wireAutosave();
    wireInspector();
    wireAdminActions();
    wireSubmissionTimestamp();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
