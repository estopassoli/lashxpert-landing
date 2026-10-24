(() => {
 const button = document.querySelector('.menu-toggle');
 const menu = document.getElementById('header-menu');
 const header = document.querySelector('.site-header');
 if (!button || !menu || !header) return;
 const background = [...document.querySelectorAll('main > :not(.site-header)')];
 function setOpen(open) {
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menu.hidden = !open;
  document.documentElement.classList.toggle('menu-open', open);
  background.forEach(element => { element.inert = open; });
 }
 button.addEventListener('click', () => setOpen(menu.hidden));
 menu.addEventListener('click', event => {
  if (event.target.closest('a')) { setOpen(false); button.focus({preventScroll:true}); }
 });
 document.addEventListener('keydown', event => {
  if (menu.hidden) return;
  if (event.key === 'Escape') { setOpen(false); button.focus(); }
  if (event.key === 'Tab') {
   const targets = [...header.querySelectorAll('a[href],button:not(:disabled)')];
   const first = targets[0], last = targets[targets.length - 1];
   if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
   else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
 });
})();
