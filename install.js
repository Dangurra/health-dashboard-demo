// Mobile "install me" stop screen. Shown on phones/tablets when the page is
// opened in a browser tab instead of from the home screen.
(function () {
  var standalone = matchMedia('(display-mode: standalone)').matches ||
    matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  var ua = navigator.userAgent;
  var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var android = /Android/.test(ua);
  if (standalone || !(ios || android || /Mobi/.test(ua))) return;
  try { if (sessionStorage.getItem('install-skip')) return; } catch (e) {}

  var iosOther = ios && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  var deferred = null;

  var shareIcon = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var plusIcon = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var dotsIcon = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>';

  var asterisk = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.33v13.34M2.27 4.67l11.46 6.66M13.73 4.67 2.27 11.33" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
  function step(n, html) { return '<li><span class="hi-n">' + n + '</span><span>' + html + '</span></li>'; }
  var steps;
  if (ios) {
    steps = step(1, 'Tap the <b>Share</b> button <span class="hi-ic">' + shareIcon + '</span>' +
        (iosOther ? ' in the address bar' : ' at the bottom of Safari')) +
      step(2, 'Scroll down and tap <b>Add to Home Screen</b> <span class="hi-ic">' + plusIcon + '</span>') +
      step(3, 'Tap <b>Add</b>, then open <b>My Health</b> from your home screen');
  } else {
    steps = step(1, 'Tap the <b>menu</b> <span class="hi-ic">' + dotsIcon + '</span> in the top corner') +
      step(2, 'Tap <b>Add to Home screen</b> or <b>Install app</b>') +
      step(3, 'Open <b>My Health</b> from your home screen');
  }

  var css = '' +
    '@font-face{font-family:"Geist Pixel Variable";font-display:swap;src:url(/geist-pixel.woff2) format("woff2")}' +
    '#hi{--hp:#fff;--hk:#111;--hm:#666;--hb:#d9d9d9;--hs:#ebebeb;--ha:#0b0dff;--hh:#e8ff00;' +
    '--mono:"Geist Pixel Variable",ui-monospace,monospace;' +
    'position:fixed;inset:0;z-index:2147483647;background:var(--hp);color:var(--hk);overflow-y:auto;' +
    'font:15px/1.6 "Manrope",system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column}' +
    ':root[data-theme="dark"] #hi{--hp:#0b0b0c;--hk:#f2f2f2;--hm:#8a8a8a;--hb:#2e2e2e;--hs:#222}' +
    '#hi .hi-h{display:flex;align-items:center;gap:12px;padding:max(16px,env(safe-area-inset-top)) 20px 16px;border-bottom:1px solid var(--hs)}' +
    '#hi .hi-mark{background:var(--hh);color:#111;font:22px/.9 var(--mono);font-variation-settings:"ELSH" 0;padding:2px 3px}' +
    '#hi .hi-w{width:100%;max-width:440px;padding:36px 20px max(32px,env(safe-area-inset-bottom));margin:0 auto}' +
    '#hi .hi-eb{font:11px var(--mono);font-variation-settings:"ELSH" 1;text-transform:uppercase;margin:0 0 14px}' +
    '#hi h1{font:400 34px/1.12 "Lora",Georgia,serif;margin:0 0 12px}' +
    '#hi p{color:var(--hm);margin:0 0 28px}' +
    '#hi ol{list-style:none;margin:0;padding:0;border-top:1px solid var(--hs)}' +
    '#hi li{display:flex;gap:14px;align-items:flex-start;padding:16px 0;border-bottom:1px solid var(--hs)}' +
    '#hi .hi-n{flex:none;min-width:26px;font:13px/1.9 var(--mono);font-variation-settings:"ELSH" 1}' +
    '#hi .hi-n::before{content:"[ "}#hi .hi-n::after{content:" ]"}' +
    '#hi b{font-weight:600}' +
    '#hi .hi-ic{display:inline-flex;vertical-align:middle;margin:0 2px}' +
    '#hi .hi-btn{display:inline-flex;align-items:center;gap:8px;height:48px;margin:0 0 24px;padding:0 16px;font:14px var(--mono);font-variation-settings:"ELSH" 1;border:1px solid var(--ha);border-radius:0;background:var(--ha);color:#fff}' +
    '#hi [hidden]{display:none!important}' +
    '#hi .hi-note{font-size:14px;margin:16px 0 0}' +
    '#hi .hi-skip{margin-top:28px;background:none;border:0;font:13px var(--mono);font-variation-settings:"ELSH" 1;color:var(--hm);padding:4px 0;cursor:pointer}' +
    '#hi .hi-arrow{position:fixed;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);color:var(--ha);animation:hib 1.4s ease-in-out infinite}' +
    ':root[data-theme="dark"] #hi .hi-arrow{color:var(--hh)}' +
    '@keyframes hib{50%{transform:translate(-50%,6px)}}' +
    '@media (prefers-reduced-motion:reduce){#hi .hi-arrow{animation:none}}';

  function show() {
    if (document.getElementById('hi')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var el = document.createElement('div');
    el.id = 'hi'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'hi-t');
    el.innerHTML = '<div class="hi-h"><span class="hi-mark">My Health</span></div>' +
      '<div class="hi-w">' +
      '<p class="hi-eb">Install the app</p>' +
      '<h1 id="hi-t">Add My Health to your home screen.</h1>' +
      '<p>It opens full screen like an app and keeps you signed in.</p>' +
      '<button class="hi-btn" id="hi-install" hidden>Install app ' + asterisk + '</button>' +
      '<ol>' + steps + '</ol>' +
      (iosOther ? '<p class="hi-note">Don’t see it? Open this page in <b>Safari</b>.</p>' : '') +
      '<button class="hi-skip" id="hi-skip">[ Continue in browser ]</button>' +
      '</div>' +
      (ios && !iosOther ? '<div class="hi-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 4v15M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg></div>' : '');
    document.body.appendChild(el);
    document.documentElement.style.overflow = 'hidden';
    document.getElementById('hi-skip').onclick = function () {
      try { sessionStorage.setItem('install-skip', '1'); } catch (e) {}
      el.remove(); document.documentElement.style.overflow = '';
    };
    var btn = document.getElementById('hi-install');
    btn.onclick = function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; btn.hidden = true; });
    };
    if (deferred) btn.hidden = false;
  }

  // Android/Chrome: offer a one-tap install button when the browser allows it.
  addEventListener('beforeinstallprompt', function (e) {
    if (ios) return;
    e.preventDefault(); deferred = e;
    var b = document.getElementById('hi-install'); if (b) b.hidden = false;
  });
  addEventListener('appinstalled', function () {
    var h = document.getElementById('hi-t'); if (h) h.textContent = 'Installed! Open My Health from your home screen';
  });

  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
