document.addEventListener("DOMContentLoaded", () => {
    initTasksPage();
});

const tasksState = {
    search: "",
    statusFilter: "ALL",
    priorityFilter: "ALL",
    tasks: [
        {
            id: 1,
            title: "Valider le devis traiteur",
            dueDate: "2026-05-18",
            priority: "URGENT",
            status: "TODO",
            comment: "Comparer avec la formule cocktail.",
        },
        {
            id: 2,
            title: "Confirmer les horaires de la salle",
            dueDate: "2026-05-24",
            priority: "IMPORTANT",
            status: "IN_PROGRESS",
            comment: "Attente du retour du prestataire.",
        },
        {
            id: 3,
            title: "Finaliser le plan de table",
            dueDate: "2026-06-02",
            priority: "IMPORTANT",
            status: "TODO",
            comment: "",
        },
        {
            id: 4,
            title: "Envoyer les informations au photographe",
            dueDate: "2026-06-08",
            priority: "NORMAL",
            status: "TODO",
            comment: "",
        },
        {
            id: 5,
            title: "Choisir les inspirations décoration",
            dueDate: "2026-05-30",
            priority: "NORMAL",
            status: "DONE",
            comment: "Première sélection envoyée.",
        },
    ],
};

function initTasksPage() {
    bindTasksEvents();
    renderTasksPage();
}

function bindTasksEvents() {
    const searchInput = document.querySelector("#taskSearchInput");
    const statusFilter = document.querySelector("#taskStatusFilter");
    const priorityFilter = document.querySelector("#taskPriorityFilter");

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

    if (priorityFilter) {
        priorityFilter.addEventListener("change", () => {
            tasksState.priorityFilter = priorityFilter.value;
            renderTasksTable();
        });
    }

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

function renderTasksPage() {
    renderTasksStats();
    renderTasksTable();
}

function renderTasksStats() {
    const tasks = tasksState.tasks;

    const total = tasks.length;
    const todo = tasks.filter((task) => task.status === "TODO").length;
    const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
    const done = tasks.filter((task) => task.status === "DONE").length;

    setText("#tasksTotalCount", total);
    setText("#tasksTodoCount", todo);
    setText("#tasksInProgressCount", inProgress);
    setText("#tasksDoneCount", done);
}

function renderTasksTable() {
    const tableBody = document.querySelector("#tasksTableBody");

    if (!tableBody) {
        return;
    }

    const tasks = getFilteredTasks();

    tableBody.innerHTML = "";

    tasks.forEach((task) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>
        <strong class="task-title-cell">${escapeHtml(task.title)}</strong>
      </td>

      <td>${escapeHtml(formatDate(task.dueDate))}</td>

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
            matchesTaskStatusFilter(task) &&
            matchesTaskPriorityFilter(task)
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

function matchesTaskPriorityFilter(task) {
    if (tasksState.priorityFilter === "ALL") {
        return true;
    }

    return task.priority === tasksState.priorityFilter;
}

function bindTaskRowActions() {
    const buttons = document.querySelectorAll("[data-task-action][data-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const action = button.dataset.taskAction;

            if (action === "done") {
                markTaskAsDone(id);
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
                deleteTask(id);
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
    setInputValue("#taskDueDate", task ? task.dueDate : "");
    setInputValue("#taskPriority", task ? task.priority : "NORMAL");
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

function handleTaskFormSubmit(event) {
    event.preventDefault();

    const id = getInputValue("#taskId");
    const title = getInputValue("#taskTitle").trim();
    const dueDate = getInputValue("#taskDueDate");
    const priority = getInputValue("#taskPriority");
    const status = getInputValue("#taskStatus");
    const comment = getInputValue("#taskComment").trim();

    if (!title) {
        alert("Le titre de la tâche est obligatoire.");
        return;
    }

    if (id) {
        const task = findTaskById(Number(id));

        if (task) {
            task.title = title;
            task.dueDate = dueDate;
            task.priority = priority;
            task.status = status;
            task.comment = comment;
        }
    } else {
        tasksState.tasks.push({
            id: getNextTaskId(),
            title,
            dueDate,
            priority,
            status,
            comment,
        });
    }

    closeTaskModal();
    renderTasksPage();

    /*
      À brancher plus tard :
      POST   /api/client/taches
      PATCH  /api/client/taches/{id}
    */
}

function markTaskAsDone(id) {
    const task = findTaskById(id);

    if (!task) {
        return;
    }

    task.status = "DONE";
    renderTasksPage();

    /*
      À brancher plus tard :
      PATCH /api/client/taches/{id}
      Body : { statut: "DONE" }
    */
}

function deleteTask(id) {
    const confirmed = window.confirm("Supprimer cette tâche ?");

    if (!confirmed) {
        return;
    }

    tasksState.tasks = tasksState.tasks.filter((task) => task.id !== id);
    renderTasksPage();

    /*
      À brancher plus tard :
      DELETE /api/client/taches/{id}
    */
}

function findTaskById(id) {
    return tasksState.tasks.find((task) => task.id === id);
}

function getNextTaskId() {
    if (tasksState.tasks.length === 0) {
        return 1;
    }

    return Math.max(...tasksState.tasks.map((task) => task.id)) + 1;
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