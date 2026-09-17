/**
 * Hero video widget popup.
 *
 * Opens a fixed, centered modal when the `.video-widget` trigger is activated.
 * The `<video>` element is created (and its file downloaded) only on open, and
 * fully removed on close so the video is decoded/streamed only while visible.
 */
export function initVideoModal() {
    const trigger = document.querySelector('[data-video-trigger]');
    const modal = document.getElementById('video-modal');

    if (!trigger || !modal) return;

    // Move the modal to <body> so its position:fixed is relative to the viewport
    // and never affected by transformed/overflow-hidden ancestors (#scroll-wrapper).
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const player = modal.querySelector('.video-modal__player');
    const closeBtn = modal.querySelector('.video-modal__close');
    const closeEls = modal.querySelectorAll('[data-video-close]');

    let lastFocused = null;
    let mutedByModal = [];

    const isOpen = () => modal.classList.contains('is-open');

    /*
     * The modal video has its own sound: while it is open, every other sound on
     * the page (hero ambient loop, scroll one-shot…) is silenced via `muted` —
     * not paused — so playback state and fades are untouched and the ambience
     * resumes seamlessly on close. Only the elements WE muted are restored (the
     * visitor's own mute-toggle state is never overridden). The root class lets
     * other modules (home-scroll-sound) hold their triggers while it is open.
     */
    function muteSiteAudio() {
        mutedByModal = [];
        document.querySelectorAll('audio').forEach((audio) => {
            if (!audio.muted) {
                audio.muted = true;
                mutedByModal.push(audio);
            }
        });
        document.documentElement.classList.add('video-modal-open');
    }

    function restoreSiteAudio() {
        mutedByModal.forEach((audio) => {
            if (audio.isConnected) audio.muted = false;
        });
        mutedByModal = [];
        document.documentElement.classList.remove('video-modal-open');
    }

    function loadVideo() {
        const src = trigger.dataset.videoSrc;
        if (!src) return;

        const video = document.createElement('video');
        video.className = 'video-modal__video';
        video.controls = true;
        video.autoplay = true;
        video.preload = 'auto';
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');

        const source = document.createElement('source');
        source.src = src;
        if (trigger.dataset.videoType) {
            source.type = trigger.dataset.videoType;
        }
        video.appendChild(source);
        player.appendChild(video);

        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {}); // Autoplay may be blocked; controls remain.
        }
    }

    function unloadVideo() {
        const video = player.querySelector('video');
        if (video) {
            video.pause();
            while (video.firstChild) {
                video.removeChild(video.firstChild);
            }
            video.removeAttribute('src');
            video.load(); // Abort the in-flight network request.
        }
        player.innerHTML = '';
    }

    function openModal() {
        if (isOpen()) return;
        lastFocused = document.activeElement;

        // Scroll lock via the `video-modal-open` class (CSS in app.css), NOT via
        // inline styles: the intro (main.js) locks/unlocks scroll inline during
        // the hero — saving/restoring its inline value here used to re-freeze the
        // page for good when the modal was opened mid-intro and closed after it.
        // The class is added by muteSiteAudio() below and removed on close.

        modal.hidden = false;
        void modal.offsetWidth; // Force reflow so the opening transition plays.
        modal.classList.add('is-open');

        muteSiteAudio();
        loadVideo();

        if (closeBtn) closeBtn.focus();
        document.addEventListener('keydown', onKeydown);
    }

    function closeModal() {
        if (!isOpen()) return;
        modal.classList.remove('is-open');
        unloadVideo();
        restoreSiteAudio(); // drops the `video-modal-open` class → scroll unlocked.

        document.removeEventListener('keydown', onKeydown);

        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            modal.hidden = true;
            modal.removeEventListener('transitionend', onTransitionEnd);
        };
        const onTransitionEnd = (event) => {
            if (event.target === modal) finish();
        };
        modal.addEventListener('transitionend', onTransitionEnd);
        window.setTimeout(finish, 400); // Fallback if transitionend never fires.

        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    }

    function onKeydown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeModal();
        }
    }

    trigger.addEventListener('click', openModal);
    trigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            openModal();
        }
    });

    closeEls.forEach((el) => el.addEventListener('click', closeModal));
}
