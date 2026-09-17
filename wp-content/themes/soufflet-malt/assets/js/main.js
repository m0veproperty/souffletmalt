import * as THREE from 'three';
import { initCustomCursor } from './cursor.js';
import { initDropdownKeyboard } from './dropdown-keyboard.js';
import { initFocusScroll } from './focus-scroll.js';
import { playHeroAnimation } from './hero-animations.js';
import { initHomeMobileAnimations } from './home-mobile-animations.js';
// NOTE: ES module imports do NOT inherit main.js's ?ver= cache-buster — the browser
// caches them by their own URL. Bump the ?v= below whenever these files change.
import { initHomeSound } from './home-sound.js?v=2';
import { initHomeScrollSound } from './home-scroll-sound.js?v=5';
import { injectComponents } from './include-components.js';
import { initInteractiveKeyboard } from './interactive-keyboard.js';
import { initLoader } from './loader.js';
import { initMobileMenu } from './mobile-menu.js';
import { initNewsHover } from './news-hover.js';
import { initHomePageExitTransition } from './page-transition.js';
import { initPreFooter } from './pre-footer.js';
import { initScrollAnimations } from './scroll-animations-v2.js';
import { init3D, rotateSphereToRegion, throwGrainsRight, updateLayout, updateMapSphereRotation } from './three-setup.js';
import { initVideoModal } from './video-modal.js?v=3';

gsap.registerPlugin(ScrollTrigger);

// Inject shared components (header, footer) — non-blocking
injectComponents().then(() => {
    initHomePageExitTransition();
    initMobileMenu();
    initDropdownKeyboard();
    initInteractiveKeyboard();
}).catch(() => {
    initHomePageExitTransition();
});

// Initialize loader done flag (will be set to true when loader exits)
window.__loaderDone = false;

// Initialize custom cursor
initCustomCursor();

// Initialize focus scroll
initFocusScroll();

// Initialize news hover image effect
initNewsHover();

// Initialize hero video widget popup
initVideoModal();

// Initialize pre-footer reveal animation
initPreFooter();

// Initialize home page mobile entrance animations (no-op on desktop).
// Called as early as possible so elements receive `.home-mobile-anim`
// before the loader screen fades out.
initHomeMobileAnimations();

// Initialize the optional home page ambient sound (no-op if no MP3 is set).
initHomeSound();

// Initialize the hardcoded one-shot scroll sound (plays once on first scroll down).
initHomeScrollSound();

// Bloquer le scroll pendant le chargement et l'animation hero
document.documentElement.style.overflow = 'hidden';
document.body.style.overflow = 'hidden';
document.body.style.position = 'fixed';
document.body.style.width = '100%';
document.body.style.top = '0';

const loaderModule = initLoader(() => {
    playHeroAnimation(layoutGroup, scrollSpinGroup, standUpGroup, updateLogoMorph, () => {
        isInteractionActive = true;
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        initScrollAnimations(layoutGroup, scrollSpinGroup, morphGeometries, updateMorph, throwGrainsRight, mouseSpinGroup, regionRotGroup);
    });
});

// Animation loop
let mouseX = 0;
let targetX = 0;
let isInteractionActive = false;
let lastRenderAt = 0;

const TARGET_RENDER_FPS = 45;
const MIN_RENDER_INTERVAL_MS = 1000 / TARGET_RENDER_FPS;
const MOUSE_ROTATION_LIMIT = 0.35;
const MOUSE_ROTATION_SENSITIVITY = 0.75;
const MOUSE_ROTATION_EASE = 0.04;

// Initialize 3D scene and pass the loader callback
const { layoutGroup, scrollSpinGroup, morphGeometries, updateMorph, updateLogoMorph, floatGroup, mouseSpinGroup, regionRotGroup, renderer, scene, camera, standUpGroup } = init3D(loaderModule.setModelLoaded);

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.001;
});

const clock = new THREE.Clock();

function animate(now = 0) {
    requestAnimationFrame(animate);

    if (!window.__loaderDone || document.hidden) return;
    if ((now - lastRenderAt) < MIN_RENDER_INTERVAL_MS) return;

    lastRenderAt = now;
    const time = clock.getElapsedTime();

    if (floatGroup) {
        floatGroup.position.y = Math.sin(time * 0.8) * 0.1;
    }

    if (mouseSpinGroup && isInteractionActive && !window.__disableMouseSpin) {
        targetX = Math.max(-MOUSE_ROTATION_LIMIT, Math.min(MOUSE_ROTATION_LIMIT, mouseX * MOUSE_ROTATION_SENSITIVITY));
        mouseSpinGroup.rotation.y += MOUSE_ROTATION_EASE * (targetX - mouseSpinGroup.rotation.y);
    }

    updateMapSphereRotation();

    if (renderer && scene && camera) renderer.render(scene, camera);
}

animate();

// Purchase malt card hover → rotate map sphere to region
document.querySelectorAll('.purchase-malt-col[data-region]').forEach(col => {
    col.addEventListener('mouseenter', () => {
        rotateSphereToRegion(col.dataset.region);
    });
    col.addEventListener('mouseleave', () => {
        rotateSphereToRegion(null);
    });
});

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.innerWidth <= 1023 ? 1.1 : Math.min(window.devicePixelRatio || 1, 1.25));
        updateLayout();
    }
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        lastRenderAt = 0;
    }
});