/* ==========================================================
   CAMILLE B - LANDING PAGE
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initLandingNavigation();
    initLandingButtons();
});

/**
 * Gestion simple des liens de navigation.
 * Pour l'instant, certains liens sont des ancres ou placeholders.
 */
function initLandingNavigation() {
    const navLinks = document.querySelectorAll("[data-nav-target]");

    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const target = link.dataset.navTarget;

            if (!target) {
                return;
            }

            if (target.startsWith("#")) {
                event.preventDefault();

                const section = document.querySelector(target);

                if (section) {
                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            }
        });
    });
}

/**
 * Gestion des boutons principaux de la landing page.
 */
function initLandingButtons() {
    const appointmentButton = document.querySelector("[data-action='appointment']");
    const clientSpaceButton = document.querySelector("[data-action='client-space']");

    if (appointmentButton) {
        appointmentButton.addEventListener("click", () => {
            // À adapter selon ton projet :
            // - ouvrir une section contact
            // - aller vers une page contact
            // - ouvrir un mailto
            window.location.href = "mailto:contact@camilleb-mariage.fr?subject=Demande%20de%20rendez-vous";
        });
    }

    if (clientSpaceButton) {
        clientSpaceButton.addEventListener("click", () => {
            // À adapter selon ton routing réel.
            // Exemple si ta page de connexion est dans public/app/login.html :
            window.location.href = "/app/login.html";
        });
    }
}