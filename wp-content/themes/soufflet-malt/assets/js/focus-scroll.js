// --- SCROLL AUTOMATIQUE AU FOCUS CLAVIER ---
// DESKTOP ONLY: ScrollTrigger pinned nécessite un scroll custom
// MOBILE: Scroll normal, pas besoin de scroll custom
export function initFocusScroll() {
    const isMobile = window.innerWidth <= 1023;
    
    if (isMobile) {
        // Mobile : scroll normal, pas besoin de scroll custom
        return;
    }
    
    // DESKTOP: Positions in the timeline where each section is fully visible
    // Fractions match scroll-animations-v2.js (total ~68 time units)
    const sectionTimeline = {
        'section-2': 5 / 68,
        'section-4': 16 / 68,
        'section-5': 23 / 68,
        'section-6': 30 / 68,
        'section-7': 44.5 / 68,
        'section-7b': 50 / 68,
        'section-8': 57 / 68
    };

    let isScrolling = false;

    document.addEventListener('focus', (e) => {
        const target = e.target;
        if (!target || isScrolling) return;

        // Ignore les éléments du header et hero
        if (target.closest('.super-header, .header-logo, .header-right-actions, .lang-switcher, .main-nav, .search-toggle, .menu-toggle, .mobile-search-panel, .mobile-menu, .skip-link, #loading-screen, .content-wrapper, .video-widget, .hscroll-cards')) return;

        // Trouve la section parente
        let sectionKey = null;
        for (const key of Object.keys(sectionTimeline)) {
            if (target.closest('.' + key)) {
                sectionKey = key;
                break;
            }
        }
        if (!sectionKey) return;

        // Récupère le ScrollTrigger principal
        const triggers = ScrollTrigger.getAll();
        if (triggers.length === 0) return;

        const st = triggers[0];
        const targetScroll = st.start + (st.end - st.start) * sectionTimeline[sectionKey];
        const currentScroll = window.pageYOffset;

        // Ne scroll que si on est loin de la cible
        if (Math.abs(currentScroll - targetScroll) < 100) return;

        isScrolling = true;
        
        // Anime le scroll de la page — GSAP met à jour window.scrollY frame par frame
        // ce qui déclenche correctement ScrollTrigger
        const scrollObj = { y: currentScroll };
        gsap.to(scrollObj, {
            y: targetScroll,
            duration: 0.8,
            ease: 'power2.inOut',
            onUpdate: () => {
                window.scrollTo(0, scrollObj.y);
            },
            onComplete: () => {
                isScrolling = false;
            }
        });
    }, true);

    // Bridge Tab between section-8 and footer
    // Footer has visibility:hidden in CSS until GSAP reveals it at t=68 (end of timeline).
    // Without this bridge, Tab wraps back to the header after the last section-8 link.
    const FOCUSABLE = 'a[href]:not([tabindex="-1"]), button:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

    function scrollAndFocus(targetY, duration, focusFn) {
        isScrolling = true;
        const scrollObj = { y: window.pageYOffset };
        gsap.to(scrollObj, {
            y: targetY,
            duration,
            ease: 'power2.inOut',
            onUpdate: () => window.scrollTo(0, scrollObj.y),
            onComplete: () => {
                isScrolling = false;
                focusFn();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || isScrolling) return;

        const focused = document.activeElement;
        if (!focused) return;

        const triggers = ScrollTrigger.getAll();
        if (triggers.length === 0) return;
        const st = triggers[0];

        if (!e.shiftKey && focused.closest('.section-8')) {
            // Forward Tab: last focusable in section-8 → first focusable in footer
            const s8 = document.querySelector('.section-8');
            if (!s8) return;
            const items = s8.querySelectorAll(FOCUSABLE);
            if (focused !== items[items.length - 1]) return;

            e.preventDefault();
            scrollAndFocus(st.end, 1.2, () => {
                const link = document.querySelector('.site-footer ' + FOCUSABLE);
                if (link) link.focus();
            });

        } else if (e.shiftKey && focused.closest('.site-footer')) {
            // Shift+Tab: first focusable in footer → last focusable in section-8
            const footer = document.querySelector('.site-footer');
            if (!footer) return;
            const items = footer.querySelectorAll(FOCUSABLE);
            if (focused !== items[0]) return;

            e.preventDefault();
            const targetY = st.start + (st.end - st.start) * sectionTimeline['section-8'];
            scrollAndFocus(targetY, 1.2, () => {
                const s8 = document.querySelector('.section-8');
                if (!s8) return;
                const els = s8.querySelectorAll(FOCUSABLE);
                if (els.length) els[els.length - 1].focus();
            });
        }
    });
}
