document.addEventListener("DOMContentLoaded", () => {
    initGuestsPage();
});

const guestsState = {
    guests: [
        {
            id: 1,
            name: "Jaque",
            food: "",
            status: "REFUSED",
            comment: "",
        },
        {
            id: 2,
            name: "Fanfan",
            food: "Allergique au poissons",
            status: "CONFIRMED",
            comment: "",
        },
        {
            id: 3,
            name: "Jaqueline",
            food: "",
            status: "CONFIRMED",
            comment: "",
        },
        {
            id: 4,
            name: "Eric",
            food: "",
            status: "CONFIRMED",
            comment: "Vient avec enfants",
        },
        {
            id: 5,
            name: "Jean-Pierre",
            food: "Végétarien",
            status: "REFUSED",
            comment: "",
        },
        {
            id: 6,
            name: "Marie",
            food: "",
            status: "PENDING",
            comment: "",
        },
        {
            id: 7,
            name: "Henry",
            food: "",
            status: "PENDING",
            comment: "",
        },
        {
            id: 8,
            name: "Martine",
            food: "Intolérante au lactose",
            status: "PENDING",
            comment: "",
        },
        {
            id: 9,
            name: "Emeric",
            food: "",
            status: "CONFIRMED",
            comment: "",
        },
        {
            id: 10,
            name: "Jean-Yve",
            food: "",
            status: "CONFIRMED",
            comment: "",
        },
        {
            id: 11,
            name: "Roger",
            food: "",
            status: "CONFIRMED",
            comment: "",
        },
    ],
    search: "",
};

function initGuestsPage() {
    renderGuests();

    const searchInput = document.querySelector("#guestSearchInput");
    const searchButton = document.querySelector("#guestSearchButton");
    const openAddButton = document.querySelector("#openAddGuestButton");
    const closeButton = document.querySelector("#closeGuestModalButton");
    const cancelButton = document.querySelector("#cancelGuestButton");
    const backdrop = document.querySelector("#guestModalBackdrop");
    const form = document.querySelector("#guestForm");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            guestsState.search = searchInput.value.trim().toLowerCase();
            renderGuests();
        });
    }

    if (searchButton) {
        searchButton.addEventListener("click", () => {
            guestsState.search = searchInput ? searchInput.value.trim().toLowerCase() : "";
            renderGuests();
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

function renderGuests() {
    const tableBody = document.querySelector("#guestsTableBody");

    if (!tableBody) {
        return;
    }

    const guests = getFilteredGuests();

    tableBody.innerHTML = "";

    guests.forEach((guest) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>${escapeHtml(guest.name)}</td>
      <td>${escapeHtml(guest.food || "")}</td>
      <td class="${getStatusCellClass(guest.status)}">
        <strong>${getStatusLabel(guest.status)}</strong>
      </td>
      <td class="status-action-cell">
        ${guest.status !== "REFUSED"
                ? `<button type="button" class="status-action-button refused" data-action="refuse" data-id="${guest.id}">Refusé</button>`
                : ""
            }
      </td>
      <td class="status-action-cell">
        ${guest.status !== "CONFIRMED"
                ? `<button type="button" class="status-action-button confirmed" data-action="confirm" data-id="${guest.id}">Confirmé</button>`
                : ""
            }
      </td>
      <td>${escapeHtml(guest.comment || "")}</td>
      <td>
        <div class="guest-row-actions">
          <button type="button" data-action="edit" data-id="${guest.id}">Modifier</button>
          <button type="button" data-action="delete" data-id="${guest.id}">Supprimer</button>
        </div>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    bindRowActions();
    renderGuestStats();
}

function getFilteredGuests() {
    if (!guestsState.search) {
        return guestsState.guests;
    }

    return guestsState.guests.filter((guest) => {
        const haystack = [
            guest.name,
            guest.food,
            guest.status,
            guest.comment,
            getStatusLabel(guest.status),
        ]
            .join(" ")
            .toLowerCase();

        return haystack.includes(guestsState.search);
    });
}

function bindRowActions() {
    const buttons = document.querySelectorAll("[data-action][data-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const action = button.dataset.action;

            if (action === "confirm") {
                updateGuestStatus(id, "CONFIRMED");
                return;
            }

            if (action === "refuse") {
                updateGuestStatus(id, "REFUSED");
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
                deleteGuest(id);
            }
        });
    });
}

function updateGuestStatus(id, status) {
    const guest = findGuestById(id);

    if (!guest) {
        return;
    }

    guest.status = status;
    renderGuests();

    /*
      À brancher plus tard :
      PATCH /api/client/invites/{id}
      body: { statut: status }
    */
}

function deleteGuest(id) {
    const confirmed = window.confirm("Supprimer cet invité ?");

    if (!confirmed) {
        return;
    }

    guestsState.guests = guestsState.guests.filter((guest) => guest.id !== id);
    renderGuests();

    /*
      À brancher plus tard :
      DELETE /api/client/invites/{id}
    */
}

function openGuestModal(guest = null) {
    const modal = document.querySelector("#guestModal");
    const title = document.querySelector("#guestModalTitle");

    if (!modal) {
        return;
    }

    document.querySelector("#guestId").value = guest ? guest.id : "";
    document.querySelector("#guestName").value = guest ? guest.name : "";
    document.querySelector("#guestFood").value = guest ? guest.food : "";
    document.querySelector("#guestStatus").value = guest ? guest.status : "PENDING";
    document.querySelector("#guestComment").value = guest ? guest.comment : "";

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

function handleGuestFormSubmit(event) {
    event.preventDefault();

    const id = document.querySelector("#guestId").value;
    const name = document.querySelector("#guestName").value.trim();
    const food = document.querySelector("#guestFood").value.trim();
    const status = document.querySelector("#guestStatus").value;
    const comment = document.querySelector("#guestComment").value.trim();

    if (!name) {
        alert("Le nom de l’invité est obligatoire.");
        return;
    }

    if (id) {
        const guest = findGuestById(Number(id));

        if (guest) {
            guest.name = name;
            guest.food = food;
            guest.status = status;
            guest.comment = comment;
        }
    } else {
        guestsState.guests.push({
            id: getNextGuestId(),
            name,
            food,
            status,
            comment,
        });
    }

    closeGuestModal();
    renderGuests();

    /*
      À brancher plus tard :
      POST /api/client/invites
      PATCH /api/client/invites/{id}
    */
}

function renderGuestStats() {
    const total = guestsState.guests.length;
    const pending = guestsState.guests.filter((guest) => guest.status === "PENDING").length;
    const refused = guestsState.guests.filter((guest) => guest.status === "REFUSED").length;
    const confirmed = guestsState.guests.filter((guest) => guest.status === "CONFIRMED").length;

    setText("#totalGuestsCount", total);
    setText("#pendingGuestsCount", pending);
    setText("#refusedGuestsCount", refused);
    setText("#confirmedGuestsCount", confirmed);
}

function findGuestById(id) {
    return guestsState.guests.find((guest) => guest.id === id);
}

function getNextGuestId() {
    if (guestsState.guests.length === 0) {
        return 1;
    }

    return Math.max(...guestsState.guests.map((guest) => guest.id)) + 1;
}

function getStatusLabel(status) {
    const labels = {
        PENDING: "En attente",
        CONFIRMED: "Confirmé",
        REFUSED: "Refusé",
    };

    return labels[status] || "En attente";
}

function getStatusCellClass(status) {
    if (status === "CONFIRMED") {
        return "guest-status-confirmed";
    }

    if (status === "REFUSED") {
        return "guest-status-refused";
    }

    return "guest-status-pending";
}

function setText(selector, value) {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.textContent = value;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}