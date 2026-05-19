document.addEventListener("DOMContentLoaded", () => {
    initClientDocumentsPage();
});

const API_BASE_URL = "";

const documentsState = {
    currentProjectId: null,
    currentProjectName: "",
    documents: [],
};

async function initClientDocumentsPage() {
    bindDocumentEvents();

    try {
        await loadCurrentProject();
        updateProjectSelect();
        await loadDocuments();
        renderDocuments();
    } catch (error) {
        console.error("Erreur initialisation documents :", error);
        alert("Impossible de charger les documents. Vérifie que tu es connecté.");
    }
}

function bindDocumentEvents() {
    const form = document.querySelector("#documentForm");
    const fileInput = document.querySelector("#documentFile");
    const openButton = document.querySelector("#openDocumentModalButton");
    const closeButton = document.querySelector("#closeDocumentModalButton");
    const cancelButton = document.querySelector("#cancelDocumentButton");
    const backdrop = document.querySelector("#documentModalBackdrop");
    const dropZone = document.querySelector("#documentsDropZone");

    if (form) {
        form.addEventListener("submit", handleDocumentSubmit);
    }

    if (fileInput) {
        fileInput.addEventListener("change", updateSelectedFileName);
    }

    if (openButton) {
        openButton.addEventListener("click", openDocumentModal);
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

    if (dropZone) {
        dropZone.addEventListener("click", openDocumentModal);
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

    documentsState.currentProjectId = data[0].id;
    documentsState.currentProjectName = data[0].nom || "Projet mariage";
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

    documentsState.documents = Array.isArray(data)
        ? data.map(mapApiDocumentToFrontDocument)
        : [];
}

async function uploadDocument(file) {
    const formData = new FormData();

    formData.append("projetMariageId", String(documentsState.currentProjectId));
    formData.append("fichier", file);

    const response = await fetch(`${API_BASE_URL}/api/client/documents`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || data.success === false) {
        throw new Error(data.error || "Impossible d’ajouter le document.");
    }

    return data.document;
}

async function deleteDocumentApi(id) {
    const response = await fetch(`${API_BASE_URL}/api/client/documents/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || data.success === false) {
        throw new Error(data.error || "Impossible de supprimer le document.");
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

function renderDocuments() {
    const tableBody = document.querySelector("#documentsTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (documentsState.documents.length === 0) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td colspan="6" class="documents-empty-cell">
        Aucun document déposé pour le moment.
      </td>
    `;

        tableBody.appendChild(tr);
        updateDocumentsStats();
        return;
    }

    documentsState.documents.forEach((documentItem) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td class="document-file-name-cell" title="${escapeAttribute(documentItem.name)}">
        <strong class="document-name-cell">${escapeHtml(documentItem.name)}</strong>
      </td>

      <td>${escapeHtml(documentItem.typeLabel)}</td>

      <td>${escapeHtml(documentItem.sizeLabel)}</td>

      <td class="document-comment-cell">
        ${documentItem.commentaireAdmin
                ? escapeHtml(documentItem.commentaireAdmin)
                : "Aucun commentaire"
            }
      </td>

      <td>
        <a href="${escapeAttribute(documentItem.url)}" target="_blank" rel="noopener" class="document-view-link">
          Voir
        </a>
      </td>

      <td>
        <button type="button" class="document-delete-button" data-document-id="${documentItem.id}">
          Supprimer
        </button>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    bindDeleteButtons();
    updateDocumentsStats();
}

function bindDeleteButtons() {
    const buttons = document.querySelectorAll("[data-document-id]");

    buttons.forEach((button) => {
        button.addEventListener("click", async () => {
            const id = Number(button.dataset.documentId);
            await deleteDocument(id);
        });
    });
}

function updateDocumentsStats() {
    const total = documentsState.documents.length;

    const commentedCount = documentsState.documents.filter((documentItem) => {
        return Boolean(documentItem.commentaireAdmin);
    }).length;

    setText("#documentsTotalCount", total);
    setText("#documentsCommentedCount", commentedCount);
    setText("#documentsToReviewCount", total - commentedCount);
}

function updateProjectSelect() {
    const select = document.querySelector("#documentProjectId");

    if (!select) {
        return;
    }

    select.innerHTML = "";

    const option = document.createElement("option");
    option.value = String(documentsState.currentProjectId || "");
    option.textContent = documentsState.currentProjectName || "Projet mariage";

    select.appendChild(option);
    select.value = String(documentsState.currentProjectId || "");
}

/* ==========================================================
   ACTIONS
   ========================================================== */

function openDocumentModal() {
    showElement("#documentModal");
    clearDocumentMessage();
}

function closeDocumentModal() {
    hideElement("#documentModal");
    clearDocumentMessage();
}

async function handleDocumentSubmit(event) {
    event.preventDefault();

    const fileInput = document.querySelector("#documentFile");

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showDocumentMessage("Sélectionne un fichier à envoyer.", "error");
        return;
    }

    if (!documentsState.currentProjectId) {
        showDocumentMessage("Aucun projet mariage trouvé pour envoyer le document.", "error");
        return;
    }

    const file = fileInput.files[0];

    try {
        showDocumentMessage("Envoi du document en cours...", "success");

        await uploadDocument(file);

        fileInput.value = "";
        updateSelectedFileName();

        await loadDocuments();
        renderDocuments();

        showDocumentMessage("Document envoyé avec succès.", "success");

        window.setTimeout(() => {
            closeDocumentModal();
        }, 700);
    } catch (error) {
        console.error("Erreur upload document :", error);
        showDocumentMessage(error.message, "error");
    }
}

async function deleteDocument(id) {
    const confirmed = window.confirm("Supprimer ce document ?");

    if (!confirmed) {
        return;
    }

    try {
        await deleteDocumentApi(id);
        await loadDocuments();
        renderDocuments();
    } catch (error) {
        console.error("Erreur suppression document :", error);
        alert(error.message);
    }
}

function updateSelectedFileName() {
    const fileInput = document.querySelector("#documentFile");
    const label = document.querySelector("#selectedDocumentName");

    if (!label) {
        return;
    }

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        label.textContent = "Aucun fichier sélectionné";
        return;
    }

    label.textContent = fileInput.files[0].name;
}

function showDocumentMessage(text, type) {
    const message = document.querySelector("#documentMessage");

    if (!message) {
        return;
    }

    message.textContent = text;
    message.className = `document-message ${type}`;
}

function clearDocumentMessage() {
    showDocumentMessage("", "");
}

/* ==========================================================
   MAPPING
   ========================================================== */

function mapApiDocumentToFrontDocument(apiDocument) {
    return {
        id: apiDocument.id,
        name: apiDocument.nomOriginal || apiDocument.nomFichier || "Document",
        typeMime: apiDocument.typeMime || "",
        typeLabel: getDocumentTypeLabel(apiDocument.typeMime),
        size: Number(apiDocument.taille || 0),
        sizeLabel: formatFileSize(apiDocument.taille),
        commentaireAdmin: apiDocument.commentaireAdmin || "",
        url: apiDocument.url || "#",
    };
}

function getDocumentTypeLabel(typeMime) {
    if (!typeMime) {
        return "Autre";
    }

    if (typeMime.includes("pdf")) {
        return "PDF";
    }

    if (typeMime.includes("image")) {
        return "Image";
    }

    return "Autre";
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