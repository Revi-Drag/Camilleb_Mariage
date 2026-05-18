document.addEventListener("DOMContentLoaded", () => {
    initAdminSettingsPage();
});

function initAdminSettingsPage() {
    const saveButton = document.querySelector("#saveAllSettingsButton");
    const logoutButton = document.querySelector("#adminLogoutButton");

    if (saveButton) {
        saveButton.addEventListener("click", handleSaveSettings);
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", handleAdminLogout);
    }
}

function handleSaveSettings() {
    const settings = {
        admin: {
            displayName: getInputValue("#adminDisplayName"),
            email: getInputValue("#adminEmail"),
            phone: getInputValue("#adminPhone"),
            newPassword: getInputValue("#adminNewPassword"),
        },
        publicInfo: {
            businessName: getInputValue("#businessName"),
            businessRole: getInputValue("#businessRole"),
            businessArea: getInputValue("#businessArea"),
            businessDescription: getInputValue("#businessDescription"),
        },
        documents: {
            acceptedFormats: getInputValue("#acceptedFormats"),
            maxFileSize: getInputValue("#maxFileSize"),
            uploadDirectory: getInputValue("#uploadDirectory"),
            uploadHelpMessage: getInputValue("#uploadHelpMessage"),
        },
    };

    console.log("Paramètres admin simulés :", settings);

    showSettingsMessage("Paramètres enregistrés côté front. Branchement API à prévoir.", "success");

    /*
      À brancher plus tard :
      PATCH /api/admin/settings
      PATCH /api/admin/profile
    */
}

async function handleAdminLogout() {
    try {
        /*
          À adapter selon ton backend.
          Si tu as une route logout Symfony, branche-la ici.
        */

        // await fetch("/api/logout", {
        //   method: "POST",
        //   credentials: "include",
        // });

        window.location.href = "/app/login.html";
    } catch (error) {
        console.error("Erreur déconnexion :", error);
        window.location.href = "/app/login.html";
    }
}

function getInputValue(selector) {
    const element = document.querySelector(selector);

    if (!element) {
        return "";
    }

    return element.value.trim();
}

function showSettingsMessage(text, type) {
    const message = document.querySelector("#adminSettingsMessage");

    if (!message) {
        return;
    }

    message.textContent = text;
    message.className = `admin-settings-message ${type}`;

    window.setTimeout(() => {
        message.textContent = "";
        message.className = "admin-settings-message";
    }, 3500);
}