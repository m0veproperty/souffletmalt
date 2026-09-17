const PAGE_TRANSITION_STORAGE_KEY = 'sm-page-transition';
const PAGE_TRANSITION_TARGETS = [
    '.super-header',
    '.header-logo',
    '.header-right-actions',
    '.main-nav',
    '.search-toggle',
    '.menu-toggle',
    '.title-overlap-container',
    '.description-text',
    '.hero-ctas',
    '.video-widget',
    '#webgl-container',
    '.bg-video',
    '.bg-video-wrapper',
    'main',
    '.site-footer',
    '.mobile-search-panel',
    '.mobile-menu'
];

let isTransitioning = false;

function createTransitionOverlay() {
    let overlay = document.querySelector('.page-transition-overlay');

    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    return overlay;
}

function isEntryTransitionPending() {
    return (
        window.__pendingPageTransition === 'gold-wipe' ||
        document.documentElement.classList.contains('page-transition-entry-pending')
    );
}

function clearStoredTransition() {
    try {
        sessionStorage.removeItem(PAGE_TRANSITION_STORAGE_KEY);
    } catch (error) {
        /* no-op */
    }
}

function clearPendingEntryState() {
    document.documentElement.classList.remove('page-transition-entry-pending');
    window.__pendingPageTransition = null;
    clearStoredTransition();
}

function persistTransitionState() {
    try {
        sessionStorage.setItem(PAGE_TRANSITION_STORAGE_KEY, JSON.stringify({
            type: 'gold-wipe',
            ts: Date.now()
        }));
    } catch (error) {
        /* no-op */
    }
}

function resetTransitionTargets() {
    const targets = PAGE_TRANSITION_TARGETS.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    if (!targets.length) return;

    if (window.gsap) {
        gsap.killTweensOf(targets);
        gsap.set(targets, {
            clearProps: 'opacity,visibility,transform,transformOrigin,pointerEvents'
        });
        return;
    }

    targets.forEach((target) => {
        target.style.opacity = '';
        target.style.visibility = '';
        target.style.transform = '';
        target.style.transformOrigin = '';
        target.style.pointerEvents = '';
    });
}

function refreshAnimationState() {
    window.requestAnimationFrame(() => {
        if (window.ScrollTrigger) {
            ScrollTrigger.sort();
            ScrollTrigger.refresh(true);
        }

        window.dispatchEvent(new CustomEvent('soufflet:page-restored'));
    });
}

function resetTransitionState(overlay, options = {}) {
    const shouldResetTargets = options.resetTargets || isTransitioning || document.body.classList.contains('page-transitioning');

    isTransitioning = false;
    document.body.classList.remove('page-transitioning');
    window.__disableMouseSpin = false;

    if (shouldResetTargets) {
        resetTransitionTargets();
    }

    if (!overlay) return;

    // Leave the overlay untouched while an entry wipe-out is pending so the
    // incoming animation (hero block or fallback) can play uninterrupted.
    if (isEntryTransitionPending() && !options.forceOverlayReset) return;

    gsap.killTweensOf(overlay);
    gsap.set(overlay, {
        clearProps: 'opacity,visibility,transform,transformOrigin,pointerEvents'
    });
}

function handlePageShow(overlay, event) {
    const restoredFromBrowserCache = Boolean(event && event.persisted);

    if (restoredFromBrowserCache) {
        clearPendingEntryState();
    }

    resetTransitionState(overlay, {
        forceOverlayReset: restoredFromBrowserCache,
        resetTargets: restoredFromBrowserCache
    });

    refreshAnimationState();
}

function isModifiedClick(event, link) {
    return (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === '_blank' ||
        link.hasAttribute('download')
    );
}

function getTargetUrl(link) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;

    let targetUrl;
    try {
        targetUrl = new URL(href, window.location.href);
    } catch (error) {
        return null;
    }

    const currentUrl = new URL(window.location.href);

    if (targetUrl.origin !== currentUrl.origin) return null;
    if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) return null;

    // Never intercept WordPress admin / authentication navigation.
    if (/\/wp-admin(\/|$)/.test(targetUrl.pathname) || /wp-login\.php/.test(targetUrl.pathname)) return null;

    return targetUrl;
}

function runExitTransition(targetUrl, overlay) {
    if (isTransitioning) return;

    isTransitioning = true;
    window.__disableMouseSpin = true;
    document.body.classList.add('page-transitioning');

    gsap.set(overlay, {
        autoAlpha: 1,
        scaleX: 0,
        transformOrigin: 'left center',
        pointerEvents: 'auto'
    });

    const tl = gsap.timeline({
        defaults: {
            ease: 'power3.inOut'
        },
        onComplete: () => {
            persistTransitionState();
            window.location.assign(targetUrl.href);
        }
    });

    tl.to(
        ['.super-header', '.header-logo', '.header-right-actions', '.main-nav', '.search-toggle', '.menu-toggle'],
        {
            y: -18,
            opacity: 0,
            duration: 0.35,
            stagger: 0.04
        },
        0
    );

    tl.to(
        ['.title-overlap-container', '.description-text', '.hero-ctas', '.video-widget'],
        {
            y: 24,
            opacity: 0,
            duration: 0.45,
            stagger: 0.04
        },
        0
    );

    tl.to(
        ['#webgl-container', '.bg-video'],
        {
            opacity: 0.08,
            duration: 0.45
        },
        0
    );

    tl.to(
        '.bg-video-wrapper',
        {
            scale: 0.94,
            opacity: 0.3,
            duration: 0.55
        },
        0
    );

    tl.to(
        overlay,
        {
            scaleX: 1,
            duration: 0.82
        },
        0.12
    );
}

function runContentPageExitTransition(targetUrl, overlay) {
    if (isTransitioning) return;

    isTransitioning = true;
    window.__disableMouseSpin = true;
    document.body.classList.add('page-transitioning');

    gsap.set(overlay, {
        autoAlpha: 1,
        scaleX: 0,
        transformOrigin: 'left center',
        pointerEvents: 'auto'
    });

    const tl = gsap.timeline({
        defaults: {
            ease: 'power3.inOut'
        },
        onComplete: () => {
            persistTransitionState();
            window.location.assign(targetUrl.href);
        }
    });

    tl.to(
        ['.super-header', '.header-logo', '.header-right-actions', '.main-nav', '.search-toggle', '.menu-toggle'],
        {
            y: -18,
            opacity: 0,
            duration: 0.35,
            stagger: 0.04
        },
        0
    );

    tl.to(
        ['main', '.site-footer', '.mobile-search-panel', '.mobile-menu'],
        {
            x: 48,
            opacity: 0,
            duration: 0.45
        },
        0
    );

    tl.to(
        overlay,
        {
            scaleX: 1,
            duration: 0.82
        },
        0.12
    );
}

/**
 * Play the incoming gold wipe-out when arriving from a transition.
 *
 * The hero-content block owns this animation on pages that contain it (so the
 * reveal stays in sync with the hero entrance). This is a fallback for content
 * pages that have no hero-content block, so the overlay never stays stuck.
 */
function playPendingEntryTransition(overlay) {
    if (!overlay) return;
    if (!isEntryTransitionPending()) return;
    if (document.querySelector('.hero-content')) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        clearPendingEntryState();
        gsap.set(overlay, {
            clearProps: 'opacity,visibility,transform,transformOrigin,pointerEvents'
        });
        return;
    }

    gsap.set(overlay, {
        autoAlpha: 1,
        scaleX: 1,
        transformOrigin: 'right center',
        pointerEvents: 'auto'
    });

    gsap.to(overlay, {
        scaleX: 0,
        duration: 1,
        ease: 'power3.inOut',
        onComplete: () => {
            clearPendingEntryState();
            gsap.set(overlay, {
                clearProps: 'opacity,visibility,transform,transformOrigin,pointerEvents'
            });
        }
    });
}

function bindTransitionClicks({ overlay, onNavigate }) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link) return;

        // Never hijack the admin bar or opted-out links.
        if (link.closest('#wpadminbar')) return;
        if (link.hasAttribute('data-no-page-transition')) return;

        if (isTransitioning) {
            event.preventDefault();
            return;
        }

        if (isModifiedClick(event, link)) return;

        const targetUrl = getTargetUrl(link);
        if (!targetUrl) return;
        if (prefersReducedMotion.matches) return;

        event.preventDefault();
        onNavigate(targetUrl, overlay);
    });
}

export function initHomePageExitTransition() {
    const overlay = createTransitionOverlay();

    // The home page intro is handled by the loader, never the gold wipe-out,
    // so drop any pending entry state left over from a previous navigation.
    clearPendingEntryState();
    resetTransitionState(overlay);

    window.addEventListener('pageshow', (event) => {
        // The home page boots through a strictly one-time sequence:
        // loader → Three.js scene → hero GSAP timeline → pinned ScrollTrigger.
        // When the browser serves it from the back/forward cache (bfcache), none
        // of that re-runs and the transition reset clears the hero back to its
        // hidden CSS state — so the restored page looks empty/broken. Forcing a
        // fresh load replays the full init sequence exactly like a normal visit.
        // The reloaded document reports `persisted === false`, so this never loops.
        if (event.persisted) {
            window.location.reload();
            return;
        }

        handlePageShow(overlay, event);
    });

    bindTransitionClicks({ overlay, onNavigate: runExitTransition });
}

export function initContentPageExitTransition() {
    const overlay = createTransitionOverlay();

    resetTransitionState(overlay);
    playPendingEntryTransition(overlay);

    window.addEventListener('pageshow', (event) => handlePageShow(overlay, event));

    bindTransitionClicks({ overlay, onNavigate: runContentPageExitTransition });
}
