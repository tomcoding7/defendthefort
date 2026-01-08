// Core game state and mechanics
class Game {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.turnNumber = 1;
        this.gameOver = false;
        this.winner = null;
        this.battleLog = [];
    }

    initialize(aiEnabled = false) {
        const player1 = new Player('Player 1', 'player1');
        const player2 = new Player(aiEnabled ? 'AI Opponent' : 'Player 2', 'player2');
        
        player1.initializeDeck();
        player2.initializeDeck();
        
        this.players = [player1, player2];
        this.currentPlayerIndex = 0;
        this.turnNumber = 1;
        this.gameOver = false;
        this.winner = null;
        this.battleLog = [];
        this.aiEnabled = aiEnabled;
        
        // Start first turn
        this.players[0].startTurn();
        this.log('Game started!');
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getOpponent(player) {
        return this.players.find(p => p.id !== player.id);
    }

    endTurn() {
        if (this.gameOver) return;
        
        const currentPlayer = this.getCurrentPlayer();
        this.log(`${currentPlayer.name} ends their turn.`);
        
        // Switch to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // If back to player 1, increment turn number
        if (this.currentPlayerIndex === 0) {
            this.turnNumber++;
            // Increase stars per turn every 3 turns
            if (this.turnNumber % 3 === 0) {
                this.players.forEach(player => {
                    player.starsPerTurn++;
                });
                this.log('Star generation increased for all players!');
            }
        }
        
        const newCurrentPlayer = this.getCurrentPlayer();
        newCurrentPlayer.startTurn();
        this.log(`${newCurrentPlayer.name} starts their turn.`);
        
        // Check for trap cards that trigger on turn start (like Last Stand)
        this.checkTraps(newCurrentPlayer, 'turn_start', {
            player: newCurrentPlayer
        });
        
        // Trigger AI turn if enabled
        if (this.aiEnabled && newCurrentPlayer.id === 'player2') {
            setTimeout(() => {
                if (window.ai && !this.gameOver) {
                    window.ai.playTurn().then(() => {
                        if (window.updateUI && !this.gameOver) {
                            window.updateUI();
                        }
                    });
                }
            }, 1500);
        }
    }

    attackMonster(attackerPlayer, attackerSlot, targetPlayer, targetSlot) {
        if (this.gameOver) return { success: false, message: 'Game is over' };
        
        // First player cannot attack on first turn
        if (this.turnNumber === 1 && attackerPlayer.id === 'player1') {
            return { success: false, message: 'First player cannot attack on their first turn!' };
        }
        
        const attacker = attackerPlayer.monsterField[attackerSlot];
        const target = targetPlayer.monsterField[targetSlot];
        
        if (!attacker || !attacker.isAlive()) {
            return { success: false, message: 'Invalid attacker' };
        }
        
        if (!attacker.canAttack()) {
            return { success: false, message: 'This monster has already attacked this turn' };
        }
        
        if (!target || !target.isAlive()) {
            return { success: false, message: 'Invalid target' };
        }
        
        // Play attack sound
        if (typeof window !== 'undefined' && typeof window.playRandomAttackSound === 'function') {
            window.playRandomAttackSound(0.7);
        }
        
        // Trigger battle animation
        if (window.animateBattle) {
            window.animateBattle(attackerPlayer.id === 'player1' ? 'player1' : 'player2', attackerSlot, 
                                targetPlayer.id === 'player1' ? 'player1' : 'player2', targetSlot);
        }
        
        // Check for trap cards that trigger on attack (like Mirror Barrier)
        // This checks the target player's traps before the attack
        this.checkTraps(targetPlayer, 'attack', {
            attacker: attacker,
            target: target,
            attackerPlayer: attackerPlayer,
            targetPlayer: targetPlayer,
            damage: attacker.attack
        });
        
        // Attacker deals damage first
        const result = attacker.attackMonster(target);
        
        if (result.success) {
            this.log(`${attackerPlayer.name}'s ${result.attacker} attacks ${targetPlayer.name}'s ${result.target} for ${result.damage} damage!`);
            
            // If target survives, it counter-attacks (counter-attacks don't count as voluntary attacks)
            if (!result.targetKilled && target.isAlive()) {
                const counterResult = target.attackMonster(attacker, true); // true = isCounterAttack
                if (counterResult.success) {
                    this.log(`${targetPlayer.name}'s ${counterResult.attacker} counter-attacks ${attackerPlayer.name}'s ${counterResult.target} for ${counterResult.damage} damage!`);
                    
                    if (counterResult.targetKilled) {
                        this.log(`${counterResult.target} is defeated!`);
                        attackerPlayer.graveyard.push(attacker);
                        attackerPlayer.monsterField[attackerSlot] = null;
                        
                        // Check for trap cards that trigger on monster destruction
                        this.checkTraps(attackerPlayer, 'monster_destroyed', {
                            player: attackerPlayer,
                            destroyedMonster: attacker,
                            destroyer: target,
                            attackerPlayer: targetPlayer
                        });
                        
                        // Animate attacker destruction
                        if (window.animateMonsterDestroy) {
                            window.animateMonsterDestroy(attackerPlayer.id === 'player1' ? 'player1' : 'player2', attackerSlot);
                        }
                        return { ...result, counterAttack: counterResult, attackerKilled: true };
                    }
                }
                return { ...result, counterAttack: counterResult };
            }
            
            if (result.targetKilled) {
                this.log(`${result.target} is defeated!`);
                targetPlayer.graveyard.push(target);
                targetPlayer.monsterField[targetSlot] = null;
                
                // Check for trap cards that trigger on monster destruction
                this.checkTraps(targetPlayer, 'monster_destroyed', {
                    player: targetPlayer,
                    destroyedMonster: target,
                    destroyer: attacker,
                    attackerPlayer: attackerPlayer
                });
                
                // Animate monster destruction
                if (window.animateMonsterDestroy) {
                    window.animateMonsterDestroy(targetPlayer.id === 'player1' ? 'player1' : 'player2', targetSlot);
                }
            }
        }
        
        return result;
    }

    attackFort(attackerPlayer, attackerSlot, targetPlayer) {
        if (this.gameOver) return { success: false, message: 'Game is over' };
        
        // First player cannot attack on first turn
        if (this.turnNumber === 1 && attackerPlayer.id === 'player1') {
            return { success: false, message: 'First player cannot attack on their first turn!' };
        }
        
        const attacker = attackerPlayer.monsterField[attackerSlot];
        
        if (!attacker || !attacker.isAlive()) {
            return { success: false, message: 'Invalid attacker' };
        }
        
        if (!attacker.canAttack()) {
            return { success: false, message: 'This monster has already attacked this turn' };
        }
        
        // Check if target has alive monsters (unless attacker has direct_fort_attack ability)
        if (targetPlayer.hasAliveMonsters() && !attacker.abilities.includes('direct_fort_attack')) {
            return { success: false, message: 'Cannot attack fort while opponent has monsters' };
        }
        
        // Play effect sound if monster has direct_fort_attack ability
        if (attacker.abilities.includes('direct_fort_attack')) {
            if (typeof window !== 'undefined' && typeof window.playRandomEffectSound === 'function') {
                window.playRandomEffectSound(0.6);
            }
        }
        
        // Play attack sound
        if (typeof window !== 'undefined' && typeof window.playRandomAttackSound === 'function') {
            window.playRandomAttackSound(0.7);
        }
        
        // Animate fort attack
        if (window.animateFortAttack) {
            window.animateFortAttack(targetPlayer.id === 'player1' ? 'player1' : 'player2');
        }
        
        const result = attacker.attackFort(targetPlayer.fort);
        
        if (result.success) {
            this.log(`${attackerPlayer.name}'s ${result.attacker} attacks ${targetPlayer.name}'s fort for ${result.damage} damage!`);
            
            // Check for trap cards that trigger on fort attack (like Ambush)
            this.checkTraps(targetPlayer, 'fort_attack', {
                targetPlayer: targetPlayer,
                attackerPlayer: attackerPlayer,
                attacker: attacker,
                damage: result.damage
            });
            
            this.checkWinCondition();
        }
        
        return result;
    }

    checkWinCondition() {
        this.players.forEach(player => {
            if (player.fort.hp <= 0) {
                this.gameOver = true;
                this.winner = this.getOpponent(player);
                this.log(`🏆 ${this.winner.name} wins! ${player.name}'s fort has been destroyed!`);
                
                // Trigger defeat screen animation
                if (window.showDefeatScreen) {
                    window.showDefeatScreen(player, this.winner);
                }
            }
        });
    }

    log(message) {
        this.battleLog.push({
            turn: this.turnNumber,
            message: message,
            timestamp: Date.now()
        });
        
        // Keep only last 50 log entries
        if (this.battleLog.length > 50) {
            this.battleLog.shift();
        }
    }

    getLogEntries() {
        return this.battleLog.slice(-20); // Return last 20 entries
    }

    triggerCardPlayTrap(player, card) {
        // Check opponent's traps when a card is played
        const opponent = this.getOpponent(player);
        if (opponent) {
            this.checkTraps(opponent, 'on_opponent_card_play', {
                card: card,
                player: player,
                opponent: opponent
            });
        }
    }

    checkTraps(player, eventType, context = {}) {
        // Check all traps in the player's spell/trap zone
        if (!player.spellTrapZone) return;
        
        player.spellTrapZone.forEach((card, index) => {
            // Check if it's a trap (not a spell)
            // Traps can be Trap instances or Card instances that need to be converted
            let trap = card;
            if (card && card.type === 'trap' && card.constructor.name === 'Card') {
                // Convert Card to Trap instance
                trap = new Trap(card.data);
            }
            
            if (trap && trap.constructor.name === 'Trap' && !trap.activated) {
                // Check if this trap should trigger
                if (trap.checkTrigger(this, player, eventType, context)) {
                    // Activate the trap
                    const result = trap.activate(this, player, context);
                    if (result.success) {
                        // Remove trap from zone after activation (traps are one-time use)
                        player.spellTrapZone[index] = null;
                        // Update UI if available
                        if (window.updateUI) {
                            window.updateUI();
                        }
                    }
                }
            }
        });
    }
}

