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
        
        // Start main menu music when showing main menu
        if (typeof switchToMainMenuMusic === 'function') {
            switchToMainMenuMusic();
        } else if (typeof window !== 'undefined' && typeof window.switchToMainMenuMusic === 'function') {
            window.switchToMainMenuMusic();
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
    
    // Update player level display
    function updatePlayerLevelDisplay() {
        if (typeof window !== 'undefined' && typeof window.getPlayerLevel === 'function') {
            const level = window.getPlayerLevel();
            const exp = window.getPlayerExperience();
            const expNeeded = window.getExpForLevel(level);
            const progress = window.getExperienceProgress();
            
            const levelValue = document.getElementById('levelValue');
            const expFill = document.getElementById('expFill');
            const expText = document.getElementById('expText');
            const levelDisplay = document.getElementById('playerLevelDisplay');
            
            if (levelValue) levelValue.textContent = level;
            if (expFill) expFill.style.width = (progress * 100) + '%';
            if (expText) expText.textContent = `${exp} / ${expNeeded} XP`;
            if (levelDisplay) levelDisplay.style.display = 'flex';
        }
    }
    
    // Check for daily login reward
    setTimeout(() => {
        console.log('[DAILY LOGIN] Checking for daily login reward...');
        
        if (typeof window !== 'undefined' && typeof window.checkDailyLogin === 'function') {
            const loginResult = window.checkDailyLogin();
            console.log('[DAILY LOGIN] Login result:', loginResult);
            
            if (loginResult && loginResult.reward) {
                console.log('[DAILY LOGIN] Showing reward modal...');
                // Show daily login modal
                if (typeof window.showDailyLoginModal === 'function') {
                    window.showDailyLoginModal(loginResult.reward, loginResult.streak);
                } else {
                    console.error('[DAILY LOGIN] showDailyLoginModal function not found!');
                }
            } else {
                console.log('[DAILY LOGIN] No reward to show (already logged in today or no result)');
            }
        } else {
            console.warn('[DAILY LOGIN] checkDailyLogin function not available yet');
            // Retry after a longer delay
            setTimeout(() => {
                if (typeof window !== 'undefined' && typeof window.checkDailyLogin === 'function') {
                    const loginResult = window.checkDailyLogin();
                    if (loginResult && loginResult.reward) {
                        if (typeof window.showDailyLoginModal === 'function') {
                            window.showDailyLoginModal(loginResult.reward, loginResult.streak);
                        }
                    }
                }
            }, 1000);
        }
        
        // Update level display
        updatePlayerLevelDisplay();
    }, 800); // Increased delay to ensure all scripts are loaded
    
    // Initialize and start main menu music
    if (typeof switchToMainMenuMusic === 'function') {
        switchToMainMenuMusic();
    } else if (typeof window !== 'undefined' && typeof window.switchToMainMenuMusic === 'function') {
        window.switchToMainMenuMusic();
    }
    
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

