// Judge Portal Interactive Evaluation & Rubric Engine — AUC 2026
(function () {
  'use strict';

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }

  // 1. EVALUATION TEAMS DATA
  const DEFAULT_TEAMS = [
    {
      id: 'nova-pay',
      name: 'NovaPay',
      lead: 'Amara Diallo',
      uni: 'Cheikh Anta Diop University',
      country: 'Senegal',
      region: '🇸🇳 West',
      stage: 'Stage 3',
      track: 'Aspiration 1 · FinTech & Trade',
      summary: 'L1 Settlement Layer for AfCFTA Micro-Trade utilizing zero-knowledge rollups and CBA-anchored stablecoins to slash cross-border transaction fees from 14% to 0.4%.',
      deadline: '2 days',
      status: 'in_review', // in_review, scored, recused
      deckUrl: '#',
      videoUrl: '#',
      scores: [86, 90, 78, 82, 88],
      comments: [
        "NovaPay's rollup-based settlement model is genuinely novel for the AfCFTA corridor. The choice of CBA-anchored stablecoins addresses real regulatory friction.",
        "Direct line to Aspiration 1 and Aspiration 2 cross-border integration. The 40,000 trader beneficiary estimate is well-sourced and grounded.",
        "Solid architecture; threat model still shallow for production. The CDK rollup choice is reasonable but compatibility with CBS-level bank integration untested.",
        "Realistic unit economics at 2¢ per transfer. SADC expansion plan is well-scoped.",
        "Strong multidisciplinary team. Their pitch delivery was crisp, technical, and grounded."
      ]
    },
    {
      id: 'fin-mesh',
      name: 'FinMesh',
      lead: 'Joseph Mwangi',
      uni: 'University of Nairobi',
      country: 'Kenya',
      region: '🇰🇪 East',
      stage: 'Stage 3',
      track: 'Aspiration 1 · FinTech & AgriFood',
      summary: 'P2P decentralized micro-lending cooperative engine connecting rural grain farmers to regional liquidity pools without formal collateral requirements.',
      deadline: '3 days',
      status: 'in_review',
      deckUrl: '#',
      videoUrl: '#',
      scores: [82, 85, 80, 76, 84],
      comments: [
        "Innovative cooperative staking mechanism leveraging traditional Chamas into modern liquidity primitives.",
        "High alignment with AU financial inclusion objectives and food security value chains.",
        "Smart contracts well-tested on testnet; oracle dependency for crop weather data requires redundancy.",
        "Healthy unit economics with 1.8% take rate; needs clearer loan default provisioning.",
        "Dynamic founding team with strong agricultural economics background."
      ]
    },
    {
      id: 'crypto-grain',
      name: 'CryptoGrain',
      lead: 'Grace Akello',
      uni: 'Makerere University',
      country: 'Uganda',
      region: '🇺🇬 East',
      stage: 'Stage 3',
      track: 'Aspiration 1 · FinTech & Agritech',
      summary: 'Commodity-backed inventory receipt tokenization platform allowing smallholder maize producers to collateralize harvests in bonded warehouses.',
      deadline: '5 days',
      status: 'in_review',
      deckUrl: '#',
      videoUrl: '#',
      scores: [79, 88, 74, 85, 80],
      comments: [
        "Strong real-world asset (RWA) implementation for African agricultural commodities.",
        "Exemplary Agenda 2063 Aspiration 1 impact by unlocking agricultural debt liquidity.",
        "Hardware IoT warehouse sensors integrate well with off-chain verification layers.",
        "Compelling margin structure; warehousing partnership agreements already signed.",
        "Clear technical lead with deep domain expertise in agricultural commodities."
      ]
    },
    {
      id: 'sub-wallet',
      name: 'SubWallet',
      lead: 'Thabo Ndlovu',
      uni: 'University of Cape Town',
      country: 'South Africa',
      region: '🇿🇦 South',
      stage: 'Stage 3',
      track: 'Aspiration 1 · FinTech & Remittances',
      summary: 'Low-latency SADC remittance aggregator with multi-currency offline USSD routing for migrant workers sending wages across borders.',
      deadline: '6 days',
      status: 'not_started',
      deckUrl: '#',
      videoUrl: '#',
      scores: [88, 92, 85, 80, 90],
      comments: [
        "USSD failover mechanism solves critical last-mile connectivity limitations in rural Southern Africa.",
        "Major impact on lowering remittance fees across the Zimbabwe-South Africa economic corridor.",
        "Robust cryptographic architecture with offline signature batching.",
        "Clear path to break-even within 8 months based on 45,000 monthly active remitters.",
        "Veteran student engineering team with multiple continental hackathon victories."
      ]
    }
  ];

  const WEIGHTS = [0.25, 0.25, 0.20, 0.15, 0.15];
  let activeTeamId = 'nova-pay';
  let allTeams = [];
  let currentFilter = 'all';

  // 2. TOAST SYSTEM
  window.showJudgeToast = function (msg, icon = 'fa-check-circle', color = 'var(--neon-green)') {
    let container = $('#toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.style.borderColor = color;
    toast.innerHTML = `<i class="fas ${icon}" style="color:${color};font-size:1.1rem;"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  };

  // 3. LOAD DATA & INITIALIZE QUEUE
  function loadTeams(savedScores) {
    savedScores = savedScores || {};
    try {
      const raw = localStorage.getItem('auc_judge_scores');
      if (raw) Object.assign(savedScores, JSON.parse(raw));
    } catch (e) {}

    // Pull registered teams from localStorage
    let registeredTeams = [];
    try {
      const regs = JSON.parse(localStorage.getItem('auc_registrations') || '[]');
      registeredTeams = regs.map((r, idx) => ({
        id: 'reg-' + (r.id || idx),
        name: r.venture || r.name || (r.lead + ' (Team)'),
        lead: r.lead,
        uni: r.uni || 'African University',
        country: r.country || 'Continental',
        region: r.country || 'Africa',
        stage: 'Stage 3',
        track: r.track || 'Aspiration 1 · FinTech',
        summary: r.summary || r.concept || 'Pan-African innovation submitted via continental portal.',
        deadline: '7 days',
        status: 'in_review',
        deckUrl: r.deckUrl || '#',
        videoUrl: r.demoUrl || r.videoUrl || '#',
        repoUrl: r.repoUrl || '#',
        members: r.members || [],
        scores: [80, 80, 80, 80, 80],
        comments: ['Solid entry.', 'Aligned with AU Agenda 2063.', 'Feasible design.', 'Scalable.', 'Capable team.']
      }));
    } catch (e) {}

    allTeams = [...DEFAULT_TEAMS, ...registeredTeams].map(t => {
      if (savedScores[t.id]) return { ...t, ...savedScores[t.id] };
      return t;
    });
  }

  // Async boot: pull live scores from API then re-render
  async function loadTeamsFromAPI() {
    let apiScores = {};
    if (window.AUC_API) {
      try { apiScores = await AUC_API.judging.getScores() || {}; } catch(e){}
    }
    loadTeams(apiScores);
    renderJudgeQueue();
    loadTeamForScoring(activeTeamId);
  }

  window.renderJudgeQueue = function () {
    const table = $('#judgeQueueTable');
    if (!table) return;

    const filtered = allTeams.filter(t => {
      if (currentFilter === 'pending') return t.status === 'in_review' || t.status === 'not_started';
      if (currentFilter === 'scored') return t.status === 'scored';
      if (currentFilter === 'recused') return t.status === 'recused';
      return true;
    });

    const header = `
      <div class="row head">
        <div>Team / Project</div>
        <div>Region</div>
        <div>Stage</div>
        <div>Deadline</div>
        <div>Status</div>
        <div>Action</div>
      </div>
    `;

    table.innerHTML = header + filtered.map(t => {
      const initials = t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const isActive = t.id === activeTeamId;
      const isScored = t.status === 'scored';
      const isRecused = t.status === 'recused';

      let statusBadge = '<span class="task-tag warn">In review</span>';
      if (isScored) {
        const weighted = calculateWeightedScore(t.scores);
        statusBadge = `<span class="task-tag done" style="color:var(--neon-green);border-color:var(--neon-green);"><i class="fas fa-check"></i> ${weighted}</span>`;
      } else if (isRecused) {
        statusBadge = '<span class="task-tag" style="color:var(--neon-gold);border-color:var(--neon-gold);"><i class="fas fa-flag"></i> Recusal</span>';
      } else if (t.status === 'not_started') {
        statusBadge = '<span class="task-tag">Not started</span>';
      }

      return `
        <div class="row judge-queue-row ${isActive ? 'active-scoring-row' : ''}" data-team-id="${t.id}" data-search="${(t.name + ' ' + t.lead + ' ' + t.uni + ' ' + t.country).toLowerCase()}">
          <div class="member">
            <div class="team-avatar" style="width:36px;height:36px;background:${isActive ? 'linear-gradient(135deg,var(--neon-green),var(--neon-cyan))' : 'rgba(255,255,255,0.08)'};font-size:.8rem;border:1px solid ${isActive ? 'var(--neon-green)' : 'transparent'};">${initials}</div>
            <div>
              <strong>${t.name}</strong>
              <small>${t.summary.slice(0, 48)}...</small>
            </div>
          </div>
          <div>${t.region}</div>
          <div><span class="task-tag warn">${t.stage}</span></div>
          <div>${t.deadline}</div>
          <div>${statusBadge}</div>
          <div>
            <button type="button" class="btn ${isActive ? 'btn-primary' : 'btn-outline'}" style="padding:.4rem .9rem;font-size:.8rem;" onclick="loadTeamForScoring('${t.id}')">
              ${isActive ? '<i class="fas fa-pen-nib"></i> Scoring' : '<i class="fas fa-folder-open"></i> Open'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    updateJudgeKpiSummary();
  };

  function updateJudgeKpiSummary() {
    const completedCount = allTeams.filter(t => t.status === 'scored').length;
    const totalCount = allTeams.length;
    const pendingCount = totalCount - completedCount;
    const percent = Math.round((completedCount / (totalCount || 1)) * 100);

    const elCompleted = $('#kpiCompletedCount');
    if (elCompleted) elCompleted.textContent = completedCount;
    const elPending = $('#kpiPendingCount');
    if (elPending) elPending.textContent = pendingCount;
    const elAssigned = $('#kpiAssignedCount');
    if (elAssigned) elAssigned.textContent = totalCount;

    // Update sidebar progress
    const sbBar = $('.team-progress .bar div');
    if (sbBar) sbBar.style.width = percent + '%';
    const sbText = $('.team-progress span');
    if (sbText) sbText.textContent = `${completedCount} of ${totalCount} reviewed · ${percent}%`;
  }

  // 4. LOAD TEAM INTO RUBRIC WORKBENCH
  window.loadTeamForScoring = function (teamId) {
    const team = allTeams.find(t => t.id === teamId);
    if (!team) return;

    activeTeamId = teamId;

    // Update Workbench Header Dossier
    const bannerName = $('#activeTeamName');
    if (bannerName) bannerName.textContent = team.name;
    const bannerLead = $('#activeTeamLead');
    if (bannerLead) bannerLead.textContent = `${team.lead} · ${team.uni} (${team.country})`;
    const bannerTrack = $('#activeTeamTrack');
    if (bannerTrack) bannerTrack.textContent = team.track;
    const bannerSummary = $('#activeTeamSummary');
    if (bannerSummary) bannerSummary.textContent = team.summary;

    const bannerTag = $('#activeTeamStatusBadge');
    if (bannerTag) {
      if (team.status === 'scored') {
        bannerTag.className = 'badge ok';
        bannerTag.innerHTML = '<i class="fas fa-lock"></i> Final Score Locked';
      } else if (team.status === 'recused') {
        bannerTag.className = 'badge gold';
        bannerTag.innerHTML = '<i class="fas fa-flag"></i> Recusal Pending';
      } else {
        bannerTag.className = 'badge cyan';
        bannerTag.innerHTML = '<i class="fas fa-clock"></i> In Evaluation';
      }
    }

    // Populate Sliders & Textareas
    const ranges = $$('.score-input input[type=range]');
    const spans = $$('.score-input span');
    const textareas = $$('#rubricCards .form-card textarea');

    team.scores.forEach((score, i) => {
      if (ranges[i]) ranges[i].value = score;
      if (spans[i]) spans[i].textContent = score;
    });

    team.comments.forEach((comm, i) => {
      if (textareas[i]) textareas[i].value = comm;
    });

    recalc();
    renderJudgeQueue();

    // Scroll to workbench
    const workbench = $('#scoringWorkbench');
    if (workbench) {
      workbench.scrollIntoView({ behavior: 'smooth', block: 'start' });
      workbench.style.outline = '2px solid rgba(0, 255, 135, 0.4)';
      workbench.style.transition = 'outline 0.3s ease';
      setTimeout(() => { workbench.style.outline = 'none'; }, 1500);
    }

    showJudgeToast(`Loaded dossier & rubric for ${team.name}`, 'fa-folder-open', 'var(--neon-cyan)');
  };

  function calculateWeightedScore(scores) {
    let total = 0;
    scores.forEach((s, i) => {
      total += (parseInt(s, 10) || 0) * (WEIGHTS[i] || 0.2);
    });
    return total.toFixed(1);
  }

  // 5. RECALCULATE WEIGHTED SCORE
  window.recalc = function () {
    const ranges = $$('.score-input input[type=range]');
    const spans = $$('.score-input span');
    let total = 0;

    ranges.forEach((r, i) => {
      const val = parseInt(r.value, 10) || 0;
      if (spans[i]) spans[i].textContent = val;
      total += val * WEIGHTS[i];
    });

    const finalEl = $('#finalScore');
    if (finalEl) {
      finalEl.textContent = total.toFixed(1);
      if (total >= 85) {
        finalEl.style.color = 'var(--neon-green)';
      } else if (total >= 75) {
        finalEl.style.color = 'var(--neon-cyan)';
      } else if (total >= 60) {
        finalEl.style.color = 'var(--neon-gold)';
      } else {
        finalEl.style.color = 'var(--africa-red)';
      }
    }
  };

  // 6. SAVE DRAFT
  window.saveRubricDraft = function () {
    const team = allTeams.find(t => t.id === activeTeamId);
    if (!team) return;

    const ranges = $$('.score-input input[type=range]');
    const textareas = $$('#rubricCards .form-card textarea');

    const scores = ranges.map(r => parseInt(r.value, 10));
    const comments = textareas.map(ta => ta.value.trim());

    team.scores = scores;
    team.comments = comments;

    const payload = { scores, comments, status: team.status };

    // Persist via AUC_API (tries network, always hits localStorage)
    if (window.AUC_API) {
      AUC_API.judging.saveScore(team.id, payload).catch(() => {});
    } else {
      let savedScores = {};
      try { savedScores = JSON.parse(localStorage.getItem('auc_judge_scores') || '{}'); } catch(e){}
      savedScores[team.id] = payload;
      localStorage.setItem('auc_judge_scores', JSON.stringify(savedScores));
    }

    renderJudgeQueue();
    showJudgeToast(`Draft scores saved for ${team.name}!`, 'fa-floppy-disk', 'var(--neon-cyan)');
  };

  // 7. SUBMIT FINAL SCORE & LOCK
  window.submitFinalScore = function () {
    const team = allTeams.find(t => t.id === activeTeamId);
    if (!team) return;

    const ranges = $$('.score-input input[type=range]');
    const textareas = $$('#rubricCards .form-card textarea');

    const scores = ranges.map(r => parseInt(r.value, 10));
    const comments = textareas.map(ta => ta.value.trim());

    const weighted = calculateWeightedScore(scores);

    team.scores = scores;
    team.comments = comments;
    team.status = 'scored';

    const payload = { scores, comments, status: 'scored', finalScore: weighted, submittedAt: new Date().toISOString() };

    // Persist via AUC_API (network + localStorage fallback)
    if (window.AUC_API) {
      AUC_API.judging.saveScore(team.id, payload).then(() => {
        AUC_API.audit.log(
          'Dr. Kwame Acheampong (Lead Assessor)',
          `Locked Stage 3 Evaluation for ${team.name} (Score: ${weighted})`,
          'stored'
        );
      }).catch(() => {});
    } else {
      let savedScores = {};
      try { savedScores = JSON.parse(localStorage.getItem('auc_judge_scores') || '{}'); } catch(e){}
      savedScores[team.id] = payload;
      localStorage.setItem('auc_judge_scores', JSON.stringify(savedScores));
      try {
        const log = JSON.parse(localStorage.getItem('auc_audit_events') || '[]');
        log.unshift({ actor: 'Dr. Kwame Acheampong (Lead Assessor)', action: `Locked Stage 3 Evaluation for ${team.name} (Score: ${weighted})`, status: 'stored', timestamp: new Date().toLocaleString() });
        localStorage.setItem('auc_audit_events', JSON.stringify(log));
      } catch(e){}
    }

    // Update modal
    $('#certTeamName').textContent = team.name;
    $('#certScoreTotal').textContent = weighted + ' / 100';
    $('#certCriteriaList').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;font-size:.82rem;color:var(--text-soft);">
        <div>Innovation & Novelty (25%): <strong>${scores[0]}/100</strong></div>
        <div>Agenda 2063 Impact (25%): <strong>${scores[1]}/100</strong></div>
        <div>Technical Feasibility (20%): <strong>${scores[2]}/100</strong></div>
        <div>Market Scalability (15%): <strong>${scores[3]}/100</strong></div>
        <div>Team & Execution (15%): <strong>${scores[4]}/100</strong></div>
      </div>
    `;

    const modal = $('#scoreSubmittedModal');
    if (modal) modal.hidden = false;

    renderJudgeQueue();
    loadTeamForScoring(activeTeamId);
    showJudgeToast(`Final score ${weighted} locked & encrypted for ${team.name}!`, 'fa-stamp', 'var(--neon-green)');
  };

  // 8. CONFLICT OF INTEREST DISCLOSURE
  window.openCoiModal = function () {
    const select = $('#coiTeamSelect');
    if (select) {
      select.innerHTML = allTeams.map(t => `<option value="${t.id}" ${t.id === activeTeamId ? 'selected' : ''}>${t.name} (${t.country} · ${t.uni})</option>`).join('');
    }
    const modal = $('#coiDisclosureModal');
    if (modal) modal.hidden = false;
  };

  window.submitCoiDisclosure = function (e) {
    e.preventDefault();
    const teamId = $('#coiTeamSelect').value;
    const nature = $('#coiNature').value;
    const notes = $('#coiNotes').value.trim();

    const team = allTeams.find(t => t.id === teamId);
    if (!team) return;

    team.status = 'recused';

    const coiPayload = {
      teamId,
      teamName: team.name,
      judgeName: 'Dr. Kwame Acheampong',
      nature,
      notes,
      date: new Date().toLocaleDateString()
    };

    // Persist via AUC_API (tries server, always updates localStorage via api-client internals)
    if (window.AUC_API) {
      AUC_API.judging.submitCoi(coiPayload).catch(() => {});
    } else {
      let disclosures = [];
      try { disclosures = JSON.parse(localStorage.getItem('auc_judge_disclosures') || '[]'); } catch(e){}
      disclosures.unshift(coiPayload);
      localStorage.setItem('auc_judge_disclosures', JSON.stringify(disclosures));
      try {
        const log = JSON.parse(localStorage.getItem('auc_audit_events') || '[]');
        log.unshift({ actor: 'Dr. Kwame Acheampong', action: `Recusal & COI declared for ${team.name} (${nature})`, status: 'flagged', timestamp: new Date().toLocaleString() });
        localStorage.setItem('auc_audit_events', JSON.stringify(log));
      } catch(e){}
    }

    const modal = $('#coiDisclosureModal');
    if (modal) modal.hidden = true;

    renderJudgeQueue();
    loadTeamForScoring(activeTeamId);
    showJudgeToast(`Conflict disclosure recorded for ${team.name}. Re-routing requested.`, 'fa-flag', 'var(--neon-gold)');
  };

  // 9. QUEUE SEARCH & FILTERS
  window.filterJudgeQueue = function (query) {
    const q = (query || '').toLowerCase();
    $$('.judge-queue-row').forEach(row => {
      const hay = row.dataset.search || row.textContent.toLowerCase();
      row.style.display = hay.includes(q) ? 'grid' : 'none';
    });
  };

  window.setQueueFilter = function (btn, filter) {
    currentFilter = filter;
    $$('.filter-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderJudgeQueue();
  };

  // 10. CSV EXPORT OF JUDGE SCORES
  window.exportJudgeScoresCsv = function () {
    let csv = 'Team Name,Lead,University,Country,Track,Status,Innovation (25%),Agenda 2063 (25%),Feasibility (20%),Market (15%),Team (15%),Weighted Final Score,Lead Evaluator Notes\n';

    allTeams.forEach(t => {
      const weighted = calculateWeightedScore(t.scores);
      const cleanComments = t.comments.map(c => c.replace(/"/g, '""')).join(' | ');
      csv += `"${t.name}","${t.lead}","${t.uni}","${t.country}","${t.track}","${t.status}",${t.scores[0]},${t.scores[1]},${t.scores[2]},${t.scores[3]},${t.scores[4]},${weighted},"${cleanComments}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `auc_judge_evaluation_scores_${Date.now()}.csv`;
    a.click();
    showJudgeToast('Exported official evaluations dossier to CSV!', 'fa-file-excel', 'var(--neon-green)');
  };

  // 11. MODAL DISMISSAL HANDLERS
  function initModals() {
    $$('.modal-close, [data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) modal.hidden = true;
      });
    });
    $$('.modal-backdrop').forEach(m => {
      m.addEventListener('click', (e) => {
        if (e.target === m) m.hidden = true;
      });
    });
  }

  // 12. INITIALIZATION
  function init() {
    // Synchronous init with localStorage data (instant UI render)
    loadTeams();
    renderJudgeQueue();
    loadTeamForScoring(activeTeamId);
    initModals();

    // Attach range listeners
    $$('.score-input input[type=range]').forEach(r => {
      r.addEventListener('input', recalc);
    });

    // Async: pull live scores from API, then re-render with fresh data
    loadTeamsFromAPI();

    // Cross-window sync
    window.addEventListener('storage', (e) => {
      if (e.key === 'auc_registrations' || e.key === 'auc_judge_scores' || e.key === 'auc_active_team') {
        loadTeams();
        renderJudgeQueue();
      }
    });
    // Live sync from AUC_API events
    window.addEventListener('auc:registration:created', () => { loadTeamsFromAPI(); });
    window.addEventListener('auc:score:updated', () => { loadTeams(); renderJudgeQueue(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
