// Tells the page's inline script that main.js loaded (otherwise content is shown without effects)
window.__portfolioReady = true;

/**
 * One shared scroll/resize listener: every scroll-driven effect below
 * registers an update function here and they all run in a single frame.
 */
const onFrame = (() => {
  const jobs = [];
  let queued = false;

  const run = () => {
    queued = false;
    jobs.forEach((job) => job());
  };

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  };

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);

  return (job) => jobs.push(job);
})();

/**
 * Scroll-reveal: fades elements with `.reveal` into view
 * the first time they enter the viewport.
 */
(() => {
  const items = document.querySelectorAll(".reveal, .stagger");

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

  // Terminal line: types itself once every typo is fixed, clears if you scroll back up
  const term = intro.querySelector(".term");
  const termText = term ? term.dataset.text : "";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let termOn = false;
  let termTimer = null;
  let typed = 0;

  const runTerm = (on) => {
    if (!term || on === termOn) return;
    termOn = on;
    clearInterval(termTimer);
    if (!on) {
      typed = 0;
      term.textContent = "";
      return;
    }
    if (reduceMotion) {
      term.textContent = termText;
      return;
    }
    termTimer = setInterval(() => {
      typed += 1;
      term.textContent = termText.slice(0, typed);
      if (typed >= termText.length) clearInterval(termTimer);
    }, 45);
  };

  const update = () => {
    const progress = Math.min(1, Math.max(0, window.scrollY / (intro.offsetHeight * 0.35)));
    intro.style.setProperty("--p", progress.toFixed(3));

    bugs.forEach((bug) => {
      const fixed = progress >= parseFloat(bug.dataset.at);
      if (fixed === bug.classList.contains("fixed")) return;
      bug.classList.toggle("fixed", fixed);
      bug.textContent = fixed ? bug.dataset.fix : bug.dataset.bad;
    });

    runTerm(bugs.every((bug) => bug.classList.contains("fixed")));
  };

  onFrame(update);
  update();
})();

/**
 * Header: shrinks slightly after the top and highlights the link of the section you are in.
 */
(() => {
  const header = document.querySelector("header");
  if (!header) return;

  const links = [...document.querySelectorAll('.navlinks a[href^="#"]')]
    .filter((a) => a.getAttribute("href").length > 1);
  const targets = links
    .map((a) => ({ a, el: document.getElementById(a.getAttribute("href").slice(1)) }))
    .filter((t) => t.el);

  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle("scrolled", y > 24);

    let current = null;
    targets.forEach((t) => {
      if (t.el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = t;
    });
    if (max > 0 && y >= max - 4 && targets.length) current = targets[targets.length - 1];

    targets.forEach((t) => {
      const on = t === current;
      t.a.classList.toggle("active", on);
      if (on) t.a.setAttribute("aria-current", "true");
      else t.a.removeAttribute("aria-current");
    });
  };

  onFrame(update);
  update();
})();

/**
 * Skills: tap a box to open its small pop-up. Only one is open at a time;
 * tapping anywhere else (or pressing Escape) closes it.
 */
(() => {
  const skills = [...document.querySelectorAll(".skill")].filter((s) => s.querySelector(".skill-btn"));
  if (!skills.length) return;

  let current = null;

  const close = (returnFocus) => {
    if (!current) return;
    const btn = current.querySelector(".skill-btn");
    current.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    if (returnFocus) btn.focus();
    current = null;
  };

  const open = (skill) => {
    close(false);
    const tip = skill.querySelector(".tip");
    tip.classList.remove("tip--right", "tip--up");

    // keep the pop-up on screen: right-align near the right edge, flip above near the bottom
    const r = skill.getBoundingClientRect();
    if (r.left + tip.offsetWidth > window.innerWidth - 16) tip.classList.add("tip--right");
    if (r.bottom + tip.offsetHeight + 20 > window.innerHeight && r.top > tip.offsetHeight + 20) {
      tip.classList.add("tip--up");
    }

    skill.classList.add("open");
    skill.querySelector(".skill-btn").setAttribute("aria-expanded", "true");
    current = skill;
  };

  skills.forEach((skill) => {
    skill.querySelector(".skill-btn").addEventListener("click", () => {
      if (skill === current) close(false);
      else open(skill);
    });
  });

  // pointerdown (not click) so it also works for taps on empty areas in iOS Safari
  document.addEventListener("pointerdown", (e) => {
    if (current && !current.contains(e.target)) close(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close(true);
  });
})();


/**
 * Desktop hero extras: the dot-grid glow follows the mouse.
 * The elements are hidden on mobile by CSS.
 */
(() => {
  const intro = document.querySelector(".intro");
  const bg = document.querySelector(".hero-bg");
  if (!intro || !bg) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  let ev = null;
  let queued = false;

  const apply = () => {
    queued = false;
    if (!ev) {
      bg.style.setProperty("--glow", "0");
      return;
    }
    const r = bg.getBoundingClientRect();
    bg.style.setProperty("--mx", (ev.clientX - r.left).toFixed(0) + "px");
    bg.style.setProperty("--my", (ev.clientY - r.top).toFixed(0) + "px");
    bg.style.setProperty("--glow", "1");
  };

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  };

  intro.addEventListener("pointermove", (e) => { ev = e; queue(); }, { passive: true });
  intro.addEventListener("pointerleave", () => { ev = null; queue(); });
  onFrame(() => { if (ev) apply(); });
})();


/**
 * Desktop: clicking an in-page link (nav, buttons, back to top) glides to the
 * section, up or down, instead of jumping. Works even when the browser's own
 * smooth-scroll is switched off.
 */
(() => {
  const desktop = window.matchMedia("(min-width: 801px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let raf = null;

  const cancel = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };

  const glideTo = (target) => {
    cancel();
    const start = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const end = Math.max(0, Math.min(max, target));
    const dist = end - start;
    if (Math.abs(dist) < 2) return;

    const dur = Math.min(1100, Math.max(550, Math.abs(dist) * 0.45));
    const t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      window.scrollTo({ top: start + dist * ease(t), behavior: "instant" });
      raf = t < 1 ? requestAnimationFrame(step) : null;
    };
    raf = requestAnimationFrame(step);
  };

  document.addEventListener("click", (e) => {
    if (!desktop.matches || reduceMotion.matches || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains("skip-link")) return;
    const id = a.getAttribute("href").slice(1);
    const el = id ? document.getElementById(id) : null;
    if (!el) return;

    e.preventDefault();
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const y = id === "top" ? 0 : el.getBoundingClientRect().top + window.scrollY - pad;
    glideTo(y);
    try { history.pushState(null, "", "#" + id); } catch (err) {}
  });

  // let the user take over: any wheel / touch / key press stops the glide
  ["wheel", "touchstart", "keydown"].forEach((evt) =>
    window.addEventListener(evt, cancel, { passive: true })
  );
})();


/**
 * Name: every now and then (random, 7-15s apart, all screen sizes) the name
 * does a very small glitch, in the same pink/cyan style as the photo strip.
 * Kept random so it drifts out of sync with the strip's 6s cycle.
 */
(() => {
  const name = document.querySelector(".hero h1");
  if (!name || !name.animate) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const step = "steps(1, end)";
  const frames = [
    { transform: "none", textShadow: "none", opacity: 1, offset: 0, easing: step },
    { transform: "translateX(-3px) skewX(-6deg)", textShadow: "-3px 0 #ff2d6f, 3px 0 #2de2ff", opacity: 1, offset: 0.15, easing: step },
    { transform: "translateX(3px) skewX(4deg)", textShadow: "3px 0 #ff2d6f, -3px 0 #2de2ff", opacity: 0.75, offset: 0.35, easing: step },
    { transform: "translateX(-2px)", textShadow: "-2px 0 #ff2d6f", opacity: 1, offset: 0.55, easing: step },
    { transform: "translateX(1px)", textShadow: "none", opacity: 1, offset: 0.75, easing: step },
    { transform: "none", textShadow: "none", opacity: 1, offset: 1 },
  ];

  const next = () => 7000 + Math.random() * 8000;

  const glitch = () => {
    if (!document.hidden) name.animate(frames, { duration: 360 });
    setTimeout(glitch, next());
  };

  setTimeout(glitch, 4000 + Math.random() * 4000);
})();


/**
 * Screenshots: tap one to see it large over a blurred page.
 * Tap anywhere (picture included) or press Escape to close it.
 */
(() => {
  const buttons = [...document.querySelectorAll(".shot-open")];
  if (!buttons.length) return;

  const box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.tabIndex = -1;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Screenshot preview. Press Escape or tap to close.");
  const big = document.createElement("img");
  box.appendChild(big);
  document.body.appendChild(box);

  let lastButton = null;
  let closeTimer = null;

  const open = (btn) => {
    const src = btn.querySelector("img");
    if (!src) return;
    clearTimeout(closeTimer);
    lastButton = btn;
    big.src = src.currentSrc || src.src;
    big.alt = src.alt;
    box.hidden = false;
    void box.offsetWidth; // let the browser register the start state so the fade plays
    box.classList.add("open");
    document.documentElement.classList.add("lightbox-open");
    box.focus();
  };

  const close = () => {
    if (box.hidden) return;
    box.classList.remove("open");
    document.documentElement.classList.remove("lightbox-open");
    closeTimer = setTimeout(() => { box.hidden = true; }, 230);
    if (lastButton) lastButton.focus();
  };

  buttons.forEach((btn) => btn.addEventListener("click", () => open(btn)));

  // tapping anywhere (blurred area or the picture itself) closes it
  box.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "Tab") e.preventDefault(); // keep focus inside the pop-up
  });
})();
