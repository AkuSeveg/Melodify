class BackgroundAudioEngine {
    constructor() {
        this.silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        this.silentAudio.loop = true;
        this.silentAudio.volume = 0.01;
        this.isUnlocked = false;
    }

    forceBackgroundUnlock() {
        try {
            this.silentAudio.play().then(() => {
                this.isUnlocked = true;
            }).catch(err => {
                console.warn("Menunggu interaksi user murni untuk unlock background.");
            });
        } catch (error) {
            console.error("Gagal memulai silent audio:", error);
        }
    }

    pauseBackground() {
        this.silentAudio.pause();
        this.isUnlocked = false;
    }

    setMediaSession(trackInfo, playCallback, pauseCallback) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: trackInfo.title,
                artist: trackInfo.artist,
                album: 'Melodify',
                artwork: [
                    { src: trackInfo.thumb, sizes: '96x96', type: 'image/jpeg' },
                    { src: trackInfo.thumb, sizes: '256x256', type: 'image/jpeg' },
                    { src: trackInfo.thumb, sizes: '512x512', type: 'image/jpeg' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => {
                this.forceBackgroundUnlock();
                if (playCallback) playCallback();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                this.pauseBackground();
                if (pauseCallback) pauseCallback();
            });
        }
    }
}

const bgEngine = new BackgroundAudioEngine();
