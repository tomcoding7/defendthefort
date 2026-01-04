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

        // 1. Play monsters if possible
        await this.playMonsters();
        if (window.updateUI) window.updateUI();

        // 2. Play spells if beneficial
        await this.playSpells();
        if (window.updateUI) window.updateUI();

        // 3. Upgrade monsters if beneficial
        await this.upgradeMonsters();
        if (window.updateUI) window.updateUI();

        // 4. Attack with monsters
        await this.attackWithMonsters();
        if (window.updateUI) window.updateUI();

        // 5. Upgrade fort if enough stars and beneficial
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
        const availableSlots = this.player.monsterField
            .map((m, i) => m === null ? i : null)
            .filter(i => i !== null);

        for (const card of hand) {
            if (availableSlots.length === 0) break;
            if (this.player.canPlayCard(card)) {
                const slotIndex = availableSlots.shift();
                const result = this.player.playMonster(card, slotIndex);
                if (result.success) {
                    this.game.log(`🤖 ${this.player.name} plays ${card.name}!`);
                    await this.delay(800);
                }
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
                const result = this.player.playSpell(card);
                if (result.success) {
                    const spellResult = result.spell.execute(this.game, this.player);
                    if (spellResult.success) {
                        this.game.log(`🤖 ${this.player.name} plays ${card.name}!`);
                        await this.delay(800);
                    }
                }
            }
        }

        // Play other spells
        for (const card of hand) {
            if (card.type === 'spell' && this.player.canPlayCard(card)) {
                const result = this.player.playSpell(card);
                if (result.success) {
                    const spellResult = result.spell.execute(this.game, this.player);
                    if (spellResult.success) {
                        this.game.log(`🤖 ${this.player.name} plays ${card.name}!`);
                        await this.delay(800);
                    }
                }
            }
        }
    }

    async upgradeMonsters() {
        const aliveMonsters = this.player.getAliveMonsters();
        
        // Upgrade monsters with low attack first
        for (let i = 0; i < this.player.monsterField.length; i++) {
            const monster = this.player.monsterField[i];
            if (monster && monster.isAlive() && this.player.stars >= 2) {
                // Upgrade weapon if attack is low
                if (monster.attack < 6 && this.player.stars >= 2) {
                    const result = this.player.upgradeMonsterWeapon(i);
                    if (result.success) {
                        this.game.log(`🤖 ${this.player.name} upgrades ${monster.name}'s weapon!`);
                        await this.delay(600);
                    }
                }
                // Upgrade armor if health is low
                else if (monster.currentHealth < monster.maxHealth * 0.5 && this.player.stars >= 2) {
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

