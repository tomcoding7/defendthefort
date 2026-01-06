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
function awardBattleCurrency(playerWon) {
    if (playerWon) {
        // Award gold for winning (random between 50-100)
        const goldEarned = 50 + Math.floor(Math.random() * 51);
        playerCurrency.gold += goldEarned;
        
        // Small chance to earn arcana (10% chance, 1-5 arcana)
        if (Math.random() < 0.1) {
            const arcanaEarned = 1 + Math.floor(Math.random() * 5);
            playerCurrency.arcana += arcanaEarned;
        }
        
        saveCurrency();
        updateCurrencyDisplay();
        
        console.log(`[CURRENCY] Awarded ${goldEarned} gold${playerCurrency.arcana > 0 ? ` and ${playerCurrency.arcana} arcana` : ''} for victory`);
    } else {
        // Small consolation reward for losing (10-20 gold)
        const consolationGold = 10 + Math.floor(Math.random() * 11);
        playerCurrency.gold += consolationGold;
        
        saveCurrency();
        updateCurrencyDisplay();
        
        console.log(`[CURRENCY] Awarded ${consolationGold} gold (consolation)`);
    }
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
        
        updateUI();
        setupEventListeners();
    } catch (error) {
        console.error('[ERROR] Error initializing game:', error);
        alert('Error initializing game! Check browser console (F12) for details.');
    }
}

function setupEventListeners() {
    // End turn button
    document.getElementById('endTurnBtn').addEventListener('click', () => {
        game.endTurn();
        updateUI();
    });

    // Upgrade fort button
    document.getElementById('upgradeFortBtn').addEventListener('click', () => {
        showFortUpgradeOptions();
    });

    // Close modal
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('cardModal').style.display = 'none';
    });

    // Settings button
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
    document.getElementById('newGameBtn').addEventListener('click', () => {
        document.getElementById('winModal').style.display = 'none';
        showGameModeSelection();
    });

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
    const currentPlayer = musicPlayer || mainMenuMusicPlayer || initializeMusicPlayer('mainmenu');

    const playPauseBtn = document.getElementById('musicPlayPause');
    const prevBtn = document.getElementById('musicPrev');
    const nextBtn = document.getElementById('musicNext');
    const trackSelect = document.getElementById('musicTrackSelect');
    const volumeSlider = document.getElementById('musicVolume');

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            const player = musicPlayer || mainMenuMusicPlayer;
            if (player) player.toggle();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const player = musicPlayer || mainMenuMusicPlayer;
            if (player) player.playPrevious();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const player = musicPlayer || mainMenuMusicPlayer;
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
            const player = musicPlayer || mainMenuMusicPlayer;
            if (player) player.selectTrack(parseInt(e.target.value));
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const player = musicPlayer || mainMenuMusicPlayer;
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
                        game.log('Attack cancelled.');
                        updateUI();
                    } else {
                        // Different monster: change selection
                        if (!monster.canAttack()) {
                            game.log(`${monster.name} has already attacked this turn!`);
                            updateUI();
                            return;
                        }
                        selectedMonsterSlot = i;
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
            slots.appendChild(slot);
            
            // Allow placing monsters in empty slots
            if (player.id === game.getCurrentPlayer().id) {
                slot.addEventListener('click', () => {
                    handleEmptySlotClick(player, i);
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
    if (selectedCard.type === 'spell' && (selectedCard.id === 'lightning_bolt' || selectedCard.id === 'heal' || selectedCard.id === 'vitality_surge')) {
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
            
            // Execute spell immediately
            const spellResult = result.spell.execute(game, player, window.spellTarget ? window.spellTarget : null);
            if (!spellResult.success) {
                // Refund if spell failed
                player.stars += selectedCard.cost;
                player.spellTrapZone[slotIndex] = null;
                player.hand.push(selectedCard);
            } else {
                // Check if spell is continuous (stays on field)
                const isContinuous = isContinuousSpell(selectedCard);
                if (!isContinuous) {
                    // Send to graveyard after execution (non-continuous spells)
                    player.graveyard.push(selectedCard);
                    player.spellTrapZone[slotIndex] = null;
                }
                // Continuous spells stay in the zone
            }
            window.spellTargetMode = false;
            window.spellTarget = null;
            
            // Force UI update to show spell effects (especially for attack boosts)
            updateUI();
        }
    } else {
        result = player.playTrap(selectedCard, slotIndex);
    }
    
    if (result.success) {
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
    } else {
        game.log(result.message);
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
        // Randomly select AI avatar (main2.png or girl1.png) and keep it consistent
        if (!aiAvatarSelected) {
            const aiAvatars = ['main2.png', 'girl1.png'];
            aiAvatarSelected = aiAvatars[Math.floor(Math.random() * aiAvatars.length)];
        }
        imagePath = `assets/images/avatar/${aiAvatarSelected}`;
    } else {
        // Player always uses main.png
        imagePath = 'assets/images/avatar/main.png';
    }
    
    if (img) {
        img.src = imagePath;
        img.alt = player.name;
        // Show placeholder if image fails to load
        img.onerror = function() {
            this.style.display = 'none';
            if (placeholder) {
                placeholder.style.display = 'block';
                // Use robot emoji for AI, person for players
                placeholder.textContent = player.name === 'AI Opponent' ? '🤖' : '👤';
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

function handleCardClick(card, player, event) {
    if (player.id !== game.getCurrentPlayer().id) return;
    if (game.gameOver) return;
    
    // Deselect other cards
    document.querySelectorAll('.hand-card').forEach(c => c.classList.remove('selected'));
    
    // Select this card
    const cardElement = (event && event.target.closest('.hand-card')) || document.querySelector(`[data-card-id="${card.id}"]`);
    if (cardElement) {
        cardElement.classList.add('selected');
        selectedCard = card;
        
        if (card.type === 'monster') {
            // Show message to select a slot
            game.log(`Select an empty monster slot to play ${card.name}`);
        } else if (card.type === 'spell') {
            // Play spell - some go to zone, some execute immediately
            if (player.canPlayCard(card)) {
                // Check if spell needs a target (like lightning bolt, heal)
                if (card.id === 'lightning_bolt' || card.id === 'heal' || card.id === 'vitality_surge') {
                    game.log(`Select a target monster to use ${card.name}`);
                    selectedCard = card;
                    // Store that we're selecting a target
                    window.spellTargetMode = true;
                } else {
                    // Spells that go to the zone (like traps) - need to select slot
                    game.log(`Select an empty spell/trap slot to place ${card.name}`);
                    selectedCard = card;
                }
            } else {
                game.log('Not enough Stars to play this card!');
                updateUI();
            }
        } else if (card.type === 'trap') {
            // Traps go in spell/trap zone
            if (player.canPlayCard(card)) {
                game.log(`Select an empty spell/trap slot to place ${card.name}`);
                selectedCard = card;
            } else {
                game.log('Not enough Stars to play this card!');
                updateUI();
            }
        }
    }
}

function handleEmptySlotClick(player, slotIndex) {
    if (player.id !== game.getCurrentPlayer().id) return;
    if (!selectedCard || selectedCard.type !== 'monster') return;
    
    // On mobile, prevent placing monsters in slot 4 (index 3)
    const isMobile = window.innerWidth <= 768;
    if (isMobile && slotIndex >= 3) {
        game.log('On mobile, only the first 3 monster slots are available. Please use slots 1-3.');
        updateUI();
        return;
    }
    
    const result = player.playMonster(selectedCard, slotIndex);
    if (result.success) {
        game.log(`${player.name} plays ${selectedCard.name}!`);
        
        // Trigger trap checks for opponent when playing monsters
        game.triggerCardPlayTrap(player, selectedCard);
        
        // Animate card play
        const cardElement = document.querySelector(`[data-card-id="${selectedCard.id}"].selected`);
        if (cardElement) {
            animateCardPlay(cardElement);
        }
        updateUI();
    } else {
        game.log(result.message);
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
        // Refresh upgrade options to show updated limits
        showMonsterUpgradeOptions(player, slotIndex, monster);
    } else {
        game.log(result.message);
    }
    updateUI();
}

function upgradeMonsterArmor(slotIndex) {
    const player = game.getCurrentPlayer();
    const monster = player.monsterField[slotIndex];
    if (!monster) return;
    
    const result = player.upgradeMonsterArmor(slotIndex);
    if (result.success) {
        game.log(`${player.name} upgrades ${monster.name}'s armor!`);
        // Refresh upgrade options to show updated limits
        showMonsterUpgradeOptions(player, slotIndex, monster);
    } else {
        game.log(result.message);
    }
    updateUI();
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
        // Add attack animation
        attackerElement.classList.add('attacking');
        targetElement.classList.add('taking-damage');
        
        // Create damage number effect
        createDamageEffect(targetElement, '⚔️');
        
        setTimeout(() => {
            attackerElement.classList.remove('attacking');
            targetElement.classList.remove('taking-damage');
        }, 600);
    }
};

window.animateFortAttack = function(targetPlayerId) {
    const fortHP = document.getElementById(targetPlayerId === 'player1' ? 'player1FortHP' : 'player2FortHP');
    if (fortHP) {
        fortHP.classList.add('fort-hit');
        createDamageEffect(fortHP.parentElement, '💥');
        setTimeout(() => {
            fortHP.classList.remove('fort-hit');
        }, 800);
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
    const effect = document.createElement('div');
    effect.className = 'damage-effect';
    effect.textContent = emoji;
    effect.style.position = 'absolute';
    effect.style.pointerEvents = 'none';
    effect.style.fontSize = '2em';
    effect.style.zIndex = '1000';
    effect.style.animation = 'damageFloat 1s ease-out forwards';
    
    const rect = element.getBoundingClientRect();
    effect.style.left = (rect.left + rect.width / 2) + 'px';
    effect.style.top = (rect.top + rect.height / 2) + 'px';
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 1000);
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
        // Show game mode selection IMMEDIATELY (don't wait for image mapping)
        showGameModeSelection();
        
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
        // Still show modal even if there's an error
        showGameModeSelection();
    }
});

