document.addEventListener("DOMContentLoaded", () => {
    initClientSettingsPage();
});

function initClientSettingsPage() {
    const contactForm = document.querySelector("#clientContactForm");
    const passwordForm = document.querySelector("#clientPasswordForm");
    const logoutButton = document.querySelector("#clientLogoutButton");

    if (contactForm) {
        contactForm.addEventListener("submit", handleContactSubmit);
    }

    if (passwordForm) {
        passwordForm.addEventListener("submit", handlePasswordSubmit);
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", handleClientLogout);
    }
}

function handleContactSubmit(event) {
    event.preventDefault();

    const email = getInputValue("#clientEmail");
    const phone = getInputValue("#clientPhone");

    if (!email || !isValidEmail(email)) {
        showMessage("#clientContactMessage", "Veuillez saisir une adresse email valide.", "error");
        return;
    }

    console.log("Modification contact client simulée :", {
        email,
        phone,
    });

    showMessage("#clientContactMessage", "Informations de contact enregistrées côté front.", "success");

    /*
      À brancher plus tard :
      PATCH /api/client/profile
      Body : { email, telephone: phone }
    */
}

function handlePasswordSubmit(event) {
    event.preventDefault();

    const currentPassword = getInputValue("#currentPassword");
    const newPassword = getInputValue("#newPassword");
    const confirmPassword = getInputValue("#confirmPassword");

    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage("#clientPasswordMessage", "Tous les champs mot de passe sont obligatoires.", "error");
        return;
    }

    if (newPassword.length < 8) {
        showMessage("#clientPasswordMessage", "Le nouveau mot de passe doit contenir au moins 8 caractères.", "error");
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage("#clientPasswordMessage", "La confirmation ne correspond pas au nouveau mot de passe.", "error");
        return;
    }

    console.log("Modification mot de passe client simulée.");

    clearPasswordFields();
    showMessage("#clientPasswordMessage", "Mot de passe modifié côté front. Branchement API à prévoir.", "success");

    /*
      À brancher plus tard :
      PATCH /api/client/password
      Body : { currentPassword, newPassword }
    */
}

async function handleClientLogout() {
    try {
        /*
          À adapter selon ton backend.
          Si tu ajoutes une route logout API, branche-la ici.
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

function clearPasswordFields() {
    setInputValue("#currentPassword", "");
    setInputValue("#newPassword", "");
    setInputValue("#confirmPassword", "");
}

function getInputValue(selector) {
    const element = document.querySelector(selector);

    if (!element) {
        return "";
    }

    return element.value.trim();
}

function setInputValue(selector, value) {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.value = value;
}

function showMessage(selector, text, type) {
    const message = document.querySelector(selector);

    if (!message) {
        return;
    }

    message.textContent = text;
    message.className = `client-settings-message ${type}`;

    window.setTimeout(() => {
        message.textContent = "";
        message.className = "client-settings-message";
    }, 3500);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}