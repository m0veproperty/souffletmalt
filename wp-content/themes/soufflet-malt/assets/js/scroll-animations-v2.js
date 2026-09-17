// --- SCROLL ANIMATIONS ---
export function initScrollAnimations(layoutGroup, scrollSpinGroup, morphGeometries, updateMorph, throwGrainsRight, mouseSpinGroup, regionRotGroup) {
    const isMobile = window.innerWidth <= 1023;

    if (isMobile) {
        // =============================================
        // MOBILE: No pinning, no main timeline.
        // CSS handles visibility (opacity:1 !important).
        // Only light scroll-triggered fade-in animations.
        // =============================================
        return;
    }

    // =============================================
    // DESKTOP: Full ScrollTrigger pinned experience
    // =============================================
    const heroEls = [document.querySelector('.content-wrapper'), document.querySelector('.video-widget')];
    const sectionEls = {
        s2: document.querySelector('.section-2'),
        fig: document.querySelector('.figures-grid'),
        s4: document.querySelector('.section-4'),
        s5: document.querySelector('.section-5'),
        s6: document.querySelector('.section-6'),
        s7: document.querySelector('.section-7'),
        s7b: document.querySelector('.section-7b'),
        s8: document.querySelector('.section-8'),
        s9: document.querySelector('.section-9')
    };
    const allInteractive = [...heroEls, ...Object.values(sectionEls)];

    window.__activeSection = null;

    function setActiveSection(...els) {
        allInteractive.forEach(s => { if (s) s.style.pointerEvents = 'none'; });
        els.forEach(el => { if (el) el.style.pointerEvents = 'auto'; });
        window.__activeSection = els.includes(sectionEls.s8) ? 's8' : (els.includes(sectionEls.s7b) ? 's7b' : null);
    }

    function predecodeImages(container, selector) {
        if (!container) return Promise.resolve();

        const decodePromises = Array.from(container.querySelectorAll(selector)).map((el) => {
            let src = '';

            if (el instanceof HTMLImageElement) {
                src = el.currentSrc || el.src;
            } else {
                const bg = getComputedStyle(el).backgroundImage;
                const match = bg && bg.match(/url\(["']?(.+?)["']?\)/);
                src = match && match[1] ? match[1] : '';
            }

            if (!src) return Promise.resolve();

            const img = new Image();
            img.decoding = 'async';
            img.src = src;

            if (img.decode) {
                return img.decode().catch(() => {});
            }

            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        });

        return Promise.all(decodePromises);
    }

    predecodeImages(sectionEls.s6, '.hscroll-card-img, .hscroll-card-logo');

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            ScrollTrigger.refresh();
        }).catch(() => {});
    }

    const tlScroll = gsap.timeline({
        scrollTrigger: {
            trigger: "#scroll-wrapper",
            start: "top top",
            end: "+=3500%",
            scrub: 1,
            pin: true,
            invalidateOnRefresh: true,
            onUpdate: () => {
                const t = tlScroll.time();
                if (t < 4) { setActiveSection(...heroEls); window.__disableMouseSpin = false; }
                else if (t < 7) { setActiveSection(sectionEls.s2); window.__disableMouseSpin = false; }
                else if (t < 11) { setActiveSection(sectionEls.s2, sectionEls.fig); window.__disableMouseSpin = false; }
                else if (t < 17) { setActiveSection(sectionEls.s4); window.__disableMouseSpin = false; }
                else if (t < 24) { setActiveSection(sectionEls.s5); window.__disableMouseSpin = false; }
                else if (t < 41) { setActiveSection(sectionEls.s6); window.__disableMouseSpin = false; }
                else if (t < 48) { setActiveSection(sectionEls.s7); window.__disableMouseSpin = true; }
                else if (t < 52) { setActiveSection(sectionEls.s7b); window.__disableMouseSpin = true; }
                else if (t < 60) {
                    setActiveSection(sectionEls.s8);
                    window.__activeSection = t >= 56 ? 's8' : null;
                    window.__disableMouseSpin = true;
                }
                else { setActiveSection(sectionEls.s9); window.__disableMouseSpin = true; }
            }
        }
    });

    // Synchroniser SVG jaune, vidéo réduite, mesh rotation/séparation et explosion graines
    tlScroll.to('.svg-title-yellow-mask', { clipPath: 'inset(0% 0% 0% 0%)', duration: 3 }, 0);
    tlScroll.to('.bg-video-wrapper', { width: '100px', height: '100px', borderRadius: '20px', duration: 2.5, ease: "power2.inOut" }, 0);
    tlScroll.to('.bg-video', { opacity: 0, duration: 0.5 }, 2);

    // Restore bg-video-wrapper at the end of scroll (after section-9)
    tlScroll.to('.bg-video-wrapper', { width: '100vw', height: '100vh', borderRadius: '0px', duration: 2.5, ease: "power2.inOut" }, 65);

    const morphObj = { val: 0 };
    tlScroll.to(morphObj, { val: 1, duration: 2.5, ease: "power2.out", onUpdate: () => updateMorph(morphObj.val) }, 0);
    tlScroll.to('.content-wrapper, .video-widget', { opacity: 0, duration: 2 }, 1.5);

    tlScroll.to(layoutGroup.position, { x: -5.2, y: 0, duration: 2.5, ease: "power1.inOut" }, 1.5);
    tlScroll.to(scrollSpinGroup.rotation, { y: Math.PI * 4, duration: 4 }, 0);
    tlScroll.to(morphObj, { val: 2, duration: 3, ease: "power2.out", onUpdate: () => updateMorph(morphObj.val) }, 2.5);

    // --- SECTION 2 ---
    tlScroll.fromTo('.section-2', { opacity: 0, x: 100 }, { opacity: 1, x: 0, duration: 2.5 }, 4);

    // --- CHIFFRES ---
    tlScroll.to('.s2-content', { opacity: 0, y: -100, duration: 2.5 }, 6);
    tlScroll.to(layoutGroup.position, { x: -7.2, duration: 3, ease: "power1.inOut" }, 6);
    tlScroll.to('.figures-grid', { opacity: 1, duration: 1.5 }, 7);
    tlScroll.to('.figure-item, .figure-text', { opacity: 1, y: 0, stagger: 0.2, duration: 2 }, 7.2);

    // =============================================
    // VIDEO-2 PANEL: slides in from left after figures
    // =============================================
    tlScroll.to('.figures-grid', { opacity: 0, duration: 1.5 }, 10);
    tlScroll.to('.section-2', { opacity: 0, duration: 1.5 }, 10);
    // Single continuous width expansion: 0 → 100vw (no opacity change, already visible)
    tlScroll.to('.video-2-left', { width: '100vw', duration: 5, ease: "power2.inOut", force3D: true }, 11);
    tlScroll.to(layoutGroup.position, { x: -9, duration: 3, ease: "power1.inOut" }, 11);
    tlScroll.to('.video-2-left video', { opacity: 0.3, filter: 'grayscale(30%) contrast(1)', duration: 3, ease: "power2.inOut" }, 13);

    // --- SECTION 4: Malt expertise text (LEFT side, over fullscreen video-2) ---
    tlScroll.to('.section-4', { opacity: 1, duration: 1.5 }, 13.5);
    tlScroll.to('.s4-title', { opacity: 1, x: 0, duration: 2, ease: "power3.out" }, 13.7);
    tlScroll.to('.s4-text', { opacity: 1, x: 0, duration: 2, ease: "power3.out" }, 14);
    tlScroll.to('.s4-cta', { opacity: 1, x: 0, duration: 1.5, ease: "power3.out" }, 14.3);

    // =============================================
    // HERITAGE-LEFT (malt-day): slides in from left ON TOP of video-2
    // =============================================
    // Fade out Malt expertise text (exits to the RIGHT — fast, far right)
    tlScroll.to('.s4-title', { x: 800, opacity: 0, duration: 0.8, ease: "power3.in" }, 18.5);
    tlScroll.to('.s4-text', { x: 700, opacity: 0, duration: 0.8, ease: "power3.in" }, 18.5);
    tlScroll.to('.s4-cta', { x: 600, opacity: 0, duration: 0.6, ease: "power3.in" }, 18.5);
    tlScroll.to('.section-4', { opacity: 0, duration: 0.5 }, 18.8);
    // Heritage-left expands from 0 to 100vw, but starts quickly to stay wider than video-2
    tlScroll.fromTo('.heritage-left', { width: '0vw' }, { width: '100vw', duration: 4, ease: "power1.out", force3D: true }, 18.5);
    // Push video-2-left to the right — starts after heritage-left is ~20% expanded, moves slower (parallax)
    tlScroll.to('.video-2-left', { left: '30vw', duration: 8, ease: "power1.out", force3D: true }, 21);
    tlScroll.to('.heritage-left video', { opacity: 0.3, filter: 'grayscale(30%) contrast(1)', duration: 3, ease: "power2.inOut" }, 21.5);

    // --- SECTION 5: Malt solutions text (LEFT side, over fullscreen malt-day) ---
    tlScroll.to('.section-5', { opacity: 1, duration: 1.5 }, 22);
    tlScroll.to('.s5-title', { opacity: 1, x: 0, duration: 2, ease: "power3.out" }, 22.2);
    tlScroll.to('.s5-text', { opacity: 1, x: 0, duration: 2, ease: "power3.out" }, 22.5);
    tlScroll.to('.s5-cta', { opacity: 1, x: 0, duration: 1.5, ease: "power3.out" }, 22.8);

    // =============================================
    // SECTION 6: Heritage brands — horizontal scroll
    // =============================================
    // Fade out Malt solutions text (exits to the RIGHT — far right)
    tlScroll.to('.s5-title', { x: 500, opacity: 0, duration: 1.5, ease: "power2.in" }, 24);
    tlScroll.to('.s5-text', { x: 400, opacity: 0, duration: 1.5, ease: "power2.in" }, 24);
    tlScroll.to('.s5-cta', { x: 300, opacity: 0, duration: 1, ease: "power2.in" }, 24);
    tlScroll.to('.section-5', { opacity: 0, duration: 1 }, 24.5);
    // Hide video-2-left immediately so it doesn't reappear underneath
    tlScroll.to('.video-2-left', { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 24);
    // Malt solutions video (heritage-left) disappears left→right via clip-path (smoother)
    tlScroll.to('.heritage-left', { clipPath: 'inset(0 0 0 100%)', duration: 4, ease: "power1.inOut" }, 24.5);
    tlScroll.to('.heritage-left', { opacity: 0, duration: 1.5 }, 27.5);
    // Reveal section 6 with entrance from the left
    tlScroll.fromTo('.section-6', { opacity: 0 }, { opacity: 1, duration: 2 }, 26.5);
    tlScroll.fromTo('.hscroll-track', { x: -200 }, { x: 0, duration: 2, ease: "power3.out" }, 26.5);
    // Animate intro text
    tlScroll.to('.hscroll-title', { opacity: 1, x: 0, duration: 2, ease: "power3.out" }, 27);
    tlScroll.to('.hscroll-text', { opacity: 1, x: 0, duration: 2, ease: "power3.out" }, 27.3);
    tlScroll.to('.hscroll-cols', { opacity: 1, x: 0, duration: 2, ease: "power3.out" }, 27.5);
    tlScroll.to('.hscroll-cta', { opacity: 1, x: 0, duration: 1.5, ease: "power3.out" }, 27.7);
    // Cards start hidden, fade in before scroll begins
    gsap.set('.hscroll-card', { opacity: 0 });
    tlScroll.to('.hscroll-card', { opacity: 1, duration: 1.5, stagger: 0.15, ease: "power2.out" }, 28.5);
    // Horizontal scroll: translate the track from 0 to -(trackWidth - 100vw)
    // Delayed so intro content appears first, then cards scroll
    const hscrollTrack = document.querySelector('.hscroll-track');
    const getHscrollDist = () => hscrollTrack ? Math.max(0, hscrollTrack.scrollWidth - window.innerWidth) : 2000;
    tlScroll.to('.hscroll-track', { x: () => -getHscrollDist(), duration: 12, ease: "none", force3D: true }, 29.5);
    // Parallax: subtle speed differences between odd/even cards
    tlScroll.to('.hscroll-card-1, .hscroll-card-3, .hscroll-card-5, .hscroll-card-7', { x: 40, duration: 12, ease: "none", force3D: true }, 29.5);
    tlScroll.to('.hscroll-card-2, .hscroll-card-4, .hscroll-card-6', { x: -40, duration: 12, ease: "none", force3D: true }, 29.5);

    // 'See all' button appears once intro text has scrolled off, disappears with section
    tlScroll.to('.hscroll-see-all', { opacity: 1, duration: 1, ease: "power2.out" }, 30);
    tlScroll.to('.hscroll-see-all', { opacity: 0, duration: 1, ease: "power2.in" }, 39);

    // --- SECTION 7 SUSTAINABILITY JUMBOTRON ---
    // Fade out section 6 (delayed to let last card breathe)
    tlScroll.to('.section-6', { opacity: 0, duration: 1.5 }, 40.5);
    // Jumbotron grow: measure natural height, then animate from small to large
    const pjEl = document.querySelector('.purchase-jumbotron');
    if (pjEl) {
        tlScroll.fromTo('.section-7', { opacity: 0 }, { opacity: 1, duration: 1.5 }, 42);
        tlScroll.to('.purchase-jumbotron', { width: '100vw', height: '100vh', borderRadius: '0px', duration: 3, ease: "power2.inOut" }, 42.5);
    }
    tlScroll.to('.purchase-title', { opacity: 1, y: 0, duration: 2, ease: "power2.out" }, 43.3);
    tlScroll.to('.purchase-text', { opacity: 1, y: 0, duration: 2, ease: "power2.out" }, 43.5);
    tlScroll.to('.purchase-columns', { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" }, 43.8);

    // --- SECTION 7B PURCHASE OUR MALT ---
    // Sustainability video exits: shrink to right with opacity fade
    tlScroll.to('.purchase-title', { opacity: 0, duration: 1, ease: "power2.in" }, 46);
    tlScroll.to('.purchase-text', { opacity: 0, duration: 1, ease: "power2.in" }, 46);
    tlScroll.to('.purchase-columns', { opacity: 0, duration: 1, ease: "power2.in" }, 46);
    tlScroll.to('.purchase-jumbotron', { clipPath: 'inset(0 0 0 100%)', duration: 2.5, ease: "power2.inOut" }, 46.5);
    tlScroll.to('.purchase-jumbotron', { opacity: 0, duration: 0.5 }, 48.5);
    tlScroll.to('.section-7', { opacity: 0, duration: 0.5 }, 48.5);
    tlScroll.to(layoutGroup.position, { x: -6, duration: 3, ease: "power1.inOut" }, 46.5);
    if (mouseSpinGroup) {
        tlScroll.to(mouseSpinGroup.rotation, { x: 0, y: 0, z: 0, duration: 1.5, ease: "power2.inOut" }, 47);
    }
    if (regionRotGroup) {
        tlScroll.to(regionRotGroup.rotation, { x: 0, y: 0, z: 0, duration: 1.5, ease: "power2.inOut" }, 47);
    }
    tlScroll.fromTo('.section-7b', { opacity: 0, pointerEvents: 'none' }, {
        opacity: 1, pointerEvents: 'auto', duration: 1.5,
        onStart: () => { window.__disableMouseSpin = true; },
        onReverseComplete: () => { window.__disableMouseSpin = false; }
    }, 48);
    tlScroll.to('.purchase-malt-title', { opacity: 1, x: 0, duration: 2, ease: "power3.out" }, 48.5);
    tlScroll.to('.purchase-malt-text', { opacity: 1, x: 0, duration: 2, ease: "power3.out" }, 48.8);
    tlScroll.to('.purchase-malt-distributors', { opacity: 1, y: 0, duration: 2, ease: "power3.out" }, 49.3);
    tlScroll.to('.purchase-malt-cta', { opacity: 1, y: 0, duration: 1.5, ease: "power3.out" }, 49.8);

    // --- SECTION 8 NEWS ---
    tlScroll.to('.purchase-malt-title', { x: 300, opacity: 0, duration: 2, ease: "power2.in" }, 52);
    tlScroll.to('.purchase-malt-text', { x: 200, opacity: 0, duration: 2, ease: "power2.in" }, 52);
    tlScroll.to('.purchase-malt-distributors', { x: 100, opacity: 0, duration: 2, ease: "power2.in" }, 52);
    tlScroll.to('.purchase-malt-cta', { x: 100, opacity: 0, duration: 1.5, ease: "power2.in" }, 52);
    tlScroll.to('.section-7b', {
        opacity: 0, pointerEvents: 'none', duration: 1.5,
        onStart: () => { window.__disableMouseSpin = false; },
        onReverseComplete: () => { window.__disableMouseSpin = true; }
    }, 52.5);
    tlScroll.to(layoutGroup.position, { x: -15, duration: 4, ease: "power1.inOut" }, 52.5);
    if (mouseSpinGroup) {
        tlScroll.to(mouseSpinGroup.rotation, { x: 0, y: 0, z: 0, duration: 2, ease: "power1.inOut" }, 56.5);
    }
    tlScroll.to(layoutGroup.position, { z: -2, duration: 3, ease: "power1.inOut" }, 54.5);
    tlScroll.fromTo('.section-8', { opacity: 0 }, { opacity: 1, duration: 1.5 }, 54);
    tlScroll.to('.news-header', { opacity: 1, x: 0, duration: 2, ease: "power3.out" }, 54.8);
    tlScroll.to('.news-item-1', { opacity: 1, x: 0, duration: 1.8, ease: "power3.out" }, 55);
    tlScroll.to('.news-item-2', { opacity: 1, x: 0, duration: 1.8, ease: "power3.out" }, 55.4);
    tlScroll.to('.news-item-3', { opacity: 1, x: 0, duration: 1.8, ease: "power3.out" }, 55.8);
    tlScroll.to('.news-all-cta', { opacity: 1, x: 0, duration: 1.5, ease: "power3.out" }, 56);

    // --- SECTION 9 PRE-FOOTER ---
    tlScroll.to('.news-header', { opacity: 0, x: -200, duration: 1.5, ease: "power2.in" }, 58.5);
    tlScroll.to('.news-item-1', { opacity: 0, x: -200, duration: 1.5, ease: "power2.in" }, 58.7);
    tlScroll.to('.news-item-2', { opacity: 0, x: -200, duration: 1.5, ease: "power2.in" }, 58.9);
    tlScroll.to('.news-item-3', { opacity: 0, x: -200, duration: 1.5, ease: "power2.in" }, 59.1);
    tlScroll.to('.news-all-cta', { opacity: 0, x: -200, duration: 1, ease: "power2.in" }, 59);
    tlScroll.to('.section-8', { opacity: 0, duration: 1.5 }, 60.5);
    tlScroll.fromTo('.section-9', { opacity: 0, visibility: 'hidden' }, { opacity: 1, visibility: 'visible', duration: 1.5 }, 61.5);
    tlScroll.fromTo('.pf-svg-fill', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 4, ease: 'power2.inOut', stagger: 0.4 }, 62);

    // --- GRAIN EXPLOSION: throw grains from bottom-left to top-right ---
    if (throwGrainsRight) {
        const throwObj = { progress: 0 };
        tlScroll.to(throwObj, {
            progress: 1,
            duration: 4,
            ease: 'power2.in',
            onUpdate: () => throwGrainsRight(throwObj.progress)
        }, 63);
    }

    // --- FOOTER REVEAL ---
    tlScroll.to('.site-footer', { opacity: 1, visibility: 'visible', duration: 0.01 }, 68);
}
