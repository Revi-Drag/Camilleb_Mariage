document.addEventListener("DOMContentLoaded", () => {
    initBudgetPage();
});

const budgetState = {
    totalBudget: 14000,
    rows: [
        {
            id: 1,
            name: "Traiteur",
            planned: 4140,
            actual: 7000,
            comment: "Voir à changer de traiteur ou de formule",
        },
        {
            id: 2,
            name: "Salle",
            planned: 4000,
            actual: 6500,
            comment: "",
        },
        {
            id: 3,
            name: "DJ",
            planned: 1000,
            actual: 2000,
            comment: "",
        },
        {
            id: 4,
            name: "Photographe",
            planned: 1000,
            actual: 2500,
            comment: "",
        },
        {
            id: 5,
            name: "Alliances",
            planned: 1200,
            actual: 2000,
            comment: "",
        },
        {
            id: 6,
            name: "Tenues",
            planned: 2000,
            actual: 2500,
            comment: "",
        },
        {
            id: 7,
            name: "Maquillage",
            planned: 200,
            actual: 300,
            comment: "",
        },
        {
            id: 8,
            name: "Coiffeur",
            planned: 100,
            actual: 250,
            comment: "",
        },
        {
            id: 9,
            name: "Déco",
            planned: 150,
            actual: 400,
            comment: "",
        },
    ],
};

function initBudgetPage() {
    bindBudgetEvents();
    renderBudgetPage();
}

function bindBudgetEvents() {
    const openAddButton = document.querySelector("#openAddExpenseButton");
    const closeButton = document.querySelector("#closeBudgetModalButton");
    const cancelButton = document.querySelector("#cancelBudgetButton");
    const backdrop = document.querySelector("#budgetModalBackdrop");
    const form = document.querySelector("#budgetForm");

    const plannedInput = document.querySelector("#expensePlanned");
    const actualInput = document.querySelector("#expenseActual");

    if (openAddButton) {
        openAddButton.addEventListener("click", () => {
            openBudgetModal();
        });
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeBudgetModal);
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", closeBudgetModal);
    }

    if (backdrop) {
        backdrop.addEventListener("click", closeBudgetModal);
    }

    if (form) {
        form.addEventListener("submit", handleBudgetFormSubmit);
    }

    if (plannedInput) {
        plannedInput.addEventListener("input", updateExpensePreview);
    }

    if (actualInput) {
        actualInput.addEventListener("input", updateExpensePreview);
    }
}

function renderBudgetPage() {
    renderBudgetSummary();
    renderBudgetRows();
}

function renderBudgetSummary() {
    const totalBudget = budgetState.totalBudget;
    const usedBudget = getUsedBudgetTotal();
    const remaining = totalBudget - usedBudget;

    setText("#budgetTotal", formatCurrency(totalBudget));
    setText("#budgetRemaining", formatCurrency(remaining));

    const remainingElement = document.querySelector("#budgetRemaining");

    if (remainingElement) {
        remainingElement.classList.toggle("negative-budget", remaining < 0);
    }
}

function renderBudgetRows() {
    const tableBody = document.querySelector("#budgetTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    budgetState.rows.forEach((row) => {
        const difference = calculateDifference(row);
        const percentage = calculateBudgetPercentage(row);

        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>${escapeHtml(row.name)}</td>
      <td>${formatCurrency(row.planned)}</td>
      <td>${row.actual === null || row.actual === "" ? "-" : formatCurrency(row.actual)}</td>
      <td class="${difference > 0 ? "budget-over" : difference < 0 ? "budget-under" : ""}">
        ${formatCurrency(difference)}
      </td>
      <td>${percentage} %</td>
      <td>${escapeHtml(row.comment || "")}</td>
      <td>
        <div class="budget-row-actions">
          <button type="button" data-budget-action="edit" data-id="${row.id}">Modifier</button>
          <button type="button" data-budget-action="delete" data-id="${row.id}">Supprimer</button>
        </div>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    bindBudgetRowActions();
}

function bindBudgetRowActions() {
    const buttons = document.querySelectorAll("[data-budget-action][data-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const action = button.dataset.budgetAction;

            if (action === "edit") {
                const row = findBudgetRowById(id);

                if (row) {
                    openBudgetModal(row);
                }

                return;
            }

            if (action === "delete") {
                deleteBudgetRow(id);
            }
        });
    });
}

function openBudgetModal(row = null) {
    const modal = document.querySelector("#budgetModal");
    const title = document.querySelector("#budgetModalTitle");

    if (!modal) {
        return;
    }

    setInputValue("#expenseId", row ? row.id : "");
    setInputValue("#expenseName", row ? row.name : "");
    setInputValue("#expensePlanned", row ? row.planned : "");
    setInputValue("#expenseActual", row && row.actual !== null ? row.actual : "");
    setInputValue("#expenseComment", row ? row.comment : "");

    if (title) {
        title.textContent = row ? "Modifier une dépense" : "Ajouter une dépense";
    }

    updateExpensePreview();
    modal.classList.remove("hidden");
}

function closeBudgetModal() {
    const modal = document.querySelector("#budgetModal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
}

function handleBudgetFormSubmit(event) {
    event.preventDefault();

    const id = getInputValue("#expenseId");
    const name = getInputValue("#expenseName").trim();
    const planned = parseAmount(getInputValue("#expensePlanned"));
    const actualRaw = getInputValue("#expenseActual");
    const actual = actualRaw === "" ? null : parseAmount(actualRaw);
    const comment = getInputValue("#expenseComment").trim();

    if (!name) {
        alert("Le nom de la dépense est obligatoire.");
        return;
    }

    if (planned === null || planned < 0) {
        alert("Le montant prévu est obligatoire et doit être positif.");
        return;
    }

    if (actual !== null && actual < 0) {
        alert("Le montant réel doit être positif.");
        return;
    }

    if (id) {
        const row = findBudgetRowById(Number(id));

        if (row) {
            row.name = name;
            row.planned = planned;
            row.actual = actual;
            row.comment = comment;
        }
    } else {
        budgetState.rows.push({
            id: getNextBudgetRowId(),
            name,
            planned,
            actual,
            comment,
        });
    }

    closeBudgetModal();
    renderBudgetPage();

    /*
      À brancher plus tard :
      POST   /api/client/budgets
      PATCH  /api/client/budgets/{id}
    */
}

function deleteBudgetRow(id) {
    const confirmed = window.confirm("Supprimer cette dépense ?");

    if (!confirmed) {
        return;
    }

    budgetState.rows = budgetState.rows.filter((row) => row.id !== id);
    renderBudgetPage();

    /*
      À brancher plus tard :
      DELETE /api/client/budgets/{id}
    */
}

function updateExpensePreview() {
    const planned = parseAmount(getInputValue("#expensePlanned"));
    const actualRaw = getInputValue("#expenseActual");
    const actual = actualRaw === "" ? null : parseAmount(actualRaw);

    const previewRow = {
        planned: planned || 0,
        actual,
    };

    const difference = calculateDifference(previewRow);
    const percentage = calculateBudgetPercentage(previewRow);

    setText("#expenseDifferencePreview", formatCurrency(difference));
    setText("#expensePercentagePreview", `${percentage} %`);
}

/**
 * Différence :
 * réel - prévu.
 *
 * Si le réel est vide, on considère la différence comme 0
 * parce que la dépense n'est pas encore réalisée.
 */
function calculateDifference(row) {
    if (row.actual === null || row.actual === "") {
        return 0;
    }

    return Number(row.actual || 0) - Number(row.planned || 0);
}

/**
 * Pourcentage :
 * - si réel rempli : réel / budget total * 100
 * - si réel vide : prévu / budget total * 100
 */
function calculateBudgetPercentage(row) {
    if (!budgetState.totalBudget || budgetState.totalBudget <= 0) {
        return 0;
    }

    const amountForPercentage =
        row.actual === null || row.actual === ""
            ? Number(row.planned || 0)
            : Number(row.actual || 0);

    return Math.round((amountForPercentage / budgetState.totalBudget) * 100);
}

/**
 * Total utilisé :
 * - si réel rempli : réel
 * - si réel vide : prévu
 */
function getUsedBudgetTotal() {
    return budgetState.rows.reduce((total, row) => {
        const amount =
            row.actual === null || row.actual === ""
                ? Number(row.planned || 0)
                : Number(row.actual || 0);

        return total + amount;
    }, 0);
}

function findBudgetRowById(id) {
    return budgetState.rows.find((row) => row.id === id);
}

function getNextBudgetRowId() {
    if (budgetState.rows.length === 0) {
        return 1;
    }

    return Math.max(...budgetState.rows.map((row) => row.id)) + 1;
}

function parseAmount(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
        return null;
    }

    return parsed;
}

function formatCurrency(value) {
    const number = Number(value || 0);

    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(number);
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