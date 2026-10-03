const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').trim().split('=')[1];

fetch('https://api.trakt.tv/genres/movies', {
  headers: {
    'Content-Type': 'application/json',
    'trakt-api-version': '2',
    'trakt-api-key': env
  }
}).then(r => r.json()).then(d => console.log("Genres:", d.slice(0, 5))).catch(console.error);

fetch('https://api.trakt.tv/movies/popular?genres=action&page=1&limit=2', {
  headers: {
    'Content-Type': 'application/json',
    'trakt-api-version': '2',
    'trakt-api-key': env
  }
}).then(r => r.json()).then(d => console.log("Popular:", JSON.stringify(d, null, 2))).catch(console.error);
