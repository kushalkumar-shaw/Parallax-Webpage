/* ═══════════════════════════════════════════════════════
   WANDERLUST — Parallax Website Script
   Handles: Navbar, Scroll Progress, Fade-ins,
            Counter Animation, Parallax Depth, Mobile Nav
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   CACHE DOM REFERENCES
───────────────────────────────────────────── */
const navbar         = document.getElementById('navbar');
const scrollProgress = document.getElementById('scrollProgress');
const hamburger      = document.getElementById('hamburger');
const mobileNav      = document.getElementById('mobileNav');

/* ─────────────────────────────────────────────
   1. NAVBAR SCROLL STATE + PROGRESS BAR
   – Adds .scrolled class after 60px
   – Updates the top gold progress bar width
───────────────────────────────────────────── */
function updateNavbarAndProgress() {
  const scrollY   = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct       = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

  // Navbar transparency
  navbar.classList.toggle('scrolled', scrollY > 60);

  // Progress bar
  scrollProgress.style.width = `${Math.min(pct, 100)}%`;
}

/* ─────────────────────────────────────────────
   2. MOBILE HAMBURGER MENU
───────────────────────────────────────────── */
function initMobileNav() {
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    // Prevent body scroll while menu is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close when any link inside the mobile nav is clicked
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ─────────────────────────────────────────────
   3. SMOOTH ANCHOR SCROLL
   – Offsets scroll by navbar height so sections
     are never hidden behind the fixed nav
───────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const offset = navbar.offsetHeight + 8;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────────
   4. FADE-IN ON SCROLL (IntersectionObserver)
   – Observes all .fade-in elements
   – Adds .visible when they enter the viewport
   – Staggers siblings slightly for a cascade feel
───────────────────────────────────────────── */
function initFadeIns() {
  const fadeEls = document.querySelectorAll('.fade-in');
  if (!fadeEls.length) return;

  // Build a map: parent → [its fade-in children]
  const siblingMap = new Map();
  fadeEls.forEach(el => {
    const parent = el.parentElement;
    if (!siblingMap.has(parent)) siblingMap.set(parent, []);
    siblingMap.get(parent).push(el);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el       = entry.target;
      const siblings = siblingMap.get(el.parentElement) || [el];
      const idx      = siblings.indexOf(el);
      const delay    = idx * 130; // 130 ms stagger per item

      setTimeout(() => {
        el.classList.add('visible');
      }, delay);

      observer.unobserve(el);
    });
  }, {
    threshold:   0.10,
    rootMargin:  '0px 0px -50px 0px'
  });

  fadeEls.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────
   5. STAT COUNTER ANIMATION
   – Reads data-target (number) and data-suffix
   – Counts up with an ease-out cubic curve
   – Triggered once when stat enters the viewport
───────────────────────────────────────────── */
function initCounters() {
  const stats = document.querySelectorAll('.stat-number[data-target]');
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el     = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const dur    = 1800; // ms
      const start  = performance.now();

      function tick(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / dur, 1);
        // Ease-out cubic: fast start, slow finish
        const eased    = 1 - Math.pow(1 - progress, 3);
        const current  = Math.floor(target * eased);

        el.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          // Ensure exact final value
          el.textContent = target + suffix;
        }
      }

      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.6 });

  stats.forEach(stat => observer.observe(stat));
}

/* ─────────────────────────────────────────────
   6. PARALLAX DEPTH ENHANCEMENT (desktop only)
   – CSS background-attachment:fixed handles the
     base parallax effect.
   – This JS layer adds a subtle extra depth by
     nudging backgroundPositionY based on how far
     each section is from the viewport center.
   – Skipped on mobile (iOS ignores fixed bg) and
     when reduced-motion is preferred.
───────────────────────────────────────────── */
function initParallaxDepth() {
  // Don't run on mobile (< 768px) or reduced-motion
  const isMobile      = window.innerWidth < 768;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isMobile || reducedMotion) return;

  const sections = document.querySelectorAll('.parallax');
  if (!sections.length) return;

  function applyDepth() {
    const viewCenter = window.innerHeight / 2;

    sections.forEach(sec => {
      const rect          = sec.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      // Offset: positive = bg shifts down (reveals lower part), negative = shifts up
      const offset = (sectionCenter - viewCenter) * 0.08;
      sec.style.backgroundPositionY = `calc(50% + ${offset}px)`;
    });
  }

  window.addEventListener('scroll', applyDepth, { passive: true });
  applyDepth(); // run once on load
}

/* ─────────────────────────────────────────────
   7. ACTIVE NAV LINK HIGHLIGHT
   – Tracks which section is currently in view
   – Adds .active class to the corresponding nav link
───────────────────────────────────────────── */
function initActiveNavLinks() {
  const sections  = document.querySelectorAll('section[id], footer[id]');
  const navLinks  = document.querySelectorAll('.nav-links a, .mobile-nav a');
  if (!sections.length || !navLinks.length) return;

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const id = entry.target.id;
      navLinks.forEach(link => {
        const matches = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', matches);
      });
    });
  }, {
    threshold:  0.35,
    rootMargin: '-10% 0px -55% 0px'
  });

  sections.forEach(sec => sectionObserver.observe(sec));
}

/* ─────────────────────────────────────────────
   8. DESTINATION CARD HOVER RIPPLE
   – Adds a subtle scale+shadow on card hover
   – Pure CSS handles this, JS is just a fallback
     registration guard
───────────────────────────────────────────── */
function initCardInteractions() {
  document.querySelectorAll('.dest-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.willChange = 'transform';
    });
    card.addEventListener('mouseleave', () => {
      card.style.willChange = '';
    });
  });
}

/* ─────────────────────────────────────────────
   9. WINDOW RESIZE HANDLER
   – Re-evaluates mobile breakpoint for parallax depth
───────────────────────────────────────────── */
let parallaxActive = false;

function handleResize() {
  const nowMobile = window.innerWidth < 768;
  // If we've crossed the mobile threshold, reload is simplest
  // (avoids patching event listeners at runtime)
  if (!parallaxActive && !nowMobile) {
    initParallaxDepth();
    parallaxActive = true;
  }
}

/* ─────────────────────────────────────────────
   INIT — Wire everything up
───────────────────────────────────────────── */
function init() {
  updateNavbarAndProgress();
  initMobileNav();
  initSmoothScroll();
  initFadeIns();
  initCounters();
  initParallaxDepth();
  initActiveNavLinks();
  initCardInteractions();

  parallaxActive = window.innerWidth >= 768;
}

// Passive scroll listener for performance
window.addEventListener('scroll', updateNavbarAndProgress, { passive: true });
window.addEventListener('resize', handleResize, { passive: true });

// Run on full load (ensures images affect layout before we measure positions)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}