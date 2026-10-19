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

    runTerm(bugs.every((bug) => bug.classList.contains("fixed")));
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

/**
 * Photo: tilts a few degrees toward the pointer (desktop with a mouse only).
 */
(() => {
  const wrap = document.querySelector(".portrait-wrap");
  if (!wrap) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let queued = false;
  let ev = null;

  const apply = () => {
    queued = false;
    if (!ev) {
      wrap.style.setProperty("--rx", "0deg");
      wrap.style.setProperty("--ry", "0deg");
      return;
    }
    const r = wrap.getBoundingClientRect();
    const clamp = (n) => Math.max(-1, Math.min(1, n));
    const x = clamp((ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
    const y = clamp((ev.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
    wrap.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
    wrap.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");
  };

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  };

  window.addEventListener("pointermove", (e) => { ev = e; queue(); }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { ev = null; queue(); });
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

  let queued = false;

  const update = () => {
    queued = false;
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

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  update();
})();

/**
 * "Currently" pop-up: slides in shortly after load, hides itself after a while,
 * can be dismissed, and stays away for the rest of the browser session.
 */
(() => {
  const card = document.getElementById("nowCard");
  if (!card) return;

  const KEY = "nowCardSeen";
  try {
    if (sessionStorage.getItem(KEY) === "1") return;
  } catch (e) {}

  let hideTimer = null;

  const hide = () => {
    clearTimeout(hideTimer);
    card.classList.remove("show");
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  };

  card.querySelector(".now-close").addEventListener("click", hide);
  card.querySelector(".now-body").addEventListener("click", hide);
  card.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  card.addEventListener("mouseleave", () => { hideTimer = setTimeout(hide, 4000); });

  setTimeout(() => {
    card.classList.add("show");
    hideTimer = setTimeout(hide, 12000);
  }, 2500);
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
