(() => {
 const title = document.getElementById('waitlist-title');
 if (!title) return;
 const sync = () => document.documentElement.style.setProperty('--section-title-size', getComputedStyle(title).fontSize);
 new ResizeObserver(sync).observe(title);
 window.addEventListener('resize', sync, { passive: true });
 document.fonts.ready.then(sync);
 sync();
})();
