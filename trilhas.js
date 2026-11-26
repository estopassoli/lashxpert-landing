(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Map();
  let previous = 0;
  let running = false;

  function sizeLoop(state) {
    const {row, originals} = state;
    const style = getComputedStyle(row);
    const gap = parseFloat(style.columnGap) || 0;
    const first = originals[0].getBoundingClientRect();
    const last = originals[originals.length - 1].getBoundingClientRect();
    const cycle = last.right - first.left + gap;
    if (cycle <= 0) return;
    const viewport = row.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
    // Keep just enough full groups to show the viewport after one complete loop.
    const groups = Math.max(2, 1 + Math.ceil((viewport + gap) / cycle));
    const fragment = document.createDocumentFragment();
    while (state.groups < groups) {
      originals.forEach(card => {
        const clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        fragment.append(clone);
      });
      state.groups++;
    }
    row.append(fragment);
    while (state.groups > groups) {
      for (let index = 0; index < originals.length; index++) row.lastElementChild.remove();
      state.groups--;
    }
    state.cycle = cycle;
    state.position = row.scrollLeft % cycle;
    row.scrollLeft = state.position;
  }

  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => { states.get(entry.target).visible = entry.isIntersecting; });
  });
  const resize = new ResizeObserver(entries => {
    entries.forEach(entry => sizeLoop(states.get(entry.target)));
  });

  function initialize(state) {
    const {row} = state;
    state.initialized = true;
    state.hover = matchMedia('(hover: hover)').matches && row.matches(':hover');
    sizeLoop(state);
    row.classList.add('is-automatic');
    row.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') state.hover = true; });
    row.addEventListener('pointerleave', () => { state.hover = false; });
    ['pointerdown', 'touchmove', 'wheel', 'keydown'].forEach(event => row.addEventListener(event, () => { state.until = performance.now() + 4000; }, {passive:true}));
    visibility.observe(row);
    resize.observe(row);
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  const nearby = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const state = states.get(entry.target);
      if (!state.initialized) initialize(state);
      nearby.unobserve(entry.target);
    });
  }, {rootMargin: '300px 0px'});

  document.querySelectorAll('.path-cards').forEach(row => {
    const originals = [...row.children];
    if (!originals.length) return;
    states.set(row, {row, originals, groups: 1, cycle: 0, initialized: false, visible: false, hover: false, until: 0, position: 0});
    nearby.observe(row);
  });

  function frame(now) {
    const dt = Math.min(now - previous, 50); previous = now;
    for (const s of states.values()) {
      if (!s.initialized) continue;
      if (!s.visible || reduced.matches || s.hover || now < s.until || document.hidden || s.row.matches(':focus-within')) { s.position = s.row.scrollLeft; continue; }
      if (!s.cycle) continue;
      s.position = (s.position + dt * .025) % s.cycle;
      s.row.scrollLeft = s.position;
    }
    requestAnimationFrame(frame);
  }
})();
