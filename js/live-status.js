(function () {
  'use strict';
  var activeSession = null;
  var checking = false;

  function setHidden(el, hidden) {
    if (!el) return;
    el.style.setProperty('display', hidden ? 'none' : '', 'important');
    el.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }

  function render() {
    var live = !!(activeSession && activeSession.slug);
    var href = live ? '/live.html?slug=' + encodeURIComponent(activeSession.slug) : '/live.html';
    setHidden(document.getElementById('icf-live-join'), !live);
    document.querySelectorAll('[data-icf-watch-live]').forEach(function (el) {
      setHidden(el, !live);
      el.href = href;
    });
    document.querySelectorAll('[data-icf-live-state]').forEach(function (el) {
      el.textContent = live ? '🔴 LIVE NOW · ICF GAMBIA' : 'ICF GAMBIA · WORSHIP & FELLOWSHIP';
      el.classList.toggle('is-live', live);
    });
    var floating = document.getElementById('icf-live-floating');
    if (floating) setHidden(floating, !live);
  }

  async function check() {
    if (checking) return;
    checking = true;
    try {
      var response = await fetch('/api/public/live?fresh=' + Date.now(), {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, max-age=0', 'Pragma': 'no-cache' }
      });
      if (response.status === 404) {
        activeSession = null;
      } else if (!response.ok) {
        throw new Error('Public live status returned HTTP ' + response.status);
      } else {
        var payload = await response.json();
        activeSession = payload && payload.live === true && payload.session && payload.session.slug
          ? payload.session : null;
      }
    } catch (error) {
      // Fail closed: never advertise an unverified broadcast.
      activeSession = null;
      console.warn('[ICF live] Status check failed; live controls hidden.', error);
    } finally {
      render();
      checking = false;
    }
  }

  function addFloatingLink() {
    if (document.getElementById('icf-live-floating')) return;
    var link = document.createElement('a');
    link.id = 'icf-live-floating';
    link.className = 'icf-live-floating';
    link.href = '/live.html';
    link.textContent = '🔴 Join Us Live';
    link.setAttribute('data-icf-watch-live', '');
    link.style.setProperty('display', 'none', 'important');
    link.setAttribute('aria-hidden', 'true');
    document.body.appendChild(link);
  }

  window.watchIcfLive = function () {
    if (activeSession && activeSession.slug) {
      window.location.href = '/live.html?slug=' + encodeURIComponent(activeSession.slug);
    } else {
      check();
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    addFloatingLink();
    render();
    check();
    window.setInterval(check, 8000);
  });
  window.addEventListener('pageshow', check);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) check();
  });
  // Hide immediately before DOM ready, so stale server markup cannot flash.
  document.querySelectorAll('#icf-live-join,[data-icf-watch-live],#icf-live-floating').forEach(function (el) {
    setHidden(el, true);
  });
})();