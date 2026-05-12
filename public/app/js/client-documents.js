document.addEventListener("DOMContentLoaded", () => {
    initDocumentsPage();
});

const documentsState = {
    documents: [],
    fallbackDocuments: [
        {
            id: 1,
            nomOriginal: "devis-traiteur.pdf",
            nomFichier: "devis-traiteur.pdf",
            typeMime: "application/pdf",
            taille: 1543555,
            commentaireAdmin: "À comparer avec la formule cocktail.",
            url: "#",
            projetMariage: {
                id: 2,
                nom: "Mariage clients test",
            },
        },
        {
            id: 2,
            nomOriginal: "inspiration-deco.jpg",
            nomFichier: "inspiration-deco.jpg",
            typeMime: "image/jpeg",
            taille: 845000,
            commentaireAdmin: null,
            url: "#",
            projetMariage: {
                id: 2,
                nom: "Mariage clients test",
            },
        },
        {
            id: 3,
            nomOriginal: "contrat-salle.pdf",
            nomFichier: "contrat-salle.pdf",
            typeMime: "application/pdf",
            taille: 2120000,
            commentaireAdmin: "À vérifier : horaires de fin de soirée.",
            url: "#",
            projetMariage: {
                id: 2,
                nom: "Mariage clients test",
            },
        },
    ],
};

function initDocumentsPage() {
    bindDocumentEvents();
    loadDocuments();
}

function bindDocumentEvents() {
    const openButton = document.querySelector("#openDocumentModalButton");
    const closeButton = document.querySelector("#closeDocumentModalButton");
    const cancelButton = document.querySelector("#cancelDocumentButton");
    const backdrop = document.querySelector("#documentModalBackdrop");
    const form = document.querySelector("#documentForm");
    const dropZone = document.querySelector("#documentsDropZone");
    const fileInput = document.querySelector("#documentFile");

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

    if (form) {
        form.addEventListener("submit", handleDocumentSubmit);
    }

    if (dropZone && fileInput) {
        dropZone.addEventListener("click", () => {
            openDocumentModal();
        });

        dropZone.addEventListener("dragover", (event) => {
            event.preventDefault();
            dropZone.classList.add("drag-over");
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("drag-over");
        });

        dropZone.addEventListener("drop", (event) => {
            event.preventDefault();
            dropZone.classList.remove("drag-over");

            const file = event.dataTransfer.files[0];

            if (!file) {
                return;
            }

            openDocumentModal();

            setTimeout(() => {
                fileInput.files = event.dataTransfer.files;
            }, 0);
        });
    }
}

async function loadDocuments() {
    try {
        const response = await fetch("/api/client/documents", {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Chargement des documents impossible.");
        }

        const data = await response.json();

        documentsState.documents = Array.isArray(data) ? data : [];
        renderDocuments();
    } catch (error) {
        console.warn("Mode démo documents :", error);
        documentsState.documents = documentsState.fallbackDocuments;
        renderDocuments();
    }
}

async function handleDocumentSubmit(event) {
    event.preventDefault();

    const message = document.querySelector("#documentMessage");
    const projectSelect = document.querySelector("#documentProjectId");
    const fileInput = document.querySelector("#documentFile");

    clearDocumentMessage(message);

    const projetMariageId = projectSelect ? projectSelect.value : "";
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (!projetMariageId || !file) {
        showDocumentMessage(message, "Veuillez sélectionner un projet et un fichier.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("projetMariageId", projetMariageId);
    formData.append("fichier", file);

    try {
        const response = await fetch("/api/client/documents", {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        const data = await safeJson(response);

        if (!response.ok || data.success === false) {
            showDocumentMessage(
                message,
                data.error || data.message || "Erreur lors de l’envoi du document.",
                "error"
            );
            return;
        }

        showDocumentMessage(message, "Document ajouté avec succès.", "success");

        if (fileInput) {
            fileInput.value = "";
        }

        setTimeout(() => {
            closeDocumentModal();
            loadDocuments();
        }, 500);
    } catch (error) {
        console.error("Erreur upload document :", error);
        showDocumentMessage(message, "Erreur de connexion au serveur.", "error");
    }
}

async function deleteDocument(id) {
    const confirmed = window.confirm("Supprimer ce document ?");

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/client/documents/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        });

        const data = await safeJson(response);

        if (!response.ok || data.success === false) {
            alert(data.error || data.message || "Suppression impossible.");
            return;
        }

        documentsState.documents = documentsState.documents.filter((document) => document.id !== id);
        renderDocuments();
    } catch (error) {
        console.error("Erreur suppression document :", error);

        documentsState.documents = documentsState.documents.filter((document) => document.id !== id);
        renderDocuments();
    }
}

function renderDocuments() {
    const tableBody = document.querySelector("#documentsTableBody");
    const countElement = document.querySelector("#documentsCount");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    documentsState.documents.forEach((documentItem) => {
        const tr = document.createElement("tr");

        const status = getDocumentStatus(documentItem);

        tr.innerHTML = `
      <td>${escapeHtml(documentItem.nomOriginal || documentItem.nomFichier || "Document")}</td>
      <td>${escapeHtml(formatMimeType(documentItem.typeMime))}</td>
      <td>${escapeHtml(formatFileSize(documentItem.taille))}</td>
      <td>${escapeHtml(documentItem.projetMariage?.nom || "-")}</td>
      <td>${escapeHtml(documentItem.commentaireAdmin || "Aucun commentaire")}</td>
      <td>
        <span class="document-status-pill ${status.className}">
          ${status.label}
        </span>
      </td>
      <td>
        <div class="document-row-actions">
          <a href="${escapeAttribute(documentItem.url || "#")}" target="_blank" rel="noopener">Voir</a>
          <a href="${escapeAttribute(documentItem.url || "#")}" download>Télécharger</a>
          <button type="button" data-document-action="delete" data-id="${documentItem.id}">Supprimer</button>
        </div>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    if (countElement) {
        countElement.textContent = documentsState.documents.length;
    }

    bindDocumentRowActions();
}

function bindDocumentRowActions() {
    const deleteButtons = document.querySelectorAll("[data-document-action='delete']");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);

            if (id) {
                deleteDocument(id);
            }
        });
    });
}

function openDocumentModal() {
    const modal = document.querySelector("#documentModal");
    const message = document.querySelector("#documentMessage");

    clearDocumentMessage(message);

    if (modal) {
        modal.classList.remove("hidden");
    }
}

function closeDocumentModal() {
    const modal = document.querySelector("#documentModal");
    const fileInput = document.querySelector("#documentFile");

    if (fileInput) {
        fileInput.value = "";
    }

    if (modal) {
        modal.classList.add("hidden");
    }
}

function getDocumentStatus(documentItem) {
    if (documentItem.commentaireAdmin) {
        return {
            label: "Commenté",
            className: "commented",
        };
    }

    return {
        label: "Déposé",
        className: "uploaded",
    };
}

function formatMimeType(typeMime) {
    if (!typeMime) {
        return "-";
    }

    if (typeMime.includes("pdf")) {
        return "PDF";
    }

    if (typeMime.includes("image")) {
        return "Image";
    }

    if (typeMime.includes("word") || typeMime.includes("document")) {
        return "Document";
    }

    return typeMime;
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

async function safeJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function showDocumentMessage(element, text, type) {
    if (!element) {
        return;
    }

    element.textContent = text;
    element.className = `document-message ${type}`;
}

function clearDocumentMessage(element) {
    if (!element) {
        return;
    }

    element.textContent = "";
    element.className = "document-message";
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