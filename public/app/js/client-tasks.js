document.addEventListener("DOMContentLoaded", () => {
    initTasksPage();
});

const API_BASE_URL = "";

const tasksState = {
    search: "",
    statusFilter: "ALL",
    currentProjectId: null,
    tasks: [],
};

async function initTasksPage() {
    bindTasksEvents();

    try {
        await loadCurrentProject();
        await loadTasks();
        renderTasksPage();
    } catch (error) {
        console.error("Erreur initialisation tâches :", error);
        alert("Impossible de charger les tâches. Vérifie que tu es connecté.");
    }
}

function bindTasksEvents() {
    const searchInput = document.querySelector("#taskSearchInput");
    const statusFilter = document.querySelector("#taskStatusFilter");
    // const priorityFilter = document.querySelector("#taskPriorityFilter");

    const openAddButton = document.querySelector("#openAddTaskButton");
    const closeButton = document.querySelector("#closeTaskModalButton");
    const cancelButton = document.querySelector("#cancelTaskButton");
    const backdrop = document.querySelector("#taskModalBackdrop");
    const form = document.querySelector("#taskForm");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            tasksState.search = searchInput.value.trim().toLowerCase();
            renderTasksTable();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            tasksState.statusFilter = statusFilter.value;
            renderTasksTable();
        });
    }

    // if (priorityFilter) {
    //     priorityFilter.addEventListener("change", () => {
    //         tasksState.priorityFilter = priorityFilter.value;
    //         renderTasksTable();
    //     });
    // }

    if (openAddButton) {
        openAddButton.addEventListener("click", () => {
            openTaskModal();
        });
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeTaskModal);
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", closeTaskModal);
    }

    if (backdrop) {
        backdrop.addEventListener("click", closeTaskModal);
    }

    if (form) {
        form.addEventListener("submit", handleTaskFormSubmit);
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

    tasksState.currentProjectId = data[0].id;
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

    tasksState.tasks = Array.isArray(data) ? data.map(mapApiTaskToFrontTask) : [];
}

async function createTask(payload) {
    const response = await fetch(`${API_BASE_URL}/api/client/taches`, {
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
        throw new Error(data.error || "Impossible de créer la tâche.");
    }

    return data.tache;
}

async function updateTask(id, payload) {
    const response = await fetch(`${API_BASE_URL}/api/client/taches/${id}`, {
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
        throw new Error(data.error || "Impossible de modifier la tâche.");
    }

    return data.tache;
}

async function deleteTaskApi(id) {
    const response = await fetch(`${API_BASE_URL}/api/client/taches/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || data.success === false) {
        throw new Error(data.error || "Impossible de supprimer la tâche.");
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

function renderTasksPage() {
    renderTasksStats();
    renderTasksTable();
}

function renderTasksStats() {
    const tasks = tasksState.tasks;

    const total = tasks.length;
    const todo = tasks.filter((task) => task.status === "TODO").length;
    const done = tasks.filter((task) => task.status === "DONE").length;
    const remaining = tasks.filter((task) => task.status !== "DONE").length;

    setText("#tasksTotalCount", total);
    setText("#tasksTodoCount", todo);
    setText("#tasksRemainingCount", remaining);
    setText("#tasksDoneCount", done);
}

function renderTasksTable() {
    const tableBody = document.querySelector("#tasksTableBody");

    if (!tableBody) {
        return;
    }

    const tasks = getFilteredTasks();

    tableBody.innerHTML = "";

    if (tasks.length === 0) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td colspan="5" class="tasks-empty-cell">
        Aucune tâche à afficher.
      </td>
    `;

        tableBody.appendChild(tr);
        renderTasksStats();
        return;
    }

    tasks.forEach((task) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>
        <strong class="task-title-cell">${escapeHtml(task.title)}</strong>
      </td>

      <td>${escapeHtml(formatDate(task.dueDate))}</td>

      <td>
        <span class="task-status-pill ${getStatusClass(task.status)}">
          ${getStatusLabel(task.status)}
        </span>
      </td>

      <td class="task-comment-cell">
        ${escapeHtml(task.comment || "Aucun commentaire")}
      </td>

      <td>
        <div class="task-row-actions">
          <button type="button" data-task-action="done" data-id="${task.id}">Terminer</button>
          <button type="button" data-task-action="edit" data-id="${task.id}">Modifier</button>
          <button type="button" data-task-action="delete" data-id="${task.id}">Supprimer</button>
        </div>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    bindTaskRowActions();
    renderTasksStats();
}

function getFilteredTasks() {
    return tasksState.tasks.filter((task) => {
        return (
            matchesTaskSearch(task) &&
            matchesTaskStatusFilter(task)
        );
    });
}

function matchesTaskSearch(task) {
    if (!tasksState.search) {
        return true;
    }

    const haystack = [
        task.title,
        task.dueDate,
        task.priority,
        task.status,
        task.comment,
        getPriorityLabel(task.priority),
        getStatusLabel(task.status),
    ]
        .join(" ")
        .toLowerCase();

    return haystack.includes(tasksState.search);
}

function matchesTaskStatusFilter(task) {
    if (tasksState.statusFilter === "ALL") {
        return true;
    }

    return task.status === tasksState.statusFilter;
}


/* ==========================================================
   ACTIONS
   ========================================================== */

function bindTaskRowActions() {
    const buttons = document.querySelectorAll("[data-task-action][data-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", async () => {
            const id = Number(button.dataset.id);
            const action = button.dataset.taskAction;

            if (action === "done") {
                await markTaskAsDone(id);
                return;
            }

            if (action === "edit") {
                const task = findTaskById(id);

                if (task) {
                    openTaskModal(task);
                }

                return;
            }

            if (action === "delete") {
                await deleteTask(id);
            }
        });
    });
}

function openTaskModal(task = null) {
    const modal = document.querySelector("#taskModal");
    const title = document.querySelector("#taskModalTitle");

    if (!modal) {
        return;
    }

    setInputValue("#taskId", task ? task.id : "");
    setInputValue("#taskTitle", task ? task.title : "");
    setInputValue("#taskDueDate", task ? normalizeDateInputValue(task.dueDate) : "");
    setInputValue("#taskStatus", task ? task.status : "TODO");
    setInputValue("#taskComment", task ? task.comment : "");

    if (title) {
        title.textContent = task ? "Modifier une tâche" : "Ajouter une tâche";
    }

    modal.classList.remove("hidden");
}

function closeTaskModal() {
    const modal = document.querySelector("#taskModal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
}

async function handleTaskFormSubmit(event) {
    event.preventDefault();

    const id = getInputValue("#taskId");
    const title = getInputValue("#taskTitle").trim();
    const dueDate = getInputValue("#taskDueDate");
    const status = getInputValue("#taskStatus");
    const comment = getInputValue("#taskComment").trim();

    if (!title) {
        alert("Le titre de la tâche est obligatoire.");
        return;
    }

    if (!tasksState.currentProjectId) {
        alert("Aucun projet mariage trouvé pour créer la tâche.");
        return;
    }

    const payload = {
        titre: title,
        description: comment || null,
        statut: mapFrontStatusToApi(status),
        dateEcheance: dueDate || null,
        projetMariageId: tasksState.currentProjectId,
    };

    try {
        if (id) {
            await updateTask(Number(id), payload);
        } else {
            await createTask(payload);
        }

        closeTaskModal();
        await loadTasks();
        renderTasksPage();
    } catch (error) {
        console.error("Erreur enregistrement tâche :", error);
        alert(error.message);
    }
}

async function markTaskAsDone(id) {
    const task = findTaskById(id);

    if (!task) {
        return;
    }

    const payload = {
        titre: task.title,
        description: task.comment || null,
        statut: "terminee",
        dateEcheance: normalizeDateInputValue(task.dueDate) || null,
        projetMariageId: tasksState.currentProjectId,
    };

    try {
        await updateTask(id, payload);
        await loadTasks();
        renderTasksPage();
    } catch (error) {
        console.error("Erreur changement statut tâche :", error);
        alert(error.message);
    }
}

async function deleteTask(id) {
    const confirmed = window.confirm("Supprimer cette tâche ?");

    if (!confirmed) {
        return;
    }

    try {
        await deleteTaskApi(id);
        await loadTasks();
        renderTasksPage();
    } catch (error) {
        console.error("Erreur suppression tâche :", error);
        alert(error.message);
    }
}

/* ==========================================================
   MAPPING API ↔ FRONT
   ========================================================== */

function mapApiTaskToFrontTask(apiTask) {
    return {
        id: apiTask.id,
        title: apiTask.titre || "",
        dueDate: apiTask.dateEcheance || "",
        status: mapApiStatusToFront(apiTask.statut),
        comment: apiTask.description || "",
        commentaireAdmin: apiTask.commentaireAdmin || null,
    };
}

function mapFrontStatusToApi(status) {
    const statuses = {
        TODO: "a_faire",
        DONE: "terminee",
    };

    return statuses[status] || "a_faire";
}

function mapApiStatusToFront(status) {
    const statuses = {
        a_faire: "TODO",
        terminee: "DONE",
    };

    return statuses[status] || "TODO";
}

/* ==========================================================
   HELPERS
   ========================================================== */

function findTaskById(id) {
    return tasksState.tasks.find((task) => task.id === id);
}

function getStatusLabel(status) {
    const labels = {
        TODO: "À faire",
        DONE: "Terminée",
    };

    return labels[status] || "À faire";
}

function getStatusClass(status) {
    const classes = {
        TODO: "todo",
        DONE: "done",
    };

    return classes[status] || "todo";
}

function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    const normalized = normalizeDateInputValue(dateString);

    if (!normalized) {
        return "-";
    }

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

function normalizeDateInputValue(dateString) {
    if (!dateString) {
        return "";
    }

    return String(dateString).slice(0, 10);
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