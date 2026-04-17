const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const statusText = document.getElementById('statusText');

const bottomPlayer = document.getElementById('bottomPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');

// Full Screen Elements
const fullScreenPlayer = document.getElementById('fullScreenPlayer');
const openFullPlayerBtn = document.getElementById('openFullPlayerBtn');
const closeFullPlayerBtn = document.getElementById('closeFullPlayerBtn');
const fullPlayPauseBtn = document.getElementById('fullPlayPauseBtn');
const fullPlayIcon = document.getElementById('fullPlayIcon');

let ytPlayer;
let isPlaying = false;
let progressInterval;
let currentTrackInfo = {};

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('yt-player-container', {
        height: '300', // HARUS 300 agar tidak diblokir YouTube
        width: '300',
        videoId: '',
        playerVars: { 
            'playsinline': 1, 
            'controls': 0, 
            'disablekb': 1,
            'origin': window.location.origin // Mencegah pemblokiran keamanan Browser
        },
        events: {
            'onReady': () => console.log("YT Player Ready"),
            'onStateChange': onPlayerStateChange,
            'onError': (e) => console.error("YT Player Error:", e.data)
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        isPlaying = true;
        playIcon.className = 'fas fa-pause';
        fullPlayIcon.className = 'fas fa-pause';
        startProgressBar();
    } else if (event.data == YT.PlayerState.PAUSED || event.data == YT.PlayerState.ENDED) {
        isPlaying = false;
        playIcon.className = 'fas fa-play';
        fullPlayIcon.className = 'fas fa-play';
        clearInterval(progressInterval);
    }
}

window.playTrack = function(videoId, title, artist, thumb) {
    // 1. Pancing Audio Bisu
    if (typeof bgEngine !== 'undefined') {
        bgEngine.forceBackgroundUnlock();
    }

    // 2. Munculkan Player UI
    bottomPlayer.classList.remove('hidden');
    currentTrackInfo = { title, artist, thumb };
    
    document.getElementById('player-title').innerText = title;
    document.getElementById('player-artist').innerText = artist;
    document.getElementById('player-thumb').src = thumb;

    document.getElementById('full-player-title').innerText = title;
    document.getElementById('full-player-artist').innerText = artist;
    const hqThumb = thumb.replace('sddefault', 'maxresdefault').replace('hqdefault', 'maxresdefault');
    document.getElementById('full-player-thumb').src = hqThumb;
    
    // 3. Putar Lagu Asli
    if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(videoId);
        ytPlayer.playVideo();
    }

    // 4. Set Notifikasi Layar Kunci
    if (typeof bgEngine !== 'undefined') {
        bgEngine.setMediaSession(
            currentTrackInfo, 
            () => { if (ytPlayer) ytPlayer.playVideo(); }, 
            () => { if (ytPlayer) ytPlayer.pauseVideo(); } 
        );
    }
}

function togglePlayPause() {
    if (!ytPlayer) return;
    if (isPlaying) {
        ytPlayer.pauseVideo();
        if (typeof bgEngine !== 'undefined') bgEngine.pauseBackground();
    } else {
        ytPlayer.playVideo();
        if (typeof bgEngine !== 'undefined') bgEngine.forceBackgroundUnlock();
    }
}

playPauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
});

fullPlayPauseBtn.addEventListener('click', togglePlayPause);

openFullPlayerBtn.addEventListener('click', () => {
    fullScreenPlayer.classList.add('active');
});

closeFullPlayerBtn.addEventListener('click', () => {
    fullScreenPlayer.classList.remove('active');
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
                document.getElementById('fullProgressBarFill').style.width = `${percent}%`;
                document.getElementById('fullCurrentTime').innerText = formatTime(current);
                document.getElementById('fullTotalTime').innerText = formatTime(duration);
            }
        }
    }, 1000);
}

function formatTime(time) {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

window.showSection = function(section) {
    document.getElementById('home-section').classList.toggle('hidden', section !== 'home');
    document.getElementById('about-section').classList.toggle('hidden', section !== 'about');
}

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    statusText.innerHTML = `Mencari: <span style="color: var(--accent);">"${query}"</span>`;
    showSkeletons();

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        resultsGrid.innerHTML = ''; 
        if (result.status === "FAILED" || result.error || !Array.isArray(result) || result.length === 0) {
            showError("Tidak ada lagu yang ditemukan atau server sibuk.");
            return;
        }

        statusText.innerHTML = `Hasil pencarian untuk: <span style="color: var(--accent);">"${query}"</span>`;
        
        result.forEach(item => {
            const track = item.data;
            const card = document.createElement('div');
            card.className = 'track-card';
            
            card.innerHTML = `
                <div class="thumbnail-wrapper">
                    <img src="${track.thumbnail}" alt="Cover" class="track-img" loading="lazy">
                </div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <button class="play-btn">
                    <i class="fas fa-play"></i><span>Putar</span>
                </button>
            `;

            card.querySelector('.play-btn').addEventListener('click', () => {
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
