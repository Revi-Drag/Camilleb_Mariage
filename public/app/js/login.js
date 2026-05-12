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
                    "Accept": "application/json",
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

            const user = data.user || data;

            setTimeout(() => {
                redirectAfterLogin(user);
            }, 500);
        } catch (error) {
            console.error("Erreur lors de la connexion :", error);
            showMessage(message, "Erreur de connexion au serveur.", "error");
        }
    });
}

function redirectAfterLogin(user) {
    const roles = Array.isArray(user.roles) ? user.roles : [];

    if (roles.includes("ROLE_ADMIN")) {
        window.location.href = "/app/admin-dashboard.html";
        return;
    }

    if (roles.includes("ROLE_CLIENT")) {
        window.location.href = "/app/client-dashboard.html";
        return;
    }

    window.location.href = "/app/client-dashboard.html";
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