import { createIcons, Gamepad2, Search, Star } from "lucide";

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = "https://api.rawg.io/api";
const ICONS = { Gamepad2, Search, Star };

const searchInput = document.getElementById("searchInput");
const gamesGrid = document.getElementById("gamesGrid");
const loader = document.getElementById("loader");
const gameCount = document.getElementById("gameCount");
const noResults = document.getElementById("noResults");
const homeBtn = document.getElementById("homeBtn");
const searchBox = document.querySelector(".search-box");
const gamesView = document.getElementById("gamesView");
const gameDetails = document.getElementById("gameDetails");

let searchTimeout = null;

function initializeApp() {
  renderIcons();
  createBackgroundParticles();

  const gameMatch = window.location.pathname.match(/^\/game\/(\d+)\/?$/);
  if (gameMatch) {
    gamesView.classList.add("hidden");
    gameDetails.classList.remove("hidden");
    searchBox.classList.add("hidden");
  }

  homeBtn.addEventListener("click", () => {
    window.location.href = "/";
  });

  searchInput.addEventListener("input", (event) => {
    clearTimeout(searchTimeout);
    const query = event.target.value.trim();
    if (query.length === 0) {
      loadTrendingGames();
      return;
    }
    if (query.length < 2) return;
    searchTimeout = setTimeout(() => searchGames(query), 400);
  });

  if (!API_KEY) {
    const message =
      "Clé API absente : ajoute VITE_RAWG_API_KEY dans le fichier .env puis redémarre Vite.";
    console.error(message);
    if (gameMatch) {
      showDetailError(message);
    } else {
      showLoader(false);
      showError(message);
    }
    return;
  }

  if (gameMatch) {
    loadGameDetails(gameMatch[1]);
  } else {
    loadTrendingGames();
  }
}

function renderIcons(root = document) {
  createIcons({ icons: ICONS, root });
}

async function requestRawg(resource, parameters = {}) {
  const url = new URL(`${BASE_URL}/${resource}`);
  url.searchParams.set("key", API_KEY);
  Object.entries(parameters).forEach(([name, value]) => {
    url.searchParams.set(name, value);
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur RAWG : HTTP ${response.status}`);
  }
  return response.json();
}

async function loadTrendingGames() {
  showLoader(true);
  try {
    const data = await requestRawg("games", {
      ordering: "-added",
      page_size: 16,
    });
    displayGames(data.results);
  } catch (error) {
    console.error("Impossible de charger les jeux tendances.", error);
    showError("Impossible de charger les jeux.");
  } finally {
    showLoader(false);
  }
}

async function searchGames(query) {
  showLoader(true);
  try {
    const data = await requestRawg("games", {
      search: query,
      page_size: 16,
    });
    displayGames(data.results);
  } catch (error) {
    console.error("Erreur lors de la recherche RAWG.", error);
    showError("Erreur lors de la recherche.");
  } finally {
    showLoader(false);
  }
}

async function loadGameDetails(gameId) {
  gameDetails.textContent = "Chargement des détails...";
  try {
    const game = await requestRawg(`games/${gameId}`);
    if (!game || !game.name) {
      throw new Error("Jeu introuvable");
    }
    displayGameDetails(game);
  } catch (error) {
    console.error("Impossible de charger les détails du jeu.", error);
    showDetailError(
      "Impossible de charger les détails de ce jeu. Vérifie ta connexion puis réessaie.",
    );
  }
}

function displayGameDetails(game) {
  document.title = `${game.name} | RAWG Explorer`;
  gameDetails.replaceChildren();

  const backLink = document.createElement("a");
  backLink.className = "detail-back";
  backLink.href = "/";
  backLink.textContent = "← Retour aux jeux";
  gameDetails.append(backLink);

  const article = document.createElement("article");
  article.className = "game-detail";

  const hero = document.createElement("div");
  hero.className = "detail-hero";
  if (game.background_image) {
    const image = document.createElement("img");
    image.className = "detail-cover";
    image.src = game.background_image;
    image.alt = "";
    hero.append(image);
  }

  const heroContent = document.createElement("div");
  heroContent.className = "detail-hero-content";
  const title = document.createElement("h2");
  title.textContent = game.name || "Jeu sans titre";
  heroContent.append(title);

  const summary = document.createElement("div");
  summary.className = "detail-summary";
  const rating = game.rating ? `${game.rating}/5` : "Non notée";
  const released = game.released || "Date inconnue";
  summary.textContent = `Note : ${rating} · Sortie : ${released}`;
  heroContent.append(summary);

  const genres = document.createElement("div");
  genres.className = "detail-tags";
  (game.genres || []).forEach((genre) => {
    const tag = document.createElement("span");
    tag.className = "genre-tag";
    tag.textContent = genre.name;
    genres.append(tag);
  });
  heroContent.append(genres);
  hero.append(heroContent);
  article.append(hero);

  const description = document.createElement("section");
  description.className = "detail-section";
  const descriptionTitle = document.createElement("h3");
  descriptionTitle.textContent = "À propos";
  const descriptionText = document.createElement("p");
  descriptionText.className = "detail-description";
  descriptionText.textContent =
    game.description_raw || "Aucune description disponible.";
  description.append(descriptionTitle, descriptionText);
  article.append(description);

  const details = document.createElement("section");
  details.className = "detail-facts";
  appendDetailFact(
    details,
    "Plateformes",
    getNames(game.platforms, "platform"),
  );
  appendDetailFact(details, "Développeurs", getNames(game.developers));
  appendDetailFact(details, "Éditeurs", getNames(game.publishers));
  appendDetailFact(
    details,
    "Metascore",
    game.metacritic ? `${game.metacritic}/100` : "",
  );
  appendDetailFact(
    details,
    "Classification",
    game.esrb_rating ? game.esrb_rating.name : "",
  );
  appendDetailFact(
    details,
    "Durée moyenne",
    game.playtime ? `${game.playtime} h` : "",
  );
  article.append(details);

  if (game.website && /^https?:\/\//i.test(game.website)) {
    const website = document.createElement("a");
    website.className = "detail-website";
    website.href = game.website;
    website.target = "_blank";
    website.rel = "noopener noreferrer";
    website.textContent = "Site officiel ↗";
    article.append(website);
  }

  gameDetails.append(article);
}

function getNames(items, nestedKey) {
  if (!items) return "";
  return items
    .map((item) => {
      const value = nestedKey ? item[nestedKey] : item;
      return value && value.name;
    })
    .filter(Boolean)
    .join(", ");
}

function appendDetailFact(container, label, value) {
  if (!value) return;
  const fact = document.createElement("div");
  fact.className = "detail-fact";
  const factLabel = document.createElement("span");
  factLabel.className = "detail-fact-label";
  factLabel.textContent = label;
  const factValue = document.createElement("span");
  factValue.className = "detail-fact-value";
  factValue.textContent = value;
  fact.append(factLabel, factValue);
  container.append(fact);
}

function displayGames(games) {
  gamesGrid.replaceChildren();
  if (!games || games.length === 0) {
    noResults.classList.remove("hidden");
    gameCount.textContent = "0 jeu";
    return;
  }
  noResults.classList.add("hidden");
  gameCount.textContent = `${games.length} jeux affichés`;

  games.forEach((game) => {
    const bgImage =
      game.background_image ||
      "https://via.placeholder.com/400x225?text=Pas+d+image";
    const rating = game.rating || "N/A";
    const released = game.released ? game.released.split("-")[0] : "Inconnue";
    const genres = game.genres
      ? game.genres
          .map((genre) => genre.name)
          .slice(0, 2)
          .join(", ")
      : "Divers";
    const platforms = game.parent_platforms
      ? game.parent_platforms.map((item) => item.platform.name).join(", ")
      : "Multiplateforme";

    const card = document.createElement("a");
    card.className = "card";
    card.href = `/game/${game.id}`;
    card.setAttribute("aria-label", `Voir les détails de ${game.name}`);
    card.innerHTML = `
      <div>
        <div class="card-img-container">
          <img src="${bgImage}" alt="${game.name}" class="card-img">
          <div class="rating-badge">
            <i data-lucide="star" style="width: 14px; height: 14px; fill: #fbbf24; color: #fbbf24;"></i> ${rating}
          </div>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span>${released}</span>
            <span class="genre-tag">${genres}</span>
          </div>
          <h3 class="card-title" title="${game.name}">${game.name}</h3>
        </div>
      </div>
      <div class="card-footer">
        <span>Plateformes:</span>
        <span class="platforms-text" title="${platforms}">${platforms}</span>
      </div>
    `;
    gamesGrid.append(card);
  });

  renderIcons(gamesGrid);
}

function showLoader(show) {
  if (show) {
    loader.classList.remove("hidden");
    gamesGrid.replaceChildren();
    noResults.classList.add("hidden");
  } else {
    loader.classList.add("hidden");
  }
}

function showError(message) {
  gamesGrid.replaceChildren();
  const error = document.createElement("div");
  error.className = "col-span-full text-center py-20 text-red";
  error.textContent = message;
  gamesGrid.append(error);
}

function showDetailError(message) {
  gameDetails.replaceChildren();
  const error = document.createElement("p");
  error.className = "detail-error";
  error.textContent = message;
  gameDetails.append(error);
}

function createBackgroundParticles() {
  const container = document.getElementById("particles-container");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const particleCount = 160;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("span");
    const duration = Math.random() * 24 + 24;
    particle.className = "background-particle";
    particle.style.width = `${Math.random() * 2 + 1.5}px`;
    particle.style.height = particle.style.width;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.setProperty(
      "--particle-opacity",
      `${Math.random() * 0.4 + 0.45}`,
    );
    particle.style.setProperty(
      "--drift-x",
      `${(Math.random() * 0.5 - 0.25) * window.innerWidth}px`,
    );
    particle.style.setProperty(
      "--drift-y",
      `${(Math.random() * 0.5 - 0.25) * window.innerHeight}px`,
    );
    particle.style.setProperty("--duration", `${duration}s`);
    particle.style.setProperty("--delay", `${Math.random() * -duration}s`);
    container.append(particle);
  }

  if (reducedMotion) return;

  const spheres = document.querySelector(".gradient-spheres");
  let pointerFrame = null;
  let lastParticleTime = 0;
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "touch") {
      const moveX = (event.clientX / window.innerWidth - 0.5) * 10;
      const moveY = (event.clientY / window.innerHeight - 0.5) * 10;
      if (pointerFrame !== null) {
        cancelAnimationFrame(pointerFrame);
      }
      pointerFrame = requestAnimationFrame(() => {
        spheres.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        pointerFrame = null;
      });
    }

    const now = performance.now();
    if (
      event.pointerType === "touch" ||
      now - lastParticleTime < 70 ||
      container.querySelectorAll(".cursor-particle").length >= 16
    ) {
      return;
    }
    lastParticleTime = now;

    const particle = document.createElement("span");
    particle.className = "cursor-particle";
    particle.style.left = `${event.clientX}px`;
    particle.style.top = `${event.clientY}px`;
    particle.style.setProperty("--drift-x", `${Math.random() * 36 - 18}px`);
    particle.style.setProperty("--drift-y", `${Math.random() * 36 - 18}px`);
    container.append(particle);
    particle.addEventListener("animationend", () => particle.remove(), {
      once: true,
    });
  });
}

initializeApp();
