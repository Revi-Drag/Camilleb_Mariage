document.addEventListener("DOMContentLoaded", () => {
    initAdminDocumentsPage();
});

const adminDocumentsState = {
    search: "",
    statusFilter: "ALL",
    typeFilter: "ALL",
    documents: [],
};

/* =================================
   INITIALISATION
================================= */

async function initAdminDocumentsPage() {
    bindAdminDocumentsEvents();

    try {
        await loadAdminDocuments();
    } catch (error) {
        console.error(error);
        alert("Impossible de charger les documents depuis la base de données.");
        renderAdminDocumentsPage();
    }
}

/* =================================
   CHARGEMENT API
================================= */

async function loadAdminDocuments() {
    const response = await fetch("/api/admin/documents", {
        method: "GET",
        credentials: "include",
        headers: {
            "Accept": "application/json"
        }
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result || result.success === false) {
        throw new Error(result?.error || "Impossible de charger les documents.");
    }

    const rawDocuments = result.data || result.documents || [];

    adminDocumentsState.documents = rawDocuments.map(normalizeAdminDocument);

    renderAdminDocumentsPage();
}

function normalizeAdminDocument(documentItem) {
    const clients = Array.isArray(documentItem.clients)
        ? documentItem.clients
        : documentItem.clients
            ? [documentItem.clients]
            : [];

    const name =
        documentItem.name ||
        documentItem.originalName ||
        documentItem.fileName ||
        documentItem.filename ||
        "Document sans nom";

    const url =
        documentItem.url ||
        documentItem.fileUrl ||
        documentItem.path ||
        documentItem.publicUrl ||
        buildDocumentUrl(documentItem);

    return {
        id: documentItem.id,
        name,
        url,
        typeMime: documentItem.typeMime || documentItem.mimeType || documentItem.mime || "",
        size: documentItem.size || documentItem.sizeBytes || 0,
        project: documentItem.project || documentItem.projectName || "Projet non précisé",
        clients,
        uploadedAgo: documentItem.uploadedAgo || documentItem.createdAgo || documentItem.createdAt || "Date inconnue",
        recent: Boolean(documentItem.recent),
        comment: documentItem.comment || documentItem.adminComment || documentItem.commentaireAdmin || "",
    };
}

function buildDocumentUrl(documentItem) {
    const filename =
        documentItem.fileName ||
        documentItem.filename ||
        documentItem.storedName ||
        documentItem.storageName ||
        "";

    if (!filename) {
        return "";
    }

    return `/uploads/documents/${encodeURIComponent(filename)}`;
}

/* =================================
   ÉVÉNEMENTS
================================= */

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
        refreshButton.addEventListener("click", async () => {
            try {
                await loadAdminDocuments();
            } catch (error) {
                console.error(error);
                alert("Impossible d’actualiser les documents.");
            }
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

/* =================================
   RENDU GLOBAL
================================= */

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

    if (!documents.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td colspan="9" class="muted">
                Aucun document trouvé.
            </td>
        `;
        tableBody.appendChild(tr);
        renderAdminDocumentStats();
        return;
    }

    documents.forEach((documentItem) => {
        const status = getDocumentStatus(documentItem);
        const type = getDocumentType(documentItem.typeMime);
        const clientsText = getClientsText(documentItem);

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                <strong class="admin-document-name">${escapeHtml(documentItem.name)}</strong>
            </td>

            <td>${escapeHtml(documentItem.project)}</td>

            <td>${escapeHtml(clientsText)}</td>

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
                    <button type="button" data-document-action="view" data-id="${escapeAttribute(documentItem.id)}">
                        Voir
                    </button>
                    <button type="button" data-document-action="comment" data-id="${escapeAttribute(documentItem.id)}">
                        Commenter
                    </button>
                    <button type="button" data-document-action="delete" data-id="${escapeAttribute(documentItem.id)}">
                        Supprimer
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(tr);
    });

    bindAdminDocumentRowActions();
    renderAdminDocumentStats();
}

/* =================================
   FILTRES
================================= */

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
        getClientsText(documentItem),
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

/* =================================
   ACTIONS LIGNES
================================= */

function bindAdminDocumentRowActions() {
    const buttons = document.querySelectorAll("[data-document-action][data-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = button.dataset.id;
            const action = button.dataset.documentAction;

            if (action === "view") {
                viewAdminDocument(id);
                return;
            }

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

function viewAdminDocument(id) {
    const documentItem = findDocumentById(id);

    if (!documentItem) {
        alert("Document introuvable.");
        return;
    }

    const url = documentItem.url;

    if (!url) {
        alert("Aucun fichier n’est associé à ce document.");
        return;
    }

    window.open(url, "_blank", "noopener");
}

/* =================================
   COMMENTAIRE
================================= */

function openAdminDocumentModal(documentItem) {
    setInputValue("#adminDocumentId", documentItem.id);
    setText("#adminDocumentName", documentItem.name);
    setText("#adminDocumentProject", documentItem.project);
    setText("#adminDocumentClients", getClientsText(documentItem));
    setInputValue("#adminDocumentComment", documentItem.comment || "");

    showElement("#adminDocumentModal");
}

function closeAdminDocumentModal() {
    hideElement("#adminDocumentModal");
}

async function handleDocumentCommentSubmit(event) {
    event.preventDefault();

    const id = getInputValue("#adminDocumentId");
    const comment = getInputValue("#adminDocumentComment").trim();

    const documentItem = findDocumentById(id);

    if (!documentItem) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/documents/${encodeURIComponent(id)}/comment`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ comment })
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || result?.success === false) {
            throw new Error(result?.error || "Impossible d’enregistrer le commentaire.");
        }

        documentItem.comment = comment;

        closeAdminDocumentModal();
        renderAdminDocumentsPage();
    } catch (error) {
        console.error(error);

        // Fallback front si la route PATCH n’existe pas encore
        documentItem.comment = comment;

        closeAdminDocumentModal();
        renderAdminDocumentsPage();

        alert("Commentaire mis à jour côté interface. La route API de sauvegarde n’est peut-être pas encore branchée.");
    }
}

/* =================================
   SUPPRESSION
================================= */

async function deleteAdminDocument(id) {
    const confirmed = window.confirm("Supprimer ce document ?");

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/documents/${encodeURIComponent(id)}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || result?.success === false) {
            throw new Error(result?.error || "Impossible de supprimer le document.");
        }

        adminDocumentsState.documents = adminDocumentsState.documents.filter((documentItem) => {
            return String(documentItem.id) !== String(id);
        });

        renderAdminDocumentsPage();
    } catch (error) {
        console.error(error);

        // Fallback front si la route DELETE n’existe pas encore
        adminDocumentsState.documents = adminDocumentsState.documents.filter((documentItem) => {
            return String(documentItem.id) !== String(id);
        });

        renderAdminDocumentsPage();

        alert("Document supprimé côté interface. La route API de suppression n’est peut-être pas encore branchée.");
    }
}

/* =================================
   HELPERS DOCUMENTS
================================= */

function findDocumentById(id) {
    return adminDocumentsState.documents.find((documentItem) => {
        return String(documentItem.id) === String(id);
    });
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

function getClientsText(documentItem) {
    if (Array.isArray(documentItem.clients)) {
        return documentItem.clients.join(", ");
    }

    return documentItem.clients || "";
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

/* =================================
   HELPERS DOM
================================= */

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

function escapeAttribute(value) {
    return escapeHtml(value);
}