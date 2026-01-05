// AI opponent for solo testing
class AI {
    constructor(player, game) {
        this.player = player;
        this.game = game;
        this.difficulty = 'medium'; // easy, medium, hard
    }

    async playTurn() {
        if (this.game.gameOver) return;
        if (this.game.getCurrentPlayer().id !== this.player.id) return;

        // Small delay to make AI moves visible
        await this.delay(1000);

        // Update UI to show it's AI's turn
        if (window.updateUI) window.updateUI();

        // 1. Play monsters FIRST (highest priority - need board presence)
        await this.playMonsters();
        if (window.updateUI) window.updateUI();

        // 2. Play beneficial spells (but only if we have monsters or need resources)
        const hasMonsters = this.player.getAliveMonsters().length > 0;
        if (hasMonsters || this.player.stars < 3) {
            await this.playSpells();
            if (window.updateUI) window.updateUI();
        }

        // 3. Upgrade monsters if beneficial (only if we have monsters)
        if (hasMonsters) {
            await this.upgradeMonsters();
            if (window.updateUI) window.updateUI();
        }

        // 4. Attack with monsters (only if we have monsters)
        if (hasMonsters) {
            await this.attackWithMonsters();
            if (window.updateUI) window.updateUI();
        }

        // 5. Upgrade fort if enough stars and beneficial (low priority)
        await this.upgradeFort();
        if (window.updateUI) window.updateUI();

        // End turn after a short delay
        await this.delay(500);
        if (!this.game.gameOver) {
            this.game.endTurn();
        }
    }

    async playMonsters() {
        const hand = this.player.hand.filter(card => card.type === 'monster');
        if (hand.length === 0) return;
        
        const availableSlots = this.player.monsterField
            .map((m, i) => m === null ? i : null)
            .filter(i => i !== null);
        
        if (availableSlots.length === 0) return; // No empty slots

        // Get current board presence
        const currentMonsters = this.player.getAliveMonsters().length;
        const opponentMonsters = this.game.getOpponent(this.player).getAliveMonsters().length;
        
        // Sort monsters by priority: 
        // 1. If we have no monsters, prioritize cheaper ones to get board presence
        // 2. If opponent has more monsters, prioritize stronger ones
        // 3. Otherwise, balance cost and power
        const playableMonsters = hand
            .filter(card => this.player.canPlayCard(card))
            .sort((a, b) => {
                if (currentMonsters === 0) {
                    // No board presence - prioritize cheaper monsters
                    return a.cost - b.cost;
                } else if (opponentMonsters > currentMonsters) {
                    // Behind on board - prioritize stronger monsters
                    const aPower = (a.data.attack || 0) + (a.data.health || 0);
                    const bPower = (b.data.attack || 0) + (b.data.health || 0);
                    if (bPower !== aPower) {
                        return bPower - aPower;
                    }
                    return a.cost - b.cost; // If same power, cheaper is better
                } else {
                    // Balanced or ahead - prioritize value (power per cost)
                    const aValue = ((a.data.attack || 0) + (a.data.health || 0)) / Math.max(a.cost, 1);
                    const bValue = ((b.data.attack || 0) + (b.data.health || 0)) / Math.max(b.cost, 1);
                    if (Math.abs(bValue - aValue) > 0.1) {
                        return bValue - aValue;
                    }
                    return a.cost - b.cost; // If similar value, cheaper is better
                }
            });

        // Play as many monsters as we can afford and have slots for
        // Try to fill at least 2-3 slots if possible
        const targetSlots = Math.min(availableSlots.length, currentMonsters === 0 ? 3 : 2);
        
        for (let i = 0; i < Math.min(playableMonsters.length, targetSlots); i++) {
            if (availableSlots.length === 0) break;
            
            const card = playableMonsters[i];
            const slotIndex = availableSlots.shift();
            const result = this.player.playMonster(card, slotIndex);
            if (result.success) {
                this.game.log(`🤖 ${this.player.name} plays ${card.name}!`);
                await this.delay(800);
                // Update UI after each monster
                if (window.updateUI) window.updateUI();
            } else {
                // If play failed, log why (for debugging)
                this.game.log(`🤖 ${this.player.name} couldn't play ${card.name}: ${result.message}`);
            }
        }
    }

    async playSpells() {
        const hand = this.player.hand.filter(card => card.type === 'spell');
        
        // Prioritize beneficial spells
        const prioritySpells = ['star_burst', 'attack_boost', 'fort_strike', 'reload', 'heal'];
        
        for (const spellName of prioritySpells) {
            const card = hand.find(c => c.id === spellName);
            if (card && this.player.canPlayCard(card)) {
                // Find an empty slot
                const emptySlot = this.player.spellTrapZone.findIndex(slot => slot === null);
                if (emptySlot !== -1) {
                    const result = this.player.playSpell(card, emptySlot);
                    if (result.success && result.spell) {
                        const spellResult = result.spell.execute(this.game, this.player);
                        if (spellResult.success) {
                            // Check if spell is continuous, if not send to graveyard
                            const isContinuous = this.isContinuousSpell(card);
                            if (!isContinuous) {
                                this.player.graveyard.push(card);
                                this.player.spellTrapZone[emptySlot] = null;
                            }
                            this.game.log(`🤖 ${this.player.name} plays ${card.name}!`);
                            await this.delay(800);
                        } else {
                            // Refund if spell failed
                            this.player.stars += card.cost;
                            this.player.spellTrapZone[emptySlot] = null;
                            this.player.hand.push(card);
                        }
                    }
                }
            }
        }

        // Play other spells
        for (const card of hand) {
            if (card.type === 'spell' && this.player.canPlayCard(card)) {
                const emptySlot = this.player.spellTrapZone.findIndex(slot => slot === null);
                if (emptySlot !== -1) {
                    const result = this.player.playSpell(card, emptySlot);
                    if (result.success && result.spell) {
                        const spellResult = result.spell.execute(this.game, this.player);
                        if (spellResult.success) {
                            // Check if spell is continuous, if not send to graveyard
                            const isContinuous = this.isContinuousSpell(card);
                            if (!isContinuous) {
                                this.player.graveyard.push(card);
                                this.player.spellTrapZone[emptySlot] = null;
                            }
                            this.game.log(`🤖 ${this.player.name} plays ${card.name}!`);
                            await this.delay(800);
                        } else {
                            // Refund if spell failed
                            this.player.stars += card.cost;
                            this.player.spellTrapZone[emptySlot] = null;
                            this.player.hand.push(card);
                        }
                    }
                }
            }
        }
    }
    
    isContinuousSpell(card) {
        if (card.type !== 'spell') return false;
        
        const continuousEffects = [
            'permanent_attack_boost',
            'permanent_health_boost',
            'grant_extra_upgrades'
        ];
        
        return continuousEffects.includes(card.data.effect);
    }

    async upgradeMonsters() {
        const aliveMonsters = this.player.getAliveMonsters();
        
        // Upgrade monsters with low attack first (respecting upgrade limits)
        for (let i = 0; i < this.player.monsterField.length; i++) {
            const monster = this.player.monsterField[i];
            if (monster && monster.isAlive() && this.player.stars >= 2) {
                // Upgrade weapon if attack is low and we have upgrade slots available
                if (monster.attack < 6 && 
                    this.player.stars >= 2 &&
                    this.player.attackUpgradesThisTurn < this.player.maxAttackUpgrades) {
                    const result = this.player.upgradeMonsterWeapon(i);
                    if (result.success) {
                        this.game.log(`🤖 ${this.player.name} upgrades ${monster.name}'s weapon!`);
                        await this.delay(600);
                    }
                }
                // Upgrade armor if health is low and we have upgrade slots available
                else if (monster.currentHealth < monster.maxHealth * 0.5 && 
                         this.player.stars >= 2 &&
                         this.player.defenseUpgradesThisTurn < this.player.maxDefenseUpgrades) {
                    const result = this.player.upgradeMonsterArmor(i);
                    if (result.success) {
                        this.game.log(`🤖 ${this.player.name} upgrades ${monster.name}'s armor!`);
                        await this.delay(600);
                    }
                }
            }
        }
    }

    async attackWithMonsters() {
        // First player cannot attack on first turn
        if (this.game.turnNumber === 1 && this.player.id === 'player1') {
            return;
        }
        
        const opponent = this.game.getOpponent(this.player);
        const myMonsters = this.player.getAliveMonsters();
        const opponentMonsters = opponent.getAliveMonsters();

        // Attack opponent's monsters
        for (let i = 0; i < this.player.monsterField.length; i++) {
            const attacker = this.player.monsterField[i];
            if (!attacker || !attacker.isAlive()) continue;

            if (opponentMonsters.length > 0) {
                // Attack weakest opponent monster
                let weakestTarget = null;
                let weakestSlot = -1;
                let lowestHP = Infinity;

                for (let j = 0; j < opponent.monsterField.length; j++) {
                    const target = opponent.monsterField[j];
                    if (target && target.isAlive() && target.currentHealth < lowestHP) {
                        weakestTarget = target;
                        weakestSlot = j;
                        lowestHP = target.currentHealth;
                    }
                }

                if (weakestTarget) {
                    const result = this.game.attackMonster(this.player, i, opponent, weakestSlot);
                    if (result.success) {
                        await this.delay(1200); // Delay for battle animation
                    }
                }
            } else {
                // Attack fort directly
                const result = this.game.attackFort(this.player, i, opponent);
                if (result.success) {
                    await this.delay(1200);
                }
            }
        }
    }

    async upgradeFort() {
        if (this.player.stars >= 5) {
            // Upgrade star generation if low on stars
            if (this.player.starsPerTurn <= 3) {
                const result = this.player.upgradeFort('stars');
                if (result.success) {
                    this.game.log(`🤖 ${this.player.name} upgrades fort star generation!`);
                    await this.delay(600);
                }
            }
            // Otherwise upgrade defense
            else if (this.player.fort.defense < 4) {
                const result = this.player.upgradeFort('defense');
                if (result.success) {
                    this.game.log(`🤖 ${this.player.name} upgrades fort defense!`);
                    await this.delay(600);
                }
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

