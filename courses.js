document.querySelectorAll('.course-carousel').forEach(section => {
 const track = section.querySelector('.course-track');
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 let visible = false;
 let pausedUntil = 0;
 let hovering = false;
 const pause = () => { pausedUntil = Date.now() + 6000; };
 const step = () => track.querySelector('.course-slide').getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
 const move = direction => {
  const max = track.scrollWidth - track.clientWidth;
  if (max <= 1) return;
  const target = direction > 0 && track.scrollLeft >= max - 2 ? 0 : Math.max(0,Math.min(max,track.scrollLeft + direction * step()));
  track.scrollTo({left:target,behavior:motion.matches ? 'auto' : 'smooth'});
 };
 new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, {threshold:.35}).observe(track);
 track.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') hovering = true; });
 track.addEventListener('pointerleave', () => { hovering = false; });
 ['pointerdown','touchstart','wheel'].forEach(event => track.addEventListener(event,pause,{passive:true}));
 track.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault();pause();move(event.key === 'ArrowRight' ? 1 : -1);}
 });
 setInterval(() => {
  if (!visible || document.hidden || motion.matches || hovering || track.contains(document.activeElement) || Date.now() < pausedUntil) return;
  move(1);
 },3500);
});
