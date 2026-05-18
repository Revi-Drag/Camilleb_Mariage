document.addEventListener("DOMContentLoaded", () => {
    initAdminDocumentsPage();
});

const adminDocumentsState = {
    search: "",
    statusFilter: "ALL",
    typeFilter: "ALL",
    documents: [
        {
            id: 1,
            name: "devis-traiteur.pdf",
            url: "/uploads/documents/devis-traiteur.pdf",
            typeMime: "application/pdf",
            size: 1543555,
            project: "Mariage Marie & Lucas",
            clients: ["Marie Dupont", "Lucas Martin"],
            uploadedAgo: "il y a 2 h",
            recent: true,
            comment: "À comparer avec la formule cocktail.",
        },
        {
            id: 2,
            name: "inspiration-deco.jpg",
            url: "/uploads/documents/inspiration-deco.jpg",
            typeMime: "image/jpeg",
            size: 845000,
            project: "Mariage Marie & Lucas",
            clients: ["Marie Dupont", "Lucas Martin"],
            uploadedAgo: "il y a 6 h",
            recent: true,
            comment: "",
        },
        {
            id: 3,
            name: "contrat-salle.pdf",
            url: "/uploads/documents/contrat-salle.pdf",
            typeMime: "application/pdf",
            size: 2120000,
            project: "Mariage clients test",
            clients: ["Client Test", "Conjoint Test"],
            uploadedAgo: "il y a 1 jour",
            recent: true,
            comment: "À vérifier : horaires de fin de soirée.",
        },
        {
            id: 4,
            name: "plan-table-v1.xlsx",
            url: "/uploads/documents/plan-table-v1.xlsx",
            typeMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            size: 320000,
            project: "Mariage Emma & Julien",
            clients: ["Emma Laurent", "Julien Moreau"],
            uploadedAgo: "il y a 4 jours",
            recent: false,
            comment: "",
        },
        {
            id: 5,
            name: "devis-dj.pdf",
            url: "/uploads/documents/devis-dj.pdf",
            typeMime: "application/pdf",
            size: 780000,
            project: "Mariage Clara & Mehdi",
            clients: ["Clara Simon", "Mehdi Haddad"],
            uploadedAgo: "il y a 8 jours",
            recent: false,
            comment: "",
        },
        {
            id: 6,
            name: "contrat-photographe.pdf",
            url: "/uploads/documents/contrat-photographe.pdf",
            typeMime: "application/pdf",
            size: 1750000,
            project: "Mariage Sophie & Antoine",
            clients: ["Sophie Martin", "Antoine Roux"],
            uploadedAgo: "il y a 10 jours",
            recent: false,
            comment: "Contrat cohérent, demander confirmation des horaires.",
        },
    ],
};

function initAdminDocumentsPage() {
    bindAdminDocumentsEvents();
    renderAdminDocumentsPage();
}

function bindAdminDocumentsEvents() {
    const refreshButton = document.querySelector("#refreshAdminDocumentsButton");
    const searchInput = document.querySelector("#adminDocumentSearchInput");
    const statusFilter = document.querySelector("#adminDocumentStatusFilter");
    const typeFilter = document.querySelector("#adminDocumentTypeFilter");

    const closeButton = document.querySelector("#closeAdminDocumentModalButton");
    const cancelButton = document.querySelector("#cancelAdminDocumentButton");
    const backdrop = document.querySelector("#adminDocumentModalBackdrop");
    const form = document.querySelector("#adminDocumentCommentForm");

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            renderAdminDocumentsPage();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            adminDocumentsState.search = searchInput.value.trim().toLowerCase();
            renderAdminDocumentsTable();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            adminDocumentsState.statusFilter = statusFilter.value;
            renderAdminDocumentsTable();
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener("change", () => {
            adminDocumentsState.typeFilter = typeFilter.value;
            renderAdminDocumentsTable();
        });
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeAdminDocumentModal);
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", closeAdminDocumentModal);
    }

    if (backdrop) {
        backdrop.addEventListener("click", closeAdminDocumentModal);
    }

    if (form) {
        form.addEventListener("submit", handleDocumentCommentSubmit);
    }
}

function renderAdminDocumentsPage() {
    renderAdminDocumentStats();
    renderAdminDocumentsTable();
}

function renderAdminDocumentStats() {
    const documents = adminDocumentsState.documents;

    const total = documents.length;
    const toReview = documents.filter((documentItem) => !hasAdminComment(documentItem)).length;
    const commented = documents.filter((documentItem) => hasAdminComment(documentItem)).length;
    const recent = documents.filter((documentItem) => documentItem.recent).length;

    setText("#documentsTotalCount", total);
    setText("#documentsToReviewCount", toReview);
    setText("#documentsCommentedCount", commented);
    setText("#documentsRecentCount", recent);
}

function renderAdminDocumentsTable() {
    const tableBody = document.querySelector("#adminDocumentsTableBody");

    if (!tableBody) {
        return;
    }

    const documents = getFilteredDocuments();

    tableBody.innerHTML = "";

    documents.forEach((documentItem) => {
        const status = getDocumentStatus(documentItem);
        const type = getDocumentType(documentItem.typeMime);

        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>
        <strong class="admin-document-name">${escapeHtml(documentItem.name)}</strong>
      </td>

      <td>${escapeHtml(documentItem.project)}</td>

      <td>${escapeHtml(documentItem.clients.join(", "))}</td>

      <td>${escapeHtml(type.label)}</td>

      <td>${escapeHtml(formatFileSize(documentItem.size))}</td>

      <td>
        <span class="admin-document-uploaded">${escapeHtml(documentItem.uploadedAgo)}</span>
      </td>

      <td class="admin-document-comment-cell">
        ${escapeHtml(documentItem.comment || "Aucun commentaire")}
      </td>

      <td>
        <span class="admin-document-status-pill ${status.className}">
          ${status.label}
        </span>
      </td>

      <td>
        <div class="admin-document-row-actions">
          <a href="${escapeAttribute(documentItem.url)}" target="_blank" rel="noopener">Voir</a>
          <button type="button" data-document-action="comment" data-id="${documentItem.id}">Commenter</button>
          <button type="button" data-document-action="delete" data-id="${documentItem.id}">Supprimer</button>
        </div>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    bindAdminDocumentRowActions();
    renderAdminDocumentStats();
}

function getFilteredDocuments() {
    return adminDocumentsState.documents.filter((documentItem) => {
        return (
            matchesDocumentSearch(documentItem) &&
            matchesDocumentStatusFilter(documentItem) &&
            matchesDocumentTypeFilter(documentItem)
        );
    });
}

function matchesDocumentSearch(documentItem) {
    if (!adminDocumentsState.search) {
        return true;
    }

    const haystack = [
        documentItem.name,
        documentItem.project,
        documentItem.clients.join(" "),
        documentItem.typeMime,
        documentItem.uploadedAgo,
        documentItem.comment,
        getDocumentStatus(documentItem).label,
    ]
        .join(" ")
        .toLowerCase();

    return haystack.includes(adminDocumentsState.search);
}

function matchesDocumentStatusFilter(documentItem) {
    const filter = adminDocumentsState.statusFilter;

    if (filter === "ALL") {
        return true;
    }

    if (filter === "TO_REVIEW") {
        return !hasAdminComment(documentItem);
    }

    if (filter === "COMMENTED") {
        return hasAdminComment(documentItem);
    }

    if (filter === "RECENT") {
        return documentItem.recent;
    }

    return true;
}

function matchesDocumentTypeFilter(documentItem) {
    const filter = adminDocumentsState.typeFilter;

    if (filter === "ALL") {
        return true;
    }

    const type = getDocumentType(documentItem.typeMime);

    return type.key === filter;
}

function bindAdminDocumentRowActions() {
    const buttons = document.querySelectorAll("[data-document-action][data-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const action = button.dataset.documentAction;

            if (action === "comment") {
                const documentItem = findDocumentById(id);

                if (documentItem) {
                    openAdminDocumentModal(documentItem);
                }

                return;
            }

            if (action === "delete") {
                deleteAdminDocument(id);
            }
        });
    });
}

function openAdminDocumentModal(documentItem) {
    setInputValue("#adminDocumentId", documentItem.id);
    setText("#adminDocumentName", documentItem.name);
    setText("#adminDocumentProject", documentItem.project);
    setText("#adminDocumentClients", documentItem.clients.join(", "));
    setInputValue("#adminDocumentComment", documentItem.comment || "");

    showElement("#adminDocumentModal");
}

function closeAdminDocumentModal() {
    hideElement("#adminDocumentModal");
}

function handleDocumentCommentSubmit(event) {
    event.preventDefault();

    const id = Number(getInputValue("#adminDocumentId"));
    const comment = getInputValue("#adminDocumentComment").trim();

    const documentItem = findDocumentById(id);

    if (!documentItem) {
        return;
    }

    documentItem.comment = comment;

    closeAdminDocumentModal();
    renderAdminDocumentsPage();

    /*
      À brancher plus tard :
      PATCH /api/admin/documents/{id}/commentaire
      Body : { commentaireAdmin: comment }
    */
}

function deleteAdminDocument(id) {
    const confirmed = window.confirm("Supprimer ce document ?");

    if (!confirmed) {
        return;
    }

    adminDocumentsState.documents = adminDocumentsState.documents.filter((documentItem) => {
        return documentItem.id !== id;
    });

    renderAdminDocumentsPage();

    /*
      À brancher plus tard :
      DELETE /api/admin/documents/{id}
    */
}

function findDocumentById(id) {
    return adminDocumentsState.documents.find((documentItem) => documentItem.id === id);
}

function hasAdminComment(documentItem) {
    return Boolean(documentItem.comment && documentItem.comment.trim() !== "");
}

function getDocumentStatus(documentItem) {
    if (hasAdminComment(documentItem)) {
        return {
            label: "Commenté",
            className: "commented",
        };
    }

    return {
        label: "À vérifier",
        className: "to-review",
    };
}

function getDocumentType(typeMime) {
    if (!typeMime) {
        return {
            key: "OTHER",
            label: "Autre",
        };
    }

    if (typeMime.includes("pdf")) {
        return {
            key: "PDF",
            label: "PDF",
        };
    }

    if (typeMime.includes("image")) {
        return {
            key: "IMAGE",
            label: "Image",
        };
    }

    return {
        key: "OTHER",
        label: "Autre",
    };
}

function formatFileSize(size) {
    const bytes = Number(size || 0);

    if (bytes <= 0) {
        return "-";
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} Ko`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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

function escapeAttribute(value) {
    return escapeHtml(value);
}