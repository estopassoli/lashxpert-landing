document.querySelectorAll('.revenue-results-window').forEach(resultsViewport => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches) return;
  let resultsFrame;
  let lastResultsTime;
  let resultsDirection = 1;
  let resultsStopped = false;
  const stopResults = () => {
    resultsStopped = true;
    cancelAnimationFrame(resultsFrame);
  };
  ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin'].forEach(event => {
    resultsViewport.addEventListener(event, stopResults, { passive: true });
  });
  const advanceResults = time => {
    if (resultsStopped) return;
    const elapsed = Math.min(time - (lastResultsTime ?? time), 50);
    lastResultsTime = time;
    const max = resultsViewport.scrollWidth - resultsViewport.clientWidth;
    const bounds = resultsViewport.getBoundingClientRect();
    if (max > 0 && bounds.bottom > 0 && bounds.top < window.innerHeight && !resultsViewport.matches(':hover')) {
      resultsViewport.scrollLeft += resultsDirection * elapsed * 0.025;
      if (resultsViewport.scrollLeft >= max - 1) resultsDirection = -1;
      else if (resultsViewport.scrollLeft <= 0) resultsDirection = 1;
    }
    resultsFrame = requestAnimationFrame(advanceResults);
  };
  resultsFrame = requestAnimationFrame(advanceResults);
  motionPreference.addEventListener('change', stopResults);
});

// Exibe a chamada fixa somente depois de passar pelo botão principal.
function setupFloatingEnrollment() {
  const floating = document.querySelector('.floating-enrollment');
  const form = document.getElementById('whatsapp-enrollment');
  if (!floating || !form) return;
  let scheduled = false;
  const update = () => {
    floating.hidden = form.getBoundingClientRect().bottom > 0;
    scheduled = false;
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', schedule, { passive:true });
  new ResizeObserver(schedule).observe(form);
  update();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupFloatingEnrollment);
} else {
  setupFloatingEnrollment();
}

