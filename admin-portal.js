// Admin HQ Interactive Engine — Operations, Routing, MOUs & Broadcasts
(function () {
  'use strict';

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }

  // 1. TOAST SYSTEM
  window.showAdminToast = function (msg, icon = 'fa-check-circle', color = 'var(--neon-green)') {
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

  // 2. AUDIT LOG LOGGER
  window.logAdminAudit = function (actor, action, status = 'stored') {
    const logList = $('#adminAuditList') || $('.audit-log');
    if (!logList) return;
    const now = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const stamp = `${months[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const row = document.createElement('div');
    row.className = 'audit-row';
    row.innerHTML = `
      <div class="ts">${stamp}</div>
      <div>${actor}</div>
      <div>${action}</div>
      <div><span class="badge-tiny ${status === 'stored' ? 'ok' : status === 'approved' ? 'ok' : 'info'}">${status}</span></div>
    `;
    // Insert after header
    const head = logList.querySelector('.audit-row.head');
    if (head && head.nextSibling) {
      logList.insertBefore(row, head.nextSibling);
    } else {
      logList.appendChild(row);
    }
  };

  // 3. PARTNERSHIP INBOX & MOU BUILDER
  const defaultPartners = [
    { ref: 'AUC-PART-9021', org: 'AfCFTA Trade Forum', contact: 'Mamadou Diallo', email: 'trade@afcfta-youth.org', tier: 'platinum', budget: '$250,000', status: 'MOU Drafted', deliverables: 'Pan-African Demo Day Keynote, Trade Corridor Sandbox Integration' },
    { ref: 'AUC-PART-8114', org: 'Pan-African Energy Fund', contact: 'Dr. Sarah Al-Sayed', email: 'partnerships@paefund.org', tier: 'gold', budget: '$100,000', status: 'Under Review', deliverables: 'Aspiration 2 Track Sponsor, Deal-Flow Rights for CleanTech finalists' },
    { ref: 'AUC-PART-7429', org: 'Nairobi Venture Hub', contact: 'Kariuki Mwangi', email: 'ventures@nairobitech.co.ke', tier: 'silver', budget: '$45,000', status: 'Approved', deliverables: 'Regional East Accelerator Host, Talent Recruitment Access' }
  ];

  window.initPartnershipInbox = function () {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('auc_partner_inquiries') || '[]'); } catch(e){}
    const all = [...stored, ...defaultPartners];
    const table = $('#partnerInboxTable');
    const badge = $('#partnerBadgeCount');
    if (badge) badge.textContent = `${all.length} Inquiries`;
    if (!table) return;

    table.innerHTML = '<div class="row head"><div>Organization</div><div>Contact / Email</div><div>Tier & Budget</div><div>HQ Status</div><div>Action</div></div>' +
      all.map((inq, idx) => `
        <div class="row partner-row" data-org="${inq.org.toLowerCase()}">
          <div><strong>${inq.org}</strong><br><small style="color:var(--text-mute);">${inq.ref || 'AUC-PART'}</small></div>
          <div>${inq.contact || 'Representative'}<br><small style="color:var(--neon-cyan);">${inq.email}</small></div>
          <div><span class="badge-tiny ${inq.tier === 'platinum' ? 'gold' : inq.tier === 'gold' ? 'ok' : 'cyan'}">${(inq.tier || 'custom').toUpperCase()}</span><br><small style="color:var(--text-mute);">${inq.budget || '$25K+'}</small></div>
          <div><span class="task-tag ${inq.status === 'Approved' ? 'done' : inq.status === 'MOU Drafted' ? 'cyan' : 'warn'}">${inq.status || 'Under Review'}</span></div>
          <div>
            <button type="button" class="btn btn-primary" style="padding:.35rem .75rem;font-size:.78rem;" onclick="openAdminMouModal(${idx})">
              <i class="fas fa-file-contract"></i> Build MOU
            </button>
          </div>
        </div>
      `).join('');
  };

  window.openAdminMouModal = function (idx) {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('auc_partner_inquiries') || '[]'); } catch(e){}
    const all = [...stored, ...defaultPartners];
    const p = all[idx] || all[0];

    $('#mouPartnerIndex').value = idx;
    $('#mouOrgName').value = p.org;
    $('#mouContact').value = p.contact || 'Representative';
    $('#mouEmail').value = p.email;
    $('#mouTier').value = p.tier || 'platinum';
    $('#mouBudget').value = p.budget || '$100,000';
    $('#mouDeliverables').value = p.deliverables || 'Continental Accelerator Co-Host, Demo Day Presentation, Direct Deal-Flow';

    updateMouLegalPreview();
    const modal = $('#adminMouModal');
    if (modal) modal.hidden = false;
  };

  window.updateMouLegalPreview = function () {
    const org = $('#mouOrgName')?.value || 'Partner Organization';
    const tier = ($('#mouTier')?.value || 'Platinum').toUpperCase();
    const budget = $('#mouBudget')?.value || '$100,000';
    const deliv = $('#mouDeliverables')?.value || 'Co-Branding & Seed Funding';

    const text = `MEMORANDUM OF UNDERSTANDING (MOU)
BETWEEN:
The African Undergraduate Challenge (AUC) Secretariat & ${org}

1. PREAMBLE & ALIGNMENT
Whereas AUC is officially aligned with African Union Agenda 2063 to foster youth-led technological, industrial, and economic sovereignty across all 54 member states.

2. SPONSORSHIP TIER & GRANT COMMITMENT
${org} hereby pledges ${budget} in sponsorship and venture grant reserves under the ${tier} Continental Partnership Designation for the 2026 Innovation Cycle.

3. STRATEGIC DELIVERABLES & CO-BENEFITS
- Full branding across Continental Finals in Addis Ababa.
- Direct deal-flow and IP sandbox access for Stage 3 regional finalists.
- Special Provisions: ${deliv}.

4. GOVERNING LAW & RATIFICATION
This agreement is entered in good faith under Pan-African arbitration principles, sealed by the AUC Secretariat Executive Director.`;

    const box = $('#mouLegalText');
    if (box) box.textContent = text;
  };

  window.dispatchAdminMou = function (e) {
    e.preventDefault();
    const idx = parseInt($('#mouPartnerIndex').value, 10);
    const org = $('#mouOrgName').value;
    const email = $('#mouEmail').value;

    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('auc_partner_inquiries') || '[]'); } catch(e){}
    const all = [...stored, ...defaultPartners];
    if (all[idx]) {
      all[idx].status = 'Approved';
      if (idx < stored.length) {
        stored[idx].status = 'Approved';
        localStorage.setItem('auc_partner_inquiries', JSON.stringify(stored));
      }
    }

    const modal = $('#adminMouModal');
    if (modal) modal.hidden = true;

    initPartnershipInbox();
    logAdminAudit('Admin HQ', `Executed and dispatched bilateral MOU for ${org} (${email})`, 'approved');
    showAdminToast(`MOU formally dispatched to ${org}! Status updated to Approved.`, 'fa-file-signature', 'var(--neon-green)');
  };

  // 4. TEAMS & ASSESSOR ROUTING MODAL
  const defaultTeams = [
    { lead: 'Amara Diallo', uni: 'Univ of Dakar', country: 'Senegal', track: 'Aspiration 1 · FinTech', assessor: 'Dr. Kwame Acheampong' },
    { lead: 'Tariq Mansour', uni: 'Cairo University', country: 'Egypt', track: 'Aspiration 2 · Integrated Corridor', assessor: 'Prof. Tendai Moyo' },
    { lead: 'Kofi Mensah', uni: 'Univ of Ghana', country: 'Ghana', track: 'Aspiration 7 · Global Player & Diplomatic Partner', assessor: 'Amb. Dr. Obinna Basil' },
    { lead: 'Lindiwe Dlamini', uni: 'Univ of Cape Town', country: 'South Africa', track: 'Aspiration 6 · Health & EdTech', assessor: 'Eng. Esther Ouko' },
    { lead: 'Ibrahim Diallo', uni: 'Cheikh Anta Diop', country: 'Senegal', track: 'Aspiration 4 · Cyber Resilience', assessor: 'Col. Babatunde Lawal' }
  ];

  window.initAdminTeams = function () {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('auc_registrations') || '[]'); } catch(e){}
    const all = [...stored.map(t => ({
      lead: t.lead,
      uni: t.uni,
      country: t.country,
      track: t.track,
      assessor: t.assignedAssessor ? t.assignedAssessor.name : 'Dr. Kwame Acheampong'
    })), ...defaultTeams];

    const table = $('#adminTeamsTable');
    if (!table) return;

    table.innerHTML = '<div class="row head"><div>Team Lead / Project</div><div>University & Country</div><div>Track</div><div>Assigned Assessor</div><div>Action</div></div>' +
      all.map((t, idx) => `
        <div class="row team-routing-row" data-query="${(t.lead + ' ' + t.track + ' ' + t.country).toLowerCase()}">
          <div><strong>${t.lead}</strong></div>
          <div>${t.uni} · <small style="color:var(--neon-green);">${t.country}</small></div>
          <div><small>${t.track}</small></div>
          <div><span class="badge-tiny ok" id="assessorBadge_${idx}">${t.assessor}</span></div>
          <div>
            <button type="button" class="btn btn-outline" style="padding:.35rem .65rem;font-size:.78rem;" onclick="openAdminAssessorModal(${idx}, '${t.lead.replace(/'/g, "\\'")}', '${t.track.replace(/'/g, "\\'")}', '${t.assessor.replace(/'/g, "\\'")}')">
              <i class="fas fa-user-edit"></i> Reassign
            </button>
          </div>
        </div>
      `).join('');
  };

  window.openAdminAssessorModal = function (idx, lead, track, currentAssessor) {
    $('#assessorTeamIdx').value = idx;
    $('#assessorTeamLead').textContent = lead;
    $('#assessorTeamTrack').textContent = track;
    const select = $('#assessorSelect');
    if (select) {
      Array.from(select.options).forEach(opt => {
        opt.selected = opt.value.includes(currentAssessor);
      });
    }
    const modal = $('#adminAssessorModal');
    if (modal) modal.hidden = false;
  };

  window.confirmAssessorReassignment = function (e) {
    e.preventDefault();
    const idx = $('#assessorTeamIdx').value;
    const lead = $('#assessorTeamLead').textContent;
    const newAssessor = $('#assessorSelect').value;
    const note = $('#assessorNotes').value.trim();

    const badge = $(`#assessorBadge_${idx}`);
    if (badge) badge.textContent = newAssessor.split('·')[0].trim();

    const modal = $('#adminAssessorModal');
    if (modal) modal.hidden = true;

    logAdminAudit('Admin HQ', `Reassigned assessor for ${lead} to ${newAssessor.split('·')[0].trim()} ${note ? '(' + note + ')' : ''}`, 'stored');
    showAdminToast(`Assessor updated to ${newAssessor.split('·')[0].trim()} for ${lead}!`, 'fa-user-check', 'var(--neon-green)');
  };

  // 5. EMAIL BROADCASTER TEMPLATES & PREVIEW
  const BROADCAST_TEMPLATES = {
    stage3: {
      group: 'stage3',
      subject: 'AUC Stage 3 Accelerator: Mentor Pairing & Deliverables Protocol',
      body: `Dear Finalists,

Congratulations on advancing to Stage 3 of the African Undergraduate Challenge (AUC) 2026. 

Your team has officially been paired with your continental industry mentor. Please log into the Student Portal to review your mentor contact card and lock in your first bilateral coaching session before September 03.

Key Stage 3 Deliverables Checklist:
1. Validated Solution Brief (800 words max)
2. Pitch Deck v3 (PDF/PPTX, max 12 slides)
3. 3-Minute Working Prototype Demonstration Video
4. Public/Evaluator Git Repository with architecture blueprint
5. Unit Economics & Break-Even Projections

Ensure all members have verified their institutional KYC status before the calibration lock.

In solidarity with AU Agenda 2063,
AUC Continental Secretariat HQ`
    },
    finals: {
      group: 'stage3',
      subject: 'Urgent: Continental Finals Travel, Visa & Clearance Protocol (Addis Ababa)',
      body: `Dear Team Leads,

The African Union Commission and WASARD Organization are delighted to officially invite your team to the Continental Finals in Addis Ababa, Ethiopia from October 15–18, 2026.

Diplomatic visa support letters and flight booking credentials have been deposited into your Student Portal under 'Resources'. Please ensure:
1. Team passport expiration dates exceed April 2027.
2. Completed yellow fever and travel health clearances are uploaded.
3. Your Dean endorsement certificate is stamped and verified.

For immediate concierge inquiries, contact the Secretariat travel desk via travel@auc2026.org.

Warm regards,
AUC Protocol & Logistics Directorate`
    },
    judges: {
      group: 'judges',
      subject: 'Notice: Stage 3 Rubric Calibration & Review Queue Score Lock',
      body: `Distinguished Evaluators,

Thank you for your dedicated service across the 7 AU Agenda 2063 Innovation Pillars.

Please be reminded that the Stage 3 Review Queue locks in exactly 9 days. Kindly review your assigned team submissions in the Judge Portal and finalize your weighted scoring across all 5 rubric criteria:
- Problem Relevance (25%)
- Deep Tech Architecture (25%)
- Unit Economics & Feasibility (20%)
- AU Agenda 2063 Impact (20%)
- Pitch Articulation (10%)

Ensure all conflict of interest disclosures are submitted prior to Friday's calibration session.

With gratitude,
AUC Academic & Jury Directorate`
    },
    partners: {
      group: 'partners',
      subject: 'AfCFTA Innovation Demo Day: Official VIP Partner Preamble & Pass',
      body: `Dear Institutional Partner,

On behalf of the African Undergraduate Challenge Secretariat, we have the distinct pleasure of presenting your VIP Credentials for the AfCFTA Continental Demo Day.

You are invited to join ministers of innovation, multilateral investment directors, and continental corporate leaders as the top 15 student teams pitch for the $250,000 Innovation Seed Fund.

Your co-branded memorandum of understanding and deal-flow schedule are accessible in your Partner dashboard.

Respectfully yours,
Directorate of Strategic Partnerships, AUC`
    }
  };

  window.loadBroadcastTemplate = function (key) {
    if (!key || !BROADCAST_TEMPLATES[key]) return;
    const t = BROADCAST_TEMPLATES[key];
    $('#emailGroup').value = t.group;
    $('#emailSubject').value = t.subject;
    $('#emailBody').value = t.body;
    showAdminToast(`Loaded template: "${t.subject.slice(0, 30)}..."`, 'fa-magic', 'var(--neon-cyan)');
  };

  window.openBroadcastPreview = function () {
    const group = $('#emailGroup')?.value || 'all';
    const subject = $('#emailSubject')?.value.trim() || 'Official AUC Continental Bulletin';
    const body = $('#emailBody')?.value.trim() || 'No message content provided.';

    const audienceMap = {
      all: '2,847 Registered Teams (54 African Nations)',
      stage3: '384 Stage 3 Finalist Teams (Regional Accelerators)',
      judges: '142 Active Continental Judges & Assessors',
      partners: '84 Strategic Partners & Corporate Foundations'
    };

    $('#previewAudienceCount').textContent = audienceMap[group] || audienceMap.all;
    $('#previewSubject').textContent = subject;
    $('#previewBody').textContent = body;
    $('#previewDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const modal = $('#adminBroadcastPreviewModal');
    if (modal) modal.hidden = false;
  };

  window.confirmDispatchBroadcast = function () {
    const group = $('#emailGroup').value;
    const subject = $('#emailSubject').value;
    const body = $('#emailBody').value;

    const queue = JSON.parse(localStorage.getItem('auc_email_queue') || '[]');
    const now = new Date();
    queue.unshift({
      id: 'eml-' + Date.now(),
      group,
      subject,
      body,
      status: 'Sent',
      timestamp: now.toLocaleString()
    });
    localStorage.setItem('auc_email_queue', JSON.stringify(queue));

    const modal = $('#adminBroadcastPreviewModal');
    if (modal) modal.hidden = true;

    if (window.renderEmailQueue) window.renderEmailQueue();
    logAdminAudit('Admin HQ', `Dispatched broadcast "${subject}" to ${group.toUpperCase()}`, 'approved');
    showAdminToast(`Broadcast "${subject}" dispatched to all recipients!`, 'fa-paper-plane', 'var(--neon-green)');
  };

  // 6. CSV EXPORTS
  window.exportAdminAuditLog = function () {
    const rows = $$('.audit-log .audit-row:not(.head)');
    let csv = 'Timestamp,Actor,Action,Status\n';
    rows.forEach(r => {
      const cols = Array.from(r.children).map(c => `"${c.textContent.trim().replace(/"/g, '""')}"`);
      csv += cols.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `auc_audit_log_${Date.now()}.csv`;
    a.click();
    showAdminToast('Exported audit log to CSV!', 'fa-file-excel', 'var(--neon-green)');
  };

  window.exportAdminTeamsCsv = function () {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('auc_registrations') || '[]'); } catch(e){}
    const all = [...stored.map(t => ({
      lead: t.lead,
      uni: t.uni,
      country: t.country,
      track: t.track,
      assessor: t.assignedAssessor ? t.assignedAssessor.name : 'Dr. Kwame Acheampong'
    })), ...defaultTeams];

    let csv = 'Team Lead,University,Country,Innovation Track,Assigned Assessor\n';
    all.forEach(t => {
      csv += `"${t.lead}","${t.uni}","${t.country}","${t.track}","${t.assessor}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `auc_teams_pipeline_${Date.now()}.csv`;
    a.click();
    showAdminToast('Exported teams pipeline to CSV!', 'fa-file-csv', 'var(--neon-cyan)');
  };

  // 7. SEARCH FILTERS
  window.filterAdminTeamsTable = function (q) {
    const val = (q || '').toLowerCase();
    $$('.team-routing-row').forEach(r => {
      const data = r.dataset.query || r.textContent.toLowerCase();
      r.style.display = data.includes(val) ? 'grid' : 'none';
    });
  };

  window.filterAdminPartnersTable = function (q) {
    const val = (q || '').toLowerCase();
    $$('.partner-row').forEach(r => {
      const data = (r.dataset.org || '') + ' ' + r.textContent.toLowerCase();
      r.style.display = data.includes(val) ? 'grid' : 'none';
    });
  };

  // 8. CMS PAGES MANAGER (Elementor Launch & Quick Edit)
  window.initCmsPagesManager = async function () {
    const table = $('#adminPagesTable');
    if (!table) return;

    try {
      const res = await fetch('/api/cms/pages');
      const json = await res.json();
      const pages = json.ok && Array.isArray(json.data) ? json.data : [];

      table.innerHTML = `
        <div class="row head" style="grid-template-columns: 2fr 100px 140px 140px 80px 220px;">
          <div>Page Title &amp; Slug</div>
          <div>Status</div>
          <div>Desk Author</div>
          <div>Last Modified</div>
          <div>Blocks</div>
          <div style="text-align:right;">Actions</div>
        </div>
        ${pages.map(p => `
          <div class="row" style="grid-template-columns: 2fr 100px 140px 140px 80px 220px; align-items:center;">
            <div>
              <strong>${p.title}</strong>
              <div style="font-size:.78rem;color:var(--text-mute);margin-top:.2rem;">
                <code style="color:var(--neon-cyan);">${p.slug}.html</code>
              </div>
            </div>
            <div>
              <span class="badge-tiny ${p.status === 'published' ? 'ok' : 'warn'}">
                ${(p.status || 'published').toUpperCase()}
              </span>
            </div>
            <div>
              <small style="color:var(--text-soft);">${p.author || 'Admin HQ'}</small>
            </div>
            <div>
              <small style="color:var(--text-mute);">${new Date(p.lastModified).toLocaleDateString()}</small>
            </div>
            <div>
              <span class="badge-tiny info">${p.blocksCount || 0}</span>
            </div>
            <div style="display:flex;gap:.4rem;justify-content:flex-end;">
              <a href="cms-editor.html?page=${p.slug}" class="btn btn-primary" style="padding:.3rem .65rem;font-size:.75rem;" title="Edit with Elementor / CMS">
                <i class="fas fa-feather-alt"></i> Elementor
              </a>
              <button type="button" class="btn btn-outline" style="padding:.3rem .55rem;font-size:.75rem;" onclick="openAdminQuickEdit('${p.slug}')" title="Quick Edit">
                <i class="fas fa-bolt"></i>
              </button>
              <a href="${p.slug}.html" target="_blank" class="btn btn-ghost" style="padding:.3rem .55rem;font-size:.75rem;" title="View Live">
                <i class="fas fa-external-link-alt"></i>
              </a>
            </div>
          </div>
        `).join('')}
      `;
    } catch (e) {
      console.warn('Could not load CMS pages table', e);
    }
  };

  window.openAdminQuickEdit = async function (slug) {
    try {
      const res = await fetch(`/api/cms/pages/${slug}`);
      const json = await res.json();
      if (!json.ok || !json.data) return;
      const p = json.data;

      $('#qeSlug').value = p.slug;
      $('#qeSlugLabel').textContent = `Editing ${p.slug}.html`;
      $('#qeTitle').value = p.title || '';
      $('#qeStatus').value = p.status || 'published';
      $('#qeExcerpt').value = p.metaDesc || '';

      const modal = $('#adminQuickEditModal');
      if (modal) modal.hidden = false;
    } catch (e) {
      showAdminToast('Could not fetch page details', 'fa-times', 'var(--africa-red)');
    }
  };

  window.submitAdminQuickEdit = async function () {
    const slug = $('#qeSlug').value;
    const title = $('#qeTitle').value.trim();
    const status = $('#qeStatus').value;
    const metaDesc = $('#qeExcerpt').value.trim();

    try {
      const res = await fetch(`/api/cms/pages/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status, metaDesc })
      });
      const data = await res.json();
      if (data.ok) {
        showAdminToast(`Page "${title}" updated successfully!`, 'fa-check', 'var(--neon-green)');
        $('#adminQuickEditModal').hidden = true;
        initCmsPagesManager();
      }
    } catch (e) {
      showAdminToast('Failed to save page settings', 'fa-times', 'var(--africa-red)');
    }
  };

  // 9. USER ACCESS CONTROL (RBAC)
  window.initUserAccessControl = async function () {
    const table = $('#adminUsersTable');
    if (!table) return;

    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      const users = json.ok && Array.isArray(json.data) ? json.data : [];

      table.innerHTML = `
        <div class="row head" style="grid-template-columns: 2fr 140px 2.5fr 110px 140px;">
          <div>User &amp; Username</div>
          <div>Role Clearance</div>
          <div>Granted Permissions</div>
          <div>Status</div>
          <div style="text-align:right;">Actions</div>
        </div>
        ${users.map(u => {
          const perms = u.permissions || {};
          const badges = [];
          if (perms.canEditPages) badges.push('<span class="badge-tiny ok">CMS Pages</span>');
          if (perms.canManageUsers) badges.push('<span class="badge-tiny gold">User Mgmt</span>');
          if (perms.canAccessJudges) badges.push('<span class="badge-tiny cyan">Judges</span>');
          if (perms.canSubmissions || perms.canApprovePartners) badges.push('<span class="badge-tiny info">Ops &amp; MOUs</span>');
          if (perms.canChangeSettings) badges.push('<span class="badge-tiny warn">Settings</span>');

          return `
            <div class="row" style="grid-template-columns: 2fr 140px 2.5fr 110px 140px; align-items:center;">
              <div>
                <strong>${u.name}</strong>
                <div style="font-size:.78rem;color:var(--text-mute);">@${u.username} · <span style="color:var(--neon-cyan);">${u.email || 'No email'}</span></div>
              </div>
              <div>
                <span class="task-tag ${u.role === 'Super Admin' ? 'done' : u.role === 'Chief Editor' ? 'cyan' : 'warn'}">
                  ${u.role}
                </span>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:.35rem;">
                ${badges.join('') || '<small style="color:var(--text-mute);">Standard Portal Access</small>'}
              </div>
              <div>
                <span class="badge-tiny ${u.status === 'active' ? 'ok' : 'warn'}">
                  ${(u.status || 'active').toUpperCase()}
                </span>
              </div>
              <div style="display:flex;gap:.35rem;justify-content:flex-end;">
                <button type="button" class="btn btn-ghost" style="padding:.25rem .5rem;font-size:.75rem;" onclick="toggleAdminUserStatus('${u.id}')" title="Toggle Active / Suspended">
                  <i class="fas ${u.status === 'active' ? 'fa-user-slash' : 'fa-user-check'}" style="color:${u.status === 'active' ? 'var(--neon-gold)' : 'var(--neon-green)'};"></i>
                </button>
                <button type="button" class="btn btn-ghost" style="padding:.25rem .5rem;font-size:.75rem;color:var(--africa-red);" onclick="deleteAdminUser('${u.id}', '${u.username}')" title="Revoke &amp; Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      `;
    } catch (e) {
      console.warn('Could not load users table', e);
    }
  };

  window.openAddUserModal = function () {
    const modal = $('#adminAddUserModal');
    if (modal) modal.hidden = false;
  };

  window.autoCheckPermissionsForRole = function (role) {
    const isSuper = role === 'Super Admin';
    const isEditor = role === 'Chief Editor' || isSuper;
    const isLeadJudge = role === 'Lead Assessor' || isSuper;
    const isSec = role === 'Secretariat Staff' || isSuper;

    $('#permEditPages').checked = isEditor;
    $('#permManageUsers').checked = isSuper;
    $('#permJudges').checked = isLeadJudge;
    $('#permSubmissions').checked = isSec || isSuper;
    $('#permPartners').checked = isSec || isSuper;
    $('#permSettings').checked = isSuper;
  };

  window.submitAdminNewUser = async function () {
    const name = $('#nuName').value.trim();
    const username = $('#nuUser').value.trim();
    const email = $('#nuEmail').value.trim();
    const password = $('#nuPass').value;
    const role = $('#nuRole').value;

    const permissions = {
      canEditPages: $('#permEditPages').checked,
      canManageUsers: $('#permManageUsers').checked,
      canAccessJudges: $('#permJudges').checked,
      canSubmissions: $('#permSubmissions').checked,
      canApprovePartners: $('#permPartners').checked,
      canChangeSettings: $('#permSettings').checked
    };

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, role, permissions })
      });
      const data = await res.json();
      if (data.ok) {
        showAdminToast(`Granted access to ${username} (${role})!`, 'fa-check', 'var(--neon-green)');
        $('#adminAddUserModal').hidden = true;
        $('#adminAddUserForm').reset();
        initUserAccessControl();
      }
    } catch (e) {
      showAdminToast('Failed to create user', 'fa-times', 'var(--africa-red)');
    }
  };

  window.toggleAdminUserStatus = async function (id) {
    try {
      const getRes = await fetch(`/api/admin/users/${id}`);
      const json = await getRes.json();
      if (!json.ok || !json.data) return;
      const nextStatus = json.data.status === 'active' ? 'suspended' : 'active';

      await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      showAdminToast(`User status set to ${nextStatus}`, 'fa-info-circle', 'var(--neon-cyan)');
      initUserAccessControl();
    } catch (e) {
      showAdminToast('Could not update user status', 'fa-times', 'var(--africa-red)');
    }
  };

  window.deleteAdminUser = async function (id, username) {
    if (!confirm(`Are you sure you want to permanently revoke access for @${username}?`)) return;
    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      showAdminToast(`Revoked access for @${username}`, 'fa-trash', 'var(--africa-red)');
      initUserAccessControl();
    } catch (e) {
      showAdminToast('Failed to delete user', 'fa-times', 'var(--africa-red)');
    }
  };

  // 10. SYSTEM SETTINGS & SITE CONTROLS
  window.initSystemSettings = async function () {
    try {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (!json.ok || !json.data) return;
      const s = json.data;

      if ($('#cfgRegStatus')) $('#cfgRegStatus').value = s.registrationStatus || 'open';
      if ($('#cfgCurrentStage')) $('#cfgCurrentStage').value = s.currentStage || 'Stage 1: Institutional & National Rounds';
      if ($('#cfgJudgingRound')) $('#cfgJudgingRound').value = s.judgingRound || 'Stage 1 Preliminary Assessment';
      if ($('#cfgBannerNotice')) $('#cfgBannerNotice').value = s.bannerNotice || '';
      if ($('#cfgBannerActive')) $('#cfgBannerActive').checked = s.bannerActive !== false;
      if ($('#cfgMaintenance')) $('#cfgMaintenance').checked = !!s.maintenanceMode;
      if ($('#cfgContactEmail')) $('#cfgContactEmail').value = s.contactEmail || 'secretariat@auc2026.org';
      if ($('#cfgContactPhone')) $('#cfgContactPhone').value = s.contactPhone || '+251 11 551 7700';
      if ($('#cfgHqLocation')) $('#cfgHqLocation').value = s.hqLocation || 'African Union Commission HQ, Roosevelt St, Addis Ababa, Ethiopia';
    } catch (e) {
      console.warn('Could not load site settings', e);
    }
  };

  window.saveAdminSystemSettings = async function () {
    const payload = {
      registrationStatus: $('#cfgRegStatus')?.value || 'open',
      currentStage: $('#cfgCurrentStage')?.value || '',
      judgingRound: $('#cfgJudgingRound')?.value || '',
      bannerNotice: $('#cfgBannerNotice')?.value || '',
      bannerActive: $('#cfgBannerActive')?.checked || false,
      maintenanceMode: $('#cfgMaintenance')?.checked || false,
      contactEmail: $('#cfgContactEmail')?.value || '',
      contactPhone: $('#cfgContactPhone')?.value || '',
      hqLocation: $('#cfgHqLocation')?.value || ''
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        showAdminToast('Global site settings updated & saved!', 'fa-check-circle', 'var(--neon-green)');
        const alert = $('#settingsSaveAlert');
        if (alert) {
          alert.style.display = 'block';
          alert.innerHTML = '<i class="fas fa-check-circle"></i> System settings successfully saved and applied to all visitor sessions across the continent!';
          setTimeout(() => { alert.style.display = 'none'; }, 4000);
        }
      }
    } catch (e) {
      showAdminToast('Failed to save settings', 'fa-times', 'var(--africa-red)');
    }
  };

  // 10.1 REAL-TIME TELEMETRY & SYSTEM HEALTH
  async function updateAdminTelemetry() {
    const tStart = performance.now();
    try {
      let tel = null;
      if (window.AUC_API && window.AUC_API.admin) {
        tel = await window.AUC_API.admin.getTelemetry();
      }
      const tEnd = performance.now();
      const latencyMs = Math.max(1, Math.round(tEnd - tStart));

      const statusBadge = $('#telemetryStatusBadge');
      const uptimeEl = $('#telemetryUptime');
      const latencyEl = $('#telemetryLatency');
      const memoryEl = $('#telemetryMemory');
      const pagesEl = $('#telemetryPages');

      // Strip elements
      const stripUptime = $('#telemetryUptimeStrip');
      const stripLatency = $('#telemetryLatencyStrip');
      const stripSync = $('#telemetryLastSync');

      if (statusBadge) {
        statusBadge.className = 'badge-tiny ok';
        statusBadge.innerHTML = '<i class="fas fa-circle" style="font-size:.5rem;margin-right:.3rem;"></i> 100% Operational';
      }
      if (uptimeEl) {
        uptimeEl.innerHTML = `<i class="fas fa-bolt"></i> ${tel?.uptimeFormatted || 'Active (Online)'}`;
      }
      if (latencyEl) {
        const latColor = latencyMs < 50 ? 'var(--c-green)' : latencyMs < 150 ? 'var(--c-gold)' : 'var(--c-red)';
        latencyEl.innerHTML = `<i class="fas fa-gauge" style="color:${latColor}"></i> <span style="color:${latColor}">${latencyMs}ms</span> Latency`;
      }
      if (memoryEl) {
        memoryEl.innerHTML = `<i class="fas fa-microchip"></i> ${tel?.memoryHeapUsed || '28.4 MB'}`;
      }
      if (pagesEl && tel?.stats) {
        pagesEl.innerHTML = `<i class="fas fa-file"></i> ${tel.stats.pagesCount || 8} Active Pages`;
      }

      // Update strip
      if (stripUptime) stripUptime.textContent = tel?.uptimeFormatted || 'Online';
      if (stripLatency) stripLatency.textContent = latencyMs + 'ms';
      if (stripSync) {
        const now = new Date();
        stripSync.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    } catch (e) {
      console.warn('Telemetry update failed', e);
    }
  }

  // 11. INITIALIZATION
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
    initPartnershipInbox();
    initAdminTeams();
    initCmsPagesManager();
    initUserAccessControl();
    initSystemSettings();
    initModals();
    updateAdminTelemetry();
    setInterval(updateAdminTelemetry, 10000);

    window.addEventListener('storage', (e) => {
      if (e.key === 'auc_registrations' || e.key === 'auc_partner_inquiries' || e.key === 'auc_audit_events') {
        initAdminTeams();
        initPartnershipInbox();
        updateAdminTelemetry();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

