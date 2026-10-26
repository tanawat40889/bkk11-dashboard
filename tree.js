// Area names come from the shared Supabase tree (public.areas + area_aliases, edited on the Tokan "จัดการพื้นที่" page).
// Read-only with the public key. If it cannot be reached, every name is left exactly as the data file has it.
// window.SD_TREE.ready resolves when loaded (never rejects); SD_TREE.canon.{phak,khet,tambon}(name, parentName) -> canonical name.
(function () {
  const BASE = 'https://cqdzfsucpivsgznfpjxl.supabase.co/rest/v1/';
  const KEY = 'sb_publishable_XkUBjE3M7HUiuDv7YwsbKA_mSu0ToEc';
  const ws = s => String(s == null ? '' : s).replace(/\s/g, '');
  const get = p => fetch(BASE + p, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });

  const T = window.SD_TREE = { ok: false, phaks: [], canon: {} };
  let areas = [], alias = new Map();

  // exact name, then ignoring spaces, then an alias (same two ways); only an unambiguous hit counts
  function match(level, name, parent) {
    if (!T.ok || name == null) return name;
    const pool = areas.filter(a => a.level === level && (!parent || a.parent_id === parent.id));
    const tests = [a => a.name === name, a => ws(a.name) === ws(name),
      a => (alias.get(a.id) || []).includes(name), a => (alias.get(a.id) || []).some(x => ws(x) === ws(name))];
    for (const t of tests) { const hit = pool.filter(t); if (hit.length === 1) return hit[0]; if (hit.length > 1) break; }
    return null;
  }
  const find = (level, name, parent) => { const m = match(level, name, parent); return m && typeof m === 'object' ? m : null; };
  const canon = (level, name, parentName, parentLevel) => {
    if (!T.ok || name == null) return name;
    const parent = parentName == null ? null : find(parentLevel, parentName, null);
    const m = find(level, name, parent);
    return m ? m.name : name;
  };
  T.canon.phak = name => canon('phak', name);
  T.canon.khet = (name, phak) => canon('khet', name, phak, 'phak');
  T.canon.tambon = (name, khet) => canon('tambon', name, khet, 'khet');

  T.ready = Promise.all([get('areas?select=id,parent_id,level,name,sort_order&order=sort_order&limit=5000'), get('area_aliases?select=area_id,alias&limit=5000')])
    .then(([a, al]) => {
      areas = a;
      al.forEach(x => alias.set(x.area_id, [...(alias.get(x.area_id) || []), x.alias]));
      T.phaks = a.filter(x => x.level === 'phak').map(x => x.name);
      T.ok = areas.length > 0;
    })
    .catch(e => console.warn('area tree unavailable, using names as they are', e));
})();
