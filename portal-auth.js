/**
 * AUC Portal Auth Guard — Shared across all portals (Admin HQ, Student, Judge, CMS Editor)
 * • Strict Access Lockdown: Impossible to bypass by clicking outside or pressing Escape
 * • Clicking the backdrop provides shake feedback and enforces authentication
 * • The back (←) button safely redirects to the central login page
 * • Automatically removes any legacy demo credentials tables from the DOM
 */
(function () {
  'use strict';

  var MAP = {
    'portal-student': 'Student Portal',
    'portal-judge': 'Judge Portal',
    'portal-admin': 'Admin HQ',
    'cms-editor': 'CMS Editor'
  };

  var rawKey = (location.pathname.split('/').pop() || '').toLowerCase().replace(/\.html$/, '');
  var portal = (rawKey in MAP) ? rawKey : null;
  var overlay = document.getElementById('loginOverlay');

  if (!overlay || !portal) return;

  // Extra safeguard: Purge any legacy demo credentials tables from the DOM
  var legacyCreds = overlay.querySelectorAll('.login-creds, .creds-hint, details');
  legacyCreds.forEach(function (el) { el.remove(); });

  /* ── Auth State Helpers ── */
  function isAuthed() {
    return window.AUC_AUTH && window.AUC_AUTH.current(portal);
  }

  function shakeCard() {
    var card = overlay.querySelector('.login-card');
    if (card) {
      card.classList.remove('card-shake');
      void card.offsetWidth; // Force CSS reflow
      card.classList.add('card-shake');
    }
  }

  function showErr(msg) {
    var e = document.getElementById('loginErr');
    if (e) {
      e.textContent = msg;
      e.hidden = false;
      shakeCard();
    }
  }

  function redirectToLogin() {
    window.location.href = 'login.html?portal=' + portal;
  }

  function openOverlay() {
    var label = document.getElementById('loginPortalLabel');
    if (label) {
      label.textContent = portal === 'portal-admin'
        ? 'Restricted Access — Authorized Secretariat Personnel Only'
        : 'Sign in to ' + MAP[portal] + ' to continue.';
    }
    var userEl = document.getElementById('loginUser');
    var passEl = document.getElementById('loginPass');
    var errEl  = document.getElementById('loginErr');
    if (userEl) userEl.value = '';
    if (passEl) passEl.value = '';
    if (errEl) { errEl.hidden = true; errEl.textContent = ''; }

    // Lock page background
    document.body.classList.add('portal-locked');
    document.documentElement.classList.add('portal-locked');
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    if (userEl) userEl.focus();
  }

  function closeAfterAuth() {
    overlay.hidden = true;
    document.body.classList.remove('portal-locked');
    document.documentElement.classList.remove('portal-locked');
    document.body.style.overflow = '';
  }

  /* ── STRICT BACKDROP RESTRICTION (Capture phase to prevent bypass) ── */
  overlay.addEventListener('click', function (ev) {
    if (ev.target === overlay) {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      shakeCard();
      var errEl = document.getElementById('loginErr');
      if (errEl && errEl.hidden) {
        errEl.textContent = 'Access Restricted: Please authenticate to enter ' + MAP[portal] + '.';
        errEl.hidden = false;
      }
      return false;
    }
  }, true);

  /* ── Prevent ESC key dismissal ── */
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !isAuthed()) {
      ev.preventDefault();
      shakeCard();
    }
  });

  /* ── Close / Back (←) button safely redirects to login ── */
  var closeBtn = overlay.querySelector('.login-close');
  if (closeBtn) {
    var newBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newBtn, closeBtn);
    newBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      redirectToLogin();
    });
    newBtn.setAttribute('title', 'Return to portal sign in');
    newBtn.setAttribute('aria-label', 'Return to portal sign in');
    newBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
  }

  /* ── Sign In submission ── */
  var submitBtn = document.getElementById('loginSubmit');
  if (submitBtn) {
    var newSubmit = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
    newSubmit.addEventListener('click', function () {
      var u = (document.getElementById('loginUser').value || '').trim();
      var p = (document.getElementById('loginPass').value || '');
      if (!u || !p) {
        showErr('Please enter both username and password.');
        return;
      }
      var result = window.AUC_AUTH.login(portal, u, p);
      if (result.ok) {
        closeAfterAuth();
        if (typeof window.updateUserBadge === 'function') window.updateUserBadge();
      } else {
        showErr(result.msg || 'Invalid username or password. Please try again.');
      }
    });
  }

  /* ── Enter key support ── */
  ['loginUser', 'loginPass'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          if (newSubmit) newSubmit.click();
        }
      });
    }
  });

  /* ── Professional Footer Link inside Modal Card ── */
  var card = overlay.querySelector('.login-card');
  if (card && !card.querySelector('.reg-prompt')) {
    var rp = document.createElement('p');
    rp.className = 'reg-prompt';
    rp.style.cssText = 'margin-top:1.25rem;font-size:.82rem;color:rgba(226,253,237,.5);text-align:center;';
    if (portal === 'portal-admin') {
      rp.innerHTML = 'Authorized access only · <a href="login.html?portal=portal-admin" style="color:var(--neon-cyan,#00E5FF);font-weight:600;text-decoration:underline;">Main Sign In Page</a>';
    } else {
      rp.innerHTML = 'Need an account? <a href="register.html" style="color:var(--neon-cyan,#00E5FF);font-weight:600;text-decoration:underline;">Register here</a> · <a href="login.html?portal=' + portal + '" style="color:var(--neon-cyan,#00E5FF);font-weight:600;">Full login page</a>';
    }
    card.appendChild(rp);
  }

  /* ── Logout buttons ── */
  var logoutBtns = document.querySelectorAll('#btnLogoutCms, #btnLogoutStudent, #btnLogoutJudge, #btnLogoutAdmin, [data-logout]');
  logoutBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (confirm('Sign out of ' + MAP[portal] + '?')) {
        window.AUC_AUTH.logout(portal);
        redirectToLogin();
      }
    });
  });

  /* ── Guard on load: Immediate lock if not authenticated ── */
  if (!isAuthed()) {
    openOverlay();
  } else {
    closeAfterAuth();
    if (typeof window.updateUserBadge === 'function') window.updateUserBadge();
  }

})();
