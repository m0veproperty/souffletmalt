// --- GESTION MENU MOBILE ---
export function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const searchToggle = document.getElementById('search-toggle');
    const mobileSearchPanel = document.getElementById('mobile-search-panel');
    const mobileAnimTargets = document.querySelectorAll('.mobile-item, .mobile-links > a.single-link, .mobile-secondary');
    const mobileSearchAnimTargets = mobileSearchPanel
        ? mobileSearchPanel.querySelectorAll('.mobile-search-panel__content')
        : [];
    let lockedScrollY = 0;
    let previousScrollStyles = null;
    let activeOverlay = null;

    if (!menuToggle || !mobileMenu) return;

    function lockPageScroll() {
        const scrollWrapper = document.getElementById('scroll-wrapper');

        if (document.documentElement.classList.contains('mobile-menu-open')) return;

        lockedScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        previousScrollStyles = {
            htmlOverflow: document.documentElement.style.overflow,
            bodyOverflow: document.body.style.overflow,
            bodyPosition: document.body.style.position,
            bodyWidth: document.body.style.width,
            bodyTop: document.body.style.top,
            bodyLeft: document.body.style.left,
            bodyRight: document.body.style.right,
            scrollWrapperOverflow: scrollWrapper ? scrollWrapper.style.overflow : null,
        };

        document.documentElement.classList.add('mobile-menu-open');
        document.body.classList.add('mobile-menu-open');
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${lockedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        if (scrollWrapper) scrollWrapper.style.overflow = 'hidden';
    }

    function unlockPageScroll() {
        const scrollWrapper = document.getElementById('scroll-wrapper');

        document.documentElement.classList.remove('mobile-menu-open');
        document.documentElement.classList.remove('mobile-search-open');
        document.body.classList.remove('mobile-menu-open');
        document.body.classList.remove('mobile-search-open');

        if (previousScrollStyles) {
            document.documentElement.style.overflow = previousScrollStyles.htmlOverflow;
            document.body.style.overflow = previousScrollStyles.bodyOverflow;
            document.body.style.position = previousScrollStyles.bodyPosition;
            document.body.style.width = previousScrollStyles.bodyWidth;
            document.body.style.top = previousScrollStyles.bodyTop;
            document.body.style.left = previousScrollStyles.bodyLeft;
            document.body.style.right = previousScrollStyles.bodyRight;
            if (scrollWrapper) scrollWrapper.style.overflow = previousScrollStyles.scrollWrapperOverflow;
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            if (scrollWrapper) scrollWrapper.style.overflow = '';
        }

        window.scrollTo(0, lockedScrollY);
        previousScrollStyles = null;
    }

    function animateTargets(targets, vars) {
        if (!targets || !targets.length) return;

        if (window.gsap) {
            gsap.to(targets, vars);
            return;
        }

        targets.forEach((target) => {
            target.style.opacity = vars.opacity;
            target.style.transform = `translateY(${vars.y || 0}px)`;
        });
    }

    function hasOpenOverlay() {
        return mobileMenu.classList.contains('is-open') || (mobileSearchPanel && mobileSearchPanel.classList.contains('is-open'));
    }

    function ensureSearchFormOpen() {
        if (!mobileSearchPanel) return;

        const searchRoot = mobileSearchPanel.querySelector('[data-soufflet-search]');
        const searchPanel = mobileSearchPanel.querySelector('.soufflet-search__panel');

        if (searchRoot) {
            searchRoot.classList.add('is-open');
        }

        if (searchPanel) {
            searchPanel.hidden = false;
        }
    }

    function focusSearchInput() {
        if (!mobileSearchPanel) return;

        const input = mobileSearchPanel.querySelector('.soufflet-search__input');

        if (input) {
            window.setTimeout(() => input.focus(), 250);
        }
    }

    function openMenu() {
        if (mobileMenu.classList.contains('is-open')) return;

        if (mobileSearchPanel && mobileSearchPanel.classList.contains('is-open')) {
            closeSearchPanel(false);
        }

        menuToggle.classList.add('is-open');
        mobileMenu.classList.add('is-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        mobileMenu.removeAttribute('inert');
        activeOverlay = 'menu';
        lockPageScroll();
        animateTargets(mobileAnimTargets, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, delay: 0.2, ease: "power2.out" });
    }

    function closeMenu(releaseScroll = true) {
        if (!mobileMenu.classList.contains('is-open')) return;

        menuToggle.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('inert', '');

        if (activeOverlay === 'menu') {
            activeOverlay = null;
        }

        animateTargets(mobileAnimTargets, { y: 20, opacity: 0, duration: 0.2 });
        setTimeout(() => {
            document.querySelectorAll('.mobile-item').forEach(item => {
                item.classList.remove('is-open');
                const toggle = item.querySelector('.mobile-item__toggle');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
        }, 400);

        if (releaseScroll && !hasOpenOverlay()) {
            unlockPageScroll();
        }
    }

    function openSearchPanel() {
        if (!searchToggle || !mobileSearchPanel || mobileSearchPanel.classList.contains('is-open')) return;

        if (mobileMenu.classList.contains('is-open')) {
            closeMenu(false);
        }

        searchToggle.classList.add('is-open');
        mobileSearchPanel.classList.add('is-open');
        searchToggle.setAttribute('aria-expanded', 'true');
        mobileSearchPanel.removeAttribute('inert');
        document.documentElement.classList.add('mobile-search-open');
        document.body.classList.add('mobile-search-open');
        activeOverlay = 'search';
        ensureSearchFormOpen();
        lockPageScroll();
        animateTargets(mobileSearchAnimTargets, { y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: "power2.out" });
        focusSearchInput();
    }

    function closeSearchPanel(releaseScroll = true) {
        if (!searchToggle || !mobileSearchPanel || !mobileSearchPanel.classList.contains('is-open')) return;

        searchToggle.classList.remove('is-open');
        mobileSearchPanel.classList.remove('is-open');
        searchToggle.setAttribute('aria-expanded', 'false');
        mobileSearchPanel.setAttribute('inert', '');
        document.documentElement.classList.remove('mobile-search-open');
        document.body.classList.remove('mobile-search-open');

        if (activeOverlay === 'search') {
            activeOverlay = null;
        }

        animateTargets(mobileSearchAnimTargets, { y: 20, opacity: 0, duration: 0.2 });

        if (releaseScroll && !hasOpenOverlay()) {
            unlockPageScroll();
        }
    }

    function toggleMenu() {
        if (mobileMenu.classList.contains('is-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    function toggleSearchPanel() {
        if (!mobileSearchPanel) return;

        if (mobileSearchPanel.classList.contains('is-open')) {
            closeSearchPanel();
        } else {
            openSearchPanel();
        }
    }

    document.querySelectorAll('.mobile-item__toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const item = toggle.parentElement;
            const willOpen = !item.classList.contains('is-open');

            // Accordion: close the other open submenus and reset their state.
            document.querySelectorAll('.mobile-item').forEach(other => {
                if (other === item) return;
                other.classList.remove('is-open');
                const otherToggle = other.querySelector('.mobile-item__toggle');
                if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
            });

            item.classList.toggle('is-open', willOpen);
            toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });
    });

    menuToggle.addEventListener('click', toggleMenu);
    if (searchToggle) {
        searchToggle.addEventListener('click', toggleSearchPanel);
    }

    // Gestion clavier pour le menu toggle
    menuToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMenu();
        }
    });

    if (searchToggle) {
        searchToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSearchPanel();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        if (activeOverlay === 'search') {
            closeSearchPanel();
            searchToggle.focus();
            return;
        }

        if (activeOverlay === 'menu') {
            closeMenu();
            menuToggle.focus();
        }
    });
}
