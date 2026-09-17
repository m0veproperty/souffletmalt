/**
 * Home page ambient sound.
 *
 * One optional MP3 (from the ACF "Home" tab) controlled by a fixed mute toggle,
 * mirroring the hero-post block sound: fade in/out, autoplay-unlock on the first
 * user gesture, mute preference persisted in sessionStorage, paused in background
 * tabs. Two scopes via data-home-sound-scope:
 *   - "page":    plays across the whole page and loops; never stops on scroll.
 *   - "section": plays only while the visitor is at the top of the page; fades out
 *                the moment they scroll down past 10px (the exact threshold that
 *                fires the one-shot scroll sound), fades back in at the top.
 */
export function initHomeSound() {
    const audio = document.querySelector('[data-home-sound]');
    if (!audio) return;

    const toggle = document.querySelector('[data-home-sound-toggle]');
    const scope = audio.dataset.homeSoundScope || 'page';
    // Same threshold as the one-shot scroll sound (home-scroll-sound.js): in the
    // "section" scope the ambient sound cuts exactly when that sound fires.
    const TRIGGER_AT = 10;

    const MUTE_KEY = 'homeSoundMuted';
    const FADE_MS = 800;
    const TARGET_VOLUME = 1;

    // Page scope is conceptually always "in view"; section scope is driven by the
    // scroll position (top of page vs past the 10px trigger) below.
    let inView = scope !== 'section';

    const isMuted = () => {
        try {
            return window.sessionStorage.getItem(MUTE_KEY) === '1';
        } catch (e) {
            return false;
        }
    };
    const setMuted = (muted) => {
        try {
            window.sessionStorage.setItem(MUTE_KEY, muted ? '1' : '0');
        } catch (e) {}
    };
    const clampVol = (value) => Math.max(0, Math.min(1, value));

    function cancelFade() {
        if (audio._homeFadeRaf) {
            window.cancelAnimationFrame(audio._homeFadeRaf);
            audio._homeFadeRaf = null;
        }
    }

    // Ramp audio.volume to `target` over `duration` ms; cancels any in-flight ramp
    // first so rapid enter/leave never jumps or stacks.
    function fadeTo(target, duration, onDone) {
        cancelFade();
        const start = audio.volume;
        const delta = target - start;

        if (!window.requestAnimationFrame || duration <= 0 || Math.abs(delta) < 0.001) {
            audio.volume = clampVol(target);
            if (onDone) onDone();
            return;
        }

        let t0 = null;
        const step = (now) => {
            if (t0 === null) t0 = now;
            const progress = Math.min(1, (now - t0) / duration);
            audio.volume = clampVol(start + delta * progress);
            if (progress < 1) {
                audio._homeFadeRaf = window.requestAnimationFrame(step);
            } else {
                audio._homeFadeRaf = null;
                if (onDone) onDone();
            }
        };
        audio._homeFadeRaf = window.requestAnimationFrame(step);
    }

    function fadeIn() {
        if (isMuted()) return;
        if (audio.paused) {
            audio.volume = 0;
            const promise = audio.play();
            // Autoplay with sound is blocked until the user interacts — swallow it.
            if (promise && typeof promise.catch === 'function') promise.catch(() => {});
        }
        fadeTo(TARGET_VOLUME, FADE_MS);
    }

    function fadeOut() {
        if (audio.paused) return;
        fadeTo(0, FADE_MS, () => audio.pause());
    }

    function syncToggle() {
        if (!toggle) return;
        const muted = isMuted();
        toggle.classList.toggle('is-muted', muted);
        const label = muted ? toggle.dataset.labelUnmute : toggle.dataset.labelMute;
        if (label) toggle.setAttribute('aria-label', label);
    }

    function applyMuteState() {
        syncToggle();
        if (isMuted()) {
            fadeOut();
        } else if (inView) {
            fadeIn();
        }
    }

    if (toggle) {
        syncToggle();
        toggle.addEventListener('click', () => {
            setMuted(!isMuted());
            applyMuteState();
        });
    }

    if (scope === 'section') {
        // Hero scope: the sound plays only while the visitor is at the top of the
        // page and CUTS (fade out) as soon as they scroll down past 10px — the same
        // threshold that triggers the one-shot scroll sound (home-scroll-sound.js),
        // so the ambient sound hands over to it. Scrolling back to the top fades it
        // back in.
        const onScroll = () => {
            const y = window.scrollY || document.documentElement.scrollTop || 0;
            const nowInView = y <= TRIGGER_AT;
            if (nowInView === inView) return;
            inView = nowInView;
            if (nowInView) {
                fadeIn();
            } else {
                fadeOut();
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });

        // Initial state (usually at the top → play).
        inView = (window.scrollY || document.documentElement.scrollTop || 0) <= TRIGGER_AT;
        if (inView) fadeIn();
    } else {
        // Page scope: play across the whole page.
        inView = true;
        fadeIn();
    }

    // Browsers block audio.play() until a user gesture. Keep listening and only
    // detach once a gesture actually starts the (in-scope, un-muted) sound.
    const unlockEvents = ['pointerdown', 'touchstart', 'keydown'];
    const unlock = () => {
        if (isMuted() || !inView) return;
        fadeIn();
        if (!audio.paused) {
            unlockEvents.forEach((evt) => window.removeEventListener(evt, unlock));
        }
    };
    unlockEvents.forEach((evt) => window.addEventListener(evt, unlock, { passive: true }));

    // Never let the sound keep playing in a backgrounded tab.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelFade();
            audio.pause();
        } else {
            applyMuteState();
        }
    });
}
