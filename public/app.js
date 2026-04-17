const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const statusText = document.getElementById('statusText');

let ytPlayer;
let isPlaying = false;
let progressInterval;

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('yt-player-container', {
        height: '300',
        width: '300',
        videoId: '',
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1,
            'autoplay': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log("Mesin YouTube siap.");
}

function onPlayerStateChange(event) {
    const playIcon = document.getElementById('playIcon');
    if (event.data == YT.PlayerState.PLAYING) {
        isPlaying = true;
        playIcon.className = 'fas fa-pause';
        startProgressBar();
        setupMediaSession(); // Perbarui sesi media saat mulai memutar
    } else {
        isPlaying = false;
        playIcon.className = 'fas fa-play';
        clearInterval(progressInterval);
    }
}

const bottomPlayer = document.getElementById('bottomPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');

let currentTrackInfo = {};

window.playTrack = function(videoId, title, artist, thumb) {
    bottomPlayer.classList.remove('hidden');
    
    currentTrackInfo = { title, artist, thumb };

    document.getElementById('player-title').innerText = title;
    document.getElementById('player-artist').innerText = artist;
    document.getElementById('player-thumb').src = thumb;
    
    if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(videoId);
    }
}

function setupMediaSession() {
    if ('mediaSession' in navigator && currentTrackInfo.title) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrackInfo.title,
            artist: currentTrackInfo.artist,
            album: 'Melodify',
            artwork: [
                { src: currentTrackInfo.thumb, sizes: '96x96',   type: 'image/jpeg' },
                { src: currentTrackInfo.thumb, sizes: '256x256', type: 'image/jpeg' },
                { src: currentTrackInfo.thumb, sizes: '512x512', type: 'image/jpeg' }
            ]
        });

        navigator.mediaSession.setActionHandler('play', function() {
            if (ytPlayer) ytPlayer.playVideo();
        });
        navigator.mediaSession.setActionHandler('pause', function() {
            if (ytPlayer) ytPlayer.pauseVideo();
        });
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
            showError(result.error || "Gagal menghubungi database.");
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
            
            const safeTitle = track.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeArtist = track.artist.replace(/'/g, "\\'").replace(/"/g, '&quot;');

            card.innerHTML = `
                <div class="thumbnail-wrapper">
                    <img src="${track.thumbnail}" alt="${safeTitle}" class="track-img" loading="lazy">
                    <span class="duration-badge">${track.duration.timestamp}</span>
                </div>
                <div class="track-info">
                    <div class="track-title" title="${safeTitle}">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <button onclick="playTrack('${track.id}', '${safeTitle}', '${safeArtist}', '${track.thumbnail}')" class="play-btn">
                    <i class="fas fa-play"></i><span>Putar Lagu</span>
                </button>
            `;
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
                <div class="track-title"></div>
                <div class="track-artist"></div>
            </div>
            <div class="play-btn" style="border: none;"></div>
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
