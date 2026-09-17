// --- GESTION CURSEUR CUSTOM ---
export function initCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3" });

    window.addEventListener("mousemove", e => {
        xTo(e.clientX);
        yTo(e.clientY);
    });

    const interactiveElements = document.querySelectorAll('a, button, input, .video-widget, .menu-toggle, .lang-switcher, .search-btn, .figure-item');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });
}
