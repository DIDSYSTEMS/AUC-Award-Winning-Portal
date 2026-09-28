/**
 * AUC Central API & Data Client
 * African Undergraduate Challenge (AUC) 2026
 *
 * Dual-Mode Architecture:
 * - Online: Communicates with local or cloud REST API (/api/*)
 * - Offline/Static: Resilient local fallback via localStorage
 * - Real-time DOM event broadcasting for dynamic UI synchronization
 */
(function (root) {
  'use strict';

  const API_BASE = '/api';
  const STORAGE_KEYS = {
    registrations: 'auc_registrations',
    activeTeam: 'auc_active_team',
    partnerships: 'auc_partner_inquiries',
    contact: 'auc_contact_messages',
    judgeScores: 'auc_judge_scores',
    judgeDisclosures: 'auc_judge_disclosures',
    audit: 'auc_audit_events',
    announcements: 'auc_announcements'
  };

  // Helper: Safe LocalStorage read/write
  const storage = {
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn('[AUC_API] Storage read error for', key, e);
        return defaultValue;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('[AUC_API] Storage write error for', key, e);
        return false;
      }
    }
  };

  // Helper: Event Dispatcher
  function broadcast(eventName, detail) {
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch (e) {}
  }

  // Network request wrapper with timeout and automatic fallback
  async function request(endpoint, options = {}) {
    const url = API_BASE + endpoint;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 4000);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options.headers || {})
        },
        signal: controller.signal,
        ...options
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      // Returns null to signal fallback to offline storage
      return null;
    }
  }

  // API Service Definitions
  const AUC_API = {
    version: '1.0.0',
    isOnline: false,

    async checkHealth() {
      const res = await request('/health', { timeout: 2000 });
      this.isOnline = !!(res && res.status === 'ok');
      return this.isOnline;
    },

    // 1. REGISTRATIONS
    registrations: {
      async submit(regData) {
        const payload = {
          ...regData,
          id: regData.id || ('AUC-2026-' + Math.floor(1000 + Math.random() * 9000)),
          submittedAt: regData.submittedAt || new Date().toISOString()
        };

        // Attempt Network API
        const netRes = await request('/registrations', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        // Always update local cache
        const local = storage.get(STORAGE_KEYS.registrations, []);
        const existingIdx = local.findIndex(r => r.id === payload.id);
        if (existingIdx >= 0) {
          local[existingIdx] = payload;
        } else {
          local.unshift(payload);
        }
        storage.set(STORAGE_KEYS.registrations, local);
        storage.set(STORAGE_KEYS.activeTeam, payload);

        // Auto log to audit trail
        AUC_API.audit.log(
          payload.lead + ' (' + (payload.uni || 'Applicant') + ')',
          'Submitted Continental Registration for ' + (payload.venture || payload.name),
          'registered'
        );

        broadcast('auc:registration:created', payload);
        return { ok: true, data: payload, source: netRes ? 'api' : 'local' };
      },

      async getAll() {
        const netRes = await request('/registrations');
        if (netRes && Array.isArray(netRes.data)) {
          storage.set(STORAGE_KEYS.registrations, netRes.data);
          return netRes.data;
        }
        return storage.get(STORAGE_KEYS.registrations, []);
      },

      async getById(id) {
        const netRes = await request(`/registrations/${id}`);
        if (netRes && netRes.data) return netRes.data;
        const all = storage.get(STORAGE_KEYS.registrations, []);
        return all.find(r => r.id === id) || null;
      },

      async update(id, updates) {
        const netRes = await request(`/registrations/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });

        const all = storage.get(STORAGE_KEYS.registrations, []);
        const idx = all.findIndex(r => r.id === id);
        if (idx !== -1) {
          all[idx] = { ...all[idx], ...updates };
          storage.set(STORAGE_KEYS.registrations, all);
          const active = storage.get(STORAGE_KEYS.activeTeam, null);
          if (active && active.id === id) {
            storage.set(STORAGE_KEYS.activeTeam, all[idx]);
          }
        }
        broadcast('auc:registration:updated', { id, updates });
        return { ok: true, source: netRes ? 'api' : 'local' };
      }
    },

    // 2. PARTNERSHIPS
    partnerships: {
      async submit(partnerData) {
        const payload = {
          ...partnerData,
          ref: partnerData.ref || ('AUC-PART-' + Math.floor(Math.random() * 9000 + 1000)),
          status: partnerData.status || 'Under Review',
          submittedAt: partnerData.submittedAt || new Date().toISOString()
        };

        const netRes = await request('/partnerships', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const local = storage.get(STORAGE_KEYS.partnerships, []);
        local.unshift(payload);
        storage.set(STORAGE_KEYS.partnerships, local);

        // Log audit
        AUC_API.audit.log(
          payload.org + ' (' + (payload.contact || 'Representative') + ')',
          'Submitted ' + (payload.tier || 'Custom').toUpperCase() + ' Partnership Inquiry (' + (payload.budget || 'TBD') + ')',
          'Inquiry Logged'
        );

        broadcast('auc:partnership:created', payload);
        return { ok: true, data: payload, source: netRes ? 'api' : 'local' };
      },

      async getAll() {
        const netRes = await request('/partnerships');
        if (netRes && Array.isArray(netRes.data)) {
          storage.set(STORAGE_KEYS.partnerships, netRes.data);
          return netRes.data;
        }
        return storage.get(STORAGE_KEYS.partnerships, []);
      },

      async updateStatus(ref, status) {
        const netRes = await request(`/partnerships/${ref}`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });

        const all = storage.get(STORAGE_KEYS.partnerships, []);
        const idx = all.findIndex(p => p.ref === ref);
        if (idx !== -1) {
          all[idx].status = status;
          storage.set(STORAGE_KEYS.partnerships, all);
        }
        broadcast('auc:partnership:updated', { ref, status });
        return { ok: true, source: netRes ? 'api' : 'local' };
      }
    },

    // 3. CONTACT & SECRETARIAT INQUIRIES
    contact: {
      async submit(msgData) {
        const payload = {
          ...msgData,
          id: 'MSG-' + Math.floor(10000 + Math.random() * 90000),
          status: 'New',
          submittedAt: new Date().toISOString()
        };

        const netRes = await request('/contact', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const local = storage.get(STORAGE_KEYS.contact, []);
        local.unshift(payload);
        storage.set(STORAGE_KEYS.contact, local);

        AUC_API.audit.log(
          payload.name + ' (' + payload.email + ')',
          'Contact Message: ' + (payload.category || 'General Inquiry'),
          'received'
        );

        broadcast('auc:contact:created', payload);
        return { ok: true, data: payload, source: netRes ? 'api' : 'local' };
      },

      async getAll() {
        const netRes = await request('/contact');
        if (netRes && Array.isArray(netRes.data)) {
          storage.set(STORAGE_KEYS.contact, netRes.data);
          return netRes.data;
        }
        return storage.get(STORAGE_KEYS.contact, []);
      }
    },

    // 4. JUDGING & SCORES
    judging: {
      async saveScore(teamId, scorePayload) {
        const payload = {
          teamId,
          ...scorePayload,
          updatedAt: new Date().toISOString()
        };

        const netRes = await request('/scores', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const saved = storage.get(STORAGE_KEYS.judgeScores, {});
        saved[teamId] = payload;
        storage.set(STORAGE_KEYS.judgeScores, saved);

        broadcast('auc:score:updated', payload);
        return { ok: true, data: payload, source: netRes ? 'api' : 'local' };
      },

      async getScores() {
        const netRes = await request('/scores');
        if (netRes && netRes.data) {
          storage.set(STORAGE_KEYS.judgeScores, netRes.data);
          return netRes.data;
        }
        return storage.get(STORAGE_KEYS.judgeScores, {});
      },

      async submitCoi(coiData) {
        const payload = {
          ...coiData,
          id: 'COI-' + Date.now(),
          submittedAt: new Date().toISOString()
        };

        const netRes = await request('/judging/coi', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const disclosures = storage.get(STORAGE_KEYS.judgeDisclosures, []);
        disclosures.unshift(payload);
        storage.set(STORAGE_KEYS.judgeDisclosures, disclosures);

        AUC_API.audit.log(
          payload.judgeName || 'Judge',
          `Filed Conflict of Interest for ${payload.teamName || payload.teamId}`,
          'recused'
        );

        broadcast('auc:coi:created', payload);
        return { ok: true, data: payload, source: netRes ? 'api' : 'local' };
      }
    },

    // 5. AUDIT TRAIL
    audit: {
      async log(actor, action, status = 'stored') {
        const now = new Date();
        const stamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const entry = {
          id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          actor,
          action,
          status,
          time: stamp,
          timestamp: now.toISOString()
        };

        request('/audit', {
          method: 'POST',
          body: JSON.stringify(entry)
        }).catch(() => {});

        const local = storage.get(STORAGE_KEYS.audit, []);
        local.unshift(entry);
        if (local.length > 100) local.length = 100; // Cap at 100
        storage.set(STORAGE_KEYS.audit, local);

        broadcast('auc:audit:logged', entry);
        return entry;
      },

      async getEvents() {
        const netRes = await request('/audit');
        if (netRes && Array.isArray(netRes.data)) {
          storage.set(STORAGE_KEYS.audit, netRes.data);
          return netRes.data;
        }
        return storage.get(STORAGE_KEYS.audit, []);
      }
    },

    // 6. ANNOUNCEMENTS & BROADCASTS
    announcements: {
      async broadcast(announcement) {
        const payload = {
          id: 'ANN-' + Date.now(),
          ...announcement,
          createdAt: new Date().toISOString()
        };

        const netRes = await request('/announcements', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const list = storage.get(STORAGE_KEYS.announcements, []);
        list.unshift(payload);
        storage.set(STORAGE_KEYS.announcements, list);

        AUC_API.audit.log(
          'Admin HQ',
          `Dispatched Continental Broadcast: "${payload.title || 'Announcement'}"`,
          'broadcast'
        );

        broadcast('auc:announcement:created', payload);
        return { ok: true, data: payload, source: netRes ? 'api' : 'local' };
      },

      async getAll() {
        const netRes = await request('/announcements');
        if (netRes && Array.isArray(netRes.data)) {
          storage.set(STORAGE_KEYS.announcements, netRes.data);
          return netRes.data;
        }
        return storage.get(STORAGE_KEYS.announcements, []);
      }
    },

    // 7. CMS PAGES & CONTENT
    cms: {
      async getPages() {
        const res = await request('/cms/pages');
        if (res && res.ok && Array.isArray(res.data)) return res.data;
        // Local fallback
        const local = storage.get('auc_cms_pages_summary', [
          { slug: 'index', title: 'Home — AUC', status: 'published', lastModified: new Date().toISOString(), author: 'Secretariat Admin', blocksCount: 5 },
          { slug: 'about', title: 'About AUC', status: 'published', lastModified: new Date().toISOString(), author: 'Dr. Amara Kone', blocksCount: 5 },
          { slug: 'structure', title: 'Competition Stages & Protocol', status: 'published', lastModified: new Date().toISOString(), author: 'Secretariat Admin', blocksCount: 2 },
          { slug: 'judging', title: 'Judging Matrix & Rubric', status: 'published', lastModified: new Date().toISOString(), author: 'Prof. Tsegaye Mengistu', blocksCount: 1 },
          { slug: 'partnership', title: 'Become an Institutional Partner', status: 'published', lastModified: new Date().toISOString(), author: 'Secretariat Admin', blocksCount: 1 },
          { slug: 'news', title: 'News & Insights', status: 'published', lastModified: new Date().toISOString(), author: 'Dr. Amara Kone', blocksCount: 3 },
          { slug: 'contact', title: 'Contact Secretariat HQ', status: 'published', lastModified: new Date().toISOString(), author: 'Secretariat Admin', blocksCount: 0 },
          { slug: 'sponsors', title: 'Partnership Tiers & Deliverables', status: 'published', lastModified: new Date().toISOString(), author: 'Secretariat Admin', blocksCount: 0 }
        ]);
        return local;
      },

      async getPage(slug) {
        const res = await request(`/cms/pages/${slug}`);
        if (res && res.ok && res.data) return res.data;
        const localAll = storage.get('auc_cms_pages_full', {});
        return localAll[slug] || null;
      },

      async savePage(slug, pageData) {
        const res = await request(`/cms/pages/${slug}`, {
          method: 'POST',
          body: JSON.stringify(pageData)
        });
        // Cache locally too
        const localAll = storage.get('auc_cms_pages_full', {});
        localAll[slug] = { ...localAll[slug], ...pageData, lastModified: new Date().toISOString() };
        storage.set('auc_cms_pages_full', localAll);
        broadcast('auc:cms:page_saved', { slug, data: pageData });
        return res ? res.data : localAll[slug];
      },

      async restoreRevision(slug, revisionId) {
        const res = await request(`/cms/pages/${slug}/revisions/restore`, {
          method: 'POST',
          body: JSON.stringify({ revisionId })
        });
        return res ? res.data : null;
      },

      async getMedia() {
        const res = await request('/cms/media');
        if (res && res.ok && Array.isArray(res.data)) return res.data;
        return storage.get('auc_media_library', []);
      },

      async uploadMedia(mediaItem) {
        const res = await request('/cms/media', {
          method: 'POST',
          body: JSON.stringify(mediaItem)
        });
        const local = storage.get('auc_media_library', []);
        local.unshift(mediaItem);
        storage.set('auc_media_library', local);
        return res ? res.data : mediaItem;
      },

      async uploadFile(filePayload) {
        const res = await request('/cms/upload', {
          method: 'POST',
          body: JSON.stringify(filePayload)
        });
        if (res && res.data) {
          const local = storage.get('auc_media_library', []);
          local.unshift(res.data);
          storage.set('auc_media_library', local);
          broadcast('auc:cms:media_uploaded', res.data);
          return res.data;
        }
        return this.uploadMedia(filePayload);
      },

      async deleteMedia(id) {
        const res = await request(`/cms/media/${id}`, { method: 'DELETE' });
        const local = storage.get('auc_media_library', []).filter(m => m.id !== id);
        storage.set('auc_media_library', local);
        return res ? res.ok : true;
      },

      async getPosts() {
        const res = await request('/cms/posts');
        if (res && res.ok && Array.isArray(res.data)) return res.data;
        return storage.get('auc_news_items', []);
      },

      async savePost(post) {
        const res = await request('/cms/posts', {
          method: 'POST',
          body: JSON.stringify(post)
        });
        const local = storage.get('auc_news_items', []);
        local.unshift(post);
        storage.set('auc_news_items', local);
        return res ? res.data : post;
      },

      async deletePost(id) {
        const res = await request(`/cms/posts/${id}`, { method: 'DELETE' });
        const local = storage.get('auc_news_items', []).filter(p => p.id !== id && p.slug !== id);
        storage.set('auc_news_items', local);
        return res ? res.ok : true;
      }
    },

    // 8. ADMIN USER ACCESS & SITE CONTROLS
    admin: {
      async getUsers() {
        const res = await request('/admin/users');
        if (res && res.ok && Array.isArray(res.data)) return res.data;
        return storage.get('auc_admin_users', []);
      },

      async createUser(userData) {
        const res = await request('/admin/users', {
          method: 'POST',
          body: JSON.stringify(userData)
        });
        const local = storage.get('auc_admin_users', []);
        const item = res && res.data ? res.data : { ...userData, id: 'usr-' + Date.now() };
        local.push(item);
        storage.set('auc_admin_users', local);
        return item;
      },

      async updateUser(id, updates) {
        const res = await request(`/admin/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        const local = storage.get('auc_admin_users', []);
        const idx = local.findIndex(u => u.id === id || u.username === id);
        if (idx !== -1) {
          local[idx] = { ...local[idx], ...updates };
          storage.set('auc_admin_users', local);
        }
        return res ? res.data : (idx !== -1 ? local[idx] : null);
      },

      async deleteUser(id) {
        const res = await request(`/admin/users/${id}`, { method: 'DELETE' });
        const local = storage.get('auc_admin_users', []).filter(u => u.id !== id && u.username !== id);
        storage.set('auc_admin_users', local);
        return res ? res.ok : true;
      },

      async getSettings() {
        const res = await request('/admin/settings');
        if (res && res.ok && res.data) return res.data;
        return storage.get('auc_site_settings', {});
      },

      async saveSettings(settings) {
        const res = await request('/admin/settings', {
          method: 'PUT',
          body: JSON.stringify(settings)
        });
        storage.set('auc_site_settings', settings);
        broadcast('auc:admin:settings_updated', settings);
        return res ? res.data : settings;
      },

      async getTelemetry() {
        const res = await request('/admin/telemetry');
        if (res && res.ok) return res;
        return {
          ok: true,
          status: 'HEALTHY',
          uptimeFormatted: 'Active',
          memoryHeapUsed: '24.50 MB',
          stats: {
            registrationsCount: storage.get(STORAGE_KEYS.registrations, []).length,
            partnershipsCount: storage.get(STORAGE_KEYS.partnerships, []).length,
            contactsCount: storage.get(STORAGE_KEYS.contact, []).length,
            pagesCount: 8,
            mediaCount: storage.get('auc_media_library', []).length,
            postsCount: storage.get('auc_news_items', []).length
          }
        };
      }
    }
  };

  // Immediate initial health check
  AUC_API.checkHealth().catch(() => {});

  // Expose globally
  root.AUC_API = AUC_API;

})(typeof window !== 'undefined' ? window : this);
