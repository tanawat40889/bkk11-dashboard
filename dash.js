// Minimal local runtime for the dashboard page: datasets, calcs, params.
// Mirrors the `dash` API the page scripts were written against.
(function () {
  const SRC = {
    attendance: 'data/attendance.json',
    attendance68: 'data/attendance68.json',
    tokan: 'data/tokan.json',
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

  Object.keys(SRC).forEach(id => {
    ds[id] = { status: 'loading', data: [] };
    fetch(SRC[id])
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(x => { ds[id] = { status: 'ok', data: x }; })
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
