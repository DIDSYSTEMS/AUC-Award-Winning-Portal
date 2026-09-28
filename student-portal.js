// Student Portal Interactive Engine — Award-Winning Dynamics
(function () {
  'use strict';

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }

  // 1. TOAST SYSTEM
  window.showStudentToast = function (msg, icon = 'fa-check-circle', color = 'var(--neon-green)') {
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

  // 2. MILESTONE CHECKBOXES & DYNAMIC PROGRESS BAR
  function initMilestones() {
    const chks = $$('.milestone-chk');
    const fill = $('#teamProgressBarFill');
    const text = $('#teamProgressText');
    const badge = $('#milestoneCounterBadge');
    const kpiCount = $('#kpiTasksCompleted');

    function update() {
      const total = chks.length;
      const checked = chks.filter(c => c.checked).length;
      // Base progress is 50% for Stage 1 & 2, remaining 50% comes from Stage 3 milestones
      const percent = Math.min(100, Math.round(50 + (checked / total) * 50));
      if (fill) fill.style.width = percent + '%';
      if (text) text.textContent = `${percent}% complete (Stage 3)`;
      if (badge) badge.textContent = `${checked} of ${total} completed`;
      if (kpiCount) kpiCount.textContent = 6 + checked; // 6 previous + current
      // Update task row tags
      chks.forEach(chk => {
        const row = chk.closest('.task-row');
        const tag = row ? row.querySelector('.task-tag') : null;
        if (tag) {
          if (chk.checked) {
            tag.className = 'task-tag done';
            tag.textContent = 'completed';
          } else {
            tag.className = 'task-tag warn';
            tag.textContent = 'pending';
          }
        }
      });
    }

    chks.forEach(c => c.addEventListener('change', () => {
      update();
      window.showStudentToast('Milestone status updated!', 'fa-tasks', 'var(--neon-cyan)');
    }));
    update();
  }

  // 3. SUBMISSION WORD COUNT
  window.updateBriefWordCount = function (textarea) {
    const countEl = $('#briefWordCount');
    if (!countEl || !textarea) return;
    const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
    countEl.textContent = `${words} / 800 words`;
    if (words > 800) {
      countEl.style.color = 'var(--africa-red)';
      countEl.textContent = `${words} / 800 words (exceeds limit)`;
    } else {
      countEl.style.color = 'var(--text-mute)';
    }
  };

  // 4. FINANCIAL CALCULATOR
  window.runFinancialModel = function () {
    const users = parseFloat($('#calcUsers')?.value) || 40000;
    const vol = parseFloat($('#calcVol')?.value) || 650;
    const rate = parseFloat($('#calcRate')?.value) || 0.75;
    const burn = parseFloat($('#calcBurn')?.value) || 4500;

    const grossVol = users * vol;
    const netRev = grossVol * (rate / 100);
    const annualBurn = burn * 12;
    const profit = netRev - annualBurn;
    const breakEvenMonths = netRev > 0 ? ((annualBurn / netRev) * 12).toFixed(1) : '—';

    const fmt = n => '$' + Math.round(n).toLocaleString();

    if ($('#resGrossVol')) $('#resGrossVol').textContent = fmt(grossVol);
    if ($('#resNetRev')) $('#resNetRev').textContent = fmt(netRev);
    if ($('#resProfit')) {
      $('#resProfit').textContent = fmt(profit);
      $('#resProfit').style.color = profit >= 0 ? 'var(--neon-green)' : 'var(--africa-red)';
    }
    if ($('#resBreakEven')) $('#resBreakEven').textContent = `${breakEvenMonths} Months`;
  };

  // 5. PITCH DECK & VIDEO UPLOADS
  window.handleDeckUpload = function (files) {
    if (!files || !files.length) return;
    const f = files[0];
    const mb = (f.size / (1024 * 1024)).toFixed(1);
    const nameEl = $('#deckFileName');
    const sizeEl = $('#deckFileSize');
    if (nameEl) nameEl.textContent = f.name;
    if (sizeEl) sizeEl.textContent = `${mb} MB · Uploaded Just now`;
    window.showStudentToast(`Uploaded ${f.name} successfully!`, 'fa-file-pdf', 'var(--neon-green)');
  };

  window.handleVideoUpload = function (files) {
    if (!files || !files.length) return;
    const f = files[0];
    const player = $('#videoPlayerBox');
    if (player) {
      player.innerHTML = `
        <div style="text-align:center;padding:1.5rem;">
          <i class="fas fa-check-circle" style="font-size:2.5rem;color:var(--neon-green);margin-bottom:.5rem;"></i>
          <div style="font-weight:700;">${f.name}</div>
          <small style="color:var(--text-soft);">${(f.size/(1024*1024)).toFixed(1)} MB · Ready for Continental Assessor Review</small>
        </div>`;
    }
    window.showStudentToast('Demo video attached to Stage 3 submission!', 'fa-video', 'var(--neon-gold)');
  };

  window.updateVideoPreview = function (url) {
    const player = $('#videoPlayerBox');
    if (!player || !url) return;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      player.innerHTML = `<div style="text-align:center;padding:1.5rem;"><i class="fab fa-youtube" style="font-size:3rem;color:#FF0000;margin-bottom:.5rem;"></i><div style="font-weight:700;">YouTube Video Stream Linked</div><small style="color:var(--text-soft);word-break:break-all;">${url}</small></div>`;
    } else if (url.includes('loom.com')) {
      player.innerHTML = `<div style="text-align:center;padding:1.5rem;"><i class="fas fa-video" style="font-size:3rem;color:var(--neon-cyan);margin-bottom:.5rem;"></i><div style="font-weight:700;">Loom Walkthrough Linked</div><small style="color:var(--text-soft);">${url}</small></div>`;
    }
  };

  // 6. SAVE DRAFT & SUBMIT FINAL (WITH CENTRAL STORAGE SYNC)
  function initSubmissionActions() {
    const btnDraft = $('#btnSaveDraft');
    const btnSubmit = $('#btnSubmitFinal');
    const status = $('#submissionAutosaveStatus');

    if (btnDraft) {
      btnDraft.addEventListener('click', () => {
        const title = $('#subTitle')?.value || '';
        const track = $('#subTrack')?.value || '';
        const tagline = $('#subTagline')?.value || '';
        const uni = $('#subUni')?.value || '';
        const narrative = $('#subNarrative')?.value || '';
        const problem = $('#subProblem')?.value || '';
        const beneficiaries = $('#subBeneficiaries')?.value || '';
        const demoUrl = $('#videoUrlInput')?.value || '';
        const repoUrl = $('#subRepoUrl')?.value || '';

        // Update active team session
        let activeTeam = getActiveTeam();
        activeTeam.name = title || activeTeam.name;
        activeTeam.venture = title || activeTeam.venture;
        activeTeam.track = track || activeTeam.track;
        activeTeam.tagline = tagline || activeTeam.tagline;
        activeTeam.uni = uni || activeTeam.uni;
        activeTeam.narrative = narrative || activeTeam.narrative;
        activeTeam.summary = narrative || activeTeam.summary;
        activeTeam.concept = narrative || activeTeam.concept;
        activeTeam.problem = problem;
        activeTeam.beneficiaries = beneficiaries;
        activeTeam.demoUrl = demoUrl;
        activeTeam.repoUrl = repoUrl;
        activeTeam.lastSaved = new Date().toISOString();

        // Persist via AUC_API (network + localStorage fallback)
        if (window.AUC_API && activeTeam.id) {
          AUC_API.registrations.update(activeTeam.id, activeTeam).catch(() => {});
        } else {
          try {
            localStorage.setItem('auc_active_team', JSON.stringify(activeTeam));
            const regs = JSON.parse(localStorage.getItem('auc_registrations') || '[]');
            const idx = regs.findIndex(r => r.id === activeTeam.id || r.lead === activeTeam.lead || r.venture === activeTeam.venture);
            if (idx !== -1) { regs[idx] = Object.assign({}, regs[idx], activeTeam); localStorage.setItem('auc_registrations', JSON.stringify(regs)); }
          } catch (e) {}
        }
        // Audit log via AUC_API
        if (window.AUC_API) {
          AUC_API.audit.log(
            activeTeam.lead + ' (Team Lead)',
            'Updated Stage 3 Submission Dossier for ' + (activeTeam.venture || activeTeam.name),
            'Synced'
          );
        } else {
          try {
            const audits = JSON.parse(localStorage.getItem('auc_audit_events') || '[]');
            audits.unshift({ actor: activeTeam.lead + ' (Team Lead)', action: 'Updated Stage 3 Dossier for ' + (activeTeam.venture || activeTeam.name), status: 'Synced', time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) });
            localStorage.setItem('auc_audit_events', JSON.stringify(audits));
          } catch (e) {}
        }

        const now = new Date();
        const stamp = `Auto-saved · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        if (status) status.innerHTML = `<i class="fas fa-check-circle"></i> ${stamp}`;
        window.showStudentToast(`Draft saved for ${activeTeam.venture || activeTeam.name}!`, 'fa-save', 'var(--neon-green)');
      });
    }

    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        let activeTeam = getActiveTeam();
        activeTeam.status = 'Stage 3 Submitted';
        // Persist via AUC_API
        if (window.AUC_API && activeTeam.id) {
          AUC_API.registrations.update(activeTeam.id, { status: 'Stage 3 Submitted' }).then(() => {
            AUC_API.audit.log(
              activeTeam.lead + ' (Team Lead)',
              'Stage 3 Continental Application Submitted for ' + (activeTeam.venture || activeTeam.name),
              'submitted'
            );
          }).catch(() => {});
        } else {
          try {
            localStorage.setItem('auc_active_team', JSON.stringify(activeTeam));
            const regs = JSON.parse(localStorage.getItem('auc_registrations') || '[]');
            const idx = regs.findIndex(r => r.id === activeTeam.id || r.lead === activeTeam.lead);
            if (idx !== -1) { regs[idx].status = 'Stage 3 Submitted'; localStorage.setItem('auc_registrations', JSON.stringify(regs)); }
          } catch (e) {}
        }
        const modal = $('#submissionSuccessModal');
        if (modal) modal.hidden = false;
        window.showStudentToast('Stage 3 Continental Application Officially Submitted!', 'fa-paper-plane', 'var(--neon-cyan)');
      });
    }
  }

  // 7. TEAM MEMBER INVITATIONS
  function initTeamModal() {
    const btnInvite = $('#inviteMemberBtn');
    const modal = $('#inviteMemberModal');
    const form = $('#inviteMemberForm');

    if (btnInvite && modal) {
      btnInvite.addEventListener('click', () => { modal.hidden = false; });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#invName').value.trim();
        const email = $('#invEmail').value.trim();
        const uni = $('#invUni').value.trim();
        const country = $('#invCountry').value.trim();
        const role = $('#invRole').value.trim();
        const contrib = $('#invContrib').value.trim() || '50';

        const table = $('#studentTeamTable');
        if (table) {
          const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';
          const newRow = document.createElement('div');
          newRow.className = 'row';
          newRow.innerHTML = `
            <div class="member">
              <div class="team-avatar" style="width:40px;height:40px;font-size:.9rem;background:linear-gradient(135deg,var(--neon-cyan),var(--africa-purple));">${initials}</div>
              <div><strong>${name}</strong><small>${email}</small></div>
            </div>
            <div>${role}</div>
            <div>${country} · <small style="color:var(--text-mute);">${uni}</small></div>
            <div class="contrib"><div class="bar"><div class="fill" style="width:${contrib}%;"></div></div><span>${contrib}%</span></div>
            <div><span class="dot online"></span><small style="color:var(--neon-cyan);">Invited</small></div>
            <div><i class="fas fa-ellipsis-h"></i></div>
          `;
          table.appendChild(newRow);
        }

        // Update badges
        const countBadge = $('#sideTeamCountBadge');
        if (countBadge) countBadge.textContent = '5';
        const sub = $('#teamSubtitleText');
        if (sub) sub.textContent = '5 members · 4 countries · Multidisciplinary';
        const kpiMembers = $('#kpiTeamMembers');
        if (kpiMembers) kpiMembers.textContent = '5';

        if (modal) modal.hidden = true;
        form.reset();
        window.showStudentToast(`Invitation sent to ${name} (${email})!`, 'fa-user-check', 'var(--neon-green)');
      });
    }
  }

  // 8. KYC UPLOAD MODAL
  function initKycModal() {
    const btn = $('#btnUploadMissingDoc');
    const modal = $('#kycUploadModal');
    const form = $('#kycUploadForm');

    if (btn && modal) {
      btn.addEventListener('click', () => { modal.hidden = false; });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const linaCard = $('#kycLinaCard');
        if (linaCard) {
          linaCard.className = 'kyc-card done';
          linaCard.innerHTML = `
            <div class="kyc-head"><i class="fas fa-check-circle" style="color:var(--neon-green);"></i><h4>Lina Bekele</h4></div>
            <p>Student ID & Enrollment Verified · Addis Ababa University</p>
            <span class="kyc-tag ok">verified</span>
          `;
        }
        const badge = $('.side-link[data-page="eligibility"] .badge');
        if (badge) {
          badge.className = 'badge cyan';
          badge.textContent = '✓';
        }
        if (modal) modal.hidden = true;
        window.showStudentToast('Lina Bekele institutional KYC verified!', 'fa-id-card', 'var(--neon-green)');
      });
    }
  }

  // 9. SCOREBOARD FILTER & SEARCH
  window.filterScoreboardTable = function (keyword) {
    const q = (keyword || '').toLowerCase();
    const rows = $$('#scoreboardList .score-row');
    rows.forEach(r => {
      const txt = r.textContent.toLowerCase();
      r.style.display = txt.includes(q) ? 'grid' : 'none';
    });
  };

  function initScoreboardFilters() {
    const pills = $$('.filter-pill[data-sb-filter]');
    pills.forEach(p => {
      p.addEventListener('click', () => {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        const track = p.dataset.sbFilter;
        const rows = $$('#scoreboardList .score-row');
        rows.forEach(r => {
          if (track === 'all' || r.dataset.track === track) {
            r.style.display = 'grid';
          } else {
            r.style.display = 'none';
          }
        });
      });
    });
  }

  // 10. SCORE BREAKDOWN MODAL
  window.openScoreBreakdown = function (team, track, uni, total, criteria, comments) {
    const modal = $('#scoreBreakdownModal');
    if (!modal) return;
    $('#sbModalTeamName').textContent = team;
    $('#sbModalTrack').textContent = track;
    $('#sbModalUni').textContent = uni;
    $('#sbModalTotal').textContent = total + ' / 100';

    const labels = [
      { name: 'Problem Relevance & Need Validation', max: 25 },
      { name: 'Deep Tech Architecture & Innovation', max: 25 },
      { name: 'Market Feasibility & Unit Economics', max: 20 },
      { name: 'AU Agenda 2063 Direct Impact', max: 20 },
      { name: 'Presentation & Pitch Articulation', max: 10 }
    ];

    const bars = $('#sbModalBars');
    if (bars) {
      bars.innerHTML = criteria.map((score, i) => `
        <div style="margin-bottom:.85rem;">
          <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.25rem;">
            <span>${labels[i].name}</span>
            <strong>${score} / ${labels[i].max}</strong>
          </div>
          <div style="height:6px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;">
            <div style="height:100%;background:var(--grad-primary);width:${(score/labels[i].max)*100}%;"></div>
          </div>
        </div>
      `).join('');
    }

    $('#sbModalComments').textContent = comments || 'No commentary logged.';
    modal.hidden = false;
  };

  // 11. MESSAGING COMPOSER
  window.sendStudentMessage = function () {
    const input = $('#studentMsgInput');
    const thread = $('#msgThreadList');
    if (!input || !thread) return;
    const text = input.value.trim();
    if (!text) return;

    const reply = document.createElement('div');
    reply.className = 'msg-reply';
    reply.innerHTML = `
      <div class="team-avatar" style="width:36px;height:36px;font-size:.8rem;background:linear-gradient(135deg,var(--neon-green),var(--neon-cyan));">AD</div>
      <div class="msg-body">
        <strong>Amara Diallo (Team Lead) · Just now</strong>
        <p>${text}</p>
      </div>
    `;
    thread.appendChild(reply);
    input.value = '';
    thread.scrollTop = thread.scrollHeight;
    window.showStudentToast('Message sent to Stage 3 evaluation thread!', 'fa-paper-plane', 'var(--neon-green)');

    // Simulate realistic assessor response after 2.5 seconds
    setTimeout(() => {
      const assessor = document.createElement('div');
      assessor.className = 'msg-from';
      assessor.innerHTML = `
        <div class="team-avatar" style="width:36px;height:36px;font-size:.8rem;background:linear-gradient(135deg,var(--neon-cyan),var(--neon-gold));">KA</div>
        <div class="msg-body">
          <strong>Dr. Kwame Acheampong (Stage 3 Lead Assessor) · Just now</strong>
          <p>Noted, Amara. The secretariat evaluation panel will review this update during Friday's pre-calibration session. Keep up the high standard.</p>
        </div>
      `;
      thread.appendChild(assessor);
      thread.scrollTop = thread.scrollHeight;
      window.showStudentToast('New message from Dr. Kwame Acheampong!', 'fa-comments', 'var(--neon-cyan)');
    }, 2500);
  };

  // 12. PROFILE SETTINGS
  window.saveProfileSettings = function () {
    const name = $('#profName')?.value || 'Amara Diallo';
    const email = $('#profEmail')?.value || 'amara@nova.africa';
    localStorage.setItem('auc_student_profile', JSON.stringify({ name, email, savedAt: Date.now() }));
    window.showStudentToast('Profile and notification channels saved!', 'fa-check-circle', 'var(--neon-green)');
  };

  // 13. EXPORT TEAM DOSSIER
  function initExportAction() {
    const btn = $('#exportTeamBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        window.showStudentToast('Generating Stage 3 Continental Dossier...', 'fa-file-pdf', 'var(--neon-cyan)');
        setTimeout(() => {
          window.print();
        }, 800);
      });
    }
  }

  // 14. NEW SUBMISSION BUTTON
  function initNewSubmissionBtn() {
    const btn = $('#newSubmissionBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const subLink = $('.side-link[data-page="submission"]');
        if (subLink) subLink.click();
      });
    }
  }

  // 15. TEAM SESSION MANAGER & SWITCHER
  const DEFAULT_STUDENT_TEAMS = [
    {
      id: 'nova-pay',
      name: 'NovaPay',
      venture: 'NovaPay',
      lead: 'Amara Diallo',
      email: 'amara@nova.africa',
      uni: 'Université Cheikh Anta Diop (Senegal)',
      country: 'Senegal',
      track: 'Aspiration 1 · Prosperity & Inclusive Growth (FinTech, Agritech)',
      tagline: 'Instant, sub-cent cross-border settlement for 40,000 West and East African informal traders via sovereign digital currency rails.',
      narrative: 'NovaPay is a settlement layer purpose-built for informal cross-border micro-trade across the AfCFTA region. Existing rails (SWIFT, traditional mobile money) lose 9–17% of transfer value to intermediary fees and FX spreads, disadvantaging small-value traders who cannot transact. NovaPay issues stablecoin-backed value across a permissioned Polygon CDK rollup, denominated in CBA-issued digital cedi equivalents. Settlement completes in under 4 seconds at a stable US$0.02 per transfer.\n\nOur solution interfaces seamlessly with USSD handsets and regional mobile money wallets (Wave, M-Pesa, Orange Money), requiring no smartphone or internet connection for market women and border merchants.',
      problem: 'Excessive cross-border currency conversion friction and high transaction costs preventing informal traders in the ECOWAS-EAC corridors from scaling regional trade.',
      beneficiaries: '40,000 cross-border micro-merchants (74% female-led) across Senegal ↔ Mali and Kenya ↔ Uganda border hubs within first 18 months of deployment.',
      demoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      repoUrl: 'https://github.com/novapay-africa/core-settlement',
      rank: '#47',
      progress: 62,
      score: 84,
      daysToFinals: 42,
      members: [
        { name: 'Amara Diallo', role: 'Lead / Product', country: '🇸🇳 Senegal', uni: 'UCAD', email: 'amara@nova.africa', contrib: 92, status: 'Active' },
        { name: 'Kwame Osei', role: 'Engineer', country: '🇬🇭 Ghana', uni: 'Univ of Ghana', email: 'k.osei@nova.africa', contrib: 84, status: 'Active' },
        { name: 'Joseph Mwangi', role: 'Finance', country: '🇰🇪 Kenya', uni: 'Univ of Nairobi', email: 'j.mwangi@nova.africa', contrib: 71, status: 'Active' },
        { name: 'Lina Bekele', role: 'Design / UX', country: '🇪🇹 Ethiopia', uni: 'Addis Ababa Univ', email: 'l.bekele@nova.africa', contrib: 58, status: 'Idle 2d' }
      ]
    },
    {
      id: 'fin-mesh',
      name: 'FinMesh',
      venture: 'FinMesh',
      lead: 'Joseph Mwangi',
      email: 'j.mwangi@finmesh.ke',
      uni: 'University of Nairobi',
      country: 'Kenya',
      track: 'Aspiration 1 · Prosperity & Inclusive Growth (FinTech, Agritech)',
      tagline: 'P2P decentralized micro-lending cooperative engine connecting rural grain farmers to regional liquidity pools.',
      narrative: 'FinMesh converts traditional agricultural harvest receipts into on-chain liquidity primitives for rural farmers.',
      problem: 'Lack of collateral preventing smallholder farmers from securing working capital ahead of planting seasons.',
      beneficiaries: '12,500 smallholder maize and coffee farmers across Rift Valley and Central Kenya.',
      demoUrl: 'https://prototype.finmesh.ke',
      repoUrl: 'https://github.com/finmesh-kenya/protocol',
      rank: '#12',
      progress: 75,
      score: 82,
      daysToFinals: 42,
      members: [
        { name: 'Joseph Mwangi', role: 'Lead / FinTech Architect', country: '🇰🇪 Kenya', uni: 'Univ of Nairobi', email: 'j.mwangi@finmesh.ke', contrib: 95, status: 'Active' },
        { name: 'Sarah Wanjiku', role: 'Agritech Specialist', country: '🇰🇪 Kenya', uni: 'JKUAT', email: 's.wanjiku@finmesh.ke', contrib: 88, status: 'Active' },
        { name: 'Emmanuel Kiprono', role: 'Smart Contract Dev', country: '🇰🇪 Kenya', uni: 'Strathmore Univ', email: 'e.kiprono@finmesh.ke', contrib: 80, status: 'Active' }
      ]
    },
    {
      id: 'crypto-grain',
      name: 'CryptoGrain',
      venture: 'CryptoGrain',
      lead: 'Grace Akello',
      email: 'g.akello@cryptograin.ug',
      uni: 'Makerere University',
      country: 'Uganda',
      track: 'Aspiration 1 · Prosperity & Inclusive Growth (FinTech, Agritech)',
      tagline: 'Commodity-backed inventory tokenization for smallholder maize producers in bonded warehouses.',
      narrative: 'CryptoGrain provides instant liquidity to grain producers in East Africa by issuing tokenized warehouse warrants.',
      problem: 'Post-harvest grain price crashes forcing distress selling by smallholder farmers.',
      beneficiaries: '8,000 grain farmers in Eastern Uganda and Western Kenya.',
      demoUrl: 'https://cryptograin.ug/demo',
      repoUrl: 'https://github.com/cryptograin/warrant-contracts',
      rank: '#18',
      progress: 68,
      score: 80,
      daysToFinals: 42,
      members: [
        { name: 'Grace Akello', role: 'Founder / CEO', country: '🇺🇬 Uganda', uni: 'Makerere Univ', email: 'g.akello@cryptograin.ug', contrib: 90, status: 'Active' },
        { name: 'David Ochieng', role: 'Logistics Lead', country: '🇺🇬 Uganda', uni: 'Makerere Univ', email: 'd.ochieng@cryptograin.ug', contrib: 85, status: 'Active' }
      ]
    }
  ];

  function mapRegToTeam(r, idx) {
    return {
      id: r.id || ('reg-' + idx),
      name: r.venture || r.name || (r.lead + ' (Team)'),
      venture: r.venture || r.name || (r.lead + ' (Team)'),
      lead: r.lead,
      email: r.email,
      uni: r.uni || 'African University',
      country: r.country || 'Africa',
      track: r.track || 'Aspiration 1 · Prosperity & Inclusive Growth',
      tagline: r.summary || r.concept || 'Registered pan-African undergraduate innovation team.',
      narrative: r.summary || r.concept || '',
      problem: r.summary || r.concept || '',
      beneficiaries: r.beneficiaries || 'Continental communities under AU Agenda 2063.',
      demoUrl: r.demoUrl || '',
      repoUrl: r.repoUrl || '',
      rank: '#01',
      progress: 55,
      score: 79,
      daysToFinals: 42,
      members: r.members && r.members.length ? r.members.map(m => ({
        name: m.name,
        role: m.role || 'Co-Founder',
        country: r.country,
        uni: r.uni,
        email: m.email || r.email,
        contrib: 85,
        status: 'Active'
      })) : [
        { name: r.lead, role: 'Team Lead', country: r.country, uni: r.uni, email: r.email, contrib: 95, status: 'Active' }
      ]
    };
  }

  function getAllAvailableTeams() {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('auc_registrations') || '[]'); } catch(e){}
    return [...stored.map(mapRegToTeam), ...DEFAULT_STUDENT_TEAMS];
  }

  // Async refresh from AUC_API — re-populates the team switcher after API responds
  async function refreshTeamsFromAPI() {
    if (!window.AUC_API) return;
    try {
      const apiRegs = await AUC_API.registrations.getAll();
      if (!apiRegs || !apiRegs.length) return;
      const switcher = $('#teamSwitcherSelect');
      if (!switcher) return;
      const active = getActiveTeam();
      const all = [...apiRegs.map(mapRegToTeam), ...DEFAULT_STUDENT_TEAMS];
      switcher.innerHTML = all.map(t =>
        `<option value="${t.id}" ${t.id === active.id ? 'selected' : ''}>${t.venture || t.name} (${t.country || 'Africa'})</option>`
      ).join('');
    } catch(e) {}
  }

  function getActiveTeam() {
    try {
      const active = JSON.parse(localStorage.getItem('auc_active_team') || 'null');
      if (active) {
        const all = getAllAvailableTeams();
        const found = all.find(t => t.id === active.id || t.lead === active.lead || t.name === active.name || t.venture === active.venture);
        if (found) return Object.assign({}, found, active);
        return active;
      }
    } catch(e) {}
    return DEFAULT_STUDENT_TEAMS[0];
  }

  window.switchStudentTeam = function (teamId) {
    const all = getAllAvailableTeams();
    const team = all.find(t => t.id === teamId) || all[0];
    try {
      localStorage.setItem('auc_active_team', JSON.stringify(team));
    } catch(e){}
    renderTeamSession(team);
    window.showStudentToast(`Switched workspace to Team ${team.venture || team.name}!`, 'fa-users', 'var(--neon-green)');
  };

  function renderTeamSession(team) {
    if (!team) return;
    const teamName = team.venture || team.name;
    const leadFirst = (team.lead || 'Founder').split(' ')[0];

    // Header & Sidebar
    if ($('#sideTeamName')) $('#sideTeamName').textContent = teamName.startsWith('Team') ? teamName : 'Team ' + teamName;
    if ($('#sideTeamTrack')) $('#sideTeamTrack').textContent = team.track ? team.track.split('(')[0].trim() : 'Aspiration 1 · FinTech';
    if ($('#teamHeading')) $('#teamHeading').textContent = teamName.startsWith('Team') ? teamName : 'Team ' + teamName;
    if ($('#dashGreeting')) $('#dashGreeting').innerHTML = `Welcome back, ${leadFirst} 👋`;

    // Initials
    const initials = (team.lead || 'Amara Diallo').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    if ($('#avatarInitials')) $('#avatarInitials').textContent = initials;
    if ($('#portalAvatarBox')) $('#portalAvatarBox').title = `${team.lead} (${teamName} Lead)`;

    // Team Table
    const teamTable = $('#studentTeamTable');
    if (teamTable && team.members && team.members.length) {
      const rows = team.members.map((m, idx) => `
        <div class="row">
          <div class="member">
            <div class="team-avatar" style="width:40px;height:40px;font-size:.9rem;background:linear-gradient(135deg,var(--neon-green),var(--neon-cyan));">${(m.name||'F').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>
            <div><strong>${m.name}</strong><small>${m.email || (team.lead === m.name ? 'Lead' : 'Member')}</small></div>
          </div>
          <div>${m.role || 'Co-Founder'}</div>
          <div>${m.country || team.country || 'Africa'} · <small style="color:var(--text-mute);">${m.uni || team.uni || ''}</small></div>
          <div class="contrib"><div class="bar"><div class="fill" style="width:${m.contrib || (90 - idx*5)}%;"></div></div><span>${m.contrib || (90 - idx*5)}%</span></div>
          <div><span class="dot online"></span>${m.status || 'Active'}</div>
          <div><i class="fas fa-ellipsis-h"></i></div>
        </div>
      `).join('');
      teamTable.innerHTML = '<div class="row head"><div>Member</div><div>Role</div><div>Country</div><div>Contribution</div><div>Status</div><div></div></div>' + rows;
      if ($('#kpiTeamMembers')) $('#kpiTeamMembers').textContent = team.members.length;
      if ($('#sideTeamCountBadge')) $('#sideTeamCountBadge').textContent = team.members.length;
      if ($('#teamSubtitleText')) $('#teamSubtitleText').textContent = `${team.members.length} members · ${team.country} · Multidisciplinary`;
    }

    // Submission Form Fields
    if ($('#subTitle')) $('#subTitle').value = teamName;
    if ($('#subTagline')) $('#subTagline').value = team.tagline || team.summary || '';
    if ($('#subUni')) $('#subUni').value = team.uni || '';
    if ($('#subNarrative')) $('#subNarrative').value = team.narrative || team.summary || '';
    if ($('#subProblem')) $('#subProblem').value = team.problem || team.summary || '';
    if ($('#subBeneficiaries') && team.beneficiaries) $('#subBeneficiaries').value = team.beneficiaries;
    if ($('#videoUrlInput') && team.demoUrl) {
      $('#videoUrlInput').value = team.demoUrl;
      window.updateVideoPreview(team.demoUrl);
    }
    if ($('#subRepoUrl') && team.repoUrl) $('#subRepoUrl').value = team.repoUrl;
  }

  function initTeamSession() {
    const switcher = $('#teamSwitcherSelect');
    const all = getAllAvailableTeams();
    const active = getActiveTeam();

    if (switcher) {
      switcher.innerHTML = all.map(t => `
        <option value="${t.id}" ${t.id === active.id ? 'selected' : ''}>
          ${t.venture || t.name} (${t.country || 'Africa'})
        </option>
      `).join('');
    }

    renderTeamSession(active);
  }

  // Modal dismiss buttons
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

  function init() {
    initMilestones();
    initTeamSession();
    initSubmissionActions();
    initTeamModal();
    initKycModal();
    initScoreboardFilters();
    initExportAction();
    initNewSubmissionBtn();
    initModals();
    runFinancialModel();

    // Async: refresh team list from API (adds newly registered teams from server)
    refreshTeamsFromAPI();

    // Live: re-populate switcher when a new team registers in another tab/window
    window.addEventListener('auc:registration:created', () => {
      refreshTeamsFromAPI();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
