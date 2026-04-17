const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const statusText = document.getElementById('statusText');

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

    statusText.innerHTML = `Menyelaraskan frekuensi untuk: <span style="color: var(--accent);">"${query}"</span>`;
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
            showError("Tidak ada lagu yang ditemukan di frekuensi ini.");
            return;
        }

        statusText.innerHTML = `Hasil pencarian untuk: <span style="color: var(--accent);">"${query}"</span>`;
        
        result.forEach(item => {
            const track = item.data;
            const card = document.createElement('div');
            card.className = 'track-card';
            
            card.innerHTML = `
                <div class="thumbnail-wrapper">
                    <img src="${track.thumbnail}" alt="${track.title}" class="track-img" loading="lazy">
                    <span class="duration-badge">${track.duration.timestamp}</span>
                </div>
                <div class="track-title" title="${track.title}">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
                <a href="${track.meta.ytm_url}" target="_blank" class="play-btn">
                    <i class="fas fa-play"></i> Listen Now
                </a>
            `;
            resultsGrid.appendChild(card);
        });

    } catch (err) {
        showError("Koneksi ke server terputus. Coba lagi nanti.");
    }
}

function showSkeletons() {
    resultsGrid.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const card = document.createElement('div');
        card.className = 'track-card skeleton';
        card.innerHTML = `
            <div class="thumbnail-wrapper"></div>
            <div class="track-title"></div>
            <div class="track-artist"></div>
            <div class="play-btn">Loading</div>
        `;
        resultsGrid.appendChild(card);
    }
}

function showError(msg) {
    resultsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 0;">
            <i class="fas fa-satellite-dish" style="font-size: 3.5rem; color: var(--text-secondary); margin-bottom: 20px;"></i>
            <h3 style="color: var(--text-primary); font-weight: 500; font-size: 1.2rem;">${msg}</h3>
        </div>
    `;
}