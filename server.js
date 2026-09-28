/**
 * AUC Central REST API & Static Server
 * Zero-dependency Node.js server for African Undergraduate Challenge
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Data Storage Helpers
function readJson(filename, defaultVal) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf8');
      return defaultVal;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultVal;
  }
}

function writeJson(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    return false;
  }
}

// Initial Seed Data
const DEFAULT_PARTNERS = [
  { ref: 'AUC-PART-9021', org: 'AfCFTA Trade Forum', contact: 'Mamadou Diallo', email: 'trade@afcfta-youth.org', tier: 'platinum', budget: '$250,000', status: 'MOU Drafted', deliverables: 'Pan-African Demo Day Keynote, Trade Corridor Sandbox Integration' },
  { ref: 'AUC-PART-8114', org: 'Pan-African Energy Fund', contact: 'Dr. Sarah Al-Sayed', email: 'partnerships@paefund.org', tier: 'gold', budget: '$100,000', status: 'Under Review', deliverables: 'Aspiration 2 Track Sponsor, Deal-Flow Rights for CleanTech finalists' },
  { ref: 'AUC-PART-7429', org: 'Nairobi Venture Hub', contact: 'Kariuki Mwangi', email: 'ventures@nairobitech.co.ke', tier: 'silver', budget: '$45,000', status: 'Approved', deliverables: 'Regional East Accelerator Host, Talent Recruitment Access' }
];

const DEFAULT_AUDIT = [
  { id: 'AUD-001', actor: 'Secretariat Admin', action: 'Initialized AUC 2026 Continental Portal Core', status: 'stored', time: '09:00', timestamp: new Date().toISOString() }
];

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4'
};

// Request Parser
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 30 * 1024 * 1024) { // 30MB limit for media uploads
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// JSON Response Helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // -------------------------------------------------------------
  // API ROUTING (/api/*)
  // -------------------------------------------------------------
  if (pathname.startsWith('/api')) {
    try {
      // 1. Health
      if (pathname === '/api/health') {
        return sendJson(res, 200, {
          status: 'ok',
          service: 'African Undergraduate Challenge API',
          version: '1.0.0',
          time: new Date().toISOString()
        });
      }

      // 2. Registrations
      if (pathname === '/api/registrations') {
        if (req.method === 'GET') {
          const list = readJson('registrations.json', []);
          return sendJson(res, 200, { ok: true, data: list });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const list = readJson('registrations.json', []);
          list.unshift(body);
          writeJson('registrations.json', list);
          return sendJson(res, 201, { ok: true, data: body });
        }
      }

      // Update registration by ID (/api/registrations/:id)
      const regMatch = pathname.match(/^\/api\/registrations\/(.+)$/);
      if (regMatch) {
        const id = decodeURIComponent(regMatch[1]);
        const list = readJson('registrations.json', []);
        const idx = list.findIndex(r => r.id === id);

        if (req.method === 'GET') {
          if (idx !== -1) return sendJson(res, 200, { ok: true, data: list[idx] });
          return sendJson(res, 404, { ok: false, error: 'Registration not found' });
        }
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const updates = await parseBody(req);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updates };
            writeJson('registrations.json', list);
            return sendJson(res, 200, { ok: true, data: list[idx] });
          }
          return sendJson(res, 404, { ok: false, error: 'Registration not found' });
        }
      }

      // 3. Partnerships
      if (pathname === '/api/partnerships') {
        if (req.method === 'GET') {
          const list = readJson('partnerships.json', DEFAULT_PARTNERS);
          return sendJson(res, 200, { ok: true, data: list });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const list = readJson('partnerships.json', DEFAULT_PARTNERS);
          list.unshift(body);
          writeJson('partnerships.json', list);
          return sendJson(res, 201, { ok: true, data: body });
        }
      }

      const partMatch = pathname.match(/^\/api\/partnerships\/(.+)$/);
      if (partMatch) {
        const ref = decodeURIComponent(partMatch[1]);
        const list = readJson('partnerships.json', DEFAULT_PARTNERS);
        const idx = list.findIndex(p => p.ref === ref);

        if (req.method === 'PATCH' || req.method === 'PUT') {
          const updates = await parseBody(req);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updates };
            writeJson('partnerships.json', list);
            return sendJson(res, 200, { ok: true, data: list[idx] });
          }
          return sendJson(res, 404, { ok: false, error: 'Inquiry not found' });
        }
      }

      // 4. Contact Inquiries
      if (pathname === '/api/contact') {
        if (req.method === 'GET') {
          const list = readJson('contacts.json', []);
          return sendJson(res, 200, { ok: true, data: list });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const list = readJson('contacts.json', []);
          list.unshift(body);
          writeJson('contacts.json', list);
          return sendJson(res, 201, { ok: true, data: body });
        }
      }

      // 5. Scores & Evaluations
      if (pathname === '/api/scores') {
        if (req.method === 'GET') {
          const scores = readJson('scores.json', {});
          return sendJson(res, 200, { ok: true, data: scores });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const scores = readJson('scores.json', {});
          if (body.teamId) {
            scores[body.teamId] = body;
            writeJson('scores.json', scores);
            return sendJson(res, 200, { ok: true, data: body });
          }
          return sendJson(res, 400, { ok: false, error: 'Missing teamId' });
        }
      }

      // 6. Judging Conflict of Interest
      if (pathname === '/api/judging/coi') {
        if (req.method === 'GET') {
          const coi = readJson('disclosures.json', []);
          return sendJson(res, 200, { ok: true, data: coi });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const coi = readJson('disclosures.json', []);
          coi.unshift(body);
          writeJson('disclosures.json', coi);
          return sendJson(res, 201, { ok: true, data: body });
        }
      }

      // 7. Audit Trail
      if (pathname === '/api/audit') {
        if (req.method === 'GET') {
          const list = readJson('audit.json', DEFAULT_AUDIT);
          return sendJson(res, 200, { ok: true, data: list });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const list = readJson('audit.json', DEFAULT_AUDIT);
          list.unshift(body);
          if (list.length > 200) list.length = 200;
          writeJson('audit.json', list);
          return sendJson(res, 201, { ok: true, data: body });
        }
      }

      // 8. Announcements
      if (pathname === '/api/announcements') {
        if (req.method === 'GET') {
          const list = readJson('announcements.json', []);
          return sendJson(res, 200, { ok: true, data: list });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const list = readJson('announcements.json', []);
          list.unshift(body);
          writeJson('announcements.json', list);
          return sendJson(res, 201, { ok: true, data: body });
        }
      }

      // 9. CMS Pages Management (/api/cms/pages)
      if (pathname === '/api/cms/pages') {
        const pages = readJson('pages.json', {});
        if (req.method === 'GET') {
          // Return summary array for table/list
          const summary = Object.keys(pages).map(slug => ({
            slug,
            title: pages[slug].title || slug,
            status: pages[slug].status || 'published',
            lastModified: pages[slug].lastModified || new Date().toISOString(),
            author: pages[slug].author || 'Admin',
            blocksCount: Array.isArray(pages[slug].blocks) ? pages[slug].blocks.length : 0
          }));
          return sendJson(res, 200, { ok: true, data: summary });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const slug = (body.slug || 'page-' + Date.now()).toLowerCase().trim();
          pages[slug] = {
            slug,
            title: body.title || 'Untitled Page',
            status: body.status || 'draft',
            lastModified: new Date().toISOString(),
            author: body.author || 'Admin',
            metaTitle: body.metaTitle || '',
            metaDesc: body.metaDesc || '',
            blocks: body.blocks || [],
            revisions: []
          };
          writeJson('pages.json', pages);
          return sendJson(res, 201, { ok: true, data: pages[slug] });
        }
      }

      // Specific page operations (/api/cms/pages/:slug)
      const pageMatch = pathname.match(/^\/api\/cms\/pages\/([a-zA-Z0-9_-]+)$/);
      if (pageMatch) {
        const slug = pageMatch[1].toLowerCase();
        const pages = readJson('pages.json', {});

        if (req.method === 'GET') {
          if (pages[slug]) {
            return sendJson(res, 200, { ok: true, data: pages[slug] });
          }
          // Return default template if not yet defined
          const defPage = {
            slug,
            title: slug.charAt(0).toUpperCase() + slug.slice(1) + ' — AUC',
            status: 'draft',
            lastModified: new Date().toISOString(),
            author: 'Admin',
            metaTitle: '',
            metaDesc: '',
            blocks: [],
            revisions: []
          };
          return sendJson(res, 200, { ok: true, data: defPage });
        }

        if (req.method === 'PUT' || req.method === 'POST' || req.method === 'PATCH') {
          const body = await parseBody(req);
          const existing = pages[slug] || {
            slug,
            title: body.title || slug,
            status: 'draft',
            revisions: []
          };

          // Save current snapshot into revision history before updating
          const revisions = existing.revisions || [];
          if (existing.blocks && existing.blocks.length) {
            revisions.unshift({
              id: 'rev-' + Date.now(),
              date: new Date().toISOString(),
              author: body.author || 'Editor',
              summary: body.revisionSummary || 'Updated content via Visual CMS Editor',
              blocksCount: existing.blocks.length,
              blocksSnapshot: existing.blocks
            });
            if (revisions.length > 20) revisions.length = 20; // Keep up to 20 revisions
          }

          pages[slug] = {
            ...existing,
            ...body,
            slug,
            lastModified: new Date().toISOString(),
            revisions
          };
          writeJson('pages.json', pages);

          // Also log audit event
          const auditList = readJson('audit.json', DEFAULT_AUDIT);
          auditList.unshift({
            actor: body.author || 'Admin HQ',
            action: `Saved & Published CMS Page: ${pages[slug].title} (${slug})`,
            status: 'published',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
          });
          if (auditList.length > 200) auditList.length = 200;
          writeJson('audit.json', auditList);

          return sendJson(res, 200, { ok: true, data: pages[slug] });
        }

        if (req.method === 'DELETE') {
          if (pages[slug]) {
            delete pages[slug];
            writeJson('pages.json', pages);
            return sendJson(res, 200, { ok: true, message: `Page ${slug} deleted` });
          }
          return sendJson(res, 404, { ok: false, error: 'Page not found' });
        }
      }

      // Restore past page revision (/api/cms/pages/:slug/revisions/restore)
      const revRestoreMatch = pathname.match(/^\/api\/cms\/pages\/([a-zA-Z0-9_-]+)\/revisions\/restore$/);
      if (revRestoreMatch && req.method === 'POST') {
        const slug = revRestoreMatch[1].toLowerCase();
        const body = await parseBody(req);
        const pages = readJson('pages.json', {});
        if (!pages[slug] || !pages[slug].revisions) {
          return sendJson(res, 404, { ok: false, error: 'Revisions not found' });
        }
        const rev = pages[slug].revisions.find(r => r.id === body.revisionId);
        if (!rev || !rev.blocksSnapshot) {
          return sendJson(res, 404, { ok: false, error: 'Revision snapshot not found' });
        }
        pages[slug].blocks = rev.blocksSnapshot;
        pages[slug].lastModified = new Date().toISOString();
        writeJson('pages.json', pages);
        return sendJson(res, 200, { ok: true, data: pages[slug], message: `Restored to revision from ${rev.date}` });
      }

      // 10. User Management & Access Control (/api/admin/users)
      if (pathname === '/api/admin/users') {
        const users = readJson('users.json', []);
        if (req.method === 'GET') {
          // Return users without sensitive password if needed, or with mask
          return sendJson(res, 200, { ok: true, data: users });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          if (!body.username || !body.role) {
            return sendJson(res, 400, { ok: false, error: 'Username and Role are required' });
          }
          const newUser = {
            id: 'usr-' + Date.now(),
            name: body.name || body.username,
            username: body.username.trim(),
            email: body.email || '',
            password: body.password || 'auc@2026',
            role: body.role,
            status: body.status || 'active',
            lastLogin: null,
            permissions: body.permissions || {
              canEditPages: body.role === 'Super Admin' || body.role === 'Chief Editor',
              canManageUsers: body.role === 'Super Admin',
              canAccessJudges: body.role === 'Super Admin' || body.role === 'Lead Assessor',
              canApprovePartners: body.role === 'Super Admin' || body.role === 'Secretariat Staff',
              canSendBroadcasts: body.role === 'Super Admin' || body.role === 'Chief Editor',
              canChangeSettings: body.role === 'Super Admin'
            }
          };
          users.push(newUser);
          writeJson('users.json', users);

          // Log audit
          const auditList = readJson('audit.json', DEFAULT_AUDIT);
          auditList.unshift({
            actor: 'Admin HQ',
            action: `Created new user ${newUser.username} (${newUser.role})`,
            status: 'stored',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
          });
          writeJson('audit.json', auditList);

          return sendJson(res, 201, { ok: true, data: newUser });
        }
      }

      // Specific user operations (/api/admin/users/:id)
      const userMatch = pathname.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)$/);
      if (userMatch) {
        const id = userMatch[1];
        const users = readJson('users.json', []);
        const idx = users.findIndex(u => u.id === id || u.username === id);

        if (req.method === 'GET') {
          if (idx !== -1) return sendJson(res, 200, { ok: true, data: users[idx] });
          return sendJson(res, 404, { ok: false, error: 'User not found' });
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
          const body = await parseBody(req);
          if (idx !== -1) {
            users[idx] = {
              ...users[idx],
              ...body,
              permissions: body.permissions ? { ...users[idx].permissions, ...body.permissions } : users[idx].permissions
            };
            writeJson('users.json', users);

            // Log audit
            const auditList = readJson('audit.json', DEFAULT_AUDIT);
            auditList.unshift({
              actor: 'Admin HQ',
              action: `Updated access permissions for user ${users[idx].username}`,
              status: 'stored',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date().toISOString()
            });
            writeJson('audit.json', auditList);

            return sendJson(res, 200, { ok: true, data: users[idx] });
          }
          return sendJson(res, 404, { ok: false, error: 'User not found' });
        }

        if (req.method === 'DELETE') {
          if (idx !== -1) {
            const removed = users.splice(idx, 1)[0];
            writeJson('users.json', users);
            return sendJson(res, 200, { ok: true, message: `User ${removed.username} deleted` });
          }
          return sendJson(res, 404, { ok: false, error: 'User not found' });
        }
      }

      // 11. System Settings & Site Controls (/api/admin/settings)
      if (pathname === '/api/admin/settings') {
        const settings = readJson('settings.json', {});
        if (req.method === 'GET') {
          return sendJson(res, 200, { ok: true, data: settings });
        }
        if (req.method === 'PUT' || req.method === 'POST') {
          const body = await parseBody(req);
          const updated = { ...settings, ...body, lastUpdated: new Date().toISOString() };
          writeJson('settings.json', updated);

          // Log audit
          const auditList = readJson('audit.json', DEFAULT_AUDIT);
          auditList.unshift({
            actor: 'Admin HQ',
            action: 'Updated global site settings & tournament parameters',
            status: 'stored',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
          });
          writeJson('audit.json', auditList);

          return sendJson(res, 200, { ok: true, data: updated });
        }
      }

      // 12. Media Library (/api/cms/media)
      if (pathname === '/api/cms/media') {
        const media = readJson('media.json', []);
        if (req.method === 'GET') {
          return sendJson(res, 200, { ok: true, data: media });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const newItem = {
            id: 'med-' + Date.now(),
            name: body.name || 'uploaded-asset',
            type: body.type || 'image',
            size: body.size || '500 KB',
            url: body.url || 'assets/img/Logo.png',
            date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            dimensions: body.dimensions || '1600x900'
          };
          media.unshift(newItem);
          writeJson('media.json', media);
          return sendJson(res, 201, { ok: true, data: newItem });
        }
      }

      const mediaMatch = pathname.match(/^\/api\/cms\/media\/([a-zA-Z0-9_-]+)$/);
      if (mediaMatch && req.method === 'DELETE') {
        const id = mediaMatch[1];
        const media = readJson('media.json', []);
        const idx = media.findIndex(m => m.id === id);
        if (idx !== -1) {
          const item = media[idx];
          // Delete physical file on disk if it was an uploaded file
          if (item.url && item.url.startsWith('assets/uploads/')) {
            const diskPath = path.join(__dirname, item.url.replace(/\//g, path.sep));
            if (fs.existsSync(diskPath)) {
              try {
                fs.unlinkSync(diskPath);
              } catch (err) {
                console.error('Failed to unlink deleted media file:', err);
              }
            }
          }
          const deletedName = item.name || id;
          media.splice(idx, 1);
          writeJson('media.json', media);

          // Audit trail
          const auditList = readJson('audit.json', DEFAULT_AUDIT);
          auditList.unshift({
            actor: 'Admin HQ',
            action: `Permanently deleted media asset: ${deletedName}`,
            status: 'deleted',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
          });
          if (auditList.length > 200) auditList.length = 200;
          writeJson('audit.json', auditList);

          return sendJson(res, 200, { ok: true, message: `Media asset "${deletedName}" deleted` });
        }
        return sendJson(res, 404, { ok: false, error: 'Media not found' });
      }

      // 12.1 Real Media Upload Endpoint (/api/cms/upload)
      if (pathname === '/api/cms/upload' && req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.data || !body.name) {
          return sendJson(res, 400, { ok: false, error: 'File data (base64) and name required' });
        }

        const uploadsDir = path.join(__dirname, 'assets', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        let base64Data = body.data;
        if (base64Data.includes(';base64,')) {
          base64Data = base64Data.split(';base64,')[1];
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const cleanName = body.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${cleanName}`;
        const targetPath = path.join(uploadsDir, fileName);

        fs.writeFileSync(targetPath, buffer);

        const sizeKb = (buffer.length / 1024).toFixed(1) + ' KB';
        const fileUrl = `assets/uploads/${fileName}`;
        const ext = path.extname(cleanName).toLowerCase();
        const isVideo = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);

        const mediaItem = {
          id: 'med-' + Date.now(),
          name: body.name,
          type: body.type || (isVideo ? 'video' : 'image'),
          size: sizeKb,
          url: fileUrl,
          date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          dimensions: body.dimensions || (isVideo ? 'HD Video' : 'Original')
        };

        const media = readJson('media.json', []);
        media.unshift(mediaItem);
        writeJson('media.json', media);

        // Audit log
        const auditList = readJson('audit.json', DEFAULT_AUDIT);
        auditList.unshift({
          actor: body.author || 'Admin HQ',
          action: `Uploaded asset: ${body.name} (${sizeKb})`,
          status: 'stored',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString()
        });
        if (auditList.length > 200) auditList.length = 200;
        writeJson('audit.json', auditList);

        return sendJson(res, 201, { ok: true, data: mediaItem });
      }

      // 12.2 Editable Logo Management (/api/admin/logo)
      if (pathname === '/api/admin/logo' && req.method === 'POST') {
        const body = await parseBody(req);
        let buffer = null;

        if (body.data) {
          // Base64 upload
          let b64 = body.data;
          if (b64.includes(';base64,')) b64 = b64.split(';base64,')[1];
          buffer = Buffer.from(b64, 'base64');
        } else if (body.url) {
          // Existing media URL or file path
          let localPath = path.join(__dirname, body.url.replace(/\//g, path.sep));
          if (fs.existsSync(localPath)) {
            buffer = fs.readFileSync(localPath);
          }
        }

        if (!buffer) {
          return sendJson(res, 400, { ok: false, error: 'Valid image data or media URL required' });
        }

        // Write directly to core logo locations
        const logoImgPath = path.join(__dirname, 'assets', 'img', 'Logo.png');
        const logoDirImgPath = path.join(__dirname, 'Logo', 'Logo-AUC.png');
        const faviconAssetsPath = path.join(__dirname, 'assets', 'favicon.png');
        const faviconRootPath = path.join(__dirname, 'favicon.png');
        const faviconIcoPath = path.join(__dirname, 'favicon.ico');

        fs.writeFileSync(logoImgPath, buffer);
        fs.writeFileSync(logoDirImgPath, buffer);
        fs.writeFileSync(faviconAssetsPath, buffer);
        fs.writeFileSync(faviconRootPath, buffer);
        fs.writeFileSync(faviconIcoPath, buffer);

        // Save timestamp in settings
        const settings = readJson('settings.json', {});
        settings.siteLogo = `assets/img/Logo.png?v=${Date.now()}`;
        settings.logoLastModified = new Date().toISOString();
        writeJson('settings.json', settings);

        // Also add to media library if it's not already there
        const media = readJson('media.json', []);
        const logoName = body.name || `Logo-Updated-${Date.now()}.png`;
        const existsInMedia = media.some(m => m.name === logoName);
        if (!existsInMedia && body.data) {
          const uploadsDir = path.join(__dirname, 'assets', 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const uploadFileName = `logo-${Date.now()}.png`;
          fs.writeFileSync(path.join(uploadsDir, uploadFileName), buffer);
          media.unshift({
            id: 'med-logo-' + Date.now(),
            name: logoName,
            type: 'image',
            size: (buffer.length / 1024).toFixed(1) + ' KB',
            url: `assets/uploads/${uploadFileName}`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            dimensions: 'Brand Logo'
          });
          writeJson('media.json', media);
        }

        // Audit log
        const auditList = readJson('audit.json', DEFAULT_AUDIT);
        auditList.unshift({
          actor: 'Admin HQ',
          action: 'Updated Official Continental Logo & Favicon across website',
          status: 'published',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString()
        });
        if (auditList.length > 200) auditList.length = 200;
        writeJson('audit.json', auditList);

        return sendJson(res, 200, {
          ok: true,
          logoUrl: settings.siteLogo,
          message: 'Website logo & favicon updated successfully across all pages!'
        });
      }

      // 12.3 Quick Picture Replacer (/api/admin/replace-image)
      if (pathname === '/api/admin/replace-image' && req.method === 'POST') {
        const body = await parseBody(req);
        const { slot, url: mediaUrl, data: b64Data, name } = body;

        if (!slot) {
          return sendJson(res, 400, { ok: false, error: 'Target slot is required' });
        }

        const settings = readJson('settings.json', {});
        if (!settings.pageAssets) settings.pageAssets = {};

        let finalUrl = mediaUrl;

        // If uploading base64 data for the slot
        if (b64Data) {
          const uploadsDir = path.join(__dirname, 'assets', 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

          let cleanData = b64Data.includes(';base64,') ? b64Data.split(';base64,')[1] : b64Data;
          const buffer = Buffer.from(cleanData, 'base64');
          const cleanName = (name || slot).replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${slot}-${Date.now()}-${cleanName}`;
          fs.writeFileSync(path.join(uploadsDir, fileName), buffer);
          finalUrl = `assets/uploads/${fileName}`;

          // Also register in media library
          const media = readJson('media.json', []);
          media.unshift({
            id: 'med-' + Date.now(),
            name: name || `${slot} visual replacement`,
            type: 'image',
            size: (buffer.length / 1024).toFixed(1) + ' KB',
            url: finalUrl,
            date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            dimensions: 'Site Asset'
          });
          writeJson('media.json', media);
        }

        settings.pageAssets[slot] = finalUrl;
        settings.lastUpdated = new Date().toISOString();
        writeJson('settings.json', settings);

        // Audit log
        const auditList = readJson('audit.json', DEFAULT_AUDIT);
        auditList.unshift({
          actor: 'Admin HQ',
          action: `Replaced website visual asset for [${slot}] -> ${finalUrl}`,
          status: 'published',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString()
        });
        if (auditList.length > 200) auditList.length = 200;
        writeJson('audit.json', auditList);

        return sendJson(res, 200, {
          ok: true,
          slot,
          url: finalUrl,
          message: `Visual asset for "${slot}" successfully updated!`
        });
      }

      // 12.4 Live Publish by DIDS' SYSTEM INC. (/api/admin/publish)
      if (pathname === '/api/admin/publish' && req.method === 'POST') {
        const body = await parseBody(req);
        const settings = readJson('settings.json', {});
        const now = new Date().toISOString();

        settings.lastPublishedAt = now;
        settings.publishedBy = body.author || "DIDS' SYSTEM INC.";
        settings.publishVersion = (settings.publishVersion || 1) + 1;
        writeJson('settings.json', settings);

        // Audit log
        const auditList = readJson('audit.json', DEFAULT_AUDIT);
        auditList.unshift({
          actor: "DIDS' SYSTEM INC. Engine",
          action: `🚀 Continental Live Site Published (v${settings.publishVersion}) — All changes deployed live`,
          status: 'published',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: now
        });
        if (auditList.length > 200) auditList.length = 200;
        writeJson('audit.json', auditList);

        return sendJson(res, 200, {
          ok: true,
          publishedAt: now,
          publishedBy: settings.publishedBy,
          version: settings.publishVersion,
          message: "🎉 Site successfully published live by DIDS' SYSTEM INC.!"
        });
      }

      // 13. Posts & News Articles (/api/cms/posts)
      if (pathname === '/api/cms/posts') {
        const posts = readJson('posts.json', []);
        if (req.method === 'GET') {
          return sendJson(res, 200, { ok: true, data: posts });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const newPost = {
            id: 'post-' + Date.now(),
            title: body.title,
            slug: (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
            category: body.category || 'announcements',
            tag: body.tag || 'Official Press',
            tagStyle: body.tagStyle || '',
            author: body.author || 'AUC Continental Secretariat',
            date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            excerpt: body.excerpt || '',
            status: body.status || 'published',
            featuredImage: body.featuredImage || 'assets/img/Logo.png'
          };
          posts.unshift(newPost);
          writeJson('posts.json', posts);
          return sendJson(res, 201, { ok: true, data: newPost });
        }
      }

      const postMatch = pathname.match(/^\/api\/cms\/posts\/([a-zA-Z0-9_-]+)$/);
      if (postMatch) {
        const id = postMatch[1];
        const posts = readJson('posts.json', []);
        const idx = posts.findIndex(p => p.id === id || p.slug === id);

        if (req.method === 'PUT') {
          const body = await parseBody(req);
          if (idx !== -1) {
            posts[idx] = { ...posts[idx], ...body };
            writeJson('posts.json', posts);
            return sendJson(res, 200, { ok: true, data: posts[idx] });
          }
          return sendJson(res, 404, { ok: false, error: 'Post not found' });
        }

        if (req.method === 'DELETE') {
          if (idx !== -1) {
            posts.splice(idx, 1);
            writeJson('posts.json', posts);
            return sendJson(res, 200, { ok: true, message: 'Post deleted' });
          }
          return sendJson(res, 404, { ok: false, error: 'Post not found' });
        }
      }

      // 14. Audit Log Alias (/api/admin/audit)
      if (pathname === '/api/admin/audit') {
        const list = readJson('audit.json', DEFAULT_AUDIT);
        if (req.method === 'GET') {
          return sendJson(res, 200, { ok: true, data: list });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          list.unshift(body);
          if (list.length > 200) list.length = 200;
          writeJson('audit.json', list);
          return sendJson(res, 201, { ok: true, data: body });
        }
      }

      // 15. Server Telemetry & System Vitals (/api/admin/telemetry)
      if (pathname === '/api/admin/telemetry' && req.method === 'GET') {
        const mem = process.memoryUsage();
        const uptime = process.uptime();
        const registrations = readJson('registrations.json', []);
        const partnerships = readJson('partnerships.json', DEFAULT_PARTNERS);
        const contacts = readJson('contacts.json', []);
        const pages = readJson('pages.json', {});
        const media = readJson('media.json', []);
        const posts = readJson('posts.json', []);

        return sendJson(res, 200, {
          ok: true,
          status: 'HEALTHY',
          uptimeSeconds: Math.floor(uptime),
          uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
          memoryHeapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
          memoryRss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
          nodeVersion: process.version,
          platform: process.platform,
          stats: {
            registrationsCount: registrations.length,
            partnershipsCount: partnerships.length,
            contactsCount: contacts.length,
            pagesCount: Object.keys(pages).length,
            mediaCount: media.length,
            postsCount: posts.length
          },
          serverTime: new Date().toISOString()
        });
      }

      return sendJson(res, 404, { ok: false, error: 'Endpoint not found' });
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { ok: false, error: 'Internal Server Error' });
    }
  }

  // -------------------------------------------------------------
  // STATIC FILE SERVING
  // -------------------------------------------------------------
  let sanitizedPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (sanitizedPath === '/' || sanitizedPath === '\\') {
    sanitizedPath = '/index.html';
  }

  const filePath = path.join(__dirname, sanitizedPath);

  // Security check: ensure path stays within root
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      return res.end('<h1>404 Not Found</h1><p>The requested file does not exist on AUC portal server.</p>');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[AUC Portal Server] Listening on http://localhost:${PORT}`);
  console.log(`[AUC Portal Server] REST Endpoints live under http://localhost:${PORT}/api/`);
});
