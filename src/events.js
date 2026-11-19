// Shared by the live 3D page and the lite page (injected at build time).
// versusroyale.com owns the schedule. Until its public feed is live (and allows this site),
// the built-in list below is shown. Edit FALLBACK_EVENTS to change the backup list.
const EVENTS_FEED = 'https://versusroyale.com/api/public/maximus-events';
const SIGNUP_BASE = 'https://versusroyale.com';
const FALLBACK_EVENTS = [
  { date: '2026-11-22', name: 'Super Mario 64 Royale', url: 'https://versusroyale.com' },
  { date: '2026-11-29', name: 'Super Smash Bros Ultimate Tournament', url: 'https://versusroyale.com' },
  { date: '2026-12-05', name: 'Mario Kart 8 Deluxe Tournament', url: 'https://versusroyale.com' },
  { date: '2026-12-13', name: 'Super Mario Galaxy Royale', url: 'https://versusroyale.com' },
  { date: '2026-12-19', name: 'Versus Gauntlet', sub: 'Sponsored by Maximus', url: 'https://versusroyale.com' },
];
// Turn whatever the feed sends into { date: 'YYYY-MM-DD', name, sub?, url }. Unknown shapes are skipped.
function normalizeFeed(data) {
  const list = Array.isArray(data) ? data : (data && (data.events || data.items || data.data)) || [];
  const pad = n => String(n).padStart(2, '0');
  return list.map(e => {
    const when = e.date || e.startDate || e.startsAt || e.startTime || e.start || e.scheduledAt;
    const d = when ? new Date(when) : null;
    const name = e.name || e.title || e.eventName;
    if (!d || isNaN(d) || !name) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(when)) ? String(when) : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const url = e.signupUrl || e.signUpUrl || e.url || e.link || (e.slug ? `${SIGNUP_BASE}/events/${e.slug}` : SIGNUP_BASE);
    return { date, name, sub: e.sponsor ? `Sponsored by ${e.sponsor}` : (e.subtitle || e.tagline || undefined), url };
  }).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
}
function renderEvents(evList, events) {
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  evList.innerHTML = '';
  let nextMarked = false;
  for (const ev of events) {
    const [y, m, d] = ev.date.split('-').map(Number), dt = new Date(y, m - 1, d);
    const past = dt < today, row = document.createElement('div');
    row.className = 'ev' + (past ? ' past' : '');
    if (!past && !nextMarked) { row.classList.add('next'); nextMarked = true; }
    row.innerHTML = `<div class="d"><small>${DOW[dt.getDay()]}</small><b>${d}</b><small>${MON[m - 1]}</small></div>
      <div class="t"><b></b>${ev.sub ? '<span></span>' : ''}</div>${past ? '<span class="tag">Ended</span>' : ''}<a target="_blank" rel="noopener">Sign up</a>`;
    row.querySelector('.t b').textContent = ev.name;
    if (ev.sub) row.querySelector('.t span').textContent = ev.sub;
    row.querySelector('a').href = /^https:\/\//.test(ev.url) ? ev.url : SIGNUP_BASE;
    evList.appendChild(row);
  }
}
// Shows the backup list right away, then swaps in the live schedule if the feed answers within 4 s.
function loadEvents(evList) {
  renderEvents(evList, FALLBACK_EVENTS);
  if (location.protocol === 'file:') return;
  const ctl = new AbortController(); setTimeout(() => ctl.abort(), 4000);
  fetch(EVENTS_FEED, { signal: ctl.signal, headers: { accept: 'application/json' } })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => { const ev = normalizeFeed(d); if (ev.length) renderEvents(evList, ev); })
    .catch(() => {});
}
