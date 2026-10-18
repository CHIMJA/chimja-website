const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav-links');
if (menu && nav) {
  const closeMenu = () => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  };
  const desktop = window.matchMedia('(min-width: 901px)');
  desktop.addEventListener('change', event => {
    if (event.matches) closeMenu();
  });
  if (desktop.matches) closeMenu();
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  // The Menu button and page content are outside nav; listen across the document.
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      if (!desktop.matches) menu.focus();
    }
  });
  menu.closest('.site-header')?.classList.add('nav-ready');
}
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
// Content remains visible by default. Animate only when an observer reports entry.
if ('IntersectionObserver' in window) {
  try {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    }), { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(element => io.observe(element));
  } catch { /* Observer failure leaves all content visible. */ }
}
