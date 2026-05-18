document.addEventListener("DOMContentLoaded", () => {
    initAdminProjectDetailPage();
});

const projectDetailState = {
    currentProject: null,
    projects: [
        {
            id: 1,
            name: "Mariage Marie & Lucas",
            weddingDate: "2026-09-14",
            status: "ACTIVE",
            clients: ["Marie Dupont", "Lucas Martin"],
            adminNote: "Priorité sur le traiteur et les documents prestataires.",
            budget: {
                planned: 14000,
                rows: [
                    { id: 1, name: "Traiteur", planned: 4140, actual: 7000 },
                    { id: 2, name: "Salle", planned: 4000, actual: 6500 },
                    { id: 3, name: "Photographe", planned: 1000, actual: 1200 },
                ],
            },
            guests: [
                { id: 1, name: "Fanfan", status: "CONFIRMED", food: "Allergique poissons" },
                { id: 2, name: "Jaque", status: "REFUSED", food: "" },
                { id: 3, name: "Marie", status: "PENDING", food: "" },
                { id: 4, name: "Roger", status: "CONFIRMED", food: "" },
            ],
            tasks: [
                { id: 1, title: "Valider le devis traiteur", priority: "URGENT", status: "TODO" },
                { id: 2, title: "Confirmer les horaires de la salle", priority: "IMPORTANT", status: "IN_PROGRESS" },
                { id: 3, title: "Choisir les inspirations décoration", priority: "NORMAL", status: "DONE" },
            ],
            documents: [
                {
                    id: 1,
                    name: "devis-traiteur.pdf",
                    uploadedAgo: "il y a 2 h",
                    comment: "À comparer avec la formule cocktail.",
                    url: "/uploads/documents/devis-traiteur.pdf",
                },
                {
                    id: 2,
                    name: "inspiration-deco.jpg",
                    uploadedAgo: "il y a 6 h",
                    comment: "",
                    url: "/uploads/documents/inspiration-deco.jpg",
                },
            ],
            activities: [
                "Nouveau document déposé il y a 2 h",
                "Nouvelle dépense ajoutée il y a 1 jour",
                "Invité ajouté il y a 3 jours",
            ],
        },
        {
            id: 2,
            name: "Mariage clients test",
            weddingDate: "2026-07-02",
            status: "ACTIVE",
            clients: ["Client Test", "Conjoint Test"],
            adminNote: "Projet utilisé pour les tests de démonstration.",
            budget: {
                planned: 12500,
                rows: [
                    { id: 1, name: "Salle", planned: 4000, actual: 6500 },
                    { id: 2, name: "DJ", planned: 1000, actual: 2000 },
                ],
            },
            guests: [
                { id: 1, name: "Client invité 1", status: "CONFIRMED", food: "" },
                { id: 2, name: "Client invité 2", status: "PENDING", food: "Végétarien" },
            ],
            tasks: [
                { id: 1, title: "Valider la salle", priority: "IMPORTANT", status: "IN_PROGRESS" },
                { id: 2, title: "Déposer le contrat", priority: "URGENT", status: "TODO" },
            ],
            documents: [
                {
                    id: 3,
                    name: "contrat-salle.pdf",
                    uploadedAgo: "il y a 1 jour",
                    comment: "À vérifier : horaires de fin de soirée.",
                    url: "/uploads/documents/contrat-salle.pdf",
                },
            ],
            activities: [
                "Nouvelle dépense il y a 1 jour",
                "Contrat salle déposé il y a 1 jour",
            ],
        },
    ],
};

function initAdminProjectDetailPage() {
    const projectId = getProjectIdFromUrl();
    const project = findProjectById(projectId) || projectDetailState.projects[0];

    projectDetailState.currentProject = project;

    bindProjectDetailEvents();
    renderProjectDetail();
}

function bindProjectDetailEvents() {
    const toggleStatusButton = document.querySelector("#toggleProjectStatusButton");
    const closeButton = document.querySelector("#closeProjectDocumentModalButton");
    const cancelButton = document.querySelector("#cancelProjectDocumentButton");
    const backdrop = document.querySelector("#projectDocumentModalBackdrop");
    const form = document.querySelector("#projectDocumentCommentForm");

    if (toggleStatusButton) {
        toggleStatusButton.addEventListener("click", toggleProjectStatus);
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeDocumentModal);
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", closeDocumentModal);
    }

    if (backdrop) {
        backdrop.addEventListener("click", closeDocumentModal);
    }

    if (form) {
        form.addEventListener("submit", handleDocumentCommentSubmit);
    }
}

function renderProjectDetail() {
    const project = projectDetailState.currentProject;

    if (!project) {
        return;
    }

    setText("#adminProjectTitle", project.name);
    setText("#adminProjectSubtitle", `Clients associés : ${project.clients.join(", ")}`);
    setText("#projectWeddingDate", formatDate(project.weddingDate));
    setText("#projectClients", project.clients.join(", "));
    setText("#projectAdminNote", project.adminNote || "Aucune note admin.");

    renderProjectStatus();
    renderProjectStats();
    renderProjectActivity();
    renderProjectDocuments();
    renderProjectBudget();
    renderProjectGuests();
    renderProjectTasks();
}

function renderProjectStatus() {
    const project = projectDetailState.currentProject;
    const badge = document.querySelector("#projectStatusBadge");
    const toggleButton = document.querySelector("#toggleProjectStatusButton");

    if (!project || !badge) {
        return;
    }

    badge.textContent = project.status === "COMPLETED" ? "Terminé" : "En cours";
    badge.className = `admin-status-pill ${project.status === "COMPLETED" ? "completed" : "active"}`;

    if (toggleButton) {
        toggleButton.textContent = project.status === "COMPLETED" ? "Réouvrir le projet" : "Marquer terminé";
    }
}

function renderProjectStats() {
    const project = projectDetailState.currentProject;

    const planned = project.budget.planned;
    const used = getBudgetUsedTotal(project);
    const confirmedGuests = project.guests.filter((guest) => guest.status === "CONFIRMED").length;
    const documentsToReview = project.documents.filter((documentItem) => !hasDocumentComment(documentItem)).length;
    const tasksRemaining = project.tasks.filter((task) => task.status !== "DONE").length;

    setText("#projectBudgetPlanned", formatCurrency(planned));
    setText("#projectBudgetUsed", formatCurrency(used));
    setText("#projectGuestsConfirmed", confirmedGuests);
    setText("#projectDocumentsToReview", documentsToReview);
    setText("#projectTasksRemaining", tasksRemaining);
}

function renderProjectActivity() {
    const list = document.querySelector("#projectActivityList");
    const project = projectDetailState.currentProject;

    if (!list || !project) {
        return;
    }

    list.innerHTML = "";

    project.activities.forEach((activity) => {
        const li = document.createElement("li");
        li.textContent = activity;
        list.appendChild(li);
    });
}

function renderProjectDocuments() {
    const body = document.querySelector("#projectDocumentsBody");
    const project = projectDetailState.currentProject;

    if (!body || !project) {
        return;
    }

    body.innerHTML = "";

    project.documents.forEach((documentItem) => {
        const status = hasDocumentComment(documentItem) ? "Commenté" : "À vérifier";
        const statusClass = hasDocumentComment(documentItem) ? "commented" : "to-review";

        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>${escapeHtml(documentItem.name)}</td>
      <td>${escapeHtml(documentItem.uploadedAgo)}</td>
      <td>
        <span class="admin-document-status-pill ${statusClass}">
          ${status}
        </span>
      </td>
      <td>
        <button type="button" class="admin-project-small-button" data-document-id="${documentItem.id}">
          Commenter
        </button>
      </td>
    `;

        body.appendChild(tr);
    });

    bindDocumentCommentButtons();
}

function renderProjectBudget() {
    const body = document.querySelector("#projectBudgetBody");
    const project = projectDetailState.currentProject;

    if (!body || !project) {
        return;
    }

    body.innerHTML = "";

    project.budget.rows.forEach((row) => {
        const diff = Number(row.actual || 0) - Number(row.planned || 0);

        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>${escapeHtml(row.name)}</td>
      <td>${formatCurrency(row.planned)}</td>
      <td>${formatCurrency(row.actual)}</td>
      <td class="${diff > 0 ? "admin-project-negative" : "admin-project-positive"}">
        ${formatCurrency(diff)}
      </td>
    `;

        body.appendChild(tr);
    });
}

function renderProjectGuests() {
    const body = document.querySelector("#projectGuestsBody");
    const project = projectDetailState.currentProject;

    if (!body || !project) {
        return;
    }

    body.innerHTML = "";

    project.guests.forEach((guest) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>${escapeHtml(guest.name)}</td>
      <td>${getGuestStatusLabel(guest.status)}</td>
      <td>${escapeHtml(guest.food || "-")}</td>
    `;

        body.appendChild(tr);
    });
}

function renderProjectTasks() {
    const body = document.querySelector("#projectTasksBody");
    const project = projectDetailState.currentProject;

    if (!body || !project) {
        return;
    }

    body.innerHTML = "";

    project.tasks.forEach((task) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>${escapeHtml(task.title)}</td>
      <td>
        <span class="task-priority-pill ${getPriorityClass(task.priority)}">
          ${getPriorityLabel(task.priority)}
        </span>
      </td>
      <td>
        <span class="task-status-pill ${getStatusClass(task.status)}">
          ${getStatusLabel(task.status)}
        </span>
      </td>
    `;

        body.appendChild(tr);
    });
}

function bindDocumentCommentButtons() {
    const buttons = document.querySelectorAll("[data-document-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const documentId = Number(button.dataset.documentId);
            const documentItem = findDocumentById(documentId);

            if (documentItem) {
                openDocumentModal(documentItem);
            }
        });
    });
}

function openDocumentModal(documentItem) {
    const project = projectDetailState.currentProject;

    setInputValue("#projectDocumentId", documentItem.id);
    setText("#projectDocumentName", documentItem.name);
    setText("#projectDocumentProject", project.name);
    setInputValue("#projectDocumentComment", documentItem.comment || "");

    showElement("#projectDocumentModal");
}

function closeDocumentModal() {
    hideElement("#projectDocumentModal");
}

function handleDocumentCommentSubmit(event) {
    event.preventDefault();

    const documentId = Number(getInputValue("#projectDocumentId"));
    const comment = getInputValue("#projectDocumentComment").trim();
    const documentItem = findDocumentById(documentId);

    if (!documentItem) {
        return;
    }

    documentItem.comment = comment;

    closeDocumentModal();
    renderProjectDetail();

    /*
      À brancher plus tard :
      PATCH /api/admin/documents/{id}/commentaire
    */
}

function toggleProjectStatus() {
    const project = projectDetailState.currentProject;

    if (!project) {
        return;
    }

    project.status = project.status === "COMPLETED" ? "ACTIVE" : "COMPLETED";

    renderProjectStatus();

    /*
      À brancher plus tard :
      PATCH /api/admin/projets/{id}/status
    */
}

function getProjectIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));

    return Number.isNaN(id) ? null : id;
}

function findProjectById(id) {
    return projectDetailState.projects.find((project) => project.id === id);
}

function findDocumentById(id) {
    const project = projectDetailState.currentProject;

    if (!project) {
        return null;
    }

    return project.documents.find((documentItem) => documentItem.id === id);
}

function hasDocumentComment(documentItem) {
    return Boolean(documentItem.comment && documentItem.comment.trim() !== "");
}

function getBudgetUsedTotal(project) {
    return project.budget.rows.reduce((total, row) => {
        return total + Number(row.actual || 0);
    }, 0);
}

function getGuestStatusLabel(status) {
    const labels = {
        CONFIRMED: "Confirmé",
        REFUSED: "Refusé",
        PENDING: "En attente",
    };

    return labels[status] || "En attente";
}

function getPriorityLabel(priority) {
    const labels = {
        NORMAL: "Normal",
        IMPORTANT: "Important",
        URGENT: "Urgent",
    };

    return labels[priority] || "Normal";
}

function getPriorityClass(priority) {
    const classes = {
        NORMAL: "normal",
        IMPORTANT: "important",
        URGENT: "urgent",
    };

    return classes[priority] || "normal";
}

function getStatusLabel(status) {
    const labels = {
        TODO: "À faire",
        IN_PROGRESS: "En cours",
        DONE: "Terminée",
    };

    return labels[status] || "À faire";
}

function getStatusClass(status) {
    const classes = {
        TODO: "todo",
        IN_PROGRESS: "in-progress",
        DONE: "done",
    };

    return classes[status] || "todo";
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

function formatCurrency(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
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