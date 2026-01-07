// Menu navigation system
// Handles showing/hiding main menu, game container, and modals

document.addEventListener('DOMContentLoaded', () => {
    // Get all menu elements
    const mainMenu = document.getElementById('mainMenu');
    const gameContainer = document.getElementById('gameContainer');
    const deckStudioModal = document.getElementById('deckStudioModal');
    const settingsModal = document.getElementById('settingsModal');
    
    // Get menu buttons
    const deckStudioMenuBtn = document.getElementById('deckStudioMenuBtn');
    const playGameMenuBtn = document.getElementById('playGameMenuBtn');
    const shopMenuBtn = document.getElementById('shopMenuBtn');
    const settingsMenuBtn = document.getElementById('settingsMenuBtn');
    const backToMainMenuBtn = document.getElementById('backToMainMenuBtn');
    
    // Function to show main menu and hide everything else
    function showMainMenu() {
        if (mainMenu) {
            mainMenu.style.display = 'flex';
        }
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        if (deckStudioModal) {
            deckStudioModal.style.display = 'none';
        }
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
    }
    
    // Function to hide main menu
    function hideMainMenu() {
        if (mainMenu) {
            mainMenu.style.display = 'none';
        }
    }
    
    // Set initial state: show main menu, hide everything else
    showMainMenu();
    
    // Deck Studio button: navigate to deck studio page
    if (deckStudioMenuBtn) {
        deckStudioMenuBtn.addEventListener('click', () => {
            // Navigate to separate deck studio page
            window.location.href = 'deck-studio.html';
        });
    }
    
    // Play Game button: navigate to battle page
    if (playGameMenuBtn) {
        playGameMenuBtn.addEventListener('click', () => {
            // Navigate to separate battle page
            window.location.href = 'battle.html';
        });
    }
    
    // Shop button: navigate to shop page
    if (shopMenuBtn) {
        shopMenuBtn.addEventListener('click', () => {
            // Navigate to separate shop page
            window.location.href = 'shop.html';
        });
    }
    
    // Settings button: navigate to settings page
    if (settingsMenuBtn) {
        settingsMenuBtn.addEventListener('click', () => {
            // Navigate to separate settings page
            window.location.href = 'settings.html';
        });
    }
    
    // Back to Main Menu button: return to main menu
    if (backToMainMenuBtn) {
        backToMainMenuBtn.addEventListener('click', () => {
            showMainMenu();
        });
    }
    
    // Also handle close buttons in modals (X buttons)
    const closeDeckStudio = document.getElementById('closeDeckStudio');
    if (closeDeckStudio) {
        closeDeckStudio.addEventListener('click', () => {
            showMainMenu();
        });
    }
    
    const closeSettings = document.getElementById('closeSettings');
    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            showMainMenu();
        });
    }
    
    // Make showMainMenu globally available for other scripts
    if (typeof window !== 'undefined') {
        window.showMainMenu = showMainMenu;
        window.hideMainMenu = hideMainMenu;
    }
});

