// --- PRE-LOADER ---
export function initLoader(onLoaderComplete) {
    let isModelLoaded = false;
    let isSvgLoaded = false;
    let loadComplete = false;
    let minTimePassed = false;
    let loaderExiting = false;

    // Animation des pétales via CSS (voir styles.css @keyframes petalPulse)

    function checkLoadComplete() {
        if (isModelLoaded && isSvgLoaded) {
            loadComplete = true;
            if (minTimePassed && !loaderExiting) {
                // Stopper l'animation CSS des pétales et les mettre à opacity 1
                document.querySelectorAll('.petal').forEach(p => {
                    p.style.animation = 'none';
                    p.style.opacity = '1';
                });
                exitLoader();
            }
        }
    }

    // Attendre au moins 1.2s avant de pouvoir quitter
    gsap.delayedCall(1.2, () => { minTimePassed = true; if (loadComplete) checkLoadComplete(); });

    // Timeout de sécurité : forcer la sortie après 8s
    gsap.delayedCall(8, () => {
        if (!loadComplete) {
            isModelLoaded = true;
            isSvgLoaded = true;
            loadComplete = true;
            checkLoadComplete();
        }
    });

    function exitLoader() {
        loaderExiting = true;
        const textImg = document.getElementById('loader-nom-img');
        const mask    = document.querySelector('.loader-text-mask');
        const screen  = document.getElementById('loading-screen');

        // Reveal the hero and fade out the loading screen. Factored out so it ALWAYS
        // runs — even if the loader's own decorative markup is missing — because the
        // page reveal (onLoaderComplete) must never be skipped: otherwise <main>
        // stays scroll-locked and blank. Previously a null #loader-nom-img /
        // .loader-text-mask / #loading-screen threw here before onLoaderComplete ran.
        const finish = () => {
            window.__loaderDone = true;
            onLoaderComplete();

            // Phase 4 : fade-out du loading screen
            if (screen) {
                screen.style.transition = 'opacity 0.8s ease';
                screen.style.opacity = '0';
                gsap.delayedCall(0.8, () => {
                    screen.remove();
                    ScrollTrigger.refresh();
                });
            } else {
                ScrollTrigger.refresh();
            }
        };

        // Phase 2 : révélation progressive du mot-symbole depuis le totem.
        // La transition CSS de `.loader-text-mask` peut être neutralisée par les
        // feuilles de style globales chargées sous WordPress (la largeur saute alors
        // instantanément). On pilote donc la révélation avec GSAP — déjà chargé —
        // pour garantir exactement le même déroulé que la référence statique.
        // `power3.out` ≙ cubic-bezier(0.33, 1, 0.68, 1) (easeOutCubic) du CSS.
        if (mask && textImg) {
            const exactWidth = textImg.clientWidth || textImg.naturalWidth || 220;
            mask.style.transition = 'none';
            gsap.set(mask, { width: 0, marginRight: 0 });
            gsap.to(mask, {
                width: exactWidth,
                marginRight: 18,
                duration: 0.6,
                ease: 'power3.out',
                // Phase 3 : pause (0.3s) après la révélation, puis lancer le hero.
                onComplete: () => gsap.delayedCall(0.3, finish),
            });
        } else {
            // Loader markup incomplete — skip the flourish, still reveal the page.
            gsap.delayedCall(0.3, finish);
        }
    }

    fetch((window.__themeUri || '') + '/assets/images/Vector.svg')
        .then(response => response.text())
        .then(svgText => {
            const svgC  = document.getElementById('svg-container');
            const svgCY = document.getElementById('svg-container-yellow');
            if (svgC)  svgC.innerHTML  = svgText;
            if (svgCY) svgCY.innerHTML = svgText;
            isSvgLoaded = true; checkLoadComplete();
        })
        .catch(() => { isSvgLoaded = true; checkLoadComplete(); });

    return { setModelLoaded: () => { isModelLoaded = true; checkLoadComplete(); } };
}
