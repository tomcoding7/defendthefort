// Main game initialization and UI interactions
let game = null;
let selectedCard = null;
let selectedMonsterSlot = null;
let upgradeMode = null; // 'weapon', 'armor', or null

function initializeGame(aiEnabled = false) {
    try {
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
    if (!musicPlayer) {
        musicPlayer = initializeMusicPlayer();
    }

    const playPauseBtn = document.getElementById('musicPlayPause');
    const prevBtn = document.getElementById('musicPrev');
    const nextBtn = document.getElementById('musicNext');
    const trackSelect = document.getElementById('musicTrackSelect');
    const volumeSlider = document.getElementById('musicVolume');

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            musicPlayer.toggle();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            musicPlayer.playPrevious();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            musicPlayer.playNext();
        });
    }

    if (trackSelect) {
        trackSelect.addEventListener('change', (e) => {
            musicPlayer.selectTrack(parseInt(e.target.value));
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            musicPlayer.setVolume(e.target.value / 100);
        });
    }

    // Update UI initially
    musicPlayer.updateUI();
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
    
    // Update spell zones
    updateSpellZone('player1SpellZone', player1);
    updateSpellZone('player2SpellZone', player2);
    
        // Update trap zones (if they exist - optional feature)
        try {
            updateTrapZone('player1TrapZone', player1);
            updateTrapZone('player2TrapZone', player2);
        } catch (error) {
            // Trap zones are optional, ignore if they don't exist
        }
        
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
    
    // Detect mobile - show 3 slots on mobile, 5 on desktop
    const isMobile = window.innerWidth <= 768;
    const maxVisibleSlots = isMobile ? 3 : 5;
    
    // Update field label
    const labelId = fieldId === 'player1MonsterField' ? 'player1MonsterFieldLabel' : 'player2MonsterFieldLabel';
    const label = document.getElementById(labelId);
    if (label) {
        label.textContent = `Monster Field (${maxVisibleSlots} slots${isMobile ? ' visible' : ''})`;
    }
    
    // Always iterate through all 5 slots (game logic uses 5), but hide slots 4-5 on mobile
    for (let i = 0; i < 5; i++) {
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
        
        // On mobile, hide slots beyond index 2 (slots 4 and 5) visually
        // Note: Game logic still uses 5 slots, but mobile UI only shows 3
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

function updateSpellZone(zoneId, player) {
    const zone = document.getElementById(zoneId);
    const label = zone.querySelector('.zone-label');
    zone.innerHTML = '';
    zone.appendChild(label);
    
    player.spellZone.forEach(spell => {
        const spellElement = spell.createElement();
        zone.appendChild(spellElement);
    });
}

function updateTrapZone(zoneId, player) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    const label = zone.querySelector('.zone-label');
    zone.innerHTML = '';
    zone.appendChild(label);
    
    // Show only 5 trap slots
    for (let i = 0; i < 5; i++) {
        const trap = player.trapZone[i];
        if (trap) {
            const trapElement = trap.createElement();
            trapElement.dataset.trapIndex = i;
            zone.appendChild(trapElement);
        }
    }
}

function updateGraveyard(graveyardId, player) {
    const graveyard = document.getElementById(graveyardId);
    const label = graveyard.querySelector('.zone-label');
    const count = player.graveyard.length;
    label.textContent = `Graveyard (${count})`;
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
            // Play spell immediately (unless it needs a target)
            if (player.canPlayCard(card)) {
                // Check if spell needs a target (like lightning bolt)
                if (card.id === 'lightning_bolt' || card.id === 'heal') {
                    game.log(`Select a target monster to use ${card.name}`);
                    selectedCard = card;
                    // Store that we're selecting a target
                    window.spellTargetMode = true;
                } else {
                    const result = player.playSpell(card);
                    if (result.success) {
                        const spellResult = result.spell.execute(game, player);
                        if (spellResult.success) {
                            game.log(`${player.name} plays ${card.name}!`);
                            // Animate spell play
                            animateCardPlay(cardElement);
                        } else {
                            // Refund if spell failed
                            player.stars += card.cost;
                            player.hand.push(card);
                        }
                        updateUI();
                    } else {
                        game.log(result.message);
                        updateUI();
                    }
                }
            } else {
                game.log('Not enough Stars to play this card!');
                updateUI();
            }
        } else if (card.type === 'trap') {
            // Traps need to be placed in trap zone
            if (player.canPlayCard(card)) {
                // Find empty trap slot
                const emptySlot = player.trapZone.findIndex(trap => trap === null);
                if (emptySlot !== -1) {
                    const result = player.playTrap(card, emptySlot);
                    if (result.success) {
                        game.log(`${player.name} sets ${card.name} in trap zone!`);
                        animateCardPlay(cardElement);
                        updateUI();
                    } else {
                        game.log(result.message);
                        updateUI();
                    }
                } else {
                    game.log('Trap zone is full!');
                    updateUI();
                }
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
    
    // On mobile, prevent placing monsters in slots 4-5 (index 3-4)
    const isMobile = window.innerWidth <= 768;
    if (isMobile && slotIndex >= 3) {
        game.log('On mobile, only the first 3 monster slots are available. Please use slots 1-3.');
        updateUI();
        return;
    }
    
    const result = player.playMonster(selectedCard, slotIndex);
    if (result.success) {
        game.log(`${player.name} plays ${selectedCard.name}!`);
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
    upgradeOptions.innerHTML = `
        <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
            <div style="font-weight: bold; margin-bottom: 10px;">Upgrade ${monster.name}:</div>
            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 5px;" 
                    onclick="upgradeMonsterWeapon(${slotIndex})">
                Upgrade Weapon (2⭐)
            </button>
            <button class="btn btn-secondary" style="width: 100%;" 
                    onclick="upgradeMonsterArmor(${slotIndex})">
                Upgrade Armor (2⭐)
            </button>
        </div>
    `;
}

function upgradeMonsterWeapon(slotIndex) {
    const player = game.getCurrentPlayer();
    const result = player.upgradeMonsterWeapon(slotIndex);
    if (result.success) {
        game.log(`${player.name} upgrades ${player.monsterField[slotIndex].name}'s weapon!`);
    } else {
        game.log(result.message);
    }
    updateUI();
}

function upgradeMonsterArmor(slotIndex) {
    const player = game.getCurrentPlayer();
    const result = player.upgradeMonsterArmor(slotIndex);
    if (result.success) {
        game.log(`${player.name} upgrades ${player.monsterField[slotIndex].name}'s armor!`);
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
    
    winTitle.textContent = `${randomTitle}!`;
    winMessage.textContent = `${game.winner.name} has successfully defended their fort and conquered their opponent!`;
    
    modal.style.display = 'block';
    modal.classList.add('win-animation');
}

function showGameModeSelection() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'gameModeModal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content win-modal">
            <h2>🛡️ Defend the Fort</h2>
            <p style="margin: 20px 0; font-size: 1.2em;">Choose your game mode:</p>
            <button class="btn btn-primary" style="width: 100%; margin-bottom: 10px; font-size: 1.1em;" onclick="startGame(false)">
                👥 Player vs Player
            </button>
            <button class="btn btn-secondary" style="width: 100%; font-size: 1.1em;" onclick="startGame(true)">
                🤖 Player vs AI
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function showBattleIntro(aiEnabled) {
    const introModal = document.getElementById('battleIntroModal');
    if (!introModal) {
        // If modal doesn't exist, just start the game
        initializeGame(aiEnabled);
        if (musicPlayer) {
            musicPlayer.play();
        }
        return;
    }

    // Initialize the game FIRST so it's visible behind the intro
    initializeGame(aiEnabled);
    
    // Small delay to ensure game UI is rendered
    setTimeout(() => {
        // Show the intro screen overlay
        introModal.style.display = 'flex';
        introModal.style.pointerEvents = 'auto'; // Block interactions during intro
        introModal.style.opacity = '1';
        
        // Reset animations
        const title = introModal.querySelector('.battle-intro-title');
        const subtitle = introModal.querySelector('.battle-intro-subtitle');
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
        
        if (commence) {
            commence.style.animation = 'none';
            commence.style.opacity = '0';
            commence.style.transform = 'translateY(20px)';
            setTimeout(() => {
                commence.style.animation = 'commenceFadeIn 0.8s ease-out 1.5s forwards';
            }, 10);
        }

        // After animations complete (about 3.5 seconds), fade out intro and start music
        setTimeout(() => {
            // Fade out the intro overlay
            introModal.style.transition = 'opacity 0.5s ease-out';
            introModal.style.opacity = '0';
            
            setTimeout(() => {
                introModal.style.display = 'none';
                introModal.style.pointerEvents = 'none'; // Allow clicks through
            }, 500);
            
            // Auto-start music when battle begins
            if (musicPlayer) {
                musicPlayer.play().catch(error => {
                    console.warn('[MUSIC] Autoplay prevented, user needs to interact first:', error);
                    // Music will start when user clicks play button
                });
            }
        }, 3500); // Total animation time: 0.8s title + 0.5s delay + 2.5s subtitle + 0.8s commence = ~3.5s
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

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize music player (but don't auto-play yet - wait for battle start)
        musicPlayer = initializeMusicPlayer();
        
        // Show game mode selection
        showGameModeSelection();
    } catch (error) {
        console.error('[ERROR] Error on DOMContentLoaded:', error);
    }
});

