// Spell system
class Spell {
    constructor(cardData) {
        this.id = cardData.id;
        this.name = cardData.name;
        this.cost = cardData.cost;
        this.description = cardData.description;
        this.effect = cardData.effect;
        this.data = cardData;
    }

    createElement() {
        const card = document.createElement('div');
        card.className = 'spell-card';
        card.dataset.spellId = this.id;
        
        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = this.name;
        
        const desc = document.createElement('div');
        desc.className = 'card-stats';
        desc.textContent = this.description;
        desc.style.fontSize = '0.85em';
        desc.style.marginTop = '5px';
        
        card.appendChild(name);
        card.appendChild(desc);
        
        return card;
    }

    execute(game, player, target = null) {
        switch (this.effect) {
            case 'draw_cards':
                for (let i = 0; i < 2; i++) {
                    const card = player.drawCard();
                    if (card) {
                        player.hand.push(card);
                    }
                }
                game.log(`${player.name} draws 2 cards!`);
                return { success: true, message: 'Drew 2 cards' };
                
            case 'redraw':
                if (player.hand.length > 0) {
                    const randomIndex = Math.floor(Math.random() * player.hand.length);
                    const card = player.hand.splice(randomIndex, 1)[0];
                    player.deck.push(card);
                    player.shuffleDeck();
                    const newCard = player.drawCard();
                    if (newCard) {
                        player.hand.push(newCard);
                    }
                    game.log(`${player.name} redraws a card!`);
                    return { success: true, message: 'Card redrawn' };
                }
                return { success: false, message: 'No cards in hand to redraw' };
                
            case 'temporary_attack_boost':
                player.monsterField.forEach(monster => {
                    if (monster && monster.isAlive()) {
                        monster.temporaryAttackBoost += 2;
                    }
                });
                game.log(`${player.name}'s monsters gain +2 Attack this turn!`);
                return { success: true, message: 'Attack boost applied' };
                
            case 'direct_fort_damage':
                const opponent = game.getOpponent(player);
                opponent.fort.takeDamage(10);
                game.log(`${player.name} deals 10 damage to ${opponent.name}'s fort!`);
                game.checkWinCondition();
                return { success: true, message: 'Fort damaged' };
                
            case 'heal_monster':
                if (target && target.isAlive()) {
                    target.heal(5);
                    game.log(`${player.name} heals ${target.name} for 5 HP!`);
                    return { success: true, message: 'Monster healed' };
                }
                return { success: false, message: 'Invalid target' };
                
            case 'gain_stars':
                player.stars += 2;
                game.log(`${player.name} gains 2 Stars!`);
                return { success: true, message: 'Stars gained' };
                
            case 'damage_monster':
                // Lightning Bolt - needs target selection
                if (target && target.isAlive()) {
                    const damage = 8;
                    const actualDamage = target.takeDamage(damage);
                    game.log(`${player.name}'s ${this.name} deals ${actualDamage} damage to ${target.name}!`);
                    
                    if (!target.isAlive()) {
                        game.log(`${target.name} is defeated!`);
                        const opponent = game.getOpponent(player);
                        const targetSlot = opponent.monsterField.indexOf(target);
                        if (targetSlot !== -1) {
                            opponent.graveyard.push(target);
                            opponent.monsterField[targetSlot] = null;
                            if (window.animateMonsterDestroy) {
                                window.animateMonsterDestroy(opponent.id, targetSlot);
                            }
                        }
                    }
                    return { success: true, message: 'Monster damaged', needsTarget: false };
                }
                return { success: false, message: 'Select a target monster', needsTarget: true };
                
            case 'permanent_attack_boost':
                // Rally Cry - permanent +1 attack to all monsters
                let boostedCount = 0;
                player.monsterField.forEach(monster => {
                    if (monster && monster.isAlive()) {
                        monster.permanentAttackBoost += 1;
                        boostedCount++;
                    }
                });
                game.log(`${player.name}'s ${this.name} permanently increases all monsters' Attack by +1!`);
                return { success: true, message: 'Permanent attack boost applied' };
                
            case 'permanent_health_boost':
                // Vitality Surge - permanent +5 health to all monsters
                let healthBoostedCount = 0;
                player.monsterField.forEach(monster => {
                    if (monster && monster.isAlive()) {
                        monster.maxHealth += 5;
                        monster.currentHealth += 5;
                        healthBoostedCount++;
                    }
                });
                game.log(`${player.name}'s ${this.name} permanently increases all monsters' Health by +5!`);
                return { success: true, message: 'Permanent health boost applied' };
                
            case 'fortify_fort':
                // Fortify - increase fort defense
                player.fort.defense += 3;
                game.log(`${player.name}'s ${this.name} increases fort defense by 3!`);
                return { success: true, message: 'Fort defense increased' };
                
            case 'grant_extra_upgrades':
                // Grant extra upgrade opportunities
                const upgradeType = this.data.upgradeType || 'both'; // 'attack', 'defense', or 'both'
                player.grantExtraUpgrade(upgradeType);
                if (upgradeType === 'both') {
                    game.log(`${player.name}'s ${this.name} grants +1 attack and +1 defense upgrade this turn!`);
                } else if (upgradeType === 'attack') {
                    game.log(`${player.name}'s ${this.name} grants +1 attack upgrade this turn!`);
                } else {
                    game.log(`${player.name}'s ${this.name} grants +1 defense upgrade this turn!`);
                }
                return { success: true, message: 'Extra upgrades granted' };
                
            default:
                return { success: false, message: 'Unknown spell effect' };
        }
    }
}

