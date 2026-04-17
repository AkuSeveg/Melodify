const yts = require('yt-search');

async function scrapeYTM(query) {
    try {
        const searchResult = await yts({ query: `${query} official audio`, hl: 'id', gl: 'ID' });
        const videos = searchResult.videos.slice(0, 15); 
        
        return videos.map(v => ({
            status: "SUCCESS",
            source: "YouTube Music Database",
            data: {
                id: v.videoId,
                title: v.title,
                artist: v.author.name,
                duration: {
                    timestamp: v.timestamp,
                    seconds: v.seconds
                },
                meta: {
                    views: v.views,
                    uploaded: v.ago,
                    url: v.url,
                    ytm_url: `https://music.youtube.com/watch?v=${v.videoId}`
                },
                thumbnail: v.thumbnail
            }
        }));
    } catch (error) {
        return {
            status: "FAILED",
            error: error.message,
            log: "Melodify failed to intercept the signal."
        };
    }
}

module.exports = scrapeYTM;