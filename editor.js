/**
 * AUC Visual CMS Builder Engine (WordPress & Elementor-style)
 * African Undergraduate Challenge 2026
 */
(function () {
  'use strict';

  // State Management
  const state = {
    currentSlug: 'about',
    pageData: null,
    selectedBlockId: null,
    selectedBlockEl: null,
    deviceMode: 'desktop', // desktop | tablet | mobile
    isPreviewMode: false,
    history: [],
    historyIndex: -1,
    isDirty: false
  };

  // Helper DOM Queries
  function $(sel, parent = document) { return parent.querySelector(sel); }
  function $$(sel, parent = document) { return Array.from(parent.querySelectorAll(sel)); }

  // 1. WIDGET TEMPLATES LIBRARY
  const WIDGET_TEMPLATES = {
    heading: (opts = {}) => `
      <div class="canvas-block" data-type="heading" data-id="blk-${Date.now()}">
        <span class="canvas-block-badge"><i class="fas fa-heading"></i> Heading</span>
        <div class="canvas-block-toolbar">
          <button class="cb-btn edit" title="Edit in Inspector"><i class="fas fa-cog"></i></button>
          <button class="cb-btn up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button class="cb-btn down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button class="cb-btn clone" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="cb-btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
        <h2 contenteditable="true" spellcheck="false" style="color: #fff; margin: 0.5rem 0;">${opts.content || 'New Heading Title'}</h2>
      </div>
    `,
    paragraph: (opts = {}) => `
      <div class="canvas-block" data-type="paragraph" data-id="blk-${Date.now()}">
        <span class="canvas-block-badge"><i class="fas fa-paragraph"></i> Text Editor</span>
        <div class="canvas-block-toolbar">
          <button class="cb-btn edit" title="Edit in Inspector"><i class="fas fa-cog"></i></button>
          <button class="cb-btn up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button class="cb-btn down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button class="cb-btn clone" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="cb-btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
        <p contenteditable="true" spellcheck="false" style="color: var(--text-soft); line-height: 1.75; font-size: 1.05rem;">
          ${opts.content || 'Type your compelling paragraph content here. You can format text, adjust colors, and style in the inspector panel.'}
        </p>
      </div>
    `,
    button: (opts = {}) => `
      <div class="canvas-block" data-type="button" data-id="blk-${Date.now()}" style="text-align: ${opts.align || 'left'};">
        <span class="canvas-block-badge"><i class="fas fa-hand-pointer"></i> Button CTA</span>
        <div class="canvas-block-toolbar">
          <button class="cb-btn edit" title="Edit in Inspector"><i class="fas fa-cog"></i></button>
          <button class="cb-btn up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button class="cb-btn down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button class="cb-btn clone" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="cb-btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
        <a href="${opts.url || '#'}" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;">
          <i class="fas ${opts.icon || 'fa-rocket'}"></i> <span contenteditable="true">${opts.text || 'Explore Opportunities'}</span>
        </a>
      </div>
    `,
    image: (opts = {}) => `
      <div class="canvas-block" data-type="image" data-id="blk-${Date.now()}">
        <span class="canvas-block-badge"><i class="fas fa-image"></i> Image</span>
        <div class="canvas-block-toolbar">
          <button class="cb-btn edit" title="Edit in Inspector"><i class="fas fa-cog"></i></button>
          <button class="cb-btn up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button class="cb-btn down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button class="cb-btn clone" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="cb-btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
        <div style="background: rgba(0, 229, 255, 0.04); border: 1px dashed rgba(0, 229, 255, 0.3); border-radius: 12px; padding: 2.5rem; text-align: center;">
          <img src="${opts.src || 'assets/img/Logo.png'}" alt="Media" style="max-height: 180px; max-width: 100%; border-radius: 8px; margin-bottom: 0.75rem;" onerror="this.style.display='none'">
          <h4 style="margin: 0; color: #fff;">Featured Continental Visual</h4>
          <small style="color: var(--text-mute);">Click to update image URL or choose from Media Library</small>
        </div>
      </div>
    `,
    quote: (opts = {}) => `
      <div class="canvas-block" data-type="quote" data-id="blk-${Date.now()}">
        <span class="canvas-block-badge"><i class="fas fa-quote-right"></i> Testimonial / Quote</span>
        <div class="canvas-block-toolbar">
          <button class="cb-btn edit" title="Edit in Inspector"><i class="fas fa-cog"></i></button>
          <button class="cb-btn up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button class="cb-btn down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button class="cb-btn clone" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="cb-btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
        <blockquote style="border-left: 4px solid var(--neon-green); padding: 1.25rem 1.5rem; background: rgba(0, 255, 135, 0.04); border-radius: 0 10px 10px 0; margin: 1rem 0;">
          <p contenteditable="true" style="font-style: italic; font-size: 1.15rem; color: #fff; line-height: 1.6; margin: 0 0 0.5rem 0;">
            "${opts.content || 'Aspiration 6 commits us to a continent whose youth are drivers — not passengers — of change.'}"
          </p>
          <footer contenteditable="true" style="font-size: 0.85rem; color: var(--neon-green); font-weight: 600;">
            — ${opts.author || 'H.E. Moussa Faki Mahamat, Chairperson, African Union Commission'}
          </footer>
        </blockquote>
      </div>
    `,
    kpi: (opts = {}) => `
      <div class="canvas-block" data-type="kpi" data-id="blk-${Date.now()}">
        <span class="canvas-block-badge"><i class="fas fa-chart-line"></i> Agenda 2063 KPI Metrics</span>
        <div class="canvas-block-toolbar">
          <button class="cb-btn edit" title="Edit in Inspector"><i class="fas fa-cog"></i></button>
          <button class="cb-btn up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button class="cb-btn down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button class="cb-btn clone" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="cb-btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin: 1rem 0;">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem; text-align: center;">
            <div style="font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #00ff87, #00e5ff); -webkit-background-clip: text; color: transparent;">54</div>
            <small style="color: var(--text-mute); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Member States</small>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem; text-align: center;">
            <div style="font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #ffb800, #ff8c00); -webkit-background-clip: text; color: transparent;">$150K+</div>
            <small style="color: var(--text-mute); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Prize Pool</small>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem; text-align: center;">
            <div style="font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #00e5ff, #9d4edd); -webkit-background-clip: text; color: transparent;">10,000+</div>
            <small style="color: var(--text-mute); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Innovators</small>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem; text-align: center;">
            <div style="font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #ff2a85, #ffb800); -webkit-background-clip: text; color: transparent;">100%</div>
            <small style="color: var(--text-mute); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Student IP</small>
          </div>
        </div>
      </div>
    `,
    tracks: () => `
      <div class="canvas-block" data-type="tracks" data-id="blk-${Date.now()}">
        <span class="canvas-block-badge"><i class="fas fa-layer-group"></i> 6 Agenda 2063 Innovation Tracks</span>
        <div class="canvas-block-toolbar">
          <button class="cb-btn edit" title="Edit in Inspector"><i class="fas fa-cog"></i></button>
          <button class="cb-btn up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button class="cb-btn down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button class="cb-btn clone" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="cb-btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin: 1rem 0;">
          <div style="padding: 1.2rem; background: rgba(0, 255, 135, 0.05); border: 1px solid rgba(0, 255, 135, 0.2); border-radius: 10px;">
            <i class="fas fa-leaf" style="color: var(--neon-green); font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
            <h4 style="margin: 0 0 0.4rem 0;">Aspiration 1 · CleanTech</h4>
            <p style="font-size: 0.85rem; color: var(--text-mute); margin: 0;">Renewable mini-grids, smart irrigation, and circular agriculture.</p>
          </div>
          <div style="padding: 1.2rem; background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 10px;">
            <i class="fas fa-heart-pulse" style="color: var(--neon-cyan); font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
            <h4 style="margin: 0 0 0.4rem 0;">Aspiration 2 · HealthTech</h4>
            <p style="font-size: 0.85rem; color: var(--text-mute); margin: 0;">Last-mile diagnostics, telemedicine drones, and maternal care AI.</p>
          </div>
          <div style="padding: 1.2rem; background: rgba(255, 184, 0, 0.05); border: 1px solid rgba(255, 184, 0, 0.2); border-radius: 10px;">
            <i class="fas fa-coins" style="color: var(--neon-gold); font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
            <h4 style="margin: 0 0 0.4rem 0;">Aspiration 3 · AfCFTA FinTech</h4>
            <p style="font-size: 0.85rem; color: var(--text-mute); margin: 0;">Cross-border settlements, MSME credit scoring, and trade logistics.</p>
          </div>
        </div>
      </div>
    `,
    divider: () => `
      <div class="canvas-block" data-type="divider" data-id="blk-${Date.now()}">
        <span class="canvas-block-badge"><i class="fas fa-minus"></i> Divider</span>
        <div class="canvas-block-toolbar">
          <button class="cb-btn edit" title="Edit in Inspector"><i class="fas fa-cog"></i></button>
          <button class="cb-btn up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button class="cb-btn down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button class="cb-btn clone" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="cb-btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
        <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 2rem 0;">
      </div>
    `,
    accordion: () => `
      <div class="canvas-block" data-type="accordion" data-id="blk-${Date.now()}">
        <span class="canvas-block-badge"><i class="fas fa-question-circle"></i> FAQ / Accordion</span>
        <div class="canvas-block-toolbar">
          <button class="cb-btn edit" title="Edit in Inspector"><i class="fas fa-cog"></i></button>
          <button class="cb-btn up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button class="cb-btn down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button class="cb-btn clone" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="cb-btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; margin: 0.5rem 0; overflow: hidden;">
          <div style="padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: #fff; cursor: pointer;">
            <span contenteditable="true">Who is eligible to participate in AUC 2026?</span>
            <i class="fas fa-chevron-down" style="color: var(--neon-cyan);"></i>
          </div>
          <div style="padding: 0 1.25rem 1rem; color: var(--text-soft); font-size: 0.9rem;" contenteditable="true">
            Any registered undergraduate student currently enrolled in any accredited university or polytechnic across the 54 African Union member states.
          </div>
        </div>
      </div>
    `
  };

  // 2. INITIALIZE BUILDER
  async function init() {
    setupTopBar();
    setupDockTabs();
    setupWidgetsPalette();
    setupCanvasInteractions();
    setupInspectorEvents();
    setupStructurePicker();

    // Check URL param for page to edit
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    if (pageParam) state.currentSlug = pageParam.toLowerCase();

    // Load available pages in dropdown and fetch active page
    await loadPagesDropdown();
    await loadPage(state.currentSlug);
  }

  // 3. TOP BAR & CONTROLS
  function setupTopBar() {
    // Page switcher dropdown
    const pageSelect = $('#abPageSelector');
    if (pageSelect) {
      pageSelect.addEventListener('change', async (e) => {
        const nextSlug = e.target.value;
        if (state.isDirty && !confirm('You have unsaved changes. Switch page anyway?')) {
          e.target.value = state.currentSlug;
          return;
        }
        state.currentSlug = nextSlug;
        history.replaceState(null, '', `?page=${nextSlug}`);
        await loadPage(nextSlug);
      });
    }

    // Viewport device buttons
    $$('.device-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.device-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.device;
        setDeviceMode(mode);
      });
    });

    // Preview Mode toggle (Eye button)
    const prevBtn = $('#abPreview');
    if (prevBtn) {
      prevBtn.addEventListener('click', togglePreviewMode);
    }

    // Revisions Modal button
    const revBtn = $('#abRevisions');
    if (revBtn) {
      revBtn.addEventListener('click', openRevisionsModal);
    }

    // Undo / Redo
    const undoBtn = $('#abUndo');
    const redoBtn = $('#abRedo');
    if (undoBtn) undoBtn.addEventListener('click', triggerUndo);
    if (redoBtn) redoBtn.addEventListener('click', triggerRedo);

    // Publish / Save Button
    const pubBtn = $('#abPublish');
    if (pubBtn) {
      pubBtn.addEventListener('click', saveAndPublishPage);
    }
  }

  function setDeviceMode(mode) {
    state.deviceMode = mode;
    const container = $('#canvasDeviceContainer');
    if (!container) return;
    container.classList.remove('mode-tablet', 'mode-mobile');
    if (mode === 'tablet') container.classList.add('mode-tablet');
    if (mode === 'mobile') container.classList.add('mode-mobile');
  }

  function togglePreviewMode() {
    state.isPreviewMode = !state.isPreviewMode;
    document.body.classList.toggle('preview-mode', state.isPreviewMode);
    const prevBtn = $('#abPreview');
    if (prevBtn) {
      prevBtn.innerHTML = state.isPreviewMode
        ? '<i class="fas fa-edit"></i> Edit'
        : '<i class="fas fa-eye"></i> Preview';
    }
  }

  // 4. LOAD PAGES FROM BACKEND
  async function loadPagesDropdown() {
    const pageSelect = $('#abPageSelector');
    if (!pageSelect) return;

    try {
      const res = await fetch('/api/cms/pages');
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        pageSelect.innerHTML = json.data.map(p => `
          <option value="${p.slug}" ${p.slug === state.currentSlug ? 'selected' : ''}>
            ${p.title} (${p.slug}.html)
          </option>
        `).join('');
      }
    } catch (e) {
      console.warn('Could not load pages list from API', e);
    }
  }

  async function loadPage(slug) {
    const statusEl = $('#abStatus');
    if (statusEl) statusEl.innerHTML = '<i class="fas fa-sync fa-spin"></i> Loading page…';

    try {
      const res = await fetch(`/api/cms/pages/${slug}`);
      const json = await res.json();
      if (json.ok && json.data) {
        state.pageData = json.data;
        renderCanvasFromData(json.data);
        populateDocumentSettings(json.data);
        rebuildNavigatorTree();
        pushHistorySnapshot();
        updateAutosaveTimestamp();
      }
    } catch (err) {
      console.error('Failed to fetch page data', err);
      // Fallback: render default blocks
      renderCanvasDefault(slug);
    }
  }

  function renderCanvasFromData(data) {
    const canvas = $('#canvasInner');
    if (!canvas) return;

    // If blocks array exists, construct elements
    if (Array.isArray(data.blocks) && data.blocks.length > 0) {
      canvas.innerHTML = data.blocks.map(blk => {
        if (blk.type === 'heading') return WIDGET_TEMPLATES.heading({ content: blk.content, tag: blk.tag });
        if (blk.type === 'paragraph') return WIDGET_TEMPLATES.paragraph({ content: blk.content });
        if (blk.type === 'button') return WIDGET_TEMPLATES.button({ text: blk.text, url: blk.url, icon: blk.icon });
        if (blk.type === 'quote') return WIDGET_TEMPLATES.quote({ content: blk.content, author: blk.author });
        if (blk.type === 'kpi-grid') return WIDGET_TEMPLATES.kpi(blk);
        if (blk.type === 'tracks-grid') return WIDGET_TEMPLATES.tracks();
        return WIDGET_TEMPLATES.paragraph({ content: blk.content || '' });
      }).join('');
    } else {
      renderCanvasDefault(data.slug);
    }

    attachBlockListeners();
  }

  function renderCanvasDefault(slug) {
    const canvas = $('#canvasInner');
    if (!canvas) return;
    canvas.innerHTML = `
      ${WIDGET_TEMPLATES.heading({ content: `${slug.toUpperCase()} — African Undergraduate Challenge` })}
      ${WIDGET_TEMPLATES.paragraph({ content: 'Welcome to this page. You can click on any text directly to edit, drag widgets from the left Elementor palette, and tweak styles on the right inspector panel.' })}
      ${WIDGET_TEMPLATES.kpi()}
      ${WIDGET_TEMPLATES.button({ text: 'Explore Continental Tracks', icon: 'fa-arrow-right' })}
    `;
    attachBlockListeners();
  }

  // 5. LEFT DOCK TABS & WIDGET PALETTE
  function setupDockTabs() {
    $$('.dock-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.dock-tab').forEach(t => t.classList.remove('active'));
        $$('.dock-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.pane;
        const pane = $(`#pane-${target}`);
        if (pane) pane.classList.add('active');
      });
    });

    // Search filter for widgets
    const searchInput = $('#widgetSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        $$('.el-widget-item').forEach(w => {
          const text = (w.innerText || '').toLowerCase();
          w.style.display = text.includes(query) ? 'flex' : 'none';
        });
      });
    }
  }

  function setupWidgetsPalette() {
    $$('.el-widget-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.widget;
        insertWidgetOnCanvas(type);
      });

      // Drag and drop support
      item.setAttribute('draggable', 'true');
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.dataset.widget);
      });
    });
  }

  function insertWidgetOnCanvas(type) {
    const canvas = $('#canvasInner');
    if (!canvas) return;

    let html = '';
    if (WIDGET_TEMPLATES[type]) {
      html = WIDGET_TEMPLATES[type]();
    } else {
      html = WIDGET_TEMPLATES.paragraph({ content: `New ${type} block component.` });
    }

    // Insert before the Add Section chooser
    const addSection = $('.el-add-section-area');
    if (addSection) {
      addSection.insertAdjacentHTML('beforebegin', html);
    } else {
      canvas.insertAdjacentHTML('beforeend', html);
    }

    attachBlockListeners();
    rebuildNavigatorTree();
    pushHistorySnapshot();
    triggerAutosave();

    // Select newly added block
    const allBlocks = $$('.canvas-block', canvas);
    const newBlock = allBlocks[allBlocks.length - 1];
    if (newBlock) {
      selectBlock(newBlock);
      newBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // 6. CANVAS INTERACTIONS & BLOCK EVENTS
  function attachBlockListeners() {
    $$('.canvas-block').forEach(block => {
      block.addEventListener('click', (e) => {
        e.stopPropagation();
        selectBlock(block);
      });

      // Block Action Buttons
      const editBtn = block.querySelector('.cb-btn.edit');
      if (editBtn) editBtn.onclick = (e) => { e.stopPropagation(); selectBlock(block); switchToInspector(); };

      const cloneBtn = block.querySelector('.cb-btn.clone');
      if (cloneBtn) cloneBtn.onclick = (e) => { e.stopPropagation(); cloneBlock(block); };

      const upBtn = block.querySelector('.cb-btn.up');
      if (upBtn) upBtn.onclick = (e) => { e.stopPropagation(); moveBlock(block, -1); };

      const downBtn = block.querySelector('.cb-btn.down');
      if (downBtn) downBtn.onclick = (e) => { e.stopPropagation(); moveBlock(block, 1); };

      const delBtn = block.querySelector('.cb-btn.del');
      if (delBtn) delBtn.onclick = (e) => { e.stopPropagation(); deleteBlock(block); };

      // Contenteditable real-time change event
      const editable = block.querySelector('[contenteditable]');
      if (editable) {
        editable.addEventListener('input', () => {
          state.isDirty = true;
          triggerAutosave();
          syncInspectorFromBlock(block);
        });
      }
    });

    // Deselect when clicking canvas background
    const canvasWrap = $('#canvasWrap');
    if (canvasWrap) {
      canvasWrap.addEventListener('click', (e) => {
        if (!e.target.closest('.canvas-block') && !e.target.closest('.editor-side')) {
          deselectAllBlocks();
        }
      });

      // Canvas drop listener
      canvasWrap.addEventListener('dragover', (e) => e.preventDefault());
      canvasWrap.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain');
        if (type) insertWidgetOnCanvas(type);
      });
    }
  }

  function selectBlock(block) {
    deselectAllBlocks();
    block.classList.add('is-selected');
    state.selectedBlockEl = block;
    state.selectedBlockId = block.dataset.id;
    populateInspector(block);
    highlightNavigatorItem(block.dataset.id);
  }

  function deselectAllBlocks() {
    $$('.canvas-block').forEach(b => b.classList.remove('is-selected'));
    state.selectedBlockEl = null;
    state.selectedBlockId = null;
  }

  function cloneBlock(block) {
    const clone = block.cloneNode(true);
    clone.dataset.id = 'blk-' + Date.now();
    block.parentNode.insertBefore(clone, block.nextSibling);
    attachBlockListeners();
    selectBlock(clone);
    rebuildNavigatorTree();
    pushHistorySnapshot();
    triggerAutosave();
  }

  function moveBlock(block, dir) {
    if (dir === -1 && block.previousElementSibling && block.previousElementSibling.classList.contains('canvas-block')) {
      block.parentNode.insertBefore(block, block.previousElementSibling);
    } else if (dir === 1 && block.nextElementSibling && block.nextElementSibling.classList.contains('canvas-block')) {
      block.parentNode.insertBefore(block.nextElementSibling, block);
    }
    rebuildNavigatorTree();
    pushHistorySnapshot();
    triggerAutosave();
  }

  function deleteBlock(block) {
    block.style.transition = 'all 0.25s ease';
    block.style.opacity = '0';
    block.style.transform = 'translateX(-20px)';
    setTimeout(() => {
      block.remove();
      deselectAllBlocks();
      rebuildNavigatorTree();
      pushHistorySnapshot();
      triggerAutosave();
    }, 250);
  }

  // 7. STRUCTURE PICKER (ELEMENTOR + BUTTON)
  function setupStructurePicker() {
    const addBtn = $('#elAddSectionBtn');
    const picker = $('#structurePicker');
    if (addBtn && picker) {
      addBtn.addEventListener('click', () => {
        picker.classList.toggle('active');
      });

      $$('.structure-box').forEach(box => {
        box.addEventListener('click', () => {
          const layout = box.dataset.layout;
          createColumnSection(layout);
          picker.classList.remove('active');
        });
      });
    }
  }

  function createColumnSection(layout) {
    let colHtml = '';
    if (layout === '1') {
      colHtml = `<div style="width: 100%;">${WIDGET_TEMPLATES.paragraph({ content: '100% full width section.' })}</div>`;
    } else if (layout === '2') {
      colHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>${WIDGET_TEMPLATES.heading({ content: 'Column 1' })}</div>
          <div>${WIDGET_TEMPLATES.paragraph({ content: 'Column 2 content.' })}</div>
        </div>
      `;
    } else if (layout === '3') {
      colHtml = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          <div>${WIDGET_TEMPLATES.paragraph({ content: 'Col 1' })}</div>
          <div>${WIDGET_TEMPLATES.paragraph({ content: 'Col 2' })}</div>
          <div>${WIDGET_TEMPLATES.paragraph({ content: 'Col 3' })}</div>
        </div>
      `;
    }

    const html = `
      <section class="el-section" data-section-id="sec-${Date.now()}">
        <div class="el-section-handle"><i class="fas fa-grip-lines"></i> Edit Section</div>
        ${colHtml}
      </section>
    `;

    const addSection = $('.el-add-section-area');
    if (addSection) addSection.insertAdjacentHTML('beforebegin', html);
    attachBlockListeners();
    rebuildNavigatorTree();
    pushHistorySnapshot();
    triggerAutosave();
  }

  // 8. RIGHT CONTEXTUAL INSPECTOR PANEL
  function setupInspectorEvents() {
    // Inspector Tabs (Content | Style | Advanced)
    $$('.insp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.insp-tab').forEach(t => t.classList.remove('active'));
        $$('.insp-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.pane;
        const pane = $(`#insp-pane-${target}`);
        if (pane) pane.classList.add('active');
      });
    });

    // Content inputs
    const contentText = $('#inspText');
    if (contentText) {
      contentText.addEventListener('input', (e) => {
        if (!state.selectedBlockEl) return;
        const target = state.selectedBlockEl.querySelector('h1, h2, h3, h4, p, span');
        if (target) target.innerText = e.target.value;
        triggerAutosave();
      });
    }

    // HTML Tag switcher (H1, H2, H3, P)
    const tagSelect = $('#inspTag');
    if (tagSelect) {
      tagSelect.addEventListener('change', (e) => {
        if (!state.selectedBlockEl) return;
        const newTag = e.target.value;
        const oldHeading = state.selectedBlockEl.querySelector('h1, h2, h3, h4, p');
        if (oldHeading) {
          const replacement = document.createElement(newTag);
          replacement.innerHTML = oldHeading.innerHTML;
          replacement.setAttribute('contenteditable', 'true');
          replacement.style.color = oldHeading.style.color;
          oldHeading.parentNode.replaceChild(replacement, oldHeading);
          attachBlockListeners();
          triggerAutosave();
        }
      });
    }

    // Text Alignment buttons
    $$('.insp-align-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.insp-align-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (!state.selectedBlockEl) return;
        state.selectedBlockEl.style.textAlign = btn.dataset.align;
        triggerAutosave();
      });
    });

    // Text Color Preset swatches
    $$('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        $$('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const color = dot.dataset.color;
        if ($('#inspTextColorPicker')) $('#inspTextColorPicker').value = color;
        applyTextColor(color);
      });
    });

    const colorPicker = $('#inspTextColorPicker');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => applyTextColor(e.target.value));
    }

    // Font size slider
    const fontSizeSlider = $('#inspFontSize');
    if (fontSizeSlider) {
      fontSizeSlider.addEventListener('input', (e) => {
        const val = e.target.value + 'px';
        const label = $('#inspFontSizeVal');
        if (label) label.textContent = val;
        if (!state.selectedBlockEl) return;
        const textEl = state.selectedBlockEl.querySelector('h1, h2, h3, p');
        if (textEl) textEl.style.fontSize = val;
        triggerAutosave();
      });
    }

    // Image Upload & URL input in Inspector
    const uploadBtn = $('#btnUploadInspImage');
    const fileInput = $('#inspImageFileInput');
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            let url = ev.target.result;
            if (window.AUC_API && window.AUC_API.cms && window.AUC_API.cms.uploadFile) {
              const res = await window.AUC_API.cms.uploadFile({
                name: file.name,
                type: 'image',
                data: ev.target.result,
                author: 'CMS Editor'
              });
              if (res && res.url) url = res.url;
            }
            if ($('#inspImageUrl')) $('#inspImageUrl').value = url;
            if ($('#inspPreviewImg')) {
              $('#inspPreviewImg').src = url;
              $('#inspImagePreview').style.display = 'block';
            }
            if (state.selectedBlockEl) {
              const img = state.selectedBlockEl.querySelector('img');
              if (img) {
                img.src = url;
              } else {
                const holder = state.selectedBlockEl.querySelector('div');
                if (holder) {
                  holder.innerHTML = `<img src="${url}" alt="${file.name}" style="max-width:100%;height:auto;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">`;
                }
              }
              triggerAutosave();
            }
          } catch (err) {
            console.error('Image upload failed', err);
          } finally {
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i>';
          }
        };
        reader.readAsDataURL(file);
      });
    }

    const imageUrlInput = $('#inspImageUrl');
    if (imageUrlInput) {
      imageUrlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if ($('#inspPreviewImg')) {
          $('#inspPreviewImg').src = url;
          $('#inspImagePreview').style.display = url ? 'block' : 'none';
        }
        if (state.selectedBlockEl) {
          const img = state.selectedBlockEl.querySelector('img');
          if (img) {
            img.src = url;
          } else {
            const holder = state.selectedBlockEl.querySelector('div');
            if (holder) {
              holder.innerHTML = `<img src="${url}" alt="image" style="max-width:100%;height:auto;border-radius:10px;">`;
            }
          }
          triggerAutosave();
        }
      });
    }
  }

  function applyTextColor(color) {
    if (!state.selectedBlockEl) return;
    const textEl = state.selectedBlockEl.querySelector('h1, h2, h3, p, [contenteditable]');
    if (textEl) textEl.style.color = color;
    triggerAutosave();
  }

  function populateInspector(block) {
    const type = block.dataset.type || 'paragraph';
    const titleEl = $('#inspSelectedTitle');
    if (titleEl) titleEl.textContent = type.toUpperCase() + ' Settings';

    // Content text
    const textTarget = block.querySelector('h1, h2, h3, h4, p, span');
    const contentText = $('#inspText');
    if (contentText && textTarget) {
      contentText.value = textTarget.innerText;
    }

    // Image widget inspector group
    const isImage = type === 'image' || !!block.querySelector('img');
    const imageGroup = $('#inspImageGroup');
    if (imageGroup) {
      imageGroup.style.display = isImage ? 'block' : 'none';
      if (isImage) {
        const img = block.querySelector('img');
        const src = img ? img.getAttribute('src') : '';
        if ($('#inspImageUrl')) $('#inspImageUrl').value = src || '';
        if ($('#inspPreviewImg') && src) {
          $('#inspPreviewImg').src = src;
          $('#inspImagePreview').style.display = 'block';
        } else if ($('#inspImagePreview')) {
          $('#inspImagePreview').style.display = 'none';
        }
      }
    }

    // Alignment
    const align = block.style.textAlign || 'left';
    $$('.insp-align-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.align === align);
    });
  }

  function syncInspectorFromBlock(block) {
    const textTarget = block.querySelector('h1, h2, h3, h4, p, span');
    const contentText = $('#inspText');
    if (contentText && textTarget) {
      contentText.value = textTarget.innerText;
    }
    const isImage = block.dataset.type === 'image' || !!block.querySelector('img');
    const imageGroup = $('#inspImageGroup');
    if (imageGroup) {
      imageGroup.style.display = isImage ? 'block' : 'none';
      if (isImage) {
        const img = block.querySelector('img');
        const src = img ? img.getAttribute('src') : '';
        if ($('#inspImageUrl')) $('#inspImageUrl').value = src || '';
      }
    }
  }

  function switchToInspector() {
    const rightSide = $('.editor-side.right');
    if (rightSide) rightSide.style.display = 'block';
  }

  // 9. NAVIGATOR TREE VIEW (LAYERS)
  function rebuildNavigatorTree() {
    const navList = $('#navigatorList');
    if (!navList) return;

    const blocks = $$('.canvas-block', $('#canvasInner'));
    if (!blocks.length) {
      navList.innerHTML = '<p style="color:var(--text-mute);font-size:.78rem;padding:.5rem;">No blocks on canvas yet.</p>';
      return;
    }

    navList.innerHTML = blocks.map((b, idx) => {
      const type = b.dataset.type || 'block';
      const label = b.querySelector('h1, h2, h3, p, span')?.innerText.slice(0, 24) || type;
      return `
        <div class="nav-tree-item ${b.classList.contains('is-selected') ? 'active' : ''}" data-target-id="${b.dataset.id}">
          <div><i class="fas fa-cube"></i> <span>${idx + 1}. ${type}: ${label}…</span></div>
          <small style="color:var(--text-mute);">${type}</small>
        </div>
      `;
    }).join('');

    $$('.nav-tree-item', navList).forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.targetId;
        const targetBlock = $(`[data-id="${id}"]`);
        if (targetBlock) {
          selectBlock(targetBlock);
          targetBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  }

  function highlightNavigatorItem(id) {
    $$('.nav-tree-item').forEach(item => {
      item.classList.toggle('active', item.dataset.targetId === id);
    });
  }

  // 10. DOCUMENT SETTINGS (PAGE TAB)
  function populateDocumentSettings(data) {
    if ($('#docTitleInput')) $('#docTitleInput').value = data.title || '';
    if ($('#docSlugInput')) $('#docSlugInput').value = data.slug || state.currentSlug;
    if ($('#docStatusSelect')) $('#docStatusSelect').value = data.status || 'published';
    if ($('#docExcerptInput')) $('#docExcerptInput').value = data.metaDesc || '';
  }

  // 11. AUTOSAVE, UNDO/REDO & REVISIONS
  function pushHistorySnapshot() {
    const canvas = $('#canvasInner');
    if (!canvas) return;
    const snapshot = canvas.innerHTML;
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);
    state.historyIndex++;
  }

  function triggerUndo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      const canvas = $('#canvasInner');
      canvas.innerHTML = state.history[state.historyIndex];
      attachBlockListeners();
      rebuildNavigatorTree();
    }
  }

  function triggerRedo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      const canvas = $('#canvasInner');
      canvas.innerHTML = state.history[state.historyIndex];
      attachBlockListeners();
      rebuildNavigatorTree();
    }
  }

  let autosaveTimer = null;
  function triggerAutosave() {
    state.isDirty = true;
    const statusEl = $('#abStatus');
    if (statusEl) statusEl.innerHTML = '<i class="fas fa-sync fa-spin"></i> Saving…';
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(async () => {
      await savePageSilent();
      updateAutosaveTimestamp();
    }, 1200);
  }

  function updateAutosaveTimestamp() {
    const statusEl = $('#abStatus');
    if (!statusEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    statusEl.innerHTML = `<span class="pulse-dot"></span> Autosaved · ${timeStr}`;
    state.isDirty = false;
  }

  // 12. SAVE & PUBLISH ENGINE (API)
  async function savePageSilent() {
    const payload = collectCanvasPayload();
    try {
      await fetch(`/api/cms/pages/${state.currentSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Autosave network issue', e);
    }
  }

  async function saveAndPublishPage() {
    const pubBtn = $('#abPublish');
    const originalText = pubBtn ? pubBtn.innerHTML : '';
    if (pubBtn) pubBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing…';

    const payload = collectCanvasPayload();
    payload.status = 'published';

    try {
      const res = await fetch(`/api/cms/pages/${state.currentSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`🎉 Page "${payload.title}" successfully published live!`);
        updateAutosaveTimestamp();
      }
    } catch (e) {
      showToast('❌ Error publishing to backend server', '#ff2a85');
    } finally {
      if (pubBtn) pubBtn.innerHTML = originalText;
    }
  }

  function collectCanvasPayload() {
    const blocks = [];
    $$('.canvas-block', $('#canvasInner')).forEach((el, idx) => {
      const type = el.dataset.type || 'paragraph';
      const text = el.querySelector('h1, h2, h3, h4, p, span')?.innerText || '';
      blocks.push({
        id: el.dataset.id || `blk-${idx}`,
        type,
        content: text,
        style: {
          textAlign: el.style.textAlign || 'left',
          color: el.style.color || ''
        }
      });
    });

    return {
      slug: state.currentSlug,
      title: $('#docTitleInput')?.value || state.currentSlug,
      status: $('#docStatusSelect')?.value || 'published',
      metaDesc: $('#docExcerptInput')?.value || '',
      blocks,
      revisionSummary: `Updated from Elementor Builder (${blocks.length} blocks)`
    };
  }

  // 13. REVISIONS MODAL
  async function openRevisionsModal() {
    try {
      const res = await fetch(`/api/cms/pages/${state.currentSlug}`);
      const json = await res.json();
      const revisions = json.ok && json.data ? (json.data.revisions || []) : [];

      let modal = $('#revisionsModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'revisionsModal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
          <div class="modal-card" style="max-width: 580px;">
            <div class="modal-head">
              <h3><i class="fas fa-history" style="color:var(--el-accent);"></i> Revision History (${state.currentSlug}.html)</h3>
              <button class="modal-close" onclick="document.getElementById('revisionsModal').hidden=true"><i class="fas fa-times"></i></button>
            </div>
            <div id="revisionsList" style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; margin: 1rem 0;"></div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      const list = $('#revisionsList', modal);
      if (!revisions.length) {
        list.innerHTML = '<p style="color:var(--text-mute);font-size:.88rem;">No previous revisions recorded yet. Revisions are created automatically upon each major publish.</p>';
      } else {
        list.innerHTML = revisions.map(r => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--wp-border); border-radius: 8px;">
            <div>
              <strong style="color: #fff; font-size: 0.9rem;">${r.summary || 'Content Update'}</strong>
              <div style="font-size: 0.78rem; color: var(--text-mute); margin-top: 0.2rem;">
                ${new Date(r.date).toLocaleString()} · Author: <span style="color: var(--el-accent);">${r.author || 'Admin'}</span>
              </div>
            </div>
            <button class="ab-btn ghost" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="restoreRevision('${r.id}')">
              <i class="fas fa-rotate-left"></i> Restore
            </button>
          </div>
        `).join('');
      }

      modal.hidden = false;
    } catch (e) {
      console.warn('Failed to load revisions', e);
    }
  }

  window.restoreRevision = async function (revId) {
    if (!confirm('Are you sure you want to restore this past version? Current edits will be replaced.')) return;
    try {
      const res = await fetch(`/api/cms/pages/${state.currentSlug}/revisions/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId: revId })
      });
      const data = await res.json();
      if (data.ok) {
        showToast('✅ Restored revision successfully!');
        const modal = $('#revisionsModal');
        if (modal) modal.hidden = true;
        await loadPage(state.currentSlug);
      }
    } catch (e) {
      showToast('❌ Failed to restore revision', '#ff2a85');
    }
  };

  // 14. TOAST NOTIFICATION
  function showToast(msg, color = 'var(--el-green)') {
    const toast = document.createElement('div');
    toast.className = 'cms-toast';
    toast.style.borderColor = color;
    toast.innerHTML = `<i class="fas fa-check-circle" style="color:${color};font-size:1.1rem;"></i> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Self Start on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
