// Demo data for filming the 60 Days Challenge app: stands in for the page host's user and database
// (window.claude.use("user"/"db")) with a made-up squad, so the real interface renders with no
// real accounts or Firebase. Injected by scripts/capture-challenge.js before the page loads.
(() => {
  const DAY = 23;                                   // the squad is on day 23 of 60
  const start = new Date(Date.now() - (DAY - 1) * 864e5);
  const iso = d => d.toISOString().slice(0, 10);
  const squad = {
    me:   { name: 'Maya',  level: 'beg', done: DAY - 1, skip: [9] },
    u2:   { name: 'Karim', level: 'adv', done: DAY,     skip: [] },
    u3:   { name: 'Lea',   level: 'beg', done: DAY - 2, skip: [4, 12] },
    u4:   { name: 'Omar',  level: 'adv', done: DAY - 1, skip: [17] },
    u5:   { name: 'Nour',  level: 'beg', done: DAY - 3, skip: [6] },
    u6:   { name: 'Ali',   level: 'adv', done: DAY,     skip: [2] },
  };
  const docs = {};
  for (const [id, a] of Object.entries(squad)) {
    const done = {}; for (let d = 1; d <= a.done; d++) if (!a.skip.includes(d)) done[d] = true;
    docs[id] = { done, start: iso(start), updated: Date.now() };
  }
  docs._levels = { levels: Object.fromEntries(Object.entries(squad).map(([id, a]) => [id, a.level])) };
  const listeners = [];
  const snap = () => ({ metadata: { fromCache: false }, docs: Object.keys(docs).map(id => ({ id, exists: true, data: () => JSON.parse(JSON.stringify(docs[id])) })) });
  const db = {
    doc: path => ({ set: body => { docs[path.split('/')[1]] = body; listeners.forEach(f => f(snap())); return Promise.resolve(); } }),
    collection: () => ({ onSnapshot: cb => { listeners.push(cb); setTimeout(() => cb(snap()), 30); return () => {}; } }),
  };
  const user = {
    id: () => Promise.resolve('me'), isOwner: () => Promise.resolve(window.__owner === true), can: () => Promise.resolve(true),
    profiles: ids => Promise.resolve(Object.fromEntries(ids.map(id => [id, { name: (squad[id] || {}).name || '' }]))),
  };
  window.claude = { use: k => Promise.resolve(k === 'user' ? user : k === 'db' ? db : null) };
})();
