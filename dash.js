// Minimal local runtime for the dashboard page: datasets, calcs, params.
// Mirrors the `dash` API the page scripts were written against.
(function () {
  // Attendance lives in Supabase (table public.sd_attendance, public read, written by the monthly run). YEAR is the พ.ศ. year on show.
  const BASE = 'https://cqdzfsucpivsgznfpjxl.supabase.co/rest/v1/';
  const KEY = 'sb_publishable_XkUBjE3M7HUiuDv7YwsbKA_mSu0ToEc';
  const YEAR = 2569;
  const MN = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const json = r => { if (!r.ok) throw new Error(r.status); return r.json(); };
  // Row order sets the order of เขต and ตำบล in the lists: the order of the monthly Excel sheets. A ตำบล not listed here goes last.
  const ORDER = ['สินทวี', 'จุลพงษ์', 'พระราม 2', 'มั่งมี', 'ศรัญญา', 'เคหะรุ่งโรจน์', 'เทียนทะเล', 'มีสุข', 'พิศาล', 'วงแหวนชัชวาลย์', 'เพชรทองคำ',
    'แม้นทอง', 'ปิ่นทอง', 'ไทรทอง', 'เอสเค', 'ศิริชัย', 'ดีเค', 'พระปิ่น 5', 'ศึกษานารี'].map(s => s.replace(/\s/g, ''));
  const pos = r => { const i = ORDER.indexOf(String(r.tambon).replace(/\s/g, '')); return i < 0 ? ORDER.length : i; };
  const att = (year, withYear) => () =>
    fetch(BASE + 'sd_attendance?select=month,phak,khet,tambon,md,wd,ymd,ywd,mb,mg,new:newcomers,total&year=eq.' + year + '&order=month',
      { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
      .then(json)
      .then(rows => rows.sort((x, y) => x.month - y.month || pos(x) - pos(y)).map(r => {
        const o = withYear ? { year } : {};
        o.month = r.month; o.month_name = MN[r.month - 1];
        for (const k of ['phak', 'khet', 'tambon', 'md', 'wd', 'ymd', 'ywd', 'mb', 'mg', 'new', 'total']) o[k] = r[k];
        return o;
      }));
  const SRC = {
    attendance: att(YEAR, false),
    attendance68: att(YEAR - 1, true),
    tokan: () => fetch('data/tokan.json').then(json),
  };
  const ds = {}, calcs = {}, subs = [];
  let params = {}, pending = false;

  const notify = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      subs.forEach(run);
    });
  };
  const run = fn => { try { fn(); } catch (e) { console.error(e); } };

  // An area link (see areas.js) keeps only that area's rows, so every calc and chart sees just that area.
  const area = window.SD_AREA;
  const inArea = r => !area || ((!area.phak || r.phak === area.phak) && (!area.khet || r.khet === area.khet) &&
    (!area.tambon || (r.tambon != null ? r.tambon : r.tambon_key).replace(/\s/g, '') === area.tambon.replace(/\s/g, '')));

  // Names are made canonical (spelling, spaces, aliases) from the shared area tree before anything is filtered or grouped.
  const T = window.SD_TREE || { ready: Promise.resolve(), ok: false, canon: {} };
  let areaSynced = false;
  function syncArea() {
    if (areaSynced || !area) return;
    areaSynced = true;
    if (area.phak) area.phak = T.canon.phak(area.phak);
    if (area.khet) area.khet = T.canon.khet(area.khet, area.phak);
    if (area.tambon) area.tambon = T.canon.tambon(area.tambon, area.khet);
    if (window.SD_PAINT_AREA) window.SD_PAINT_AREA();
  }
  function canonRow(r) {
    if (!T.ok || !r || typeof r !== 'object') return r;
    const phak = T.canon.phak(r.phak), khet = T.canon.khet(r.khet, phak), o = { ...r, phak, khet };
    if (r.tambon != null) o.tambon = T.canon.tambon(r.tambon, khet);
    if (r.tambon_key != null) o.tambon_key = T.canon.tambon(r.tambon_key, khet).replace(/\s/g, '');  // the page compares this one with spaces removed
    return o;
  }

  Object.keys(SRC).forEach(id => {
    ds[id] = { status: 'loading', data: [] };
    if (area === false) { ds[id] = { status: 'error', data: [] }; return; }
    SRC[id]()
      .then(x => T.ready.then(() => { syncArea(); return Array.isArray(x) ? x.map(canonRow) : x; }))
      .then(x => { ds[id] = { status: 'ok', data: Array.isArray(x) ? x.filter(inArea) : x }; })
      .catch(e => { console.error(id, e); ds[id] = { status: 'error', data: [] }; })
      .then(notify);
  });

  function data(id) {
    if (ds[id]) return ds[id];
    const c = calcs[id];
    if (!c) return { status: 'missing', data: [] };
    if (c.res) return c.res;
    const ins = c.inputs.map(data);
    if (ins.some(x => x.status === 'error' || x.status === 'missing')) return { status: 'error', data: [] };
    if (ins.some(x => x.status !== 'ok')) return { status: 'loading', data: [] };
    try { return (c.res = { status: 'ok', data: c.fn(...ins.map(x => x.data)) }); }
    catch (e) { console.error(id, e); return (c.res = { status: 'error', data: [] }); }
  }

  window.dash = {
    data,
    calc(id, o) { calcs[id] = { inputs: o.inputs, fn: o.fn }; },
    loader() {},
    onData(fn) { subs.push(fn); run(fn); },
    params: () => ({ ...params }),
    setParams(p) { params = { ...params, ...p }; notify(); },
    resetParams() { params = {}; notify(); },
    setLink(name) { try { history.replaceState(null, '', '#' + name); } catch (e) {} },
    refresh() {},
    colors: ['#2E9E8F', '#D9A23A', '#4C78A8', '#E45756', '#72B7B2', '#B279A2', '#FF9DA6', '#9D755D'],
  };

  // redraw charts when the page width changes
  let w = 0;
  new ResizeObserver(es => {
    const nw = Math.round(es[0].contentRect.width);
    if (nw !== w) { w = nw; notify(); }
  }).observe(document.documentElement);
})();
