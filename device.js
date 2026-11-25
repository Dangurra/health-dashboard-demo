// Shared by phone.html and present.html: keep the framed app in light mode, and on the phone
// let the app run edge to edge (status bar colored to match, tab bar padded for the home indicator).
function frameApp(iframe, phone){
  const run = () => {
    const doc = iframe.contentDocument; if (!doc || doc.URL === 'about:blank') return;
    doc.documentElement.setAttribute('data-theme', 'light'); // ignore a saved dark preference while recording
    if (!phone) return;
    const st = doc.createElement('style');
    st.textContent = '@media (max-width:760px){nav.tabs{padding-bottom:30px!important}}';
    doc.head.appendChild(st);
    const bar = iframe.closest('.screen').querySelector('.status');
    const paint = () => { const head = doc.querySelector('.app-head') || doc.body; bar.style.background = getComputedStyle(head).backgroundColor !== 'rgba(0, 0, 0, 0)' ? getComputedStyle(head).backgroundColor : getComputedStyle(doc.body).backgroundColor; };
    paint(); setTimeout(paint, 300);
  };
  iframe.addEventListener('load', run);
  if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') run(); // already loaded
}
