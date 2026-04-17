const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const statusText = document.getElementById('statusText');

let ytPlayer;
let isPlaying = false;
let progressInterval;

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('yt-player-container', {
        height: '10',
        width: '10',
        videoId: '',
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1
        },
        events: {
            'onReady': () => console.log("Mesin YouTube siap."),
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    const playIcon = document.getElementById('playIcon');
    if (event.data == YT.PlayerState.PLAYING) {
        isPlaying = true;
        playIcon.className = 'fas fa-pause';
        startProgressBar();
    } else {
        isPlaying = false;
        playIcon.className = 'fas fa-play';
        clearInterval(progressInterval);
    }
}

const bottomPlayer = document.getElementById('bottomPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');

let currentTrackInfo = {};

// Fungsi Play yang aman dan kuat
window.playTrack = function(videoId, title, artist, thumb) {
    bottomPlayer.classList.remove('hidden');
    
    currentTrackInfo = { title, artist, thumb };

    document.getElementById('player-title').innerText = title;
    document.getElementById('player-artist').innerText = artist;
    document.getElementById('player-thumb').src = thumb;
    
    if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(videoId);
        ytPlayer.playVideo(); // Memaksa browser HP untuk memutar karena ini di-trigger oleh klik user
    }

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: 'Melodify',
            artwork: [
                { src: thumb, sizes: '96x96', type: 'image/jpeg' },
                { src: thumb, sizes: '512x512', type: 'image/jpeg' }
            ]
        });

        navigator.mediaSession.setActionHandler('play', () => ytPlayer.playVideo());
        navigator.mediaSession.setActionHandler('pause', () => ytPlayer.pauseVideo());
    }
}

playPauseBtn.addEventListener('click', () => {
    if (!ytPlayer) return;
    if (isPlaying) {
        ytPlayer.pauseVideo();
    } else {
        ytPlayer.playVideo();
    }
});

function startProgressBar() {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
            const current = ytPlayer.getCurrentTime();
            const duration = ytPlayer.getDuration();
            if (duration > 0) {
                const percent = (current / duration) * 100;
                document.getElementById('progressBarFill').style.width = `${percent}%`;
            }
        }
    }, 1000);
}

window.showSection = function(section) {
    const homeSection = document.getElementById('home-section');
    const aboutSection = document.getElementById('about-section');

    if (section === 'about') {
        homeSection.classList.add('hidden');
        aboutSection.classList.remove('hidden');
    } else {
        homeSection.classList.remove('hidden');
        aboutSection.classList.add('hidden');
    }
}

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    statusText.innerHTML = `Mencari: <span style="color: var(--accent);">"${query}"</span>`;
    showSkeletons();

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        resultsGrid.innerHTML = ''; 

        if (result.status === "FAILED" || result.error) {
            showError("Gagal menghubungi database.");
            return;
        }

        if (!Array.isArray(result) || result.length === 0) {
            showError("Tidak ada lagu yang ditemukan.");
            return;
        }

        statusText.innerHTML = `Hasil pencarian untuk: <span style="color: var(--accent);">"${query}"</span>`;
        
        result.forEach(item => {
            const track = item.data;
            const card = document.createElement('div');
            card.className = 'track-card';
            
            // CARA BARU YANG 100% AMAN (ANTI-ERROR KARAKTER KUTIP)
            card.innerHTML = `
                <div class="thumbnail-wrapper">
                    <img src="${track.thumbnail}" alt="Cover" class="track-img" loading="lazy">
                </div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <button class="play-btn">
                    <i class="fas fa-play"></i><span>Putar Lagu</span>
                </button>
            `;

            // Pasang event listener langsung ke tombol (Mencegah bug HTML pecah)
            const btn = card.querySelector('.play-btn');
            btn.addEventListener('click', () => {
                playTrack(track.id, track.title, track.artist, track.thumbnail);
            });

            resultsGrid.appendChild(card);
        });

    } catch (err) {
        showError("Koneksi ke server terputus.");
    }
}

function showSkeletons() {
    resultsGrid.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const card = document.createElement('div');
        card.className = 'track-card skeleton';
        card.innerHTML = `
            <div class="thumbnail-wrapper"></div>
            <div class="track-info">
                <div class="track-title" style="background:#333; height:15px; width:70%; margin-bottom:5px;"></div>
                <div class="track-artist" style="background:#333; height:10px; width:40%;"></div>
            </div>
            <div class="play-btn" style="background:transparent;"></div>
        `;
        resultsGrid.appendChild(card);
    }
}

function showError(msg) {
    resultsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 0;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 15px;"></i>
            <h3 style="color: var(--text-primary); font-weight: 500; font-size: 1.1rem;">${msg}</h3>
        </div>
    `;
    }
