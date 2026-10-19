/**
 * Reveal-on-scroll: fades in any element with the .reveal class
 * the first time it enters the viewport.
 */
(() => {
  'use strict';

  const items = document.querySelectorAll('.reveal');
  const show = (el) => el.classList.add('visible');

  // Older browsers: skip the animation and show everything.
  if (!('IntersectionObserver' in window)) {
    items.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));
})();
