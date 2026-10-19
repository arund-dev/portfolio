/**
 * Scroll-reveal: fades elements with `.reveal` into view
 * the first time they enter the viewport.
 */
(() => {
  const items = document.querySelectorAll(".reveal");

  const show = (el) => el.classList.add("visible");

  // Fallback for browsers without IntersectionObserver
  if (!("IntersectionObserver" in window)) {
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

/**
 * Ticker: append a duplicate set of items so the mobile marquee
 * can loop without a visible jump (hidden on larger screens via CSS).
 */
(() => {
  const track = document.querySelector(".ticker-track");
  if (!track) return;

  [...track.children].forEach((item) => {
    const clone = item.cloneNode(true);
    clone.classList.add("ticker-clone");
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });
})();
