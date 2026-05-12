document.addEventListener("DOMContentLoaded", () => {
    initClientDashboard();
});

async function initClientDashboard() {
    const fallbackData = {
        tasksCount: 7,
        budgetAmount: "12 500 €",
        guestsCount: 84,
        nextSteps: [
            {
                label: "Valider le devis traiteur",
                status: "Cette semaine",
            },
            {
                label: "Confirmer les horaires de la salle",
                status: "Important",
            },
            {
                label: "Finaliser le plan de table",
                status: "À faire",
            },
        ],
        comments: [
            {
                label: "devis-traiteur.pdf",
                status: "Commenté",
            },
            {
                label: "inspiration-deco.jpg",
                status: "Vu",
            },
            {
                label: "contrat-salle.pdf",
                status: "À vérifier",
            },
        ],
    };

    try {
        /*
          À brancher plus tard quand l'endpoint dashboard existera.
    
          Exemple attendu :
          GET /api/client/dashboard
    
          Réponse possible :
          {
            "tasksCount": 7,
            "budgetAmount": "12 500 €",
            "guestsCount": 84,
            "nextSteps": [...],
            "comments": [...]
          }
        */

        // const response = await fetch("/api/client/dashboard", {
        //   method: "GET",
        //   credentials: "include",
        //   headers: {
        //     "Accept": "application/json",
        //   },
        // });

        // if (!response.ok) {
        //   throw new Error("Impossible de charger le tableau de bord.");
        // }

        // const data = await response.json();
        // renderDashboard(data);

        renderDashboard(fallbackData);
    } catch (error) {
        console.error("Erreur tableau de bord :", error);
        renderDashboard(fallbackData);
    }
}

function renderDashboard(data) {
    setText("#tasksCount", data.tasksCount);
    setText("#budgetAmount", data.budgetAmount);
    setText("#guestsCount", data.guestsCount);

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

function setText(selector, value) {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.textContent = value;
}