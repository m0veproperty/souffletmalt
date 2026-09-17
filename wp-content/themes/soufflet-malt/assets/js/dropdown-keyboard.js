// --- GESTION CLAVIER POUR LES DROPDOWNS ---
export function initDropdownKeyboard() {
    const dropdownTriggers = document.querySelectorAll('.main-nav > ul > li > button[aria-haspopup="menu"]');
    
    function openDropdown(trigger, dropdown, menuItems) {
        trigger.setAttribute('aria-expanded', 'true');
        dropdown.style.opacity = '1';
        dropdown.style.visibility = 'visible';
        menuItems.forEach(item => item.setAttribute('tabindex', '0'));
        if (menuItems.length > 0) menuItems[0].focus();
    }
    
    function closeDropdown(trigger, dropdown, menuItems) {
        trigger.setAttribute('aria-expanded', 'false');
        dropdown.style.opacity = '';
        dropdown.style.visibility = '';
        menuItems.forEach(item => item.setAttribute('tabindex', '-1'));
    }
    
    dropdownTriggers.forEach(trigger => {
        const dropdown = trigger.nextElementSibling;
        if (!dropdown) return;

        const menuItems = dropdown.querySelectorAll('[role="menuitem"]');

        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                openDropdown(trigger, dropdown, menuItems);
            }
        });
        
        trigger.addEventListener('focus', () => {
            closeDropdown(trigger, dropdown, menuItems);
        });
        
        menuItems.forEach((item, index) => {
            item.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextItem = menuItems[index + 1];
                    if (nextItem) nextItem.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (index === 0) {
                        trigger.focus();
                    } else {
                        menuItems[index - 1].focus();
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closeDropdown(trigger, dropdown, menuItems);
                    trigger.focus();
                }
            });
        });
    });
}
