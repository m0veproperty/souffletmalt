// --- HOME MOBILE ANIMATIONS ---
// On mobile (≤ 1023px) the desktop GSAP scroll-pinned timeline is disabled.
// This module re-introduces lightweight entrance animations for every
// title, paragraph and button of the home page so they fade in as the
// user scrolls instead of appearing all at once.
//
// Strategy:
//   1. Tag matching elements with the `.home-mobile-anim` class (CSS
//      gives them `opacity:0; transform:translateY(30px)`).
//   2. Stagger sibling elements so groups feel coordinated.
//   3. Reveal each element through an IntersectionObserver by adding
//      `.is-revealed` (CSS animates back to natural state).
//
// Elements above the fold are revealed on the next animation frame so
// they don't stay hidden after the loader / hero animation finishes.

// NOTE: hero text (.description-text, .hero-ctas) stays handled by
// `hero-animations.js` (playHeroAnimation) because it sits above the fold and
// fades in with the hero timeline on every breakpoint.
// `.video-widget` is the exception: on mobile it drops below the hero viewport,
// so it is revealed on scroll here instead. The `.home-mobile-anim !important`
// rules override the (now off-screen) GSAP hero tween on mobile.
const SELECTORS = [
    // Hero — video widget (below the fold on mobile only)
    '.video-widget',

    // Section 2 — intro paragraph
    '.section-2 .s2-content > h2',
    '.section-2 .s2-content > p',
    '.section-2 .s2-content > div',

    // Figures grid
    '.figures-grid .figure-item',
    '.figures-grid .figure-text-col',

    // Section 4 — Malt expertise
    '.section-4 .s4-title',
    '.section-4 .s4-text',
    '.section-4 .s4-cta',

    // Section 5 — Malt solutions
    '.section-5 .s5-title',
    '.section-5 .s5-text',
    '.section-5 .s5-cta',

    // Section 6 — Heritage brands carousel on mobile
    '.section-6 .hscroll-title',
    '.section-6 .hscroll-text',
    '.section-6 .hscroll-cols > *',
    '.section-6 .hscroll-cta',
    '.section-6 .hscroll-card',
    '.section-6 .hscroll-see-all',

    // Section 7 — Sustainability jumbotron
    '.section-7 .purchase-title',
    '.section-7 .purchase-text',
    '.section-7 .purchase-jumbotron-cta',

    // Section 7b — Purchase malt distributors
    '.section-7b .purchase-malt-title',
    '.section-7b .purchase-malt-text',
    '.section-7b .purchase-malt-col',
    '.section-7b .purchase-malt-cta',

    // Section 8 — News list
    '.section-8 .news-title',
    '.section-8 .news-subtitle',
    '.section-8 .news-item',
    '.section-8 .news-all-cta',

    // Section 9 — Pre-footer giant SVG word
    '.section-9 .pf-line'
].join(', ');

const STAGGER_MS = 80;
const STAGGER_MAX_INDEX = 5;

function applyAnimClass(els) {
    const groupMap = new Map();

    els.forEach((el) => {
        const parent = el.parentElement || document.body;
        if (!groupMap.has(parent)) {
            groupMap.set(parent, []);
        }
        groupMap.get(parent).push(el);
    });

    groupMap.forEach((items) => {
        items.forEach((el, idx) => {
            el.classList.add('home-mobile-anim');
            const delay = Math.min(idx, STAGGER_MAX_INDEX) * STAGGER_MS;
            el.style.setProperty('--home-anim-delay', delay + 'ms');
        });
    });
}

function revealVisibleNow(els) {
    const viewportHeight = window.innerHeight;

    els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < viewportHeight && rect.bottom > 0) {
            el.classList.add('is-revealed');
        }
    });
}

export function initHomeMobileAnimations() {
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (!isMobile) return;

    const root = document.querySelector('#scroll-wrapper');
    if (!root) return;

    const els = Array.from(root.querySelectorAll(SELECTORS));
    if (!els.length) return;

    applyAnimClass(els);

    if (typeof IntersectionObserver === 'undefined') {
        els.forEach((el) => el.classList.add('is-revealed'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.05
    });

    els.forEach((el) => observer.observe(el));

    // Reveal anything already in view (hero + section-2 above the fold)
    requestAnimationFrame(() => {
        revealVisibleNow(els);
    });
}
