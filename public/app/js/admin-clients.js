document.addEventListener("DOMContentLoaded", () => {
    initAdminClientsPage();
});

const adminClientsState = {
    search: "",
    statusFilter: "ALL",
    clients: [
        {
            id: 1,
            firstName: "Marie",
            lastName: "Dupont",
            email: "marie.dupont@email.fr",
            phone: "06 12 34 56 78",
            project: "Mariage Marie & Lucas",
            status: "ACTIVE",
            lastActivity: "Connectée il y a 2 jours",
        },
        {
            id: 2,
            firstName: "Lucas",
            lastName: "Martin",
            email: "lucas.martin@email.fr",
            phone: "06 22 44 66 88",
            project: "Mariage Marie & Lucas",
            status: "ACTIVE",
            lastActivity: "Connecté il y a 3 jours",
        },
        {
            id: 3,
            firstName: "Client",
            lastName: "Test",
            email: "client@test.fr",
            phone: "06 00 00 00 01",
            project: "Mariage clients test",
            status: "ACTIVE",
            lastActivity: "Connecté aujourd’hui",
        },
        {
            id: 4,
            firstName: "Emma",
            lastName: "Laurent",
            email: "emma.laurent@email.fr",
            phone: "06 90 12 45 78",
            project: "Mariage Emma & Julien",
            status: "PENDING",
            lastActivity: "Accès non créé",
        },
        {
            id: 5,
            firstName: "Julien",
            lastName: "Moreau",
            email: "julien.moreau@email.fr",
            phone: "06 14 25 36 47",
            project: "Mariage Emma & Julien",
            status: "PENDING",
            lastActivity: "Accès non créé",
        },
        {
            id: 6,
            firstName: "Anaïs",
            lastName: "Petit",
            email: "anais.petit@email.fr",
            phone: "06 74 12 98 55",
            project: "Mariage Anaïs & Thomas",
            status: "INACTIVE",
            lastActivity: "Projet terminé",
        },
    ],
};

function initAdminClientsPage() {
    bindAdminClientsEvents();
    renderAdminClientsPage();
}

function bindAdminClientsEvents() {
    const searchInput = document.querySelector("#adminClientSearchInput");
    const statusFilter = document.querySelector("#adminClientStatusFilter");
    const openButton = document.querySelector("#openAddClientButton");
    const closeButton = document.querySelector("#closeAdminClientModalButton");
    const cancelButton = document.querySelector("#cancelAdminClientButton");
    const backdrop = document.querySelector("#adminClientModalBackdrop");
    const form = document.querySelector("#adminClientForm");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            adminClientsState.search = searchInput.value.trim().toLowerCase();
            renderAdminClientsTable();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            adminClientsState.statusFilter = statusFilter.value;
            renderAdminClientsTable();
        });
    }

    if (openButton) {
        openButton.addEventListener("click", () => {
            openAdminClientModal();
        });
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeAdminClientModal);
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", closeAdminClientModal);
    }

    if (backdrop) {
        backdrop.addEventListener("click", closeAdminClientModal);
    }

    if (form) {
        form.addEventListener("submit", handleAdminClientFormSubmit);
    }
}

function renderAdminClientsPage() {
    renderAdminClientsStats();
    renderAdminClientsTable();
}

function renderAdminClientsStats() {
    const clients = adminClientsState.clients;

    const total = clients.length;
    const active = clients.filter((client) => client.status === "ACTIVE").length;
    const pending = clients.filter((client) => client.status === "PENDING").length;
    const inactive = clients.filter((client) => client.status === "INACTIVE").length;

    setText("#clientsTotalCount", total);
    setText("#clientsActiveCount", active);
    setText("#clientsPendingCount", pending);
    setText("#clientsInactiveCount", inactive);
}

function renderAdminClientsTable() {
    const tableBody = document.querySelector("#adminClientsTableBody");

    if (!tableBody) {
        return;
    }

    const clients = getFilteredClients();

    tableBody.innerHTML = "";

    clients.forEach((client) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>
        <strong class="admin-client-name">${escapeHtml(getClientFullName(client))}</strong>
      </td>

      <td>${escapeHtml(client.email)}</td>

      <td>${escapeHtml(client.phone || "-")}</td>

      <td>${escapeHtml(client.project || "-")}</td>

      <td>
        <span class="admin-client-status-pill ${getClientStatusClass(client.status)}">
          ${getClientStatusLabel(client.status)}
        </span>
      </td>

      <td>
        <span class="admin-client-activity">${escapeHtml(client.lastActivity || "-")}</span>
      </td>

      <td>
        <div class="admin-client-row-actions">
          <button type="button" data-client-action="view" data-id="${client.id}">Voir</button>
          <button type="button" data-client-action="edit" data-id="${client.id}">Modifier</button>
        </div>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    bindAdminClientRowActions();
    renderAdminClientsStats();
}

function getFilteredClients() {
    return adminClientsState.clients.filter((client) => {
        const matchesSearch = matchesClientSearch(client);
        const matchesFilter = matchesClientStatusFilter(client);

        return matchesSearch && matchesFilter;
    });
}

function matchesClientSearch(client) {
    if (!adminClientsState.search) {
        return true;
    }

    const haystack = [
        client.firstName,
        client.lastName,
        client.email,
        client.phone,
        client.project,
        client.status,
        client.lastActivity,
    ]
        .join(" ")
        .toLowerCase();

    return haystack.includes(adminClientsState.search);
}

function matchesClientStatusFilter(client) {
    const filter = adminClientsState.statusFilter;

    if (filter === "ALL") {
        return true;
    }

    return client.status === filter;
}

function bindAdminClientRowActions() {
    const buttons = document.querySelectorAll("[data-client-action][data-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const action = button.dataset.clientAction;

            const client = findClientById(id);

            if (!client) {
                return;
            }

            if (action === "view") {
                openAdminClientModal(client, true);
                return;
            }

            if (action === "edit") {
                openAdminClientModal(client, false);
            }
        });
    });
}

function openAdminClientModal(client = null, readOnly = false) {
    const modal = document.querySelector("#adminClientModal");
    const title = document.querySelector("#adminClientModalTitle");
    const form = document.querySelector("#adminClientForm");

    if (!modal || !form) {
        return;
    }

    setInputValue("#clientId", client ? client.id : "");
    setInputValue("#clientFirstName", client ? client.firstName : "");
    setInputValue("#clientLastName", client ? client.lastName : "");
    setInputValue("#clientEmail", client ? client.email : "");
    setInputValue("#clientPhone", client ? client.phone : "");
    setInputValue("#clientProject", client ? client.project : "");
    setInputValue("#clientStatus", client ? client.status : "PENDING");
    setInputValue("#clientTemporaryPassword", "");

    if (title) {
        if (readOnly) {
            title.textContent = "Détail client";
        } else {
            title.textContent = client ? "Modifier un client" : "Créer un client";
        }
    }

    setFormReadOnly(form, readOnly);

    modal.classList.remove("hidden");
}

function closeAdminClientModal() {
    const modal = document.querySelector("#adminClientModal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
}

function handleAdminClientFormSubmit(event) {
    event.preventDefault();

    const id = getInputValue("#clientId");
    const firstName = getInputValue("#clientFirstName").trim();
    const lastName = getInputValue("#clientLastName").trim();
    const email = getInputValue("#clientEmail").trim();
    const phone = getInputValue("#clientPhone").trim();
    const project = getInputValue("#clientProject");
    const status = getInputValue("#clientStatus");

    if (!firstName || !lastName || !email || !project) {
        alert("Prénom, nom, email et projet sont obligatoires.");
        return;
    }

    if (id) {
        const client = findClientById(Number(id));

        if (client) {
            client.firstName = firstName;
            client.lastName = lastName;
            client.email = email;
            client.phone = phone;
            client.project = project;
            client.status = status;
            client.lastActivity = status === "PENDING" ? "Accès non créé" : client.lastActivity;
        }
    } else {
        adminClientsState.clients.push({
            id: getNextClientId(),
            firstName,
            lastName,
            email,
            phone,
            project,
            status,
            lastActivity: status === "PENDING" ? "Accès non créé" : "Compte créé aujourd’hui",
        });
    }

    closeAdminClientModal();
    renderAdminClientsPage();

    /*
      À brancher plus tard :
      GET    /api/admin/clients
      POST   /api/admin/clients
      PATCH  /api/admin/clients/{id}
    */
}

function setFormReadOnly(form, readOnly) {
    const fields = form.querySelectorAll("input, select, textarea");
    const saveButton = form.querySelector(".admin-client-save-button");

    fields.forEach((field) => {
        if (field.id === "clientId") {
            return;
        }

        field.disabled = readOnly;
    });

    if (saveButton) {
        saveButton.style.display = readOnly ? "none" : "inline-flex";
    }
}

function findClientById(id) {
    return adminClientsState.clients.find((client) => client.id === id);
}

function getNextClientId() {
    if (adminClientsState.clients.length === 0) {
        return 1;
    }

    return Math.max(...adminClientsState.clients.map((client) => client.id)) + 1;
}

function getClientFullName(client) {
    return `${client.firstName} ${client.lastName}`.trim();
}

function getClientStatusLabel(status) {
    const labels = {
        ACTIVE: "Actif",
        PENDING: "À créer",
        INACTIVE: "Inactif",
    };

    return labels[status] || "À créer";
}

function getClientStatusClass(status) {
    const classes = {
        ACTIVE: "active",
        PENDING: "pending",
        INACTIVE: "inactive",
    };

    return classes[status] || "pending";
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
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}