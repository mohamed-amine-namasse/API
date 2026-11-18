import "dotenv/config"; // Charge automatiquement le fichier .env
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const API_KEY = process.env.RAWG_API_KEY;

if (!API_KEY) {
  console.error(
    "❌ Erreur : La clé RAWG_API_KEY est introuvable dans le fichier .env !",
  );
  process.exit(1);
}

// Tout le code HTML/JS de l'application (avec Tailwind CSS local via /output.css)
const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Explorateur de Jeux Vidéo - RAWG API</title>
    <link href="/output.css" rel="stylesheet">
</head>
<body class="bg-[#0f172a] text-slate-100 min-h-screen font-sans antialiased">

    <header class="bg-[#1e293b]/85 backdrop-blur-md sticky top-0 z-50 border-b border-slate-700/50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 id="homeBtn" class="text-2xl font-black tracking-wider text-indigo-400 flex items-center gap-2 cursor-pointer">
                🎮 <span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">RAWG Explorer</span>
            </h1>
            <div class="w-full sm:w-96 relative">
                <input type="text" id="searchInput" placeholder="Rechercher un jeu..." 
                    class="w-full bg-slate-900 border border-slate-700 rounded-full px-5 py-2.5 pl-11 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500">
                <svg class="w-5 h-5 text-slate-500 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
        <div class="flex items-center justify-between mb-6">
            <h2 id="sectionTitle" class="text-xl font-bold text-slate-200">🔥 Jeux Tendances du Moment</h2>
            <span id="gameCount" class="text-xs font-semibold px-3 py-1 bg-slate-800 text-slate-400 rounded-full border border-slate-700">Chargement...</span>
        </div>

        <div id="loader" class="hidden flex justify-center items-center py-24">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>

        <div id="gamesGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"></div>

        <div id="noResults" class="hidden text-center py-20 text-slate-500">
            <p class="text-lg">Aucun jeu trouvé pour votre recherche.</p>
        </div>
    </main>

    <script>
        const API_KEY = "${API_KEY}";
        const BASE_URL = 'https://api.rawg.io/api';

        const searchInput = document.getElementById('searchInput');
        const gamesGrid = document.getElementById('gamesGrid');
        const loader = document.getElementById('loader');
        const sectionTitle = document.getElementById('sectionTitle');
        const gameCount = document.getElementById('gameCount');
        const noResults = document.getElementById('noResults');
        const homeBtn = document.getElementById('homeBtn');

        let searchTimeout = null;

        window.addEventListener('DOMContentLoaded', () => loadTrendingGames());
        homeBtn.addEventListener('click', () => { searchInput.value = ''; loadTrendingGames(); });

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            if (query.length === 0) { loadTrendingGames(); return; }
            if (query.length < 2) return;
            searchTimeout = setTimeout(() => searchGames(query), 400);
        });

        async function loadTrendingGames() {
            sectionTitle.textContent = "🔥 Jeux Tendances du Moment";
            showLoader(true);
            try {
                const res = await fetch(\`\${BASE_URL}/games?key=\${API_KEY}&ordering=-added&page_size=16\`);
                const data = await res.json();
                displayGames(data.results);
            } catch (err) {
                showError("Impossible de charger les jeux.");
            } finally { showLoader(false); }
        }

        async function searchGames(query) {
            sectionTitle.textContent = \`Résultats pour : "\${query}"\`;
            showLoader(true);
            try {
                const res = await fetch(\`\${BASE_URL}/games?key=\${API_KEY}&search=\${encodeURIComponent(query)}&page_size=16\`);
                const data = await res.json();
                displayGames(data.results);
            } catch (err) {
                showError("Erreur lors de la recherche.");
            } finally { showLoader(false); }
        }

        function displayGames(games) {
            gamesGrid.innerHTML = '';
            if (!games || games.length === 0) {
                noResults.classList.remove('hidden');
                gameCount.textContent = "0 jeu";
                return;
            }
            noResults.classList.add('hidden');
            gameCount.textContent = \`\${games.length} jeux affichés\`;

            games.forEach(game => {
                const bgImage = game.background_image || 'https://via.placeholder.com/400x225?text=Pas+d+image';
                const rating = game.rating || 'N/A';
                const released = game.released ? game.released.split('-')[0] : 'Inconnue';
                const genres = game.genres ? game.genres.map(g => g.name).slice(0, 2).join(', ') : 'Divers';
                const platforms = game.parent_platforms ? game.parent_platforms.map(p => p.platform.name).join(', ') : 'Multiplateforme';

                const card = document.createElement('div');
                card.className = "bg-[#1e293b] rounded-xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 hover:scale-[1.02] shadow-xl flex flex-col justify-between group";
                card.innerHTML = \`
                    <div>
                        <div class="relative h-48 overflow-hidden bg-slate-900">
                            <img src="\${bgImage}" alt="\${game.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                            <div class="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-400 border border-slate-700 flex items-center gap-1">
                                ⭐ \${rating}
                            </div>
                        </div>
                        <div class="p-4">
                            <div class="flex justify-between items-center text-xs text-slate-400 mb-2">
                                <span>\${released}</span>
                                <span class="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">\${genres}</span>
                            </div>
                            <h3 class="font-bold text-slate-100 text-lg truncate group-hover:text-indigo-400 transition-colors" title="\${game.name}">\${game.name}</h3>
                        </div>
                    </div>
                    <div class="px-4 pb-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>Plateformes:</span>
                        <span class="truncate max-w-[150px] text-slate-300" title="\${platforms}">\${platforms}</span>
                    </div>
                \`;
                gamesGrid.appendChild(card);
            });
        }

        function showLoader(show) {
            if (show) { loader.classList.remove('hidden'); gamesGrid.innerHTML = ''; noResults.classList.add('hidden'); }
            else { loader.classList.add('hidden'); }
        }

        function showError(msg) {
            gamesGrid.innerHTML = \`<div class="col-span-full text-center text-red-400 py-12">\${msg}</div>\`;
        }
    </script>
</body>
</html>`;

// Serveur HTTP unique qui sert l'HTML et le CSS compilé
http
  .createServer((req, res) => {
    if (req.url === "/" || req.url === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(htmlContent);
    } else if (req.url === "/output.css") {
      const cssPath = path.join(__dirname, "output.css");
      fs.readFile(cssPath, (err, content) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Fichier output.css introuvable. Avez-vous lancé Tailwind ?");
        } else {
          res.writeHead(200, { "Content-Type": "text/css" });
          res.end(content);
        }
      });
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Page non trouvée");
    }
  })
  .listen(PORT, () => {
    console.log(`🚀 Application prête sur http://localhost:${PORT}`);
  });
