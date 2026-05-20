document.addEventListener("DOMContentLoaded", () => {
    initClientBudgetPage();
});

const API_BASE_URL = "";

const budgetState = {
    currentProjectId: null,
    currentProjectName: "",
    budget: null,
    expenses: [],
    comment: "",
};

async function initClientBudgetPage() {
    bindBudgetEvents();

    try {
        await loadCurrentProject();
        await loadBudget();
        renderBudgetPage();
    } catch (error) {
        console.error("Erreur initialisation budget :", error);
        alert("Impossible de charger le budget. Vérifie que tu es connecté.");
    }
}

function bindBudgetEvents() {
    const plannedInput = document.querySelector("#budgetPlannedInput");
    const commentInput = document.querySelector("#budgetCommentInput");
    const addButton = document.querySelector("#addBudgetExpenseButton");
    const submitButton = document.querySelector("#budgetSubmitButton");

    if (plannedInput) {
        plannedInput.addEventListener("input", () => {
            renderBudgetSummary();
            renderExpensesTable();
        });
    }

    if (commentInput) {
        commentInput.addEventListener("input", () => {
            budgetState.comment = commentInput.value.trim();
        });
    }

    if (addButton) {
        addButton.addEventListener("click", addExpenseRow);
    }

    if (submitButton) {
        submitButton.addEventListener("click", handleBudgetSubmit);
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

    budgetState.currentProjectId = data[0].id;
    budgetState.currentProjectName = data[0].nom || "Projet mariage";
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

    budgetState.budget = Array.isArray(data) && data.length > 0
        ? mapApiBudgetToFrontBudget(data[0])
        : null;

    hydrateBudgetStateFromBudget();
}

async function createBudget(payload) {
    const response = await fetch(`${API_BASE_URL}/api/client/budget`, {
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
        throw new Error(data.error || "Impossible de créer le budget.");
    }

    return data.budget;
}

async function updateBudget(id, payload) {
    const response = await fetch(`${API_BASE_URL}/api/client/budget/${id}`, {
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
        throw new Error(data.error || "Impossible de modifier le budget.");
    }

    return data.budget;
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
   INITIALISATION DONNÉES
   ========================================================== */

function hydrateBudgetStateFromBudget() {
    const budget = budgetState.budget;

    if (!budget) {
        budgetState.expenses = [];
        budgetState.comment = "";
        return;
    }

    const parsedNotes = parseBudgetNotes(budget.notes);

    budgetState.expenses = parsedNotes.expenses;
    budgetState.comment = parsedNotes.comment;
}

function parseBudgetNotes(notes) {
    if (!notes) {
        return {
            comment: "",
            expenses: [],
        };
    }

    try {
        const parsed = JSON.parse(notes);

        if (parsed && Array.isArray(parsed.expenses)) {
            return {
                comment: parsed.comment || "",
                expenses: parsed.expenses.map(normalizeExpense),
            };
        }
    } catch (error) {
        return {
            comment: notes,
            expenses: [],
        };
    }

    return {
        comment: "",
        expenses: [],
    };
}

function normalizeExpense(expense) {
    return {
        id: expense.id || createLocalId(),
        name: expense.name || "",
        amount: Number(expense.amount || 0),
    };
}

/* ==========================================================
   RENDU
   ========================================================== */

function renderBudgetPage() {
    renderBudgetForm();
    renderBudgetSummary();
    renderExpensesTable();
}

function renderBudgetForm() {
    const budget = budgetState.budget;

    setText("#budgetProjectName", budgetState.currentProjectName || "-");
    setInputValue("#budgetPlannedInput", budget ? budget.montantPrevu : "");
    setInputValue("#budgetCommentInput", budgetState.comment || "");
}

function renderBudgetSummary() {
    const planned = getCurrentPlannedAmount();
    const spent = getExpensesTotal();
    const remaining = planned - spent;

    setText("#budgetTotalAmount", formatCurrency(planned));
    setText("#budgetSpentAmount", formatCurrency(spent));
    setText("#budgetRemainingAmount", formatCurrency(remaining));
}

function renderExpensesTable() {
    const tableBody = document.querySelector("#budgetExpensesTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (budgetState.expenses.length === 0) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td colspan="4" class="budget-empty-cell">
        Aucune dépense ajoutée pour le moment.
      </td>
    `;

        tableBody.appendChild(tr);
        return;
    }

    budgetState.expenses.forEach((expense) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>
        <input
          class="budget-expense-input"
          type="text"
          value="${escapeAttribute(expense.name)}"
          placeholder="Ex : Traiteur"
          data-expense-field="name"
          data-expense-id="${expense.id}"
        />
      </td>

      <td>
        <input
          class="budget-expense-input"
          type="number"
          min="0"
          step="1"
          value="${escapeAttribute(expense.amount)}"
          placeholder="Ex : 7000"
          data-expense-field="amount"
          data-expense-id="${expense.id}"
        />
      </td>

      <td>
        <strong data-expense-percent="${expense.id}">
        ${escapeHtml(formatExpensePercent(expense.amount))}
        </strong>
      </td>

      <td>
        <button
          type="button"
          class="budget-delete-button"
          data-expense-delete="${expense.id}"
        >
          Supprimer
        </button>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    bindExpenseInputs();
    bindDeleteExpenseButtons();
}

function bindExpenseInputs() {
    const inputs = document.querySelectorAll("[data-expense-field][data-expense-id]");

    inputs.forEach((input) => {
        input.addEventListener("input", () => {
            const id = input.dataset.expenseId;
            const field = input.dataset.expenseField;
            const expense = findExpenseById(id);

            if (!expense) {
                return;
            }

            if (field === "name") {
                expense.name = input.value;
            }

            if (field === "amount") {
                expense.amount = Number(input.value || 0);

                const percentCell = document.querySelector(`[data-expense-percent="${id}"]`);

                if (percentCell) {
                    percentCell.textContent = formatExpensePercent(expense.amount);
                }
            }

            renderBudgetSummary();
        });
    });
}

function bindDeleteExpenseButtons() {
    const buttons = document.querySelectorAll("[data-expense-delete]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = button.dataset.expenseDelete;
            budgetState.expenses = budgetState.expenses.filter((expense) => {
                return String(expense.id) !== String(id);
            });

            renderBudgetSummary();
            renderExpensesTable();
        });
    });
}

/* ==========================================================
   ACTIONS
   ========================================================== */

function addExpenseRow() {
    budgetState.expenses.push({
        id: createLocalId(),
        name: "",
        amount: 0,
    });

    renderExpensesTable();
}

async function handleBudgetSubmit() {
    const planned = getCurrentPlannedAmount();
    const spent = getExpensesTotal();
    const notesPayload = buildBudgetNotesPayload();

    if (planned < 0) {
        showBudgetMessage("Le budget prévu doit être positif.", "error");
        return;
    }

    if (!budgetState.currentProjectId) {
        showBudgetMessage("Aucun projet mariage associé.", "error");
        return;
    }

    const payload = {
        montantPrevu: planned,
        montantDepense: spent,
        notes: JSON.stringify(notesPayload),
        projetMariageId: budgetState.currentProjectId,
    };

    try {
        if (budgetState.budget) {
            await updateBudget(budgetState.budget.id, payload);
            showBudgetMessage("Budget enregistré avec succès.", "success");
        } else {
            await createBudget(payload);
            showBudgetMessage("Budget créé avec succès.", "success");
        }

        await loadBudget();
        renderBudgetPage();
    } catch (error) {
        console.error("Erreur sauvegarde budget :", error);
        showBudgetMessage(error.message, "error");
    }
}

function buildBudgetNotesPayload() {
    const commentInput = document.querySelector("#budgetCommentInput");

    return {
        comment: commentInput ? commentInput.value.trim() : budgetState.comment,
        expenses: budgetState.expenses
            .filter((expense) => expense.name.trim() !== "" || Number(expense.amount) > 0)
            .map((expense) => ({
                id: expense.id,
                name: expense.name.trim(),
                amount: Number(expense.amount || 0),
            })),
    };
}

/* ==========================================================
   MAPPING
   ========================================================== */

function mapApiBudgetToFrontBudget(apiBudget) {
    return {
        id: apiBudget.id,
        montantPrevu: Number(apiBudget.montantPrevu || 0),
        montantDepense: Number(apiBudget.montantDepense || 0),
        ecart: Number(apiBudget.ecart || 0),
        notes: apiBudget.notes || "",
        commentaireAdmin: apiBudget.commentaireAdmin || "",
        projectId: apiBudget.projetMariage?.id || null,
        projectName: apiBudget.projetMariage?.nom || "",
    };
}

/* ==========================================================
   HELPERS
   ========================================================== */

function getCurrentPlannedAmount() {
    return Number(getInputValue("#budgetPlannedInput") || 0);
}

function getExpensesTotal() {
    return budgetState.expenses.reduce((total, expense) => {
        return total + Number(expense.amount || 0);
    }, 0);
}

function formatExpensePercent(amount) {
    const planned = getCurrentPlannedAmount();

    if (!planned) {
        return "0 %";
    }

    const percent = (Number(amount || 0) / planned) * 100;

    return `${Math.round(percent)} %`;
}

function findExpenseById(id) {
    return budgetState.expenses.find((expense) => {
        return String(expense.id) === String(id);
    });
}

function createLocalId() {
    return `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function showBudgetMessage(text, type) {
    const message = document.querySelector("#budgetMessage");

    if (!message) {
        return;
    }

    message.textContent = text;
    message.className = `budget-message ${type}`;

    window.setTimeout(() => {
        message.textContent = "";
        message.className = "budget-message";
    }, 3500);
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

function escapeAttribute(value) {
    return escapeHtml(value);
}