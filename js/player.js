// Player class
class Player {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.stars = 2;
        this.starsPerTurn = 2;
        this.hand = [];
        this.deck = [];
        this.monsterField = [null, null, null, null, null]; // 5 slots
        this.spellZone = [];
        this.trapZone = [null, null, null, null, null]; // 5 trap slots (like Yu-Gi-Oh)
        this.graveyard = [];
        this.fort = {
            hp: 100,
            maxHp: 100,
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
    }

    canPlayCard(card) {
        return this.stars >= card.cost;
    }

    playMonster(card, slotIndex) {
        if (slotIndex < 0 || slotIndex >= 5) {
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

    playSpell(card) {
        if (!this.canPlayCard(card)) {
            return { success: false, message: 'Not enough Stars' };
        }
        
        if (card.type !== 'spell') {
            return { success: false, message: 'Not a spell card' };
        }
        
        this.stars -= card.cost;
        const spell = new Spell(card.data);
        
        // Remove card from hand
        const handIndex = this.hand.findIndex(c => c.id === card.id);
        if (handIndex !== -1) {
            this.hand.splice(handIndex, 1);
        }
        
        return { success: true, spell: spell };
    }

    playTrap(card, trapZoneIndex) {
        if (trapZoneIndex < 0 || trapZoneIndex >= 5) {
            return { success: false, message: 'Invalid trap slot' };
        }
        
        if (this.trapZone[trapZoneIndex] !== null) {
            return { success: false, message: 'Trap slot already occupied' };
        }
        
        if (!this.canPlayCard(card)) {
            return { success: false, message: 'Not enough Stars' };
        }
        
        if (card.type !== 'trap') {
            return { success: false, message: 'Not a trap card' };
        }
        
        this.stars -= card.cost;
        const trap = new Trap(card.data);
        this.trapZone[trapZoneIndex] = trap;
        
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
        
        this.stars -= 2;
        monster.upgradeWeapon();
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
        
        this.stars -= 2;
        monster.upgradeArmor();
        return { success: true, message: 'Armor upgraded' };
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

