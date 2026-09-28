// Centralized portal credentials. Editable from Admin → Roles & Access.
window.AUC_AUTH = (function () {
  const KEY = 'auc_auth_v1';
  const defaults = {
    student:  { username: 'team_demo', password: 'student@2026', label: 'Student Portal' },
    judge:    { username: 'judge_demo', password: 'judge@2026',  label: 'Judge Portal'   },
    admin:    { username: 'admin',      password: 'AUCadmin123', label: 'Admin HQ'       },
    cms:      { username: 'editor',     password: 'cms@2026',    label: 'CMS Editor'     }
  };
  function load() {
    try { const s = localStorage.getItem(KEY); if (s) return Object.assign({}, defaults, JSON.parse(s)); }
    catch (e) {}
    return JSON.parse(JSON.stringify(defaults));
  }
  function save(obj) { try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) {} }
  function login(portal, u, p) {
    const a = load();
    const k = portal === 'portal-student' ? 'student'
           : portal === 'portal-judge'   ? 'judge'
           : portal === 'portal-admin'   ? 'admin'
           : portal === 'cms-editor'     ? 'cms' : null;
    if (!k) return { ok:false, msg:'Unknown portal' };
    if (a[k].username === u && a[k].password === p) {
      try { localStorage.setItem('auc_session_'+k, JSON.stringify({ user:u, ts: Date.now() })); } catch(e){}
      return { ok:true, msg:'Authenticated as '+a[k].label };
    }
    return { ok:false, msg:'Invalid credentials — check the table: Student / Judge / Admin HQ / CMS Editor' };
  }
  function current(portal) {
    const k = portal === 'portal-student' ? 'student'
           : portal === 'portal-judge'   ? 'judge'
           : portal === 'portal-admin'   ? 'admin'
           : portal === 'cms-editor'     ? 'cms' : null;
    if (!k) return null;
    try { return JSON.parse(localStorage.getItem('auc_session_'+k) || 'null'); } catch(e){ return null; }
  }
  function logout(portal) {
    const k = portal === 'portal-student' ? 'student'
           : portal === 'portal-judge'   ? 'judge'
           : portal === 'portal-admin'   ? 'admin'
           : portal === 'cms-editor'     ? 'cms' : null;
    if (k) try { localStorage.removeItem('auc_session_'+k); } catch(e){}
  }
  function badge() {
    const a = load();
    return [
      { label:'Student Portal', user:a.student.username, pass:a.student.password },
      { label:'Judge Portal',   user:a.judge.username,   pass:a.judge.password   },
      { label:'Admin HQ',       user:a.admin.username,   pass:a.admin.password   },
      { label:'CMS Editor',     user:a.cms.username,     pass:a.cms.password     }
    ];
  }
  return { login, logout, current, load, save, badge, defaults };
})();
