// --- GESTION CLAVIER POUR LES ÉLÉMENTS INTERACTIFS ---
export function initInteractiveKeyboard() {
    const interactiveElements = document.querySelectorAll('[role="button"][tabindex="0"]');
    
    interactiveElements.forEach(element => {
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                element.click();
            }
        });
    });
}
