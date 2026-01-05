// Player class
class Player {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.stars = 2;
        this.starsPerTurn = 2;
        this.hand = [];
        this.deck = [];
        this.monsterField = [null, null, null, null]; // 4 slots
        this.spellTrapZone = [null, null, null, null, null]; // 5 slots for spells or traps
        this.graveyard = [];
        // Upgrade limits per turn
        this.attackUpgradesThisTurn = 0;
        this.defenseUpgradesThisTurn = 0;
        this.maxAttackUpgrades = 1; // Can be increased by spells/traps
        this.maxDefenseUpgrades = 1; // Can be increased by spells/traps
        this.fort = {
            hp: 50,
            maxHp: 50,
            defense: 0,
            starGeneration: 0, // Bonus stars per turn
            level: 1,
            takeDamage: function(amount) {
                const actualDamage = Math.max(1, amount - this.defense);
                this.hp = Math.max(0, this.hp - actualDamage);
                return actualDamage;
            },
            heal: function(amount) {
                this.hp = Math.min(this.maxHp, this.hp + amount);
            }
        };
    }

    initializeDeck() {
        try {
            const starterDeck = getStarterDeck();
            if (!starterDeck || starterDeck.length === 0) {
                console.error('[ERROR] Starter deck is empty!');
                return;
            }
            
            this.deck = starterDeck.map(cardId => createCard(cardId)).filter(card => card !== null);
            this.shuffleDeck();
            
            // Draw starting hand
            for (let i = 0; i < 5; i++) {
                const card = this.drawCard();
                if (card) {
                    this.hand.push(card);
                }
            }
        } catch (error) {
            console.error(`[ERROR] Error initializing deck for ${this.name}:`, error);
        }
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
        if (this.deck.length === 0) {
            // Reshuffle graveyard into deck if deck is empty
            if (this.graveyard.length > 0) {
                this.deck = [...this.graveyard];
                this.graveyard = [];
                this.shuffleDeck();
            } else {
                return null; // No cards left
            }
        }
        return this.deck.pop();
    }

    startTurn() {
        // Gain stars
        this.stars += this.starsPerTurn + this.fort.starGeneration;
        
        // Draw a card
        const card = this.drawCard();
        if (card) {
            this.hand.push(card);
        }
        
        // Reset monsters for new turn
        this.monsterField.forEach(monster => {
            if (monster && monster.isAlive()) {
                monster.resetTurn();
            }
        });
        
        // Reset upgrade counts for new turn
        this.attackUpgradesThisTurn = 0;
        this.defenseUpgradesThisTurn = 0;
        this.maxAttackUpgrades = 1; // Reset to default (spells/traps can increase this)
        this.maxDefenseUpgrades = 1; // Reset to default (spells/traps can increase this)
    }

    canPlayCard(card) {
        return this.stars >= card.cost;
    }

    playMonster(card, slotIndex) {
        if (slotIndex < 0 || slotIndex >= 4) {
            return { success: false, message: 'Invalid slot' };
        }
        
        if (this.monsterField[slotIndex] !== null) {
            return { success: false, message: 'Slot already occupied' };
        }
        
        if (!this.canPlayCard(card)) {
            return { success: false, message: 'Not enough Stars' };
        }
        
        if (card.type !== 'monster') {
            return { success: false, message: 'Not a monster card' };
        }
        
        this.stars -= card.cost;
        const monster = new Monster(card.data);
        monster.owner = this;
        this.monsterField[slotIndex] = monster;
        
        // Remove card from hand
        const handIndex = this.hand.findIndex(c => c.id === card.id);
        if (handIndex !== -1) {
            this.hand.splice(handIndex, 1);
        }
        
        return { success: true, monster: monster };
    }

    playSpell(card, zoneIndex = null) {
        if (!this.canPlayCard(card)) {
            return { success: false, message: 'Not enough Stars' };
        }
        
        if (card.type !== 'spell') {
            return { success: false, message: 'Not a spell card' };
        }
        
        // Find empty slot if not specified
        if (zoneIndex === null) {
            zoneIndex = this.spellTrapZone.findIndex(slot => slot === null);
        }
        
        if (zoneIndex < 0 || zoneIndex >= 5) {
            return { success: false, message: 'Invalid spell/trap slot' };
        }
        
        if (this.spellTrapZone[zoneIndex] !== null) {
            return { success: false, message: 'Spell/trap slot already occupied' };
        }
        
        this.stars -= card.cost;
        const spell = new Spell(card.data);
        this.spellTrapZone[zoneIndex] = spell;
        
        // Remove card from hand
        const handIndex = this.hand.findIndex(c => c.id === card.id);
        if (handIndex !== -1) {
            this.hand.splice(handIndex, 1);
        }
        
        return { success: true, spell: spell };
    }

    playTrap(card, zoneIndex = null) {
        if (!this.canPlayCard(card)) {
            return { success: false, message: 'Not enough Stars' };
        }
        
        if (card.type !== 'trap') {
            return { success: false, message: 'Not a trap card' };
        }
        
        // Find empty slot if not specified
        if (zoneIndex === null) {
            zoneIndex = this.spellTrapZone.findIndex(slot => slot === null);
        }
        
        if (zoneIndex < 0 || zoneIndex >= 5) {
            return { success: false, message: 'Invalid spell/trap slot' };
        }
        
        if (this.spellTrapZone[zoneIndex] !== null) {
            return { success: false, message: 'Spell/trap slot already occupied' };
        }
        
        this.stars -= card.cost;
        const trap = new Trap(card.data);
        this.spellTrapZone[zoneIndex] = trap;
        
        // Remove card from hand
        const handIndex = this.hand.findIndex(c => c.id === card.id);
        if (handIndex !== -1) {
            this.hand.splice(handIndex, 1);
        }
        
        return { success: true, trap: trap };
    }

    getAliveMonsters() {
        return this.monsterField.filter(m => m !== null && m.isAlive());
    }

    hasAliveMonsters() {
        return this.getAliveMonsters().length > 0;
    }

    upgradeMonsterWeapon(monsterIndex) {
        const monster = this.monsterField[monsterIndex];
        if (!monster || !monster.isAlive()) {
            return { success: false, message: 'Invalid monster' };
        }
        
        if (this.stars < 2) {
            return { success: false, message: 'Not enough Stars (need 2)' };
        }
        
        // Check upgrade limit
        if (this.attackUpgradesThisTurn >= this.maxAttackUpgrades) {
            return { success: false, message: `You can only upgrade attack ${this.maxAttackUpgrades} time(s) per turn!` };
        }
        
        this.stars -= 2;
        monster.upgradeWeapon();
        this.attackUpgradesThisTurn++;
        return { success: true, message: 'Weapon upgraded' };
    }

    upgradeMonsterArmor(monsterIndex) {
        const monster = this.monsterField[monsterIndex];
        if (!monster || !monster.isAlive()) {
            return { success: false, message: 'Invalid monster' };
        }
        
        if (this.stars < 2) {
            return { success: false, message: 'Not enough Stars (need 2)' };
        }
        
        // Check upgrade limit
        if (this.defenseUpgradesThisTurn >= this.maxDefenseUpgrades) {
            return { success: false, message: `You can only upgrade defense ${this.maxDefenseUpgrades} time(s) per turn!` };
        }
        
        this.stars -= 2;
        monster.upgradeArmor();
        this.defenseUpgradesThisTurn++;
        return { success: true, message: 'Armor upgraded' };
    }
    
    // Allow spells/traps to grant extra upgrade opportunities
    grantExtraUpgrade(type) {
        if (type === 'attack') {
            this.maxAttackUpgrades++;
        } else if (type === 'defense') {
            this.maxDefenseUpgrades++;
        } else if (type === 'both') {
            this.maxAttackUpgrades++;
            this.maxDefenseUpgrades++;
        }
    }

    upgradeFort(upgradeType) {
        if (this.stars < 5) {
            return { success: false, message: 'Not enough Stars (need 5)' };
        }
        
        this.stars -= 5;
        
        switch (upgradeType) {
            case 'defense':
                this.fort.defense += 2;
                this.fort.level++;
                return { success: true, message: 'Fort defense increased' };
            case 'stars':
                this.fort.starGeneration += 1;
                this.fort.level++;
                return { success: true, message: 'Star generation increased' };
            case 'hp':
                this.fort.maxHp += 20;
                this.fort.hp += 20;
                this.fort.level++;
                return { success: true, message: 'Fort HP increased' };
            default:
                this.stars += 5; // Refund
                return { success: false, message: 'Invalid upgrade type' };
        }
    }
}

