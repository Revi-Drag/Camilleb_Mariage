document.addEventListener("DOMContentLoaded", () => {
    initAdminDashboard();
});

const API_BASE_URL = "";

const adminDashboardState = {
    search: "",
    statusFilter: "ALL",
    selectedClientsForProject: [],
    availableClients: [],
    projects: [],
};

/* ==========================================================
   INIT
   ========================================================== */

async function initAdminDashboard() {
    bindAdminDashboardEvents();

    try {
        await loadAdminDashboardData();
        renderClientSelectOptions();
        renderAdminDashboard();
    } catch (error) {
        console.error("Erreur initialisation dashboard admin :", error);
        alert("Impossible de charger le tableau de bord admin. Vérifie que tu es connecté en admin.");
    }
}

async function loadAdminDashboardData() {
    const [projects, clients] = await Promise.all([
        fetchAdminProjects(),
        fetchAdminClients(),
    ]);

    adminDashboardState.projects = projects.map(mapApiProjectToFrontProject);
    adminDashboardState.availableClients = clients.map(mapApiClientToFrontClient);
}

/* ==========================================================
   EVENTS
   ========================================================== */

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
        refreshButton.addEventListener("click", async () => {
            await refreshAdminDashboard();
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

/* ==========================================================
   API
   ========================================================== */

async function fetchAdminProjects() {
    const response = await fetch(`${API_BASE_URL}/api/admin/projets`, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les projets admin.");
    }

    return Array.isArray(data) ? data : [];
}

async function fetchAdminClients() {
    const response = await fetch(`${API_BASE_URL}/api/admin/clients`, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les clients admin.");
    }

    return Array.isArray(data) ? data : [];
}

async function createAdminProject(payload) {
    const response = await fetch(`${API_BASE_URL}/api/admin/projets`, {
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
        throw new Error(data.error || "Impossible de créer le projet.");
    }

    return data.projet;
}

async function createAdminClient(payload) {
    const response = await fetch(`${API_BASE_URL}/api/admin/clients`, {
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
        throw new Error(data.error || "Impossible de créer le client.");
    }

    return data.client || data.user || data;
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

async function refreshAdminDashboard() {
    try {
        await loadAdminDashboardData();
        renderClientSelectOptions();
        renderAdminDashboard();
    } catch (error) {
        console.error("Erreur actualisation admin :", error);
        alert(error.message);
    }
}

/* ==========================================================
   RENDER
   ========================================================== */

function renderAdminDashboard() {
    renderAdminStats();
    renderAdminProjectsTable();
}

function renderAdminStats() {
    const projects = adminDashboardState.projects;

    const activeProjects = projects.filter((project) => project.status === "en_traitement");
    const completedProjects = projects.filter((project) => project.status === "finalise");
    const waitingProjects = projects.filter((project) => project.status === "en_attente");

    setText("#activeProjectsCount", activeProjects.length);
    setText("#completedProjectsCount", completedProjects.length);
    setText("#recentActivityCount", waitingProjects.length);
    setText("#documentsToReviewCount", 0);
}

function renderAdminProjectsTable() {
    const tableBody = document.querySelector("#adminProjectsTableBody");

    if (!tableBody) {
        return;
    }

    const projects = getFilteredProjects();

    tableBody.innerHTML = "";

    if (projects.length === 0) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td colspan="7" class="admin-empty-cell">
        Aucun projet à afficher.
      </td>
    `;

        tableBody.appendChild(tr);
        return;
    }

    projects.forEach((project) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>
        <strong class="admin-project-name">${escapeHtml(project.name)}</strong>
      </td>

      <td>
        ${escapeHtml(project.clients.join(", ") || "-")}
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
        return matchesProjectSearch(project) && matchesProjectStatusFilter(project);
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

    return project.status === filter;
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
   MODALE PROJET
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
            option.textContent = client.email;
            select.appendChild(option);
        });
}

function addExistingClientToProject() {
    const select = document.querySelector("#existingClientSelect");

    if (!select || !select.value) {
        alert("Sélectionne un client existant à associer.");
        return;
    }

    const client = adminDashboardState.availableClients.find((item) => {
        return item.id === Number(select.value);
    });

    if (!client) {
        return;
    }

    if (adminDashboardState.selectedClientsForProject.length >= 2) {
        alert("Un projet mariage doit être lié à 1 ou 2 clients maximum.");
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

async function addQuickClientToProject() {
    const email = getInputValue("#quickClientEmail").trim();
    const password = getInputValue("#quickClientPassword").trim();

    if (!email || !password) {
        alert("L’email et le mot de passe temporaire sont obligatoires pour créer un client.");
        return;
    }

    if (adminDashboardState.selectedClientsForProject.length >= 2) {
        alert("Un projet mariage doit être lié à 1 ou 2 clients maximum.");
        return;
    }

    const payload = {
        email,
        password,
    };

    try {
        const createdClient = await createAdminClient(payload);
        const mappedClient = mapApiClientToFrontClient(createdClient);

        adminDashboardState.availableClients.push(mappedClient);
        adminDashboardState.selectedClientsForProject.push(mappedClient);

        clearQuickClientFields();
        hideElement("#quickClientForm");

        renderClientSelectOptions();
        renderAssociatedClients();
    } catch (error) {
        console.error("Erreur création client rapide :", error);
        alert(error.message);
    }
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
      <span>${escapeHtml(client.email)}</span>
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

async function handleProjectFormSubmit(event) {
    event.preventDefault();

    const name = getInputValue("#projectName").trim();
    const weddingDate = getInputValue("#projectWeddingDate");
    const status = getInputValue("#projectStatus") || "en_attente";
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

    if (adminDashboardState.selectedClientsForProject.length > 2) {
        alert("Un projet mariage doit être lié à 1 ou 2 clients maximum.");
        return;
    }

    const payload = {
        nom: name,
        dateMariage: weddingDate,
        budget: budget ? Number(budget) : null,
        description: "",
        statut: status,
        commentaireAdmin: adminComment || null,
        clientIds: adminDashboardState.selectedClientsForProject.map((client) => client.id),
    };

    try {
        await createAdminProject(payload);
        closeProjectModal();
        await refreshAdminDashboard();
    } catch (error) {
        console.error("Erreur création projet :", error);
        alert(error.message);
    }
}

/* ==========================================================
   MAPPING
   ========================================================== */

function mapApiProjectToFrontProject(apiProject) {
    const clients = Array.isArray(apiProject.clients)
        ? apiProject.clients.map((client) => client.email || `Client #${client.id}`)
        : [];

    return {
        id: apiProject.id,
        name: apiProject.nom || "Projet mariage",
        clients,
        weddingDate: apiProject.dateMariage || "",
        status: apiProject.statut || "en_attente",
        budget: apiProject.budget ?? null,
        description: apiProject.description || "",
        adminComment: apiProject.commentaireAdmin || "",
        lastChange: buildProjectLastChange(apiProject),
        attention: buildProjectAttention(apiProject),
        attentionType: buildProjectAttentionType(apiProject),
        documentsToReview: 0,
        recentActivity: apiProject.statut === "en_attente",
    };
}

function mapApiClientToFrontClient(apiClient) {
    return {
        id: Number(apiClient.id),
        email: apiClient.email || "",
        roles: Array.isArray(apiClient.roles) ? apiClient.roles : [],
        projects: Array.isArray(apiClient.projetsMariage) ? apiClient.projetsMariage : [],
    };
}

function buildProjectLastChange(apiProject) {
    if (apiProject.commentaireAdmin) {
        return {
            type: "comment",
            label: "Commentaire admin",
            ago: "à jour",
        };
    }

    return {
        type: "project",
        label: "Projet enregistré",
        ago: "à jour",
    };
}

function buildProjectAttention(apiProject) {
    if (apiProject.statut === "en_attente") {
        return "À traiter";
    }

    if (apiProject.statut === "finalise") {
        return "Archivé";
    }

    return "RAS";
}

function buildProjectAttentionType(apiProject) {
    if (apiProject.statut === "en_attente") {
        return "COMMENT";
    }

    return "NONE";
}

/* ==========================================================
   HELPERS
   ========================================================== */

function clearQuickClientFields() {
    setInputValue("#quickClientFirstName", "");
    setInputValue("#quickClientLastName", "");
    setInputValue("#quickClientEmail", "");
    setInputValue("#quickClientPassword", "");
}

function getProjectStatusLabel(status) {
    const labels = {
        en_attente: "En attente",
        en_traitement: "En traitement",
        finalise: "Finalisé",
    };

    return labels[status] || status || "En attente";
}

function getProjectStatusClass(status) {
    const classes = {
        en_attente: "waiting",
        en_traitement: "active",
        finalise: "completed",
    };

    return classes[status] || "waiting";
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

    const normalized = String(dateString).replace(" ", "T");
    const date = new Date(normalized);

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
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}