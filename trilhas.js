(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = [...document.querySelectorAll('.path-cards')].map(row => {
    const originals = [...row.children];
    if (!originals.length) return null;
    // Repeated groups leave enough room for a seamless loop on wide screens.
    for (let group = 0; group < 5; group++) originals.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      row.append(clone);
    });
    row.classList.add('is-automatic');
    const state = {row, count: originals.length, visible: false, hover: false, until: 0, paused: reduced.matches, position: 0};
    reduced.addEventListener('change', e => { state.paused = e.matches; });
    row.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') state.hover = true; });
    row.addEventListener('pointerleave', () => { state.hover = false; });
    ['pointerdown', 'touchmove', 'wheel', 'keydown'].forEach(event => row.addEventListener(event, () => { state.until = performance.now() + 4000; }, {passive:true}));
    new IntersectionObserver(entries => { state.visible = entries[0].isIntersecting; }).observe(row);
    return state;
  }).filter(Boolean);
  let previous = 0;
  function frame(now) {
    const dt = Math.min(now - previous, 50); previous = now;
    for (const s of states) {
      if (!s.visible || s.paused || s.hover || now < s.until || document.hidden || s.row.matches(':focus-within')) { s.position = s.row.scrollLeft; continue; }
      const cycle = s.row.children[s.count].offsetLeft - s.row.children[0].offsetLeft;
      if (!cycle) continue;
      s.position = (s.position + dt * .025) % cycle;
      s.row.scrollLeft = s.position;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
