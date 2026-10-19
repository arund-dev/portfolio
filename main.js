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

/**
 * Intro background: the faint code behind the hero starts out full of typos.
 * While scrolling through the intro it drifts upward and the typos get fixed
 * one by one (and come back if you scroll back up).
 */
(() => {
  const intro = document.querySelector(".intro");
  if (!intro) return;

  const bugs = [...intro.querySelectorAll(".bug")];
  bugs.forEach((bug) => {
    bug.dataset.bad = bug.textContent;
  });

  let queued = false;

  const update = () => {
    queued = false;

    const progress = Math.min(1, Math.max(0, window.scrollY / (intro.offsetHeight * 0.35)));
    intro.style.setProperty("--p", progress.toFixed(3));

    bugs.forEach((bug) => {
      const fixed = progress >= parseFloat(bug.dataset.at);
      if (fixed === bug.classList.contains("fixed")) return;
      bug.classList.toggle("fixed", fixed);
      bug.textContent = fixed ? bug.dataset.fix : bug.dataset.bad;
    });
  };

  const queueUpdate = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
  update();
})();
