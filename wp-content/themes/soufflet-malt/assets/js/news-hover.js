// --- NEWS HOVER IMAGE EFFECT ---
export function initNewsHover() {
    if (window.matchMedia('(max-width: 1023px)').matches) {
        return;
    }

    const newsItems = document.querySelectorAll('.news-item');
    const rotations = [-3, 2.5, -4];
    const allImgs = [];
    const imgWidth = 280;
    const imgHeight = 180;

    function getLocalImagePosition(item, event) {
        const itemRect = item.getBoundingClientRect();
        const itemRight = itemRect.right;
        const tagElement = item.querySelector('.news-item-tag');

        let textEndX = itemRect.left + (itemRect.width * 0.4);
        if (tagElement) {
            const tagRect = tagElement.getBoundingClientRect();
            textEndX = tagRect.left - 20;
        }

        let viewportX = Math.max(textEndX, event.clientX + 20);
        if (viewportX + imgWidth > itemRight) {
            viewportX = itemRight - imgWidth;
        }

        let viewportY = event.clientY - 100;
        if (viewportY < 0) viewportY = 0;
        if (viewportY + imgHeight > window.innerHeight) {
            viewportY = window.innerHeight - imgHeight;
        }

        return {
            x: viewportX - (itemRect.right - imgWidth),
            y: viewportY - itemRect.top,
        };
    }

    newsItems.forEach((item, i) => {
        const img = item.querySelector('.news-item-img');
        if (!img) return;

        const rot = rotations[i % rotations.length];
        allImgs.push(img);

        let isHovering = false;
        let lastX = 0;
        let lastY = 0;

        item.addEventListener('mouseenter', (e) => {
            if (window.__activeSection !== 's8') return;
            isHovering = true;
            lastX = e.clientX;
            lastY = e.clientY;
            const startPosition = getLocalImagePosition(item, e);

            // Hide all other images first
            allImgs.forEach(other => {
                if (other !== img) gsap.to(other, { opacity: 0, scale: 0.85, duration: 0.15, overwrite: true });
            });
            gsap.killTweensOf(img);
            gsap.set(img, { x: startPosition.x, y: startPosition.y });
            gsap.to(img, { opacity: 1, scale: 1, rotation: rot, duration: 0.35, ease: "power3.out", overwrite: true });
        });

        item.addEventListener('mousemove', (e) => {
            if (window.__activeSection !== 's8' || !isHovering) return;

            lastX = e.clientX;
            lastY = e.clientY;
            const targetPosition = getLocalImagePosition(item, e);

            gsap.to(img, {
                x: targetPosition.x,
                y: targetPosition.y,
                duration: 0.4,
                ease: "power3.out",
                overwrite: 'auto'
            });
        });

        item.addEventListener('mouseleave', () => {
            isHovering = false;
            gsap.killTweensOf(img);
            gsap.to(img, { opacity: 0, scale: 0.85, rotation: rot * 1.5, duration: 0.3, ease: "power2.in", overwrite: true });
        });
    });

    // Force-hide hover images when leaving the news section without a permanent RAF loop
    let wasS8Active = false;
    const syncSectionState = () => {
        const isS8Active = window.__activeSection === 's8';
        if (wasS8Active && !isS8Active) {
            allImgs.forEach(img => gsap.to(img, { opacity: 0, duration: 0.25, ease: "power2.in", overwrite: true }));
        }
        wasS8Active = isS8Active;
    };

    window.addEventListener('scroll', syncSectionState, { passive: true });
    document.addEventListener('visibilitychange', syncSectionState);
}
