/**
 * Home page one-shot scroll sound.
 *
 * A hardcoded sound (assets/audio/v1-explosion-drone.mp3, embedded in page-home.php)
 * tied to ONE precise moment: the first time the visitor scrolls down past 10px.
 * A single play() attempt is made right at that crossing:
 *   - If it succeeds, the track plays through to the end, then the <audio> element
 *     is removed from the DOM. Never replayed.
 *   - If the browser blocks it (autoplay policy: no user gesture yet), the moment
 *     has passed — the sound is dropped and NEVER played late (a click near the
 *     footer must not fire it).
 *
 * It respects the site mute toggle (home-sound.js, sessionStorage "homeSoundMuted"):
 *   - Muted at the crossing → the one-shot is dropped silently.
 *   - Muted while the track is playing → it goes silent immediately (audio.muted);
 *     unmuting mid-track restores the sound.
 */
export function initHomeScrollSound() {
    const audio = document.getElementById('home-scroll-sound');
    if (!audio) return;

    // Same key as the home ambient sound's mute toggle (home-sound.js).
    const MUTE_KEY = 'homeSoundMuted';

    const isMuted = () => {
        try {
            return window.sessionStorage.getItem(MUTE_KEY) === '1';
        } catch (e) {
            return false;
        }
    };

    let attempted = false;

    const teardown = () => {
        window.removeEventListener('scroll', onScroll);
        document.removeEventListener('click', onToggleClick);
    };

    // Successful full play → destroy the element.
    audio.addEventListener(
        'ended',
        () => {
            teardown();
            audio.remove();
        },
        { once: true }
    );

    // Delegated: fires AFTER home-sound.js's own toggle handler (element listeners
    // run before document ones), so sessionStorage already holds the new state.
    function onToggleClick(event) {
        if (!event.target || !event.target.closest('[data-home-sound-toggle]')) return;
        audio.muted = isMuted();
    }

    const onScroll = () => {
        if (attempted) return;
        // Video modal open (its own sound has priority): hold the trigger without
        // consuming it — the one-shot can still fire after the modal closes.
        if (document.documentElement.classList.contains('video-modal-open')) return;
        if (window.scrollY > 10 || document.documentElement.scrollTop > 10) {
            // One shot: whatever the outcome, never try again.
            attempted = true;
            window.removeEventListener('scroll', onScroll);

            // Sound muted via the toggle → drop the one-shot silently.
            if (isMuted()) {
                teardown();
                audio.remove();
                return;
            }

            const promise = audio.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(() => {
                    // Autoplay blocked (or media error): the launch moment is gone —
                    // do not play late, drop the element entirely.
                    teardown();
                    audio.remove();
                });
            }
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onToggleClick);
}
