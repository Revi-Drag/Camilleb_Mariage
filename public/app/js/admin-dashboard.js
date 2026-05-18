document.addEventListener("DOMContentLoaded", () => {
    initAdminDashboard();
});

const adminDashboardState = {
    search: "",
    statusFilter: "ALL",
    selectedClientsForProject: [],
    availableClients: [
        {
            id: 1,
            firstName: "Marie",
            lastName: "Dupont",
            email: "marie.dupont@email.fr",
            phone: "06 12 34 56 78",
        },
        {
            id: 2,
            firstName: "Lucas",
            lastName: "Martin",
            email: "lucas.martin@email.fr",
            phone: "06 22 44 66 88",
        },
        {
            id: 3,
            firstName: "Client",
            lastName: "Test",
            email: "client@test.fr",
            phone: "06 00 00 00 01",
        },
        {
            id: 4,
            firstName: "Emma",
            lastName: "Laurent",
            email: "emma.laurent@email.fr",
            phone: "06 90 12 45 78",
        },
    ],
    projects: [
        {
            id: 1,
            name: "Mariage Marie & Lucas",
            clients: ["Marie Dupont", "Lucas Martin"],
            weddingDate: "2026-09-14",
            status: "ACTIVE",
            lastChange: {
                type: "document",
                label: "Nouveau document",
                ago: "il y a 2 h",
            },
            attention: "Document à vérifier",
            attentionType: "DOCUMENT",
            documentsToReview: 1,
            recentActivity: true,
        },
        {
            id: 2,
            name: "Mariage clients test",
            clients: ["Client Test", "Conjoint Test"],
            weddingDate: "2026-07-02",
            status: "ACTIVE",
            lastChange: {
                type: "budget",
                label: "Nouvelle dépense",
                ago: "il y a 1 jour",
            },
            attention: "Budget dépassé",
            attentionType: "BUDGET",
            documentsToReview: 0,
            recentActivity: true,
        },
        {
            id: 3,
            name: "Mariage Emma & Julien",
            clients: ["Emma Laurent", "Julien Moreau"],
            weddingDate: "2026-11-21",
            status: "ACTIVE",
            lastChange: {
                type: "guest",
                label: "Invité ajouté",
                ago: "il y a 3 jours",
            },
            attention: "RAS",
            attentionType: "NONE",
            documentsToReview: 0,
            recentActivity: true,
        },
        {
            id: 4,
            name: "Mariage Anaïs & Thomas",
            clients: ["Anaïs Petit", "Thomas Bernard"],
            weddingDate: "2025-06-18",
            status: "COMPLETED",
            lastChange: {
                type: "none",
                label: "Projet terminé",
                ago: "il y a 8 mois",
            },
            attention: "Archivé",
            attentionType: "NONE",
            documentsToReview: 0,
            recentActivity: false,
        },
        {
            id: 5,
            name: "Mariage Clara & Mehdi",
            clients: ["Clara Simon", "Mehdi Haddad"],
            weddingDate: "2026-05-30",
            status: "ACTIVE",
            lastChange: {
                type: "comment",
                label: "Nouveau commentaire client",
                ago: "il y a 5 h",
            },
            attention: "Réponse à prévoir",
            attentionType: "COMMENT",
            documentsToReview: 0,
            recentActivity: true,
        },
        {
            id: 6,
            name: "Mariage Sophie & Antoine",
            clients: ["Sophie Martin", "Antoine Roux"],
            weddingDate: "2026-08-09",
            status: "ACTIVE",
            lastChange: {
                type: "document",
                label: "Contrat salle déposé",
                ago: "il y a 4 jours",
            },
            attention: "Document à vérifier",
            attentionType: "DOCUMENT",
            documentsToReview: 1,
            recentActivity: true,
        },
    ],
};

function initAdminDashboard() {
    bindAdminDashboardEvents();
    renderClientSelectOptions();
    renderAdminDashboard();
}

function bindAdminDashboardEvents() {
    const refreshButton = document.querySelector("#refreshAdminDashboardButton");
    const searchInput = document.querySelector("#adminProjectSearchInput");
    const statusFilter = document.querySelector("#adminProjectStatusFilter");

    const openCreateProjectButton = document.querySelector("#openCreateProjectButton");
    const closeProjectModalButton = document.querySelector("#closeAdminProjectModalButton");
    const cancelProjectButton = document.querySelector("#cancelAdminProjectButton");
    const modalBackdrop = document.querySelector("#adminProjectModalBackdrop");
    const projectForm = document.querySelector("#adminProjectForm");

    const addExistingClientButton = document.querySelector("#addExistingClientButton");
    const toggleQuickClientButton = document.querySelector("#toggleQuickClientButton");
    const saveQuickClientButton = document.querySelector("#saveQuickClientButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            renderAdminDashboard();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            adminDashboardState.search = searchInput.value.trim().toLowerCase();
            renderAdminProjectsTable();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            adminDashboardState.statusFilter = statusFilter.value;
            renderAdminProjectsTable();
        });
    }

    if (openCreateProjectButton) {
        openCreateProjectButton.addEventListener("click", openProjectModal);
    }

    if (closeProjectModalButton) {
        closeProjectModalButton.addEventListener("click", closeProjectModal);
    }

    if (cancelProjectButton) {
        cancelProjectButton.addEventListener("click", closeProjectModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener("click", closeProjectModal);
    }

    if (projectForm) {
        projectForm.addEventListener("submit", handleProjectFormSubmit);
    }

    if (addExistingClientButton) {
        addExistingClientButton.addEventListener("click", addExistingClientToProject);
    }

    if (toggleQuickClientButton) {
        toggleQuickClientButton.addEventListener("click", toggleQuickClientForm);
    }

    if (saveQuickClientButton) {
        saveQuickClientButton.addEventListener("click", addQuickClientToProject);
    }
}

function renderAdminDashboard() {
    renderAdminStats();
    renderAdminProjectsTable();
}

function renderAdminStats() {
    const projects = adminDashboardState.projects;

    const activeProjects = projects.filter((project) => project.status === "ACTIVE");
    const completedProjects = projects.filter((project) => project.status === "COMPLETED");
    const recentActivities = projects.filter((project) => project.recentActivity);
    const documentsToReview = projects.reduce((total, project) => {
        return total + Number(project.documentsToReview || 0);
    }, 0);

    setText("#activeProjectsCount", activeProjects.length);
    setText("#completedProjectsCount", completedProjects.length);
    setText("#recentActivityCount", recentActivities.length);
    setText("#documentsToReviewCount", documentsToReview);
}

function renderAdminProjectsTable() {
    const tableBody = document.querySelector("#adminProjectsTableBody");

    if (!tableBody) {
        return;
    }

    const projects = getFilteredProjects();

    tableBody.innerHTML = "";

    projects.forEach((project) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>
        <strong class="admin-project-name">${escapeHtml(project.name)}</strong>
      </td>

      <td>
        ${escapeHtml(project.clients.join(", "))}
      </td>

      <td>
        ${formatDate(project.weddingDate)}
      </td>

      <td>
        <span class="admin-status-pill ${getProjectStatusClass(project.status)}">
          ${getProjectStatusLabel(project.status)}
        </span>
      </td>

      <td>
        <span class="admin-change-label">${escapeHtml(project.lastChange.label)}</span>
        <small>${escapeHtml(project.lastChange.ago)}</small>
      </td>

      <td>
        <span class="admin-attention-pill ${getAttentionClass(project.attentionType)}">
          ${escapeHtml(project.attention)}
        </span>
      </td>

      <td>
        <div class="admin-row-actions">
          <button type="button" data-admin-action="view" data-id="${project.id}">Voir</button>
          <button type="button" data-admin-action="manage" data-id="${project.id}">Gérer</button>
        </div>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    bindAdminRowActions();
}

function getFilteredProjects() {
    return adminDashboardState.projects.filter((project) => {
        const matchesSearch = matchesProjectSearch(project);
        const matchesFilter = matchesProjectStatusFilter(project);

        return matchesSearch && matchesFilter;
    });
}

function matchesProjectSearch(project) {
    if (!adminDashboardState.search) {
        return true;
    }

    const haystack = [
        project.name,
        project.clients.join(" "),
        project.status,
        project.lastChange.label,
        project.lastChange.ago,
        project.attention,
    ]
        .join(" ")
        .toLowerCase();

    return haystack.includes(adminDashboardState.search);
}

function matchesProjectStatusFilter(project) {
    const filter = adminDashboardState.statusFilter;

    if (filter === "ALL") {
        return true;
    }

    if (filter === "ACTIVE") {
        return project.status === "ACTIVE";
    }

    if (filter === "COMPLETED") {
        return project.status === "COMPLETED";
    }

    if (filter === "ATTENTION") {
        return project.attentionType !== "NONE";
    }

    return true;
}

function bindAdminRowActions() {
    const buttons = document.querySelectorAll("[data-admin-action][data-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const action = button.dataset.adminAction;

            if (action === "view") {
                window.location.href = `/app/admin-project-detail.html?id=${id}`;
                return;
            }

            if (action === "manage") {
                window.location.href = `/app/admin-project-detail.html?id=${id}&mode=manage`;
            }
        });
    });
}

/* ==========================================================
   CRÉATION PROJET
   ========================================================== */

function openProjectModal() {
    resetProjectForm();
    renderClientSelectOptions();
    renderAssociatedClients();
    showElement("#adminProjectModal");
}

function closeProjectModal() {
    hideElement("#adminProjectModal");
}

function resetProjectForm() {
    const form = document.querySelector("#adminProjectForm");

    if (form) {
        form.reset();
    }

    adminDashboardState.selectedClientsForProject = [];

    hideElement("#quickClientForm");
    clearQuickClientFields();
}

function renderClientSelectOptions() {
    const select = document.querySelector("#existingClientSelect");

    if (!select) {
        return;
    }

    const selectedIds = adminDashboardState.selectedClientsForProject.map((client) => client.id);

    select.innerHTML = `<option value="">Sélectionner un client existant</option>`;

    adminDashboardState.availableClients
        .filter((client) => !selectedIds.includes(client.id))
        .forEach((client) => {
            const option = document.createElement("option");
            option.value = client.id;
            option.textContent = `${client.firstName} ${client.lastName} — ${client.email}`;
            select.appendChild(option);
        });
}

function addExistingClientToProject() {
    const select = document.querySelector("#existingClientSelect");

    if (!select || !select.value) {
        alert("Sélectionne un client existant à associer.");
        return;
    }

    const client = adminDashboardState.availableClients.find((item) => item.id === Number(select.value));

    if (!client) {
        return;
    }

    adminDashboardState.selectedClientsForProject.push(client);

    renderClientSelectOptions();
    renderAssociatedClients();
}

function toggleQuickClientForm() {
    const quickForm = document.querySelector("#quickClientForm");

    if (!quickForm) {
        return;
    }

    quickForm.classList.toggle("hidden");
}

function addQuickClientToProject() {
    const firstName = getInputValue("#quickClientFirstName").trim();
    const lastName = getInputValue("#quickClientLastName").trim();
    const email = getInputValue("#quickClientEmail").trim();
    const phone = getInputValue("#quickClientPhone").trim();

    if (!firstName || !lastName || !email) {
        alert("Prénom, nom et email sont obligatoires pour ajouter un client.");
        return;
    }

    const newClient = {
        id: getNextClientId(),
        firstName,
        lastName,
        email,
        phone,
    };

    adminDashboardState.availableClients.push(newClient);
    adminDashboardState.selectedClientsForProject.push(newClient);

    clearQuickClientFields();
    hideElement("#quickClientForm");

    renderClientSelectOptions();
    renderAssociatedClients();
}

function renderAssociatedClients() {
    const list = document.querySelector("#associatedClientsList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (adminDashboardState.selectedClientsForProject.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-associated-client";
        empty.textContent = "Aucun client associé pour le moment.";
        list.appendChild(empty);
        return;
    }

    adminDashboardState.selectedClientsForProject.forEach((client) => {
        const li = document.createElement("li");

        li.innerHTML = `
      <span>${escapeHtml(client.firstName)} ${escapeHtml(client.lastName)} — ${escapeHtml(client.email)}</span>
      <button type="button" data-remove-client-id="${client.id}">Retirer</button>
    `;

        list.appendChild(li);
    });

    bindRemoveAssociatedClientButtons();
}

function bindRemoveAssociatedClientButtons() {
    const buttons = document.querySelectorAll("[data-remove-client-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.removeClientId);

            adminDashboardState.selectedClientsForProject =
                adminDashboardState.selectedClientsForProject.filter((client) => client.id !== id);

            renderClientSelectOptions();
            renderAssociatedClients();
        });
    });
}

function handleProjectFormSubmit(event) {
    event.preventDefault();

    const name = getInputValue("#projectName").trim();
    const weddingDate = getInputValue("#projectWeddingDate");
    const status = getInputValue("#projectStatus");
    const budget = getInputValue("#projectBudget");
    const adminComment = getInputValue("#projectAdminComment").trim();

    if (!name || !weddingDate) {
        alert("Le nom du projet et la date du mariage sont obligatoires.");
        return;
    }

    if (adminDashboardState.selectedClientsForProject.length === 0) {
        alert("Ajoute au moins un client au projet.");
        return;
    }

    const newProject = {
        id: getNextProjectId(),
        name,
        clients: adminDashboardState.selectedClientsForProject.map((client) => {
            return `${client.firstName} ${client.lastName}`;
        }),
        weddingDate,
        status,
        budget: budget ? Number(budget) : null,
        adminComment,
        lastChange: {
            type: "project",
            label: "Projet créé",
            ago: "à l’instant",
        },
        attention: "RAS",
        attentionType: "NONE",
        documentsToReview: 0,
        recentActivity: true,
    };

    adminDashboardState.projects.unshift(newProject);

    closeProjectModal();
    renderAdminDashboard();

    /*
      À brancher plus tard :
      POST /api/admin/projets
      Body :
      {
        name,
        weddingDate,
        status,
        budget,
        adminComment,
        clients: [...]
      }
    */
}

function clearQuickClientFields() {
    setInputValue("#quickClientFirstName", "");
    setInputValue("#quickClientLastName", "");
    setInputValue("#quickClientEmail", "");
    setInputValue("#quickClientPhone", "");
}

function getNextProjectId() {
    if (adminDashboardState.projects.length === 0) {
        return 1;
    }

    return Math.max(...adminDashboardState.projects.map((project) => project.id)) + 1;
}

function getNextClientId() {
    if (adminDashboardState.availableClients.length === 0) {
        return 1;
    }

    return Math.max(...adminDashboardState.availableClients.map((client) => client.id)) + 1;
}

/* ==========================================================
   HELPERS EXISTANTS
   ========================================================== */

function getProjectStatusLabel(status) {
    const labels = {
        ACTIVE: "En cours",
        COMPLETED: "Terminé",
    };

    return labels[status] || "En cours";
}

function getProjectStatusClass(status) {
    if (status === "COMPLETED") {
        return "completed";
    }

    return "active";
}

function getAttentionClass(attentionType) {
    const classes = {
        DOCUMENT: "document",
        BUDGET: "budget",
        COMMENT: "comment",
        NONE: "none",
    };

    return classes[attentionType] || "none";
}

function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
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

function showElement(selector) {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.classList.remove("hidden");
}

function hideElement(selector) {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.classList.add("hidden");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}