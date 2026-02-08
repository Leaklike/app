const STORAGE_KEY = "tv-show-tracker";
const form = document.querySelector("#show-form");
const showList = document.querySelector("#show-list");
const filterStatus = document.querySelector("#filter-status");
const searchInput = document.querySelector("#search-input");
const summary = document.querySelector("#summary");
const clearShowsButton = document.querySelector("#clear-shows");
const template = document.querySelector("#show-card-template");

const statusLabels = {
  watching: "Kijkt nu",
  planned: "Nog te starten",
  finished: "Afgerond",
};

const nextStatus = {
  watching: "finished",
  finished: "planned",
  planned: "watching",
};

const loadShows = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

const saveShows = (shows) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shows));
};

const formatProgress = (season, episode) => {
  if (!season && !episode) {
    return "Nog geen voortgang ingevuld";
  }

  const seasonText = season ? `S${season}` : "S?";
  const episodeText = episode ? `E${episode}` : "E?";
  return `${seasonText} · ${episodeText}`;
};

const formatRating = (rating) => {
  if (!rating) {
    return "Geen rating";
  }

  return `${rating}/10`;
};

const renderSummary = (shows) => {
  const counts = shows.reduce(
    (acc, show) => {
      acc.total += 1;
      if (show.status === "watching") acc.watching += 1;
      if (show.status === "finished") acc.finished += 1;
      return acc;
    },
    { total: 0, watching: 0, finished: 0 }
  );

  summary.querySelector('[data-summary="total"]').textContent = counts.total;
  summary.querySelector('[data-summary="watching"]').textContent = counts.watching;
  summary.querySelector('[data-summary="finished"]').textContent = counts.finished;
};

const renderShows = () => {
  const shows = loadShows();
  const searchTerm = searchInput.value.trim().toLowerCase();
  const statusFilter = filterStatus.value;

  showList.innerHTML = "";

  const filtered = shows.filter((show) => {
    const matchesStatus = statusFilter === "all" || show.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      show.title.toLowerCase().includes(searchTerm) ||
      show.genre.toLowerCase().includes(searchTerm);

    return matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.textContent =
      "Nog geen shows gevonden. Voeg er eentje toe of pas je filter aan.";
    empty.className = "show-card__notes";
    showList.appendChild(empty);
    renderSummary(shows);
    return;
  }

  filtered.forEach((show) => {
    const card = template.content.cloneNode(true);
    const article = card.querySelector(".show-card");

    card.querySelector("h3").textContent = show.title;
    card.querySelector(".tag").textContent = statusLabels[show.status];
    card.querySelector(".show-card__meta").textContent = show.genre
      ? `Genre: ${show.genre}`
      : "Geen genre toegevoegd";
    card.querySelector(".progress__value").textContent = formatProgress(
      show.season,
      show.episode
    );
    card.querySelector(".show-card__notes").textContent = show.notes
      ? `Notities: ${show.notes}`
      : "Geen notities toegevoegd";
    card.querySelector(".rating").textContent = `Rating: ${formatRating(
      show.rating
    )}`;

    const toggleButton = card.querySelector('[data-action="toggle"]');
    toggleButton.addEventListener("click", () => {
      updateShowStatus(show.id);
    });

    const removeButton = card.querySelector('[data-action="remove"]');
    removeButton.addEventListener("click", () => {
      removeShow(show.id);
    });

    showList.appendChild(article);
  });

  renderSummary(shows);
};

const addShow = (event) => {
  event.preventDefault();
  const formData = new FormData(form);

  const show = {
    id: crypto.randomUUID(),
    title: formData.get("title").trim(),
    genre: formData.get("genre").trim(),
    status: formData.get("status"),
    season: formData.get("season") ? Number(formData.get("season")) : "",
    episode: formData.get("episode") ? Number(formData.get("episode")) : "",
    rating: formData.get("rating") ? Number(formData.get("rating")) : "",
    notes: formData.get("notes").trim(),
  };

  const shows = loadShows();
  shows.unshift(show);
  saveShows(shows);
  form.reset();
  renderShows();
};

const updateShowStatus = (id) => {
  const shows = loadShows();
  const updated = shows.map((show) => {
    if (show.id !== id) return show;
    return { ...show, status: nextStatus[show.status] };
  });
  saveShows(updated);
  renderShows();
};

const removeShow = (id) => {
  const shows = loadShows().filter((show) => show.id !== id);
  saveShows(shows);
  renderShows();
};

const clearShows = () => {
  if (loadShows().length === 0) return;
  if (!confirm("Weet je zeker dat je alle shows wilt wissen?")) return;
  saveShows([]);
  renderShows();
};

form.addEventListener("submit", addShow);
filterStatus.addEventListener("change", renderShows);
searchInput.addEventListener("input", renderShows);
clearShowsButton.addEventListener("click", clearShows);

renderShows();
