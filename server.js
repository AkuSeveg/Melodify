const express = require('express');
const path = require('path');
const cors = require('cors');
const scrapeYTM = require('./scraper');

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: "Query pencarian tidak boleh kosong" });
    }

    const results = await scrapeYTM(query);
    res.json(results);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Melodify Server berjalan di http://localhost:${PORT}`);
    });
}

module.exports = app;