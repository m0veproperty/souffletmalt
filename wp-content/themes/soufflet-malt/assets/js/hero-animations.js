// --- HERO ANIMATIONS ---
export function playHeroAnimation(layoutGroup, scrollSpinGroup, standUpGroup, updateLogoMorph, onAnimationComplete) {
    if (typeof updateLogoMorph !== 'function') {
        onAnimationComplete = updateLogoMorph;
        updateLogoMorph = null;
    }

    const tl = gsap.timeline({
        onComplete: () => { 
            if (onAnimationComplete) onAnimationComplete();
        }
    });

    tl.fromTo('.bg-video', { opacity: 0 }, { opacity: 0.08, duration: 3, ease: "power2.out" }, 0);
    tl.fromTo('.bg-video-wrapper', { width: '300px', height: '300px', borderRadius: '30px' }, { width: '100vw', height: '100vh', borderRadius: '0px', duration: 2.5, ease: "power3.inOut" }, 0);

    tl.to('.super-header, .header-logo, .header-right-actions, .main-nav', { y: 0, opacity: 1, visibility: 'visible', duration: 1.2, stagger: 0.1, ease: "power2.out" }, 0.5);

    const startScale = window.innerWidth <= 900 ? 1.25 : 1.9;
    tl.fromTo(layoutGroup.scale, { x: startScale, y: startScale, z: startScale }, { x: 1, y: 1, z: 1, duration: 2.25, ease: "power3.out" }, 0.5);
    tl.set(scrollSpinGroup.rotation, { x: 0, y: 0, z: 0 }, 0.5);
    tl.set(standUpGroup.rotation, { x: 0, y: 0, z: 0 }, 0.5);

    const logoMorph = { val: 0 };
    tl.to(logoMorph, {
        val: 1,
        duration: 2,
        ease: "power3.out",
        onUpdate: () => {
            if (updateLogoMorph) updateLogoMorph(logoMorph.val);
        }
    }, 0.55);

    tl.fromTo('.svg-title-container svg path, .svg-title-container svg polygon', { y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.03, ease: "power4.out" }, 1.2);
    tl.to('.description-text', { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }, 1.6);
    tl.to('.hero-ctas', { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 1.8);
    tl.to('.video-widget', { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 1.9);
    if (window.innerWidth <= 1023) {
        tl.to('#webgl-container', { opacity: 0.5, duration: 0.7, ease: "power2.out" }, 2.75);
    } else {
        tl.set('#webgl-container', { opacity: 1 }, 2.75);
    }
}
