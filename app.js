/* ===== GameZone — App Logic ===== */

// ---------- Sample game catalog ----------
const SAMPLE_GAMES = [];

// ---------- State ----------
let games = [];
let currentCategory = "all";
let searchQuery = "";

// ---------- Init ----------
function init() {
    loadGames();
    renderGames();
    bindEvents();
}

function loadGames() {
    const stored = localStorage.getItem("gamezone_games");
    if (stored) {
        games = JSON.parse(stored);
    } else {
        games = [...SAMPLE_GAMES];
        saveGames();
    }
}

function saveGames() {
    localStorage.setItem("gamezone_games", JSON.stringify(games));
}

// ---------- Render ----------
function renderGames() {
    const grid = document.getElementById("gamesGrid");
    const noResults = document.getElementById("noResults");
    const countEl = document.getElementById("gameCount");
    const titleEl = document.getElementById("sectionTitle");

    const filtered = games.filter(g => {
        const matchCat = currentCategory === "all" || g.category === currentCategory;
        const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    // Section title
    const catLabels = { all: "Tüm Oyunlar", aksiyon: "Aksiyon", bulmaca: "Bulmaca", yarış: "Yarış", spor: "Spor", strateji: "Strateji" };
    titleEl.textContent = "🔥 " + (catLabels[currentCategory] || "Tüm Oyunlar");
    countEl.textContent = filtered.length + " oyun";

    if (filtered.length === 0) {
        grid.innerHTML = "";
        noResults.style.display = "block";
        return;
    }
    noResults.style.display = "none";

    grid.innerHTML = filtered.map(g => `
        <div class="game-card" data-id="${g.id}">
            <div class="game-card-img">
                ${g.image ? `<img src="${g.image}" alt="${g.name}">` : g.emoji}
            </div>
            <div class="game-card-body">
                <div class="game-card-title">${g.name}</div>
                <div class="game-card-meta">
                    <span class="game-card-cat">${g.category}</span>
                    <span class="game-card-plays">▶ ${formatPlays(g.plays)}</span>
                </div>
            </div>
        </div>
    `).join("");
}

function formatPlays(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
}

// ---------- Events ----------
function bindEvents() {
    // Category nav
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            link.classList.add("active");
            currentCategory = link.dataset.category;
            renderGames();
        });
    });

    // Search
    document.getElementById("searchInput").addEventListener("input", e => {
        searchQuery = e.target.value;
        renderGames();
    });

    // Game card click
    document.getElementById("gamesGrid").addEventListener("click", e => {
        const card = e.target.closest(".game-card");
        if (!card) return;
        const id = parseInt(card.dataset.id);
        openGame(id);
    });

    // Close game modal
    document.getElementById("modalClose").addEventListener("click", closeGame);
    document.getElementById("gameModal").addEventListener("click", e => {
        if (e.target === e.currentTarget) closeGame();
    });

    // Upload FAB
    document.getElementById("fabUpload").addEventListener("click", () => {
        document.getElementById("uploadModal").classList.add("open");
    });
    document.getElementById("uploadClose").addEventListener("click", () => {
        document.getElementById("uploadModal").classList.remove("open");
    });
    document.getElementById("uploadModal").addEventListener("click", e => {
        if (e.target === e.currentTarget) document.getElementById("uploadModal").classList.remove("open");
    });

    // Upload form
    document.getElementById("uploadForm").addEventListener("submit", handleUpload);

    // ESC key
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            closeGame();
            document.getElementById("uploadModal").classList.remove("open");
        }
    });
}

// ---------- Game Modal ----------
function openGame(id) {
    const game = games.find(g => g.id === id);
    if (!game) return;

    // Increment plays
    game.plays++;
    saveGames();

    document.getElementById("modalTitle").textContent = game.name;
    document.getElementById("modalCategory").textContent = game.category.toUpperCase();
    document.getElementById("modalPlays").textContent = "▶ " + formatPlays(game.plays) + " oynama";

    const container = document.getElementById("modalGameContainer");
    container.innerHTML = `<iframe src="${game.url}" allowfullscreen></iframe>`;

    document.getElementById("gameModal").classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeGame() {
    const modal = document.getElementById("gameModal");
    modal.classList.remove("open");
    document.getElementById("modalGameContainer").innerHTML = "";
    document.body.style.overflow = "";
}

// ---------- Upload ----------
function handleUpload(e) {
    e.preventDefault();
    const statusEl = document.getElementById("uploadStatus");
    const name = document.getElementById("uploadName").value.trim();
    const category = document.getElementById("uploadCategory").value;
    const file = document.getElementById("uploadFile").files[0];
    const imageFile = document.getElementById("uploadImage").files[0];

    if (!name || !file) return;

    // For demo: create a blob URL from the uploaded HTML file
    const reader = new FileReader();
    reader.onload = function (ev) {
        const blob = new Blob([ev.target.result], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        const newGame = {
            id: Date.now(),
            name: name,
            category: category,
            emoji: getCategoryEmoji(category),
            url: url,
            plays: 0,
            image: null
        };

        // Handle cover image
        if (imageFile) {
            const imgReader = new FileReader();
            imgReader.onload = function (imgEv) {
                newGame.image = imgEv.target.result;
                addGame(newGame, statusEl);
            };
            imgReader.readAsDataURL(imageFile);
        } else {
            addGame(newGame, statusEl);
        }
    };
    reader.readAsArrayBuffer(file);
}

function addGame(game, statusEl) {
    games.unshift(game);
    saveGames();
    renderGames();

    statusEl.textContent = "✅ Oyun başarıyla yüklendi!";
    statusEl.className = "upload-status success";
    document.getElementById("uploadForm").reset();

    setTimeout(() => {
        document.getElementById("uploadModal").classList.remove("open");
        statusEl.textContent = "";
    }, 1500);
}

function getCategoryEmoji(cat) {
    const map = { aksiyon: "💥", bulmaca: "🧩", yarış: "🏎️", spor: "⚽", strateji: "🏰" };
    return map[cat] || "🎮";
}

// ---------- Start ----------
document.addEventListener("DOMContentLoaded", init);
