document.addEventListener("DOMContentLoaded", () => {
    initClientDashboard();
});

const API_BASE_URL = "";

const dashboardState = {
    me: null,
    project: null,
    budget: null,
    guests: [],
    tasks: [],
    documents: [],
};

async function initClientDashboard() {
    try {
        await Promise.all([
            loadMe(),
            loadProjects(),
            loadBudget(),
            loadGuests(),
            loadTasks(),
            loadDocuments(),
        ]);

        renderDashboard(buildDashboardData());
    } catch (error) {
        console.error("Erreur tableau de bord :", error);
        renderDashboard(buildFallbackData());
    }
}

/* ==========================================================
   API
   ========================================================== */

async function loadMe() {
    const response = await fetch(`${API_BASE_URL}/api/client/me`, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(data.error || "Impossible de charger le profil client.");
    }

    dashboardState.me = data;
}

async function loadProjects() {
    const response = await fetch(`${API_BASE_URL}/api/client/projets`, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(data.error || "Impossible de charger le projet.");
    }

    dashboardState.project = Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function loadBudget() {
    const response = await fetch(`${API_BASE_URL}/api/client/budget`, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(data.error || "Impossible de charger le budget.");
    }

    dashboardState.budget = Array.isArray(data) && data.length > 0 ? data[0] : null;
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

    dashboardState.guests = Array.isArray(data) ? data : [];
}

async function loadTasks() {
    const response = await fetch(`${API_BASE_URL}/api/client/taches`, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les tâches.");
    }

    dashboardState.tasks = Array.isArray(data) ? data : [];
}

async function loadDocuments() {
    const response = await fetch(`${API_BASE_URL}/api/client/documents`, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les documents.");
    }

    dashboardState.documents = Array.isArray(data) ? data : [];
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
   CONSTRUCTION DONNÉES DASHBOARD
   ========================================================== */

function buildDashboardData() {
    const budget = dashboardState.budget;
    const project = dashboardState.project;

    const tasksRemaining = dashboardState.tasks.filter((task) => {
        return task.statut !== "terminee";
    }).length;

    const confirmedGuests = dashboardState.guests.filter((guest) => {
        return guest.statut === "confirme";
    }).length;

    const documentsCount = dashboardState.documents.length;

    const budgetAmount = budget
        ? `${formatCurrency(budget.montantDepense)} / ${formatCurrency(budget.montantPrevu)}`
        : "0 €";

    return {
        projectName: project?.nom || "Projet mariage",
        projectDate: project?.dateMariage || null,
        projectStatus: project?.statut || "-",
        tasksCount: tasksRemaining,
        budgetAmount,
        guestsCount: confirmedGuests,
        documentsCount,
        nextSteps: buildNextSteps(),
        comments: buildDocumentComments(),
    };
}

function buildNextSteps() {
    const pendingTasks = dashboardState.tasks.filter((task) => {
        return task.statut !== "terminee";
    });

    if (pendingTasks.length === 0) {
        return [
            {
                label: "Aucune tâche restante",
                status: "OK",
            },
        ];
    }

    return pendingTasks.slice(0, 3).map((task) => {
        return {
            label: task.titre || "Tâche sans titre",
            status: formatTaskStatus(task.statut),
        };
    });
}

function buildDocumentComments() {
    if (dashboardState.documents.length === 0) {
        return [
            {
                label: "Aucun document déposé",
                status: "-",
            },
        ];
    }

    return dashboardState.documents.slice(0, 3).map((documentItem) => {
        return {
            label: documentItem.nomOriginal || documentItem.nomFichier || "Document",
            status: documentItem.commentaireAdmin ? "Commenté" : "Déposé",
        };
    });
}

function buildFallbackData() {
    return {
        projectName: "Projet mariage",
        projectDate: null,
        projectStatus: "-",
        tasksCount: 0,
        budgetAmount: "0 €",
        guestsCount: 0,
        documentsCount: 0,
        nextSteps: [
            {
                label: "Impossible de charger les données",
                status: "Erreur",
            },
        ],
        comments: [
            {
                label: "Vérifie la connexion client",
                status: "Info",
            },
        ],
    };
}

/* ==========================================================
   RENDU
   ========================================================== */

function renderDashboard(data) {
    setText("#tasksCount", data.tasksCount);
    setText("#budgetAmount", data.budgetAmount);
    setText("#guestsCount", data.guestsCount);

    setText("#projectName", data.projectName);
    setText("#projectDate", formatDate(data.projectDate));
    setText("#projectStatus", formatProjectStatus(data.projectStatus));
    setText("#documentsCount", data.documentsCount);

    renderList("#nextStepsList", data.nextSteps);
    renderList("#commentsList", data.comments);
}

function renderList(selector, items) {
    const list = document.querySelector(selector);

    if (!list) {
        return;
    }

    list.innerHTML = "";

    items.forEach((item) => {
        const li = document.createElement("li");

        const label = document.createElement("span");
        label.textContent = item.label;

        const status = document.createElement("span");
        status.className = "status-pill";
        status.textContent = item.status;

        li.appendChild(label);
        li.appendChild(status);

        list.appendChild(li);
    });
}

/* ==========================================================
   HELPERS
   ========================================================== */

function setText(selector, value) {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.textContent = value;
}

function formatCurrency(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function formatTaskStatus(status) {
    const statuses = {
        a_faire: "À faire",
        terminee: "Terminée",
    };

    return statuses[status] || "À faire";
}

function formatProjectStatus(status) {
    const statuses = {
        en_traitement: "En traitement",
        termine: "Terminé",
        en_attente: "En attente",
    };

    return statuses[status] || status || "-";
}