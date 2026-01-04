// Trap system (like Yu-Gi-Oh but different)
class Trap {
    constructor(cardData) {
        this.id = cardData.id;
        this.name = cardData.name;
        this.cost = cardData.cost;
        this.description = cardData.description;
        this.trigger = cardData.trigger;
        this.effect = cardData.effect;
        this.data = cardData;
        this.activated = false;
    }

    createElement() {
        const card = document.createElement('div');
        card.className = 'spell-card trap-card';
        card.dataset.trapId = this.id;
        card.title = this.name;
        
        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = 'Trap';
        name.style.color = '#ffffff';
        name.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.5)';
        name.style.opacity = '0.9';
        
        const cost = document.createElement('div');
        cost.style.position = 'absolute';
        cost.style.top = '5px';
        cost.style.right = '5px';
        cost.style.background = 'rgba(0,0,0,0.6)';
        cost.style.padding = '3px 8px';
        cost.style.borderRadius = '10px';
        cost.style.fontSize = '0.8em';
        cost.style.color = '#ffd700';
        cost.textContent = `⭐${this.cost}`;
        
        card.appendChild(name);
        card.appendChild(cost);
        
        return card;
    }

    activate(game, player, context = {}) {
        if (this.activated) return { success: false, message: 'Trap already activated' };
        
        this.activated = true;
        
        switch (this.effect) {
            case 'reflect_damage':
                // Reflect 50% damage back to attacker
                if (context.attacker && context.damage) {
                    const reflectedDamage = Math.floor(context.damage * 0.5);
                    context.attacker.takeDamage(reflectedDamage);
                    game.log(`💥 ${player.name}'s ${this.name} reflects ${reflectedDamage} damage!`);
                    return { success: true, message: 'Damage reflected', damage: reflectedDamage };
                }
                break;
                
            case 'counter_damage':
                // Deal damage when monster is destroyed
                if (context.destroyer) {
                    context.destroyer.takeDamage(5);
                    game.log(`⚔️ ${player.name}'s ${this.name} deals 5 damage to attacker!`);
                    return { success: true, message: 'Counter damage dealt' };
                }
                break;
                
            case 'negate_spell':
                // Negate spell effect
                game.log(`🛡️ ${player.name}'s ${this.name} negates the spell!`);
                return { success: true, message: 'Spell negated', negated: true };
                
            case 'summon_defender':
                // Summon a defender when fort is attacked
                const emptySlot = player.monsterField.findIndex(m => m === null);
                if (emptySlot !== -1) {
                    const defenderData = {
                        id: 'defender',
                        name: 'Trap Defender',
                        attack: 3,
                        defense: 3,
                        health: 5,
                        abilities: []
                    };
                    const defender = new Monster(defenderData);
                    defender.owner = player;
                    player.monsterField[emptySlot] = defender;
                    game.log(`🛡️ ${player.name}'s ${this.name} summons a defender!`);
                    return { success: true, message: 'Defender summoned' };
                }
                break;
                
            case 'emergency_heal':
                // Heal fort when HP is low
                if (player.fort.hp < 20) {
                    player.fort.heal(30);
                    game.log(`💚 ${player.name}'s ${this.name} restores 30 HP to fort!`);
                    return { success: true, message: 'Fort healed' };
                }
                break;
                
            case 'steal_stars':
                // Steal stars from opponent
                const opponent = game.getOpponent(player);
                if (opponent.stars >= 3) {
                    opponent.stars -= 3;
                    player.stars += 3;
                    game.log(`⭐ ${player.name}'s ${this.name} steals 3 Stars!`);
                    return { success: true, message: 'Stars stolen' };
                }
                break;
        }
        
        return { success: false, message: 'Trap effect failed' };
    }

    checkTrigger(game, player, eventType, context = {}) {
        if (this.activated) return false;
        
        switch (this.trigger) {
            case 'on_attack':
                return eventType === 'attack';
            case 'on_monster_destroyed':
                return eventType === 'monster_destroyed' && context.player === player;
            case 'on_spell_cast':
                return eventType === 'spell_cast';
            case 'on_fort_attack':
                return eventType === 'fort_attack' && context.targetPlayer === player;
            case 'on_low_fort_hp':
                return eventType === 'turn_start' && player.fort.hp < 20;
            case 'on_opponent_card_play':
                return eventType === 'card_play' && context.player !== player;
            default:
                return false;
        }
    }
}

