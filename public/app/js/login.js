document.addEventListener("DOMContentLoaded", () => {
    initLoginForm();
    initAppointmentButton();
});

function initLoginForm() {
    const form = document.querySelector("#loginForm");
    const message = document.querySelector("#loginMessage");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        clearMessage(message);

        const email = form.email.value.trim();
        const password = form.password.value.trim();

        if (!email || !password) {
            showMessage(message, "Veuillez renseigner votre email et votre mot de passe.", "error");
            return;
        }

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await safeJson(response);

            if (!response.ok || data.success === false) {
                showMessage(
                    message,
                    data.error || data.message || "Identifiants incorrects.",
                    "error"
                );
                return;
            }

            showMessage(message, "Connexion réussie. Redirection...", "success");

            window.setTimeout(() => {
                window.location.href = data.redirect || getFallbackRedirect(data.user);
            }, 500);
        } catch (error) {
            console.error("Erreur lors de la connexion :", error);
            showMessage(message, "Erreur de connexion au serveur.", "error");
        }
    });
}

function getFallbackRedirect(user) {
    const roles = Array.isArray(user?.roles) ? user.roles : [];

    if (roles.includes("ROLE_ADMIN")) {
        return "/app/admin-dashboard.html";
    }

    if (roles.includes("ROLE_CLIENT")) {
        return "/app/client-dashboard.html";
    }

    return "/app/";
}

function initAppointmentButton() {
    const appointmentButton = document.querySelector("[data-action='appointment']");

    if (!appointmentButton) {
        return;
    }

    appointmentButton.addEventListener("click", () => {
        window.location.href =
            "mailto:contact@camilleb-mariage.fr?subject=Demande%20de%20rendez-vous";
    });
}

async function safeJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function showMessage(element, text, type) {
    if (!element) {
        return;
    }

    element.textContent = text;
    element.className = `login-message ${type}`;
}

function clearMessage(element) {
    if (!element) {
        return;
    }

    element.textContent = "";
    element.className = "login-message";
}