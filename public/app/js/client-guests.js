document.addEventListener("DOMContentLoaded", () => {
    initGuestsPage();
});

const API_BASE_URL = "";

const guestsState = {
    search: "",
    statusFilter: "ALL",
    currentProjectId: null,
    guests: [],
};

async function initGuestsPage() {
    bindGuestsEvents();

    try {
        await loadCurrentProject();
        await loadGuests();
        renderGuestsPage();
    } catch (error) {
        console.error("Erreur initialisation invités :", error);
        alert("Impossible de charger les invités. Vérifie que tu es connecté.");
    }
}

function bindGuestsEvents() {
    const searchInput = document.querySelector("#guestSearchInput");
    const statusFilter = document.querySelector("#guestStatusFilter");
    const openAddButton = document.querySelector("#openAddGuestButton");

    const closeButton = document.querySelector("#closeGuestModalButton");
    const cancelButton = document.querySelector("#cancelGuestButton");
    const backdrop = document.querySelector("#guestModalBackdrop");
    const form = document.querySelector("#guestForm");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            guestsState.search = searchInput.value.trim().toLowerCase();
            renderGuestsTable();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            guestsState.statusFilter = statusFilter.value;
            renderGuestsTable();
        });
    }

    if (openAddButton) {
        openAddButton.addEventListener("click", () => {
            openGuestModal();
        });
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeGuestModal);
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", closeGuestModal);
    }

    if (backdrop) {
        backdrop.addEventListener("click", closeGuestModal);
    }

    if (form) {
        form.addEventListener("submit", handleGuestFormSubmit);
    }
}

/* ==========================================================
   API
   ========================================================== */

async function loadCurrentProject() {
    const response = await fetch(`${API_BASE_URL}/api/client/projets`, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(data.error || "Impossible de charger le projet client.");
    }

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Aucun projet mariage associé à ce client.");
    }

    guestsState.currentProjectId = data[0].id;
}

async function loadGuests() {
    const response = await fetch(`${API_BASE_URL}/api/client/invites`, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les invités.");
    }

    guestsState.guests = Array.isArray(data) ? data.map(mapApiGuestToFrontGuest) : [];
}

async function createGuest(payload) {
    const response = await fetch(`${API_BASE_URL}/api/client/invites`, {
        method: "POST",
        credentials: "include",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || data.success === false) {
        throw new Error(data.error || "Impossible de créer l’invité.");
    }

    return data.invite;
}

async function updateGuest(id, payload) {
    const response = await fetch(`${API_BASE_URL}/api/client/invites/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || data.success === false) {
        throw new Error(data.error || "Impossible de modifier l’invité.");
    }

    return data.invite;
}

async function deleteGuestApi(id) {
    const response = await fetch(`${API_BASE_URL}/api/client/invites/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || data.success === false) {
        throw new Error(data.error || "Impossible de supprimer l’invité.");
    }

    return data;
}

async function parseJsonResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error("Réponse non JSON :", text);
        throw new Error("Réponse serveur invalide.");
    }
}

/* ==========================================================
   RENDU
   ========================================================== */

function renderGuestsPage() {
    renderGuestsStats();
    renderGuestsTable();
}

function renderGuestsStats() {
    const guests = guestsState.guests;

    const total = guests.length;
    const confirmed = guests.filter((guest) => guest.status === "CONFIRMED").length;
    const pending = guests.filter((guest) => guest.status === "PENDING").length;
    const refused = guests.filter((guest) => guest.status === "REFUSED").length;

    setText("#guestsTotalCount", total);
    setText("#guestsConfirmedCount", confirmed);
    setText("#guestsPendingCount", pending);
    setText("#guestsRefusedCount", refused);
}

function renderGuestsTable() {
    const tableBody = document.querySelector("#guestsTableBody");

    if (!tableBody) {
        return;
    }

    const guests = getFilteredGuests();

    tableBody.innerHTML = "";

    if (guests.length === 0) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td colspan="6" class="guests-empty-cell">
        Aucun invité à afficher.
      </td>
    `;

        tableBody.appendChild(tr);
        renderGuestsStats();
        return;
    }

    guests.forEach((guest) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>
        <strong class="guest-name-cell">${escapeHtml(guest.name)}</strong>
      </td>

      <td>${escapeHtml(guest.email || "-")}</td>

      <td>${escapeHtml(guest.phone || "-")}</td>

      <td>
        <span class="guest-status-pill ${getStatusClass(guest.status)}">
          ${getStatusLabel(guest.status)}
        </span>
      </td>

      <td class="guest-comment-cell">
        ${escapeHtml(formatGuestNotes(guest))}
      </td>

      <td>
        <div class="guest-row-actions">
          <button type="button" data-guest-action="confirm" data-id="${guest.id}">Confirmer</button>
          <button type="button" data-guest-action="refuse" data-id="${guest.id}">Refuser</button>
          <button type="button" data-guest-action="edit" data-id="${guest.id}">Modifier</button>
          <button type="button" data-guest-action="delete" data-id="${guest.id}">Supprimer</button>
        </div>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    bindGuestRowActions();
    renderGuestsStats();
}

function getFilteredGuests() {
    return guestsState.guests.filter((guest) => {
        return matchesGuestSearch(guest) && matchesGuestStatusFilter(guest);
    });
}

function matchesGuestSearch(guest) {
    if (!guestsState.search) {
        return true;
    }

    const haystack = [
        guest.name,
        guest.email,
        guest.phone,
        guest.status,
        guest.foodRestrictions,
        guest.comment,
        getStatusLabel(guest.status),
    ]
        .join(" ")
        .toLowerCase();

    return haystack.includes(guestsState.search);
}

function matchesGuestStatusFilter(guest) {
    if (guestsState.statusFilter === "ALL") {
        return true;
    }

    return guest.status === guestsState.statusFilter;
}

/* ==========================================================
   ACTIONS
   ========================================================== */

function bindGuestRowActions() {
    const buttons = document.querySelectorAll("[data-guest-action][data-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", async () => {
            const id = Number(button.dataset.id);
            const action = button.dataset.guestAction;

            if (action === "confirm") {
                await updateGuestStatus(id, "confirme");
                return;
            }

            if (action === "refuse") {
                await updateGuestStatus(id, "refuse");
                return;
            }

            if (action === "edit") {
                const guest = findGuestById(id);

                if (guest) {
                    openGuestModal(guest);
                }

                return;
            }

            if (action === "delete") {
                await deleteGuest(id);
            }
        });
    });
}

function openGuestModal(guest = null) {
    const modal = document.querySelector("#guestModal");
    const title = document.querySelector("#guestModalTitle");

    if (!modal) {
        return;
    }

    setInputValue("#guestId", guest ? guest.id : "");
    setInputValue("#guestName", guest ? guest.name : "");
    setInputValue("#guestEmail", guest ? guest.email : "");
    setInputValue("#guestPhone", guest ? guest.phone : "");
    setInputValue("#guestStatus", guest ? guest.status : "PENDING");
    setInputValue("#guestFoodRestrictions", guest ? guest.foodRestrictions : "");
    setInputValue("#guestComment", guest ? guest.comment : "");

    if (title) {
        title.textContent = guest ? "Modifier un invité" : "Ajouter un invité";
    }

    modal.classList.remove("hidden");
}

function closeGuestModal() {
    const modal = document.querySelector("#guestModal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
}

async function handleGuestFormSubmit(event) {
    event.preventDefault();

    const id = getInputValue("#guestId");
    const name = getInputValue("#guestName").trim();
    const email = getInputValue("#guestEmail").trim();
    const phone = getInputValue("#guestPhone").trim();
    const status = getInputValue("#guestStatus");
    const foodRestrictions = getInputValue("#guestFoodRestrictions").trim();
    const comment = getInputValue("#guestComment").trim();

    if (!name) {
        alert("Le nom de l’invité est obligatoire.");
        return;
    }

    if (!guestsState.currentProjectId) {
        alert("Aucun projet mariage trouvé pour créer l’invité.");
        return;
    }

    const payload = {
        nom: name,
        email: email || null,
        telephone: phone || null,
        statut: mapFrontStatusToApi(status),
        regimeAlimentaire: foodRestrictions || null,
        notes: comment || null,
        projetMariageId: guestsState.currentProjectId,
    };

    try {
        if (id) {
            await updateGuest(Number(id), payload);
        } else {
            await createGuest(payload);
        }

        closeGuestModal();
        await loadGuests();
        renderGuestsPage();
    } catch (error) {
        console.error("Erreur enregistrement invité :", error);
        alert(error.message);
    }
}

async function updateGuestStatus(id, apiStatus) {
    const guest = findGuestById(id);

    if (!guest) {
        return;
    }

    const payload = {
        nom: guest.name,
        email: guest.email || null,
        telephone: guest.phone || null,
        statut: apiStatus,
        regimeAlimentaire: guest.foodRestrictions || null,
        notes: guest.comment || null,
        projetMariageId: guestsState.currentProjectId,
    };

    try {
        await updateGuest(id, payload);
        await loadGuests();
        renderGuestsPage();
    } catch (error) {
        console.error("Erreur changement statut invité :", error);
        alert(error.message);
    }
}

async function deleteGuest(id) {
    const confirmed = window.confirm("Supprimer cet invité ?");

    if (!confirmed) {
        return;
    }

    try {
        await deleteGuestApi(id);
        await loadGuests();
        renderGuestsPage();
    } catch (error) {
        console.error("Erreur suppression invité :", error);
        alert(error.message);
    }
}

/* ==========================================================
   MAPPING API ↔ FRONT
   ========================================================== */

function mapApiGuestToFrontGuest(apiGuest) {
    return {
        id: apiGuest.id,
        name: apiGuest.nom || "",
        email: apiGuest.email || "",
        phone: apiGuest.telephone || "",
        status: mapApiStatusToFront(apiGuest.statut),
        foodRestrictions: apiGuest.regimeAlimentaire || "",
        comment: apiGuest.notes || "",
    };
}

function mapFrontStatusToApi(status) {
    const statuses = {
        PENDING: "en_attente",
        CONFIRMED: "confirme",
        REFUSED: "refuse",
    };

    return statuses[status] || "en_attente";
}

function mapApiStatusToFront(status) {
    const statuses = {
        en_attente: "PENDING",
        confirme: "CONFIRMED",
        refuse: "REFUSED",
    };

    return statuses[status] || "PENDING";
}

/* ==========================================================
   HELPERS
   ========================================================== */

function findGuestById(id) {
    return guestsState.guests.find((guest) => guest.id === id);
}

function getStatusLabel(status) {
    const labels = {
        PENDING: "En attente",
        CONFIRMED: "Confirmé",
        REFUSED: "Refusé",
    };

    return labels[status] || "En attente";
}

function getStatusClass(status) {
    const classes = {
        PENDING: "pending",
        CONFIRMED: "confirmed",
        REFUSED: "refused",
    };

    return classes[status] || "pending";
}

function formatGuestNotes(guest) {
    const parts = [];

    if (guest.foodRestrictions) {
        parts.push(`Régime : ${guest.foodRestrictions}`);
    }

    if (guest.comment) {
        parts.push(guest.comment);
    }

    return parts.length > 0 ? parts.join(" — ") : "Aucun commentaire";
}

function setText(selector, value) {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.textContent = value;
}

function setInputValue(selector, value) {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.value = value;
}

function getInputValue(selector) {
    const element = document.querySelector(selector);

    if (!element) {
        return "";
    }

    return element.value;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}