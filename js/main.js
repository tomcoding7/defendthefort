// Main game initialization and UI interactions
let game = null;
let selectedCard = null;
let selectedMonsterSlot = null;
let upgradeMode = null; // 'weapon', 'armor', or null

// Currency system (for shops, not used in battles)
let playerCurrency = {
    gold: 0,
    arcana: 0
};

// Load currency from localStorage
function loadCurrency() {
    try {
        const saved = localStorage.getItem('playerCurrency');
        if (saved) {
            playerCurrency = JSON.parse(saved);
        }
    } catch (error) {
        console.error('[CURRENCY] Error loading currency:', error);
    }
    updateCurrencyDisplay();
}

// Save currency to localStorage
function saveCurrency() {
    try {
        localStorage.setItem('playerCurrency', JSON.stringify(playerCurrency));
        
        // Auto-save to cloud if signed in
        if (typeof window !== 'undefined' && typeof window.isSignedIn === 'function' && window.isSignedIn()) {
            if (typeof window.autoSave === 'function') {
                window.autoSave();
            }
        }
    } catch (error) {
        console.error('[CURRENCY] Error saving currency:', error);
    }
}

// Update currency display in header
function updateCurrencyDisplay() {
    const goldDisplay = document.getElementById('goldDisplay');
    const arcanaDisplay = document.getElementById('arcanaDisplay');
    
    if (goldDisplay) {
        goldDisplay.textContent = playerCurrency.gold.toLocaleString();
    }
    if (arcanaDisplay) {
        arcanaDisplay.textContent = playerCurrency.arcana.toLocaleString();
    }
}

// Award currency after battle
// Title/Achievement system
const TITLE_KEY = 'playerTitle';
const AI_WINS_KEY = 'aiWinsCount';
const MASTER_TITLE = 'Master of Forts';
const MASTER_WINS_REQUIRED = 20;

function getAIWinsCount() {
    try {
        return parseInt(localStorage.getItem(AI_WINS_KEY) || '0');
    } catch (error) {
        console.error('[TITLE] Error loading AI wins:', error);
        return 0;
    }
}

function incrementAIWins() {
    if (!game || !game.aiEnabled) {
        return; // Only count wins against AI
    }
    
    let wins = getAIWinsCount();
    wins++;
    localStorage.setItem(AI_WINS_KEY, wins.toString());
    
    console.log(`[TITLE] AI wins: ${wins}/${MASTER_WINS_REQUIRED}`);
    
    // Check if player earned the title
    if (wins >= MASTER_WINS_REQUIRED) {
        const currentTitle = localStorage.getItem(TITLE_KEY);
        if (currentTitle !== MASTER_TITLE) {
            localStorage.setItem(TITLE_KEY, MASTER_TITLE);
            console.log(`[TITLE] 🏆 CONGRATULATIONS! You are now ${MASTER_TITLE}!`);
            showTitleUnlocked(MASTER_TITLE);
        }
    }
    
    return wins;
}

function getPlayerTitle() {
    try {
        return localStorage.getItem(TITLE_KEY) || '';
    } catch (error) {
        return '';
    }
}

function showTitleUnlocked(title) {
    // Create a notification for title unlock
    const notification = document.createElement('div');
    notification.className = 'title-unlock-notification';
    notification.innerHTML = `
        <div class="title-unlock-content">
            <div class="title-unlock-icon">🏆</div>
            <div class="title-unlock-title">TITLE UNLOCKED!</div>
            <div class="title-unlock-name">${title}</div>
            <div class="title-unlock-message">You have proven yourself a true master!</div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after animation
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 500);
    }, 4000);
}

function awardBattleCurrency(playerWon) {
    if (playerWon) {
        // Award gold for winning (random between 50-100)
        const goldEarned = 50 + Math.floor(Math.random() * 51);
        playerCurrency.gold += goldEarned;
        
        // Small chance to earn arcana (10% chance, 1-5 arcana)
        let arcanaEarned = 0;
        if (Math.random() < 0.1) {
            arcanaEarned = 1 + Math.floor(Math.random() * 5);
            playerCurrency.arcana += arcanaEarned;
        }
        
        // Award experience for winning
        if (typeof window !== 'undefined' && typeof window.addExperience === 'function') {
            const expGained = 50 + Math.floor(Math.random() * 51); // 50-100 XP for winning
            window.addExperience(expGained);
        }
        
        // Chance to get a card reward after duel (20% chance)
        let cardReward = null;
        if (Math.random() < 0.2) {
            cardReward = awardDuelCardReward();
        }
        
        saveCurrency();
        updateCurrencyDisplay();
        
        // Track AI wins for title system
        if (game && game.aiEnabled) {
            incrementAIWins();
        }
        
        console.log(`[CURRENCY] Awarded ${goldEarned} gold${arcanaEarned > 0 ? ` and ${arcanaEarned} arcana` : ''} for victory${cardReward ? ` and 1 card` : ''}`);
    } else {
        // Small consolation reward for losing (10-20 gold)
        const consolationGold = 10 + Math.floor(Math.random() * 11);
        playerCurrency.gold += consolationGold;
        
        // Small experience for losing (10-20 XP)
        if (typeof window !== 'undefined' && typeof window.addExperience === 'function') {
            const expGained = 10 + Math.floor(Math.random() * 11);
            window.addExperience(expGained);
        }
        
        saveCurrency();
        updateCurrencyDisplay();
        
        console.log(`[CURRENCY] Awarded ${consolationGold} gold (consolation)`);
    }
}

// Award a random card after duel
function awardDuelCardReward() {
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
    
    if (!cardDB || Object.keys(cardDB).length === 0) {
        return null;
    }
    
    // Determine rarity (mostly common/rare, small chance for epic/legendary)
    let rarity = 'common';
    const rarityRoll = Math.random();
    
    if (rarityRoll < 0.05) {
        rarity = 'legendary'; // 5% chance
    } else if (rarityRoll < 0.15) {
        rarity = 'epic'; // 10% chance
    } else if (rarityRoll < 0.4) {
        rarity = 'rare'; // 25% chance
    }
    // 60% chance for common
    
    // Get rarity function
    let getRarityFn = null;
    if (typeof window !== 'undefined' && typeof window.getCardRarity === 'function') {
        getRarityFn = window.getCardRarity;
    }
    
    let cardId = null;
    
    if (getRarityFn) {
        const allCards = Object.entries(cardDB);
        const cardsOfRarity = allCards.filter(([id, cardData]) => {
            return getRarityFn(id) === rarity;
        });
        
        if (cardsOfRarity.length > 0) {
            const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            cardId = randomCard[0];
        }
    }
    
    // Fallback: determine by cost
    if (!cardId) {
        const allCards = Object.entries(cardDB);
        const cardsOfRarity = allCards.filter(([id, cardData]) => {
            if (rarity === 'legendary') return cardData.cost >= 6;
            if (rarity === 'epic') return cardData.cost >= 4 && cardData.cost < 6;
            if (rarity === 'rare') return cardData.cost >= 2 && cardData.cost < 4;
            return cardData.cost < 2;
        });
        
        if (cardsOfRarity.length > 0) {
            const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            cardId = randomCard[0];
        } else {
            // Ultimate fallback: any card
            const allCardIds = Object.keys(cardDB);
            cardId = allCardIds[Math.floor(Math.random() * allCardIds.length)];
        }
    }
    
    // Add card to collection
    if (cardId) {
        const addCardsFn = (typeof addCardsToCollection !== 'undefined') ? addCardsToCollection :
                          (typeof window !== 'undefined' && typeof window.addCardsToCollection) ? window.addCardsToCollection : null;
        
        if (addCardsFn) {
            addCardsFn([cardId]);
            
            // Play card reward sound
            try {
                const audio = new Audio('assets/soundeffects/rewards/lootreward.wav');
                audio.volume = 0.6;
                audio.play().catch(() => {});
            } catch (e) {}
        }
    }
    
    return cardId;
}

function initializeGame(aiEnabled = false) {
    try {
        // Reset AI avatar selection for new game
        aiAvatarSelected = null;
        
        game = new Game();
        game.initialize(aiEnabled);
        
        // Initialize AI if enabled
        if (aiEnabled) {
            const aiPlayer = game.players.find(p => p.id === 'player2');
            if (aiPlayer) {
                window.ai = new AI(aiPlayer, game);
            }
        } else {
            window.ai = null;
        }
        
        // Start battle music
        if (typeof switchToBattleMusic === 'function') {
            switchToBattleMusic();
        } else if (typeof window !== 'undefined' && typeof window.switchToBattleMusic === 'function') {
            window.switchToBattleMusic();
        }
        
        updateUI();
        setupEventListeners();
    } catch (error) {
        console.error('[ERROR] Error initializing game:', error);
        alert('Error initializing game! Check browser console (F12) for details.');
    }
}

function setupEventListeners() {
    // End turn button - ensure single listener and proper event handling
    const endTurnBtn = document.getElementById('endTurnBtn');
    if (endTurnBtn) {
        // Remove any existing listeners by cloning
        const newEndTurnBtn = endTurnBtn.cloneNode(true);
        endTurnBtn.parentNode.replaceChild(newEndTurnBtn, endTurnBtn);
        
        // Add event listener with proper event handling
        const handleEndTurn = (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            if (game && !game.gameOver) {
                game.endTurn();
                updateUI();
            }
            return false;
        };
        
        // Support both click and touch events for better mobile support
        newEndTurnBtn.addEventListener('click', handleEndTurn, { passive: false });
        newEndTurnBtn.addEventListener('touchend', handleEndTurn, { passive: false });
        
        // Ensure button is clickable
        newEndTurnBtn.style.pointerEvents = 'auto';
        newEndTurnBtn.style.cursor = 'pointer';
        newEndTurnBtn.style.userSelect = 'none';
    }

    // Upgrade fort button
    document.getElementById('upgradeFortBtn').addEventListener('click', () => {
        showFortUpgradeOptions();
    });

    // Close modal
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('cardModal').style.display = 'none';
    });

    // Settings button (in-game)
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'block';
        });
    }
    
    if (closeSettings && settingsModal) {
        closeSettings.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            // Return to main menu if game is not started
            if (typeof game === 'undefined' || !game) {
                setTimeout(() => {
                    if (typeof showMainMenu === 'function') {
                        showMainMenu();
                    }
                }, 100);
            }
        });
    }
    
    // Back to main menu button in settings
    const backToMainMenuBtn = document.getElementById('backToMainMenuBtn');
    if (backToMainMenuBtn) {
        backToMainMenuBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            showMainMenu();
        });
    }
    
    // Click outside settings modal to close
    if (settingsModal) {
        window.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }

    // New game button
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            document.getElementById('winModal').style.display = 'none';
            // Return to main menu after game ends
            showMainMenu();
        });
    }

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('cardModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Music player controls
    setupMusicControls();

    // Battle log toggle
    const battleLogToggle = document.getElementById('battleLogToggle');
    const battleZone = document.getElementById('battleZone');
    if (battleLogToggle && battleZone) {
        battleLogToggle.addEventListener('click', () => {
            if (battleZone.style.display === 'none') {
                battleZone.style.display = 'block';
                battleLogToggle.textContent = '📜 Hide Log';
            } else {
                battleZone.style.display = 'none';
                battleLogToggle.textContent = '📜 Battle Log';
            }
        });
    }

    // Handle window resize for responsive monster field
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (game) {
                updateUI();
            }
        }, 250); // Debounce resize events
    });
}

function setupMusicControls() {
    // Get current music player (battle or main menu)
    // Check if musicPlayer and mainMenuMusicPlayer are defined (from music.js)
    const musicPlayerExists = typeof musicPlayer !== 'undefined' && musicPlayer !== null;
    const mainMenuMusicPlayerExists = typeof mainMenuMusicPlayer !== 'undefined' && mainMenuMusicPlayer !== null;
    const initializeMusicPlayerExists = typeof initializeMusicPlayer === 'function';
    
    const currentPlayer = (musicPlayerExists ? musicPlayer : null) || 
                         (mainMenuMusicPlayerExists ? mainMenuMusicPlayer : null) || 
                         (initializeMusicPlayerExists ? initializeMusicPlayer('mainmenu') : null);

    const playPauseBtn = document.getElementById('musicPlayPause');
    const prevBtn = document.getElementById('musicPrev');
    const nextBtn = document.getElementById('musicNext');
    const trackSelect = document.getElementById('musicTrackSelect');
    const volumeSlider = document.getElementById('musicVolume');

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            const player = (musicPlayerExists ? musicPlayer : null) || (mainMenuMusicPlayerExists ? mainMenuMusicPlayer : null);
            if (player) player.toggle();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const player = (musicPlayerExists ? musicPlayer : null) || (mainMenuMusicPlayerExists ? mainMenuMusicPlayer : null);
            if (player) player.playPrevious();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const player = (musicPlayerExists ? musicPlayer : null) || (mainMenuMusicPlayerExists ? mainMenuMusicPlayer : null);
            if (player) player.playNext();
        });
    }

    // Populate track selection dropdown
    if (trackSelect) {
        // Function to update dropdown
        const updateTrackSelect = (player) => {
            if (!player) return;
            trackSelect.innerHTML = '';
            player.tracks.forEach((track, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = track.name;
                trackSelect.appendChild(option);
            });
            trackSelect.value = player.currentTrackIndex;
        };
        
        // Update for current music player
        updateTrackSelect(currentPlayer);
        
        trackSelect.addEventListener('change', (e) => {
            const player = (musicPlayerExists ? musicPlayer : null) || (mainMenuMusicPlayerExists ? mainMenuMusicPlayer : null);
            if (player) player.selectTrack(parseInt(e.target.value));
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const player = (musicPlayerExists ? musicPlayer : null) || (mainMenuMusicPlayerExists ? mainMenuMusicPlayer : null);
            if (player) player.setVolume(e.target.value / 100);
        });
    }

    // Update UI initially
    if (currentPlayer) {
        currentPlayer.updateUI();
    }
}

function updateUI() {
    try {
        if (!game) {
            console.warn('[WARNING] updateUI called but game is null');
            return;
        }
        
        const player1 = game.players[0];
        const player2 = game.players[1];
        const currentPlayer = game.getCurrentPlayer();
        
        // Update turn indicator
        document.getElementById('turnIndicator').textContent = `${currentPlayer.name}'s Turn`;
        document.getElementById('turnNumber').textContent = game.turnNumber;
        
        // Update player stats
        document.getElementById('player1Stars').textContent = player1.stars;
        const p1FortHP = document.getElementById('player1FortHP');
        p1FortHP.textContent = player1.fort.hp;
        p1FortHP.style.cursor = 'default';
        
        // Update player title
        const player1Title = document.getElementById('player1Title');
        if (player1Title) {
            const title = getPlayerTitle();
            if (title) {
                player1Title.textContent = title;
                player1Title.style.display = 'block';
            } else {
                player1Title.style.display = 'none';
            }
        }
        
        document.getElementById('player2Stars').textContent = player2.stars;
        const p2FortHP = document.getElementById('player2FortHP');
        p2FortHP.textContent = player2.fort.hp;
        
        // Update character icons
        updateCharacterIcon('player1CharacterIcon', player1);
        updateCharacterIcon('player2CharacterIcon', player2);
        
        // Make opponent's fort clickable if attackable
    const opponent = game.getOpponent(currentPlayer);
    
    if (currentPlayer.id === 'player1') {
        // Player 1 can attack player 2's fort
        if (!opponent.hasAliveMonsters() || currentPlayer.getAliveMonsters().some(m => m.abilities.includes('direct_fort_attack'))) {
            p2FortHP.style.cursor = 'pointer';
            p2FortHP.style.color = '#ff6b6b';
            p2FortHP.title = 'Click to attack fort (select a monster first)';
            p2FortHP.onclick = () => handleFortAttack(opponent);
        } else {
            p2FortHP.style.cursor = 'default';
            p2FortHP.style.color = '#ffd700';
            p2FortHP.title = '';
            p2FortHP.onclick = null;
        }
    } else {
        // Player 2 can attack player 1's fort
        if (!opponent.hasAliveMonsters() || currentPlayer.getAliveMonsters().some(m => m.abilities.includes('direct_fort_attack'))) {
            p1FortHP.style.cursor = 'pointer';
            p1FortHP.style.color = '#ff6b6b';
            p1FortHP.title = 'Click to attack fort (select a monster first)';
            p1FortHP.onclick = () => handleFortAttack(opponent);
        } else {
            p1FortHP.style.cursor = 'default';
            p1FortHP.style.color = '#ffd700';
            p1FortHP.title = '';
            p1FortHP.onclick = null;
        }
    }
    
    // Update monster fields
    updateMonsterField('player1MonsterField', player1);
    updateMonsterField('player2MonsterField', player2);
    
    // Update hands
    updateHand('playerHand', player1);
    
    // Update spell/trap zones (combined)
    updateSpellTrapZone('player1SpellTrapZone', player1);
    updateSpellTrapZone('player2SpellTrapZone', player2);
        
        // Update graveyards
        updateGraveyard('player1Graveyard', player1);
        updateGraveyard('player2Graveyard', player2);
        
        // Update battle log
        updateBattleLog();
        
        // Check for win condition
        if (game.gameOver && game.winner) {
            showWinModal();
        }
        
        // Reset selection
        selectedCard = null;
        selectedMonsterSlot = null;
        upgradeMode = null;
        document.querySelectorAll('.hand-card').forEach(card => {
            card.classList.remove('selected');
        });
    } catch (error) {
        console.error('[ERROR] Error updating UI:', error);
    }
}

function updateMonsterField(fieldId, player) {
    const field = document.getElementById(fieldId);
    let slots = field.querySelector('.monster-slots');
    if (!slots) {
        // Create slots container if it doesn't exist
        slots = document.createElement('div');
        slots.className = 'monster-slots';
        field.appendChild(slots);
    } else {
        slots.innerHTML = '';
    }
    
    // Detect mobile - show 3 slots on mobile, 4 on desktop
    const isMobile = window.innerWidth <= 768;
    const maxVisibleSlots = isMobile ? 3 : 4;
    
    // Update field label
    const labelId = fieldId === 'player1MonsterField' ? 'player1MonsterFieldLabel' : 'player2MonsterFieldLabel';
    const label = document.getElementById(labelId);
    if (label) {
        label.textContent = `Monster Field (${maxVisibleSlots} slots${isMobile ? ' visible' : ''})`;
    }
    
    // Always iterate through all 4 slots
    for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        slot.className = 'monster-card empty';
        slot.dataset.slotIndex = i;
        
        const monster = player.monsterField[i];
        if (monster && monster.isAlive()) {
            const monsterElement = monster.createElement();
            monsterElement.dataset.slotIndex = i;
            monsterElement.dataset.monsterId = monster.id;
            
            // Ensure the element is visible and properly displayed
            monsterElement.style.display = 'flex';
            monsterElement.style.visibility = 'visible';
            monsterElement.style.opacity = '1';
            monsterElement.style.position = 'relative';
            monsterElement.style.zIndex = '2';
            
            // Check if this is a newly summoned monster (for animation)
            // Use a timestamp-based check instead of dataset to avoid persistence issues
            const monsterId = `${player.id}-${i}-${monster.id}`;
            const lastUpdateKey = `lastMonsterUpdate_${monsterId}`;
            const currentTime = Date.now();
            const lastUpdate = window[lastUpdateKey] || 0;
            
            // If this monster was just added (within last 2 seconds), animate it
            if (currentTime - lastUpdate < 2000) {
                monsterElement.classList.add('card-summoning');
                // Add highlight effect to the slot instead of full-screen flash
                monsterElement.classList.add('slot-highlight');
                setTimeout(() => {
                    // Remove animation class after animation completes
                    monsterElement.classList.remove('card-summoning');
                    monsterElement.classList.remove('slot-highlight');
                }, 600);
            }
            
            // Update timestamp
            window[lastUpdateKey] = currentTime;
            
            // Highlight selected monster
            if (selectedMonsterSlot === i && player.id === game.getCurrentPlayer().id) {
                monsterElement.style.borderColor = '#ffd700';
                monsterElement.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.8)';
            }
            
            // Add click handlers for current player's monsters
            if (player.id === game.getCurrentPlayer().id) {
                monsterElement.addEventListener('click', () => {
                    // If in spell target mode, allow targeting own monsters
                    if (window.spellTargetMode && selectedCard && selectedCard.type === 'spell') {
                        handleTargetSelection(player, i);
                        return;
                    }
                    
                    // Check if monster can still attack
                    if (!monster.canAttack()) {
                        game.log(`${monster.name} has already attacked this turn!`);
                        updateUI();
                        return;
                    }
                    
                    if (selectedMonsterSlot === null) {
                        // First click: select as attacker or show upgrade options
                        handleMonsterClick(player, i);
                    } else if (selectedMonsterSlot === i) {
                        // Clicked same monster: deselect
                        selectedMonsterSlot = null;
                        document.getElementById('upgradeOptions').innerHTML = '';
                        game.log('Attack cancelled.');
                        updateUI();
                    } else {
                        // Different monster: change selection and show upgrade options
                        if (!monster.canAttack()) {
                            game.log(`${monster.name} has already attacked this turn!`);
                            updateUI();
                            return;
                        }
                        selectedMonsterSlot = i;
                        // Show upgrade options for the newly selected monster
                        showMonsterUpgradeOptions(player, i, monster);
                        game.log(`Selected ${monster.name} to attack. Now select a target!`);
                        updateUI();
                    }
                });
            } else {
                // Opponent's monsters can be targeted
                monsterElement.addEventListener('click', () => {
                    handleTargetSelection(player, i);
                });
            }
            
            slots.appendChild(monsterElement);
        } else {
            slot.textContent = `Slot ${i + 1}`;
            slot.dataset.slotIndex = i; // Ensure slotIndex is set
            slots.appendChild(slot);
            
            // Allow placing monsters in empty slots
            if (player.id === game.getCurrentPlayer().id) {
                slot.addEventListener('click', (e) => {
                    // Get slotIndex from the clicked element to ensure accuracy
                    const clickedSlotIndex = parseInt(e.currentTarget.dataset.slotIndex) || i;
                    handleEmptySlotClick(player, clickedSlotIndex);
                });
            }
        }
        
        // On mobile, hide slot 4 (index 3) visually
        // Note: Game logic uses 4 slots, but mobile UI only shows 3
        if (isMobile && i >= 3) {
            const elementToHide = monster && monster.isAlive() ? slots.lastElementChild : slot;
            if (elementToHide) {
                elementToHide.style.display = 'none';
            }
        } else if (isMobile) {
            // Ensure visible slots are shown
            const elementToShow = monster && monster.isAlive() ? slots.lastElementChild : slot;
            if (elementToShow) {
                elementToShow.style.display = '';
            }
        }
    }
}

function updateHand(handId, player) {
    try {
        const hand = document.getElementById(handId);
        if (!hand) {
            console.error(`[ERROR] Hand element not found: ${handId}`);
            return;
        }
        
        hand.innerHTML = '';
        
        if (!player.hand || player.hand.length === 0) {
            console.warn(`[WARNING] ${player.name} has no cards in hand!`);
            const emptyMsg = document.createElement('div');
            emptyMsg.textContent = 'No cards in hand';
            emptyMsg.style.color = '#888';
            emptyMsg.style.padding = '20px';
            emptyMsg.style.textAlign = 'center';
            hand.appendChild(emptyMsg);
            return;
        }
        
        player.hand.forEach((card, index) => {
            try {
                if (!card) {
                    console.warn(`[WARNING] Card at index ${index} is null/undefined`);
                    return;
                }
                
                if (typeof card.createElement !== 'function') {
                    console.error(`[ERROR] Card ${index} does not have createElement method:`, card);
                    return;
                }
                
                const cardElement = card.createElement();
                if (!cardElement) {
                    console.error(`[ERROR] Failed to create element for card ${index}: ${card.name || card.id}`);
                    return;
                }
                
                cardElement.addEventListener('click', (e) => {
                    handleCardClick(card, player, e);
                });
                hand.appendChild(cardElement);
            } catch (error) {
                console.error(`[ERROR] Error adding card ${index} to hand:`, error);
            }
        });
        
        // Simple animation - no spam
        const newCards = hand.querySelectorAll('.hand-card');
        newCards.forEach((card, index) => {
            card.style.opacity = '1';
        });
    } catch (error) {
        console.error('[ERROR] Error updating hand:', error);
    }
}

function updateSpellTrapZone(zoneId, player) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    const label = zone.querySelector('.zone-label');
    zone.innerHTML = '';
    zone.appendChild(label);
    
    // Detect mobile - show 3 slots on mobile, 5 on desktop
    const isMobile = window.innerWidth <= 768;
    const maxVisibleSlots = isMobile ? 3 : 5;
    
    // Always iterate through all 5 slots internally (game logic uses 5)
    for (let i = 0; i < 5; i++) {
        const card = player.spellTrapZone[i];
        if (card) {
            const cardElement = card.createElement();
            cardElement.dataset.zoneIndex = i;
            // Hide slots beyond visible limit on mobile
            if (isMobile && i >= maxVisibleSlots) {
                cardElement.style.display = 'none';
            }
            zone.appendChild(cardElement);
        } else {
            // Show empty slot
            const emptySlot = document.createElement('div');
            emptySlot.className = 'spell-card empty-spell-trap-slot';
            emptySlot.dataset.zoneIndex = i;
            emptySlot.textContent = `Slot ${i + 1}`;
            emptySlot.style.opacity = '0.3';
            emptySlot.style.cursor = 'pointer';
            
            // Hide slots beyond visible limit on mobile
            if (isMobile && i >= maxVisibleSlots) {
                emptySlot.style.display = 'none';
            }
            
            if (player.id === game.getCurrentPlayer().id) {
                emptySlot.addEventListener('click', () => {
                    if (selectedCard && (selectedCard.type === 'spell' || selectedCard.type === 'trap')) {
                        handleSpellTrapSlotClick(player, i);
                    }
                });
            }
            zone.appendChild(emptySlot);
        }
    }
}

function handleSpellTrapSlotClick(player, slotIndex) {
    if (player.id !== game.getCurrentPlayer().id) return;
    if (!selectedCard || (selectedCard.type !== 'spell' && selectedCard.type !== 'trap')) return;
    
    // Check if spell needs a target first
    // Note: vitality_surge doesn't need a target - it affects all monsters
    if (selectedCard.type === 'spell' && (selectedCard.id === 'lightning_bolt' || selectedCard.id === 'heal')) {
        if (!window.spellTargetMode) {
            game.log(`Select a target monster to use ${selectedCard.name}`);
            window.spellTargetMode = true;
            return;
        }
    }
    
    let result;
    if (selectedCard.type === 'spell') {
        result = player.playSpell(selectedCard, slotIndex);
        if (result.success && result.spell) {
            // Trigger trap checks for opponent (like Star Drain)
            game.triggerCardPlayTrap(player, selectedCard);
            
            // Update UI first to show spell on field
            updateUI();
            
            // Wait a moment to show spell on field, then execute
            setTimeout(() => {
                // Execute spell
                if (!result.spell) {
                    console.error('[SPELL] Spell object is missing from result');
                    // Refund if spell object is missing
                    player.stars += selectedCard.cost;
                    player.spellTrapZone[slotIndex] = null;
                    player.hand.push(selectedCard);
                    updateUI();
                    return;
                }
                
                const spellResult = result.spell.execute(game, player, window.spellTarget ? window.spellTarget : null);
                if (!spellResult || !spellResult.success) {
                    // Refund if spell failed
                    player.stars += selectedCard.cost;
                    player.spellTrapZone[slotIndex] = null;
                    player.hand.push(selectedCard);
                    game.log(spellResult && spellResult.message ? spellResult.message : 'Spell failed to execute');
                } else {
                    // Check if spell is continuous (stays on field)
                    const isContinuous = isContinuousSpell(selectedCard);
                    if (!isContinuous) {
                        // Send to graveyard after execution (non-continuous spells)
                        // Wait a bit more to show it on field before moving to graveyard
                        setTimeout(() => {
                            player.graveyard.push(selectedCard);
                            player.spellTrapZone[slotIndex] = null;
                            updateUI();
                        }, 800); // Show on field for 0.8 seconds
                    }
                    // Continuous spells stay in the zone
                }
                window.spellTargetMode = false;
                window.spellTarget = null;
                
                // Force UI update to show spell effects (especially for attack boosts and card draws)
                updateUI();
            }, 300); // Small delay to show spell on field first
        }
    } else {
        result = player.playTrap(selectedCard, slotIndex);
    }
    
    // Check if result exists and has success property
    if (result && result.success) {
        game.log(`${player.name} plays ${selectedCard.name}!`);
        
        // Trigger trap checks for opponent when playing cards
        if (selectedCard.type === 'monster' || selectedCard.type === 'trap') {
            game.triggerCardPlayTrap(player, selectedCard);
        }
        
        const cardElement = document.querySelector(`[data-card-id="${selectedCard.id}"].selected`);
        if (cardElement) {
            animateCardPlay(cardElement);
        }
        selectedCard = null;
        // Update UI again to ensure all changes are reflected
        updateUI();
    } else if (result && result.message) {
        game.log(result.message);
        updateUI();
    } else if (!result) {
        // Handle case where result is undefined
        game.log('Failed to play card. Please try again.');
        updateUI();
    }
}

// Check if a spell is continuous (stays on field)
function isContinuousSpell(card) {
    if (card.type !== 'spell') return false;
    
    // Continuous spells have permanent or field effects
    const continuousEffects = [
        'permanent_attack_boost',
        'permanent_health_boost',
        'grant_extra_upgrades'
    ];
    
    return continuousEffects.includes(card.data.effect);
}

// Store graveyard click handlers to prevent duplicates
const graveyardHandlers = new Map();

function updateGraveyard(graveyardId, player) {
    const graveyard = document.getElementById(graveyardId);
    if (!graveyard) return;
    
    const label = graveyard.querySelector('.zone-label');
    const count = player.graveyard.length;
    label.textContent = `Graveyard (${count})`;
    
    // Remove existing handler if any
    if (graveyardHandlers.has(graveyardId)) {
        const oldHandler = graveyardHandlers.get(graveyardId);
        graveyard.removeEventListener('click', oldHandler);
    }
    
    // Make graveyard clickable
    graveyard.style.cursor = count > 0 ? 'pointer' : 'default';
    graveyard.style.transition = 'all 0.3s';
    
    if (count > 0) {
        const clickHandler = () => {
            showGraveyardModal(player);
        };
        graveyard.addEventListener('click', clickHandler);
        graveyardHandlers.set(graveyardId, clickHandler);
        
        // Add hover effect
        graveyard.addEventListener('mouseenter', () => {
            graveyard.style.background = 'rgba(139, 0, 0, 0.6)';
            graveyard.style.transform = 'scale(1.05)';
        });
        
        graveyard.addEventListener('mouseleave', () => {
            graveyard.style.background = '';
            graveyard.style.transform = '';
        });
    }
}

function showGraveyardModal(player) {
    const modal = document.getElementById('cardModal');
    const modalContent = document.getElementById('modalCardDetails');
    
    if (!modal || !modalContent) return;
    
    if (player.graveyard.length === 0) {
        modalContent.innerHTML = `
            <h3>${player.name}'s Graveyard</h3>
            <p style="text-align: center; padding: 20px; color: #888;">Graveyard is empty</p>
        `;
    } else {
        let html = `<h3>${player.name}'s Graveyard (${player.graveyard.length} cards)</h3>`;
        html += '<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">';
        
        player.graveyard.forEach((card, index) => {
            // Try to get card image
            const cardImage = card.createElement ? card.createElement().querySelector('img') : null;
            const imageSrc = cardImage ? cardImage.src : '';
            
            html += `
                <div style="background: rgba(0, 0, 0, 0.5); padding: 10px; border-radius: 8px; border: 2px solid rgba(255, 255, 255, 0.2); min-width: 150px; max-width: 200px;">
                    ${imageSrc ? `<img src="${imageSrc}" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" onerror="this.style.display='none';">` : ''}
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 5px;">${card.name}</div>
                    <div style="font-size: 0.85em; color: #ccc; margin-bottom: 5px;">${card.description || 'No description'}</div>
                    <div style="font-size: 0.8em; color: #888;">Type: ${card.type} | Cost: ⭐${card.cost || 0}</div>
                </div>
            `;
        });
        
        html += '</div>';
        modalContent.innerHTML = html;
    }
    
    modal.style.display = 'block';
}

// Store AI avatar selection so it stays consistent
let aiAvatarSelected = null;

function updateCharacterIcon(iconId, player) {
    const iconContainer = document.getElementById(iconId);
    if (!iconContainer) return;
    
    const img = iconContainer.querySelector('img');
    const placeholder = iconContainer.querySelector('.character-icon-placeholder');
    
    // Determine which image to use based on player type
    let imagePath;
    if (player.name === 'AI Opponent') {
        // Randomly select AI avatar (girl or rival) and keep it consistent
        if (!aiAvatarSelected) {
            // Try common filename variations
            const aiAvatars = ['girl.png', 'rival.png', 'girl1.png', 'main2.png'];
            aiAvatarSelected = aiAvatars[Math.floor(Math.random() * aiAvatars.length)];
        }
        imagePath = `assets/images/avatar/${aiAvatarSelected}`;
    } else {
        // Player always uses main.png
        imagePath = 'assets/images/avatar/main.png';
    }
    
    if (img) {
        // Hide placeholder first
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        img.src = imagePath;
        img.alt = player.name;
        img.style.display = 'block';
        
        // Try multiple image variations if first fails
        const tryImageVariations = (variations, index = 0) => {
            if (index >= variations.length) {
                // All variations failed, show placeholder
                img.style.display = 'none';
                if (placeholder) {
                    placeholder.style.display = 'block';
                    placeholder.textContent = player.name === 'AI Opponent' ? '🤖' : '👤';
                }
                return;
            }
            
            img.src = `assets/images/avatar/${variations[index]}`;
        };
        
        // Show placeholder if image fails to load
        img.onerror = function() {
            if (player.name === 'AI Opponent') {
                // Try other AI avatar variations
                const variations = ['girl.png', 'rival.png', 'girl1.png', 'main2.png'];
                const currentIndex = variations.indexOf(aiAvatarSelected);
                if (currentIndex < variations.length - 1) {
                    aiAvatarSelected = variations[currentIndex + 1];
                    this.src = `assets/images/avatar/${aiAvatarSelected}`;
                } else {
                    // All failed, show placeholder
                    this.style.display = 'none';
                    if (placeholder) {
                        placeholder.style.display = 'block';
                        placeholder.textContent = '🤖';
                    }
                }
            } else {
                // Try main.png variations
                const variations = ['main.png', 'main1.png'];
                if (this.src.includes('main.png') && variations.length > 1) {
                    this.src = 'assets/images/avatar/main1.png';
                } else {
                    this.style.display = 'none';
                    if (placeholder) {
                        placeholder.style.display = 'block';
                        placeholder.textContent = '👤';
                    }
                }
            }
        };
        
        img.onload = function() {
            this.style.display = 'block';
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        };
    }
    
}


function updateBattleLog() {
    const logContent = document.getElementById('logContent');
    logContent.innerHTML = '';
    
    const entries = game.getLogEntries();
    entries.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[Turn ${entry.turn}] ${entry.message}`;
        logContent.appendChild(logEntry);
    });
    
    // Auto-scroll to bottom
    logContent.scrollTop = logContent.scrollHeight;
}

// Track last click time for double-click detection
let lastCardClickTime = 0;
let lastCardClickId = null;

function handleCardClick(card, player, event) {
    if (player.id !== game.getCurrentPlayer().id) return;
    if (game.gameOver) return;
    
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - lastCardClickTime;
    const isDoubleClick = (card.id === lastCardClickId && timeSinceLastClick < 500); // 500ms double-click window
    
    // Update last click info
    lastCardClickTime = currentTime;
    lastCardClickId = card.id;
    
    // Deselect other cards
    document.querySelectorAll('.hand-card').forEach(c => c.classList.remove('selected'));
    
    // Select this card
    const cardElement = (event && event.target.closest('.hand-card')) || document.querySelector(`[data-card-id="${card.id}"]`);
    if (cardElement) {
        cardElement.classList.add('selected');
        selectedCard = card;
        
        if (card.type === 'monster') {
            // Check if player has enough stars
            if (!player.canPlayCard(card)) {
                game.log(`Not enough Stars to play ${card.name}! You have ${player.stars} Stars, but it costs ${card.cost} Stars.`);
                selectedCard = null;
                cardElement.classList.remove('selected');
                updateUI();
                return;
            }
            
            // Double-click: automatically summon to first available slot
            if (isDoubleClick) {
                // Find first available slot
                const availableSlot = player.monsterField.findIndex(slot => slot === null);
                
                if (availableSlot === -1) {
                    game.log('No empty monster slots available!');
                    selectedCard = null;
                    cardElement.classList.remove('selected');
                    updateUI();
                    return;
                }
                
                // On mobile, prevent placing in slot 4 (index 3)
                const isMobile = window.innerWidth <= 768;
                if (isMobile && availableSlot >= 3) {
                    game.log('On mobile, only the first 3 monster slots are available. Please remove a monster first.');
                    selectedCard = null;
                    cardElement.classList.remove('selected');
                    updateUI();
                    return;
                }
                
                // Automatically summon the monster
                handleEmptySlotClick(player, availableSlot);
                return;
            }
            
            // Single click: show message (for now, but double-click is the main way)
            game.log(`Double-click to summon ${card.name}, or click an empty slot`);
        } else if (card.type === 'spell') {
            // Check if player has enough stars
            if (!player.canPlayCard(card)) {
                game.log(`Not enough Stars to play ${card.name}! You have ${player.stars} Stars, but it costs ${card.cost} Stars.`);
                selectedCard = null;
                cardElement.classList.remove('selected');
                updateUI();
                return;
            }
            
            // Check if spell needs a target (like lightning bolt, heal)
            // Note: vitality_surge doesn't need a target - it affects all monsters
            if (card.id === 'lightning_bolt' || card.id === 'heal') {
                // Double-click: automatically target (if possible) or show target mode
                if (isDoubleClick) {
                    game.log(`Select a target monster to use ${card.name}`);
                    selectedCard = card;
                    window.spellTargetMode = true;
                    return;
                }
                // Single click: show message
                game.log(`Double-click to use ${card.name}, then select a target`);
                selectedCard = card;
                window.spellTargetMode = true;
            } else {
                // Spells that don't need targets or go to the zone - double-click auto-plays
                if (isDoubleClick) {
                    // Find first available spell/trap slot
                    const availableSlot = player.spellTrapZone.findIndex(slot => slot === null);
                    
                    if (availableSlot === -1) {
                        game.log('No empty spell/trap slots available!');
                        selectedCard = null;
                        cardElement.classList.remove('selected');
                        updateUI();
                        return;
                    }
                    
                    // Automatically play the spell/trap
                    handleSpellTrapSlotClick(player, availableSlot);
                    return;
                }
                // Single click: show message
                game.log(`Double-click to play ${card.name}, or click an empty spell/trap slot`);
                selectedCard = card;
            }
        } else if (card.type === 'trap') {
            // Traps go in spell/trap zone
            if (!player.canPlayCard(card)) {
                game.log(`Not enough Stars to play ${card.name}! You have ${player.stars} Stars, but it costs ${card.cost} Stars.`);
                selectedCard = null;
                cardElement.classList.remove('selected');
                updateUI();
                return;
            }
            
            // Double-click: auto-place trap
            if (isDoubleClick) {
                // Find first available spell/trap slot
                const availableSlot = player.spellTrapZone.findIndex(slot => slot === null);
                
                if (availableSlot === -1) {
                    game.log('No empty spell/trap slots available!');
                    selectedCard = null;
                    cardElement.classList.remove('selected');
                    updateUI();
                    return;
                }
                
                // Automatically play the trap
                handleSpellTrapSlotClick(player, availableSlot);
                return;
            }
            
            // Single click: show message
            game.log(`Double-click to play ${card.name}, or click an empty spell/trap slot`);
            selectedCard = card;
        }
    }
}

function handleEmptySlotClick(player, slotIndex) {
    if (player.id !== game.getCurrentPlayer().id) return;
    if (!selectedCard || selectedCard.type !== 'monster') {
        if (!selectedCard) {
            game.log('Please select a monster card from your hand first!');
        }
        return;
    }
    
    // Validate slotIndex
    if (slotIndex < 0 || slotIndex >= 4) {
        game.log(`Invalid slot index: ${slotIndex}`);
        return;
    }
    
    // Check if slot is already occupied
    if (player.monsterField[slotIndex] !== null) {
        game.log(`Slot ${slotIndex + 1} is already occupied!`);
        updateUI();
        return;
    }
    
    // On mobile, prevent placing monsters in slot 4 (index 3)
    const isMobile = window.innerWidth <= 768;
    if (isMobile && slotIndex >= 3) {
        game.log('On mobile, only the first 3 monster slots are available. Please use slots 1-3.');
        updateUI();
        return;
    }
    
    // Play monster in the EXACT slot specified
    const result = player.playMonster(selectedCard, slotIndex);
    if (result.success) {
        game.log(`${player.name} plays ${selectedCard.name} in slot ${slotIndex + 1}!`);
        
        // Mark this monster as just summoned for animation (before updateUI)
        const monsterId = `${player.id}-${slotIndex}-${selectedCard.id}`;
        const lastUpdateKey = `lastMonsterUpdate_${monsterId}`;
        window[lastUpdateKey] = Date.now();
        
        // Trigger trap checks for opponent when playing monsters
        game.triggerCardPlayTrap(player, selectedCard);
        
        // Animate card play
        const cardElement = document.querySelector(`[data-card-id="${selectedCard.id}"].selected`);
        if (cardElement) {
            animateCardPlay(cardElement);
        }
        
        // Clear selection
        selectedCard = null;
        document.querySelectorAll('.hand-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Immediately update UI to show the new monster
        updateUI();
        
        // Force a second update after a tiny delay to ensure visibility
        setTimeout(() => {
            updateUI();
        }, 100);
    } else {
        // Show detailed error message
        game.log(`Cannot summon ${selectedCard.name}: ${result.message}`);
        if (result.message.includes('Stars')) {
            game.log(`You have ${player.stars} Stars, but ${selectedCard.name} costs ${selectedCard.cost} Stars.`);
        }
        updateUI();
    }
}

function handleMonsterClick(player, slotIndex) {
    if (player.id !== game.getCurrentPlayer().id) return;
    
    const monster = player.monsterField[slotIndex];
    if (!monster || !monster.isAlive()) return;
    
    // Check if monster can still attack
    if (!monster.canAttack()) {
        game.log(`${monster.name} has already attacked this turn!`);
        updateUI();
        return;
    }
    
    // Check if opponent has monsters - if not, allow fort attack
    const opponent = game.getOpponent(player);
    if (!opponent.hasAliveMonsters() || monster.abilities.includes('direct_fort_attack')) {
        // Can attack fort
        const result = game.attackFort(player, slotIndex, opponent);
        if (result.success) {
            selectedMonsterSlot = null;
        }
        updateUI();
    } else {
        // Show upgrade options and allow selecting as attacker
        selectedMonsterSlot = slotIndex;
        showMonsterUpgradeOptions(player, slotIndex, monster);
        game.log(`Selected ${monster.name}. Click opponent's monster to attack, or upgrade below.`);
    }
}

function handleTargetSelection(targetPlayer, slotIndex) {
    const currentPlayer = game.getCurrentPlayer();
    const target = targetPlayer.monsterField[slotIndex];
    
    if (!target || !target.isAlive()) return;
    
    // Check if we're in spell target mode (lightning bolt, heal, etc.)
    if (window.spellTargetMode && selectedCard && selectedCard.type === 'spell') {
        const spell = selectedCard;
        const result = currentPlayer.playSpell(spell);
        if (result.success) {
            const spellResult = result.spell.execute(game, currentPlayer, target);
            if (spellResult.success) {
                game.log(`${currentPlayer.name} plays ${spell.name}!`);
                animateCardPlay(document.querySelector(`[data-card-id="${spell.id}"].selected`));
            } else {
                // Refund if spell failed
                currentPlayer.stars += spell.cost;
                currentPlayer.hand.push(spell);
            }
            window.spellTargetMode = false;
            selectedCard = null;
            updateUI();
        }
        return;
    }
    
    // Check if we have a selected attacker (monster battle)
    if (selectedMonsterSlot !== null && currentPlayer.monsterField[selectedMonsterSlot] && 
        currentPlayer.monsterField[selectedMonsterSlot].isAlive()) {
        if (game.getCurrentPlayer().id === targetPlayer.id) {
            // Can't attack own monsters
            return;
        }
        // Attack with selected monster
        const result = game.attackMonster(currentPlayer, selectedMonsterSlot, targetPlayer, slotIndex);
        selectedMonsterSlot = null;
        // Update UI after animation delay
        setTimeout(() => {
            updateUI();
        }, 700);
    } else {
        // Select attacker first
        const aliveMonsters = currentPlayer.getAliveMonsters();
        if (aliveMonsters.length === 0) {
            game.log('You have no monsters to attack with!');
            updateUI();
            return;
        }
        
        // If only one monster, use it automatically
        if (aliveMonsters.length === 1) {
            const attackerSlot = currentPlayer.monsterField.findIndex(m => m && m.isAlive());
            const result = game.attackMonster(currentPlayer, attackerSlot, targetPlayer, slotIndex);
            setTimeout(() => {
                updateUI();
            }, 700);
        } else {
            game.log('Click one of your monsters to attack with, then click the target!');
            updateUI();
        }
    }
}

function handleAttackerSelection(player, slotIndex) {
    if (player.id !== game.getCurrentPlayer().id) return;
    
    const monster = player.monsterField[slotIndex];
    if (!monster || !monster.isAlive()) return;
    
    selectedMonsterSlot = slotIndex;
    game.log(`Selected ${monster.name} to attack. Now select a target!`);
    updateUI();
}

function showMonsterUpgradeOptions(player, slotIndex, monster) {
    const upgradeOptions = document.getElementById('upgradeOptions');
    const attackUpgradesLeft = player.maxAttackUpgrades - player.attackUpgradesThisTurn;
    const defenseUpgradesLeft = player.maxDefenseUpgrades - player.defenseUpgradesThisTurn;
    const canUpgradeAttack = attackUpgradesLeft > 0 && player.stars >= 2;
    const canUpgradeDefense = defenseUpgradesLeft > 0 && player.stars >= 2;
    
    upgradeOptions.innerHTML = `
        <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
            <div style="font-weight: bold; margin-bottom: 10px;">Upgrade ${monster.name}:</div>
            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 5px;" 
                    onclick="upgradeMonsterWeapon(${slotIndex})"
                    ${!canUpgradeAttack ? 'disabled' : ''}>
                Upgrade Weapon (2⭐) ${attackUpgradesLeft > 0 ? `(${attackUpgradesLeft} left)` : '(Limit reached)'}
            </button>
            <button class="btn btn-secondary" style="width: 100%;" 
                    onclick="upgradeMonsterArmor(${slotIndex})"
                    ${!canUpgradeDefense ? 'disabled' : ''}>
                Upgrade Armor (2⭐) ${defenseUpgradesLeft > 0 ? `(${defenseUpgradesLeft} left)` : '(Limit reached)'}
            </button>
        </div>
    `;
}

function upgradeMonsterWeapon(slotIndex) {
    const player = game.getCurrentPlayer();
    const monster = player.monsterField[slotIndex];
    if (!monster) return;
    
    const result = player.upgradeMonsterWeapon(slotIndex);
    if (result.success) {
        game.log(`${player.name} upgrades ${monster.name}'s weapon!`);
        // Refresh upgrade options for THIS monster to show updated limits
        showMonsterUpgradeOptions(player, slotIndex, monster);
        // Also update UI to refresh all monster upgrade buttons
        updateUI();
    } else {
        game.log(result.message);
        updateUI();
    }
}

function upgradeMonsterArmor(slotIndex) {
    const player = game.getCurrentPlayer();
    const monster = player.monsterField[slotIndex];
    if (!monster) return;
    
    const result = player.upgradeMonsterArmor(slotIndex);
    if (result.success) {
        game.log(`${player.name} upgrades ${monster.name}'s armor!`);
        // Refresh upgrade options for THIS monster to show updated limits
        showMonsterUpgradeOptions(player, slotIndex, monster);
        // Also update UI to refresh all monster upgrade buttons
        updateUI();
    } else {
        game.log(result.message);
        updateUI();
    }
}

function showFortUpgradeOptions() {
    const player = game.getCurrentPlayer();
    if (player.stars < 5) {
        game.log('Not enough Stars to upgrade fort (need 5)');
        updateUI();
        return;
    }
    
    const upgradeOptions = document.getElementById('upgradeOptions');
    upgradeOptions.innerHTML = `
        <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
            <div style="font-weight: bold; margin-bottom: 10px;">Upgrade Fort:</div>
            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 5px;" 
                    onclick="upgradeFort('defense')">
                +2 Defense (5⭐)
            </button>
            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 5px;" 
                    onclick="upgradeFort('stars')">
                +1 Star/Turn (5⭐)
            </button>
            <button class="btn btn-secondary" style="width: 100%;" 
                    onclick="upgradeFort('hp')">
                +20 Max HP (5⭐)
            </button>
        </div>
    `;
}

function upgradeFort(upgradeType) {
    const player = game.getCurrentPlayer();
    const result = player.upgradeFort(upgradeType);
    if (result.success) {
        game.log(`${player.name} upgrades their fort: ${result.message}!`);
    } else {
        game.log(result.message);
    }
    updateUI();
}

function handleFortAttack(targetPlayer) {
    const currentPlayer = game.getCurrentPlayer();
    
    if (selectedMonsterSlot !== null && currentPlayer.monsterField[selectedMonsterSlot] && 
        currentPlayer.monsterField[selectedMonsterSlot].isAlive()) {
        const result = game.attackFort(currentPlayer, selectedMonsterSlot, targetPlayer);
        selectedMonsterSlot = null;
        updateUI();
    } else {
        // Check if any monster can attack fort
        const canAttackFort = !targetPlayer.hasAliveMonsters() || 
            currentPlayer.getAliveMonsters().some(m => m.abilities.includes('direct_fort_attack'));
        
        if (canAttackFort) {
            game.log('Select one of your monsters to attack the fort!');
        } else {
            game.log('Cannot attack fort while opponent has monsters!');
        }
        updateUI();
    }
}

// Show defeat screen (Yu-Gi-Oh style) when a player loses
window.showDefeatScreen = function(defeatedPlayer, winner) {
    // Show the WINNER's face, not the loser's
    // If player 1 won, show player 1's face. If AI won, show AI's face.
    let faceImagePath;
    let messageText;
    
    if (winner.id === 'player1') {
        // Player won - show player's face with "YOU WON!"
        faceImagePath = 'assets/images/avatar/main.png';
        messageText = 'YOU WON!';
    } else {
        // AI won - show AI's face with "YOU LOST!"
        if (aiAvatarSelected) {
            faceImagePath = `assets/images/avatar/${aiAvatarSelected}`;
        } else {
            // Fallback: try common variations
            faceImagePath = 'assets/images/avatar/girl.png';
        }
        messageText = 'YOU LOST!';
    }
    
    // Create defeat screen overlay
    const defeatScreen = document.createElement('div');
    defeatScreen.className = 'defeat-screen';
    
    const faceContainer = document.createElement('div');
    faceContainer.className = 'defeat-face-container';
    
    const faceImg = document.createElement('img');
    faceImg.className = 'defeat-face';
    faceImg.alt = winner.name;
    faceImg.src = faceImagePath;
    
    // Try image variations if first fails
    faceImg.onerror = function() {
        if (winner.id === 'player1') {
            // Try main.png variations for player
            if (this.src.includes('main.png')) {
                this.src = 'assets/images/avatar/main1.png';
            }
        } else {
            // Try other AI avatar variations
            const variations = ['girl.png', 'rival.png', 'girl1.png', 'main2.png'];
            let currentIndex = variations.indexOf(aiAvatarSelected || 'girl.png');
            if (currentIndex === -1) currentIndex = 0;
            
            if (currentIndex < variations.length - 1) {
                this.src = `assets/images/avatar/${variations[currentIndex + 1]}`;
            } else {
                // If all fail, show a fallback (but keep trying)
                console.warn('Could not load AI avatar image, using placeholder');
            }
        }
    };
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'defeat-message';
    messageDiv.textContent = messageText;
    messageDiv.dataset.text = messageText; // For gold overlay effect
    
    // Add sparkles around the message (only for "YOU WON!")
    if (messageText === 'YOU WON!') {
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('span');
            sparkle.className = 'sparkle';
            sparkle.textContent = '✨';
            sparkle.style.left = `${10 + (i * 12)}%`;
            sparkle.style.top = `${-30 + (i % 2) * 60}px`;
            sparkle.style.animationDelay = `${i * 0.2}s`;
            messageDiv.appendChild(sparkle);
        }
    }
    
    faceContainer.appendChild(faceImg);
    faceContainer.appendChild(messageDiv);
    defeatScreen.appendChild(faceContainer);
    document.body.appendChild(defeatScreen);
    
    // Animate face appearing
    setTimeout(() => {
        defeatScreen.classList.add('show');
    }, 100);
    
    // After showing face, fade it out and show win modal
    setTimeout(() => {
        defeatScreen.classList.add('fade-out');
        setTimeout(() => {
            defeatScreen.remove();
            // Show regular win modal
            showWinModal();
        }, 1500);
    }, 2500); // Show face for 2.5 seconds
};

function showWinModal() {
    const modal = document.getElementById('winModal');
    const winTitle = document.getElementById('winTitle');
    const winMessage = document.getElementById('winMessage');
    
    const titles = ['Fort Master', 'King of Games', 'Fortress Conqueror', 'Defender Supreme'];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    
    // Check if player 1 won
    const playerWon = game.winner && game.winner.id === 'player1';
    
    winTitle.textContent = playerWon ? `${randomTitle}!` : 'Defeat!';
    winMessage.textContent = playerWon 
        ? `${game.winner.name} has successfully defended their fort and conquered their opponent!`
        : `${game.winner.name} has defeated you! Better luck next time!`;
    
    // Award currency based on win/loss
    awardBattleCurrency(playerWon);
    
    modal.style.display = 'block';
    modal.classList.add('win-animation');
}

// Show main menu
function showMainMenu() {
    const mainMenu = document.getElementById('mainMenu');
    const gameContainer = document.getElementById('gameContainer');
    
    if (mainMenu) {
        mainMenu.style.display = 'flex';
    }
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
    
    // Close any open modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Make showMainMenu globally available
if (typeof window !== 'undefined') {
    window.showMainMenu = showMainMenu;
    window.hideMainMenu = hideMainMenu;
}

// Hide main menu and show game
function hideMainMenu() {
    const mainMenu = document.getElementById('mainMenu');
    const gameContainer = document.getElementById('gameContainer');
    
    if (mainMenu) {
        mainMenu.style.display = 'none';
    }
    if (gameContainer) {
        gameContainer.style.display = 'block';
    }
}

// Show game mode selection (for Play Game button)
function showGameModeSelection() {
    // Remove existing modal if present
    const existingModal = document.getElementById('gameModeModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'gameModeModal';
    modal.style.display = 'block';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    
    // Use larger, more mobile-friendly buttons
    modal.innerHTML = `
        <div class="modal-content win-modal">
            <h2 style="margin-top: 0;">🛡️ Defend the Fort</h2>
            <p style="margin: 20px 0; font-size: 1.2em; font-weight: 500;">Choose your game mode:</p>
            <button class="btn btn-primary" style="width: 100%; margin-bottom: 15px; font-size: 1.2em; padding: 18px; min-height: 60px; border-radius: 10px; font-weight: bold; touch-action: manipulation;" onclick="startGame(false)">
                👥 Player vs Player
            </button>
            <button class="btn btn-secondary" style="width: 100%; font-size: 1.2em; padding: 18px; min-height: 60px; border-radius: 10px; font-weight: bold; touch-action: manipulation;" onclick="startGame(true)">
                🤖 Player vs AI
            </button>
            <button class="btn btn-secondary" style="width: 100%; margin-top: 15px; font-size: 1em; padding: 12px; border-radius: 10px; touch-action: manipulation;" onclick="closeGameModeSelection(); showMainMenu();">
                ← Back to Main Menu
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Force a reflow to ensure modal is visible
    modal.offsetHeight;
    
    // Add click outside to close (optional, but helpful)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // Don't close on mobile - require button click
            // modal.style.display = 'none';
        }
    });
}

function showBattleIntro(aiEnabled) {
    const introModal = document.getElementById('battleIntroModal');
    if (!introModal) {
        // If modal doesn't exist, just start the game
        initializeGame(aiEnabled);
        if (musicPlayer && typeof musicPlayer.play === 'function') {
            const playPromise = musicPlayer.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(error => {
                    console.warn('[MUSIC] Autoplay prevented:', error);
                });
            }
        }
        return;
    }

    // Initialize the game FIRST so it's visible behind the intro
    initializeGame(aiEnabled);
    
        // Switch to battle music when battle starts
        switchToBattleMusic();
        
        // Small delay to ensure game UI is rendered
        setTimeout(() => {
            // Show the intro screen overlay
            introModal.style.display = 'flex';
            introModal.style.pointerEvents = 'auto'; // Block interactions during intro
            introModal.style.opacity = '1';
        
        // Reset animations
        const title = introModal.querySelector('.battle-intro-title');
        const subtitle = introModal.querySelector('.battle-intro-subtitle');
        const narrator = introModal.querySelector('.battle-intro-narrator');
        const commence = introModal.querySelector('.battle-intro-commence');
        
        if (title) {
            title.style.animation = 'none';
            title.style.opacity = '0';
            title.style.transform = 'translateY(-100px)';
            setTimeout(() => {
                title.style.animation = 'titleSlideIn 0.8s ease-out forwards';
            }, 10);
        }
        
        if (subtitle) {
            subtitle.style.animation = 'none';
            subtitle.style.opacity = '0';
            subtitle.style.transform = 'translateX(calc(50vw + 100%))';
            setTimeout(() => {
                subtitle.style.animation = 'subtitleSlideIn 2.5s ease-in-out 0.5s forwards';
            }, 10);
        }
        
        // Show narrator text (matches the voice)
        if (narrator) {
            narrator.textContent = 'Let the battle commence!';
            narrator.style.animation = 'none';
            narrator.style.opacity = '0';
            narrator.style.transform = 'translateY(10px)';
            setTimeout(() => {
                narrator.style.animation = 'narratorFadeIn 0.6s ease-out 1s forwards, narratorFadeOut 0.6s ease-out 2.5s forwards';
            }, 10);
        }
        
        if (commence) {
            commence.style.animation = 'none';
            commence.style.opacity = '0';
            commence.style.transform = 'translateY(20px)';
            setTimeout(() => {
                commence.style.animation = 'commenceFadeIn 0.8s ease-out 2.8s forwards';
            }, 10);
        }

        // After animations complete (about 4 seconds), fade out intro and start music
        setTimeout(() => {
            // Fade out the intro overlay
            introModal.style.transition = 'opacity 0.5s ease-out';
            introModal.style.opacity = '0';
            
            setTimeout(() => {
                introModal.style.display = 'none';
                introModal.style.pointerEvents = 'none'; // Allow clicks through
            }, 500);
            
            // Auto-start music when battle begins
            if (musicPlayer && typeof musicPlayer.play === 'function') {
                const playPromise = musicPlayer.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(error => {
                        console.warn('[MUSIC] Autoplay prevented, user needs to interact first:', error);
                        // Music will start when user clicks play button
                    });
                }
            }
        }, 4000); // Total animation time: 0.8s title + 0.5s delay + 2.5s subtitle + 0.3s gap + 0.6s narrator + 0.8s commence = ~4s
    }, 100); // Small delay to ensure game is rendered
}

window.startGame = function(aiEnabled) {
    const modal = document.getElementById('gameModeModal');
    if (modal) {
        modal.remove();
    }
    
    // Show battle intro screen
    showBattleIntro(aiEnabled);
};

// Animation functions
window.animateBattle = function(attackerPlayerId, attackerSlot, targetPlayerId, targetSlot) {
    const attackerField = document.getElementById(attackerPlayerId === 'player1' ? 'player1MonsterField' : 'player2MonsterField');
    const targetField = document.getElementById(targetPlayerId === 'player1' ? 'player1MonsterField' : 'player2MonsterField');
    
    const attackerElement = attackerField.querySelector(`[data-slot-index="${attackerSlot}"]`);
    const targetElement = targetField.querySelector(`[data-slot-index="${targetSlot}"]`);
    
    if (attackerElement && targetElement) {
        // Subtle attack animation - no flashing, just highlight
        attackerElement.classList.add('attacking');
        targetElement.classList.add('taking-damage');
        
        // Remove animations after short duration
        setTimeout(() => {
            attackerElement.classList.remove('attacking');
            targetElement.classList.remove('taking-damage');
        }, 300);
        
        // Optional: Only show damage effect if really needed (commented out to reduce flashing)
        // createDamageEffect(targetElement, '⚔️');
    }
};

window.animateFortAttack = function(targetPlayerId) {
    const fortHP = document.getElementById(targetPlayerId === 'player1' ? 'player1FortHP' : 'player2FortHP');
    const characterIcon = document.getElementById(targetPlayerId === 'player1' ? 'player1CharacterIcon' : 'player2CharacterIcon');
    
    // Animate fort HP
    if (fortHP) {
        fortHP.classList.add('fort-hit');
        createDamageEffect(fortHP.parentElement, '💥');
        setTimeout(() => {
            fortHP.classList.remove('fort-hit');
        }, 800);
    }
    
    // Shake avatar and show chat bubble
    if (characterIcon) {
        // Add shake animation
        characterIcon.classList.add('avatar-shake');
        
        // Create chat bubble
        const chatBubble = document.createElement('div');
        chatBubble.className = 'chat-bubble';
        chatBubble.textContent = 'That hurt!';
        characterIcon.appendChild(chatBubble);
        
        // Remove shake and bubble after animation
        setTimeout(() => {
            characterIcon.classList.remove('avatar-shake');
            setTimeout(() => {
                if (chatBubble.parentNode) {
                    chatBubble.remove();
                }
            }, 500);
        }, 1000);
    }
};

window.animateMonsterDestroy = function(playerId, slotIndex) {
    const field = document.getElementById(playerId === 'player1' ? 'player1MonsterField' : 'player2MonsterField');
    const monsterElement = field.querySelector(`[data-slot-index="${slotIndex}"]`);
    
    if (monsterElement) {
        monsterElement.classList.add('destroyed');
        createDamageEffect(monsterElement, '💀');
        setTimeout(() => {
            monsterElement.style.opacity = '0';
            monsterElement.style.transform = 'scale(0)';
        }, 500);
    }
};

function createDamageEffect(element, emoji) {
    // Reduced damage effects to prevent flashing
    // Only show subtle effect if needed
    if (!element) return;
    
    const effect = document.createElement('div');
    effect.className = 'damage-effect';
    effect.textContent = emoji;
    effect.style.position = 'absolute';
    effect.style.pointerEvents = 'none';
    effect.style.fontSize = '1.2em'; // Smaller, less flashy
    effect.style.zIndex = '1000';
    effect.style.opacity = '0.7'; // More subtle
    effect.style.animation = 'damageFloat 0.5s ease-out forwards'; // Shorter duration
    
    const rect = element.getBoundingClientRect();
    effect.style.left = (rect.left + rect.width / 2) + 'px';
    effect.style.top = (rect.top + rect.height / 2) + 'px';
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 500); // Remove faster
}

function animateCardPlay(cardElement) {
    if (cardElement) {
        cardElement.classList.add('card-played');
        setTimeout(() => {
            cardElement.classList.remove('card-played');
        }, 500);
    }
}

// Detect device type and apply appropriate class
function detectDeviceType() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile && isTouchDevice) {
        document.body.classList.add('mobile-device');
        document.documentElement.style.setProperty('--is-mobile', '1');
    } else {
        document.body.classList.add('desktop-device');
        document.documentElement.style.setProperty('--is-mobile', '0');
    }
}

// Randomize background theme
function randomizeBackground() {
    const themes = ['purple', 'blue', 'red', 'green', 'orange', 'dark'];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    document.body.className = `body-theme-${randomTheme}`;
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Randomize background theme
    randomizeBackground();
    
    detectDeviceType();
    try {
        // Show main menu IMMEDIATELY (don't wait for image mapping)
        showMainMenu();
        
        // Build image mapping cache asynchronously (non-blocking)
        // This runs in the background and doesn't delay the UI
        if (typeof buildImageMapping === 'function') {
            buildImageMapping().then(() => {
                console.log('[IMAGES] Image mapping built:', imageMappingCache);
                // Refresh UI if game is already started
                if (game && typeof updateUI === 'function') {
                    updateUI();
                }
            }).catch(err => {
                console.warn('[IMAGES] Image mapping failed (non-critical):', err);
            });
        }
        
        // Load currency from localStorage
        loadCurrency();
        
        // Setup main menu listeners
        setupMainMenuListeners();
        
        // Initialize main menu music player
        setTimeout(() => {
            if (!mainMenuMusicPlayer) {
                mainMenuMusicPlayer = initializeMusicPlayer('mainmenu');
                // Try to play main menu music (may require user interaction)
                if (mainMenuMusicPlayer) {
                    mainMenuMusicPlayer.play().catch(error => {
                        console.log('[MUSIC] Main menu music autoplay prevented, will start after user interaction');
                    });
                }
            }
        }, 100);
    } catch (error) {
        console.error('[ERROR] Error on DOMContentLoaded:', error);
        // Still show main menu even if there's an error
        showMainMenu();
    }
});

