// Card definitions and card system
// Image mapping cache - automatically populated
let imageMappingCache = null;
// Make it globally accessible for Monster class
if (typeof window !== 'undefined') {
    window.imageMappingCache = null;
}

// Build image mapping by trying to load images and detecting what exists
// Optimized for mobile: runs asynchronously without blocking UI
async function buildImageMapping() {
    if (imageMappingCache) return imageMappingCache;
    
    imageMappingCache = {};
    const cardDatabase = CARD_DATABASE;
    
    // Helper to normalize names for matching
    function normalizeName(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    
    // Use requestIdleCallback for better performance, fallback to setTimeout
    const scheduleCheck = (callback) => {
        if (window.requestIdleCallback) {
            window.requestIdleCallback(callback, { timeout: 2000 });
        } else {
            setTimeout(callback, 0);
        }
    };
    
    // Process cards in batches to avoid blocking
    const cardEntries = Object.entries(cardDatabase);
    const batchSize = 5; // Process 5 cards at a time
    let currentIndex = 0;
    
    return new Promise((resolve) => {
        function processBatch() {
            const endIndex = Math.min(currentIndex + batchSize, cardEntries.length);
            
            for (let i = currentIndex; i < endIndex; i++) {
                const [cardId, cardData] = cardEntries[i];
                const type = cardData.type;
                const basePath = `assets/images/cards/${type}s/`;
                
                // Generate possible filenames
                const possibleNames = [
                    cardId, // Exact ID match
                    cardId.replace(/_/g, ''), // Without underscores
                    normalizeName(cardData.name), // From card name
                    cardData.name.toLowerCase().replace(/\s+/g, ''), // From card name (spaces removed)
                ];
                
                // Try first variation synchronously (most common case)
                const firstPath = `${basePath}${possibleNames[0]}.png`;
                        checkImageExistsFast(firstPath).then(exists => {
                            if (exists) {
                                imageMappingCache[cardId] = firstPath;
                                if (typeof window !== 'undefined') {
                                    window.imageMappingCache = imageMappingCache;
                                }
                            } else {
                        // Try other variations asynchronously
                        tryOtherVariations(cardId, basePath, possibleNames.slice(1));
                    }
                });
            }
            
            currentIndex = endIndex;
            
            if (currentIndex < cardEntries.length) {
                scheduleCheck(processBatch);
            } else {
                // Give a small delay for all checks to complete
                setTimeout(() => resolve(imageMappingCache), 500);
            }
        }
        
        function tryOtherVariations(cardId, basePath, variations) {
            if (variations.length === 0) return;
            
            const path = `${basePath}${variations[0]}.png`;
            checkImageExistsFast(path).then(exists => {
                if (exists) {
                    imageMappingCache[cardId] = path;
                    if (typeof window !== 'undefined') {
                        window.imageMappingCache = imageMappingCache;
                    }
                } else if (variations.length > 1) {
                    tryOtherVariations(cardId, basePath, variations.slice(1));
                }
            });
        }
        
        // Start processing
        scheduleCheck(processBatch);
    });
}

// Fast image check with shorter timeout for mobile
function checkImageExistsFast(url) {
    return new Promise((resolve) => {
        const img = new Image();
        let resolved = false;
        
        img.onload = () => {
            if (!resolved) {
                resolved = true;
                resolve(true);
            }
        };
        
        img.onerror = () => {
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
        };
        
        img.src = url;
        // Shorter timeout for mobile (300ms instead of 1000ms)
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
        }, 300);
    });
}

class Card {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type; // 'monster', 'spell', or 'trap'
        this.cost = data.cost || 0;
        this.description = data.description || '';
        this.data = data;
    }

    createElement() {
        const card = document.createElement('div');
        card.className = `hand-card ${this.type}`;
        card.dataset.cardId = this.id;
        
        // Add card image if available (optional - will hide if not found)
        const cardImage = document.createElement('img');
        cardImage.className = 'card-image';
        cardImage.alt = this.name;
        
        // Use cached mapping if available, otherwise try variations
        if (imageMappingCache && imageMappingCache[this.id]) {
            cardImage.src = imageMappingCache[this.id];
            cardImage.loading = 'lazy'; // Lazy load images for better mobile performance
        } else {
            // Fallback: try multiple filename variations
            const basePath = `assets/images/cards/${this.type}s/`;
            const imageVariations = [
                `${this.id}.png`, // Exact match (e.g., knight.png, reload.png)
                `${this.id.replace(/_/g, '')}.png`, // Without underscore (e.g., lightningbolt.png)
                `${this.name.toLowerCase().replace(/\s+/g, '')}.png`, // From card name (e.g., valiantknight.png, elitearcher.png)
                `${this.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`, // Normalized name
            ];
            
            cardImage.loading = 'lazy'; // Lazy load images for better mobile performance
            
            let currentVariationIndex = 0;
            const tryNextVariation = () => {
                currentVariationIndex++;
                if (currentVariationIndex < imageVariations.length) {
                    cardImage.src = basePath + imageVariations[currentVariationIndex];
                } else {
                    // Hide image if all variations fail (fallback to text-only)
                    cardImage.style.display = 'none';
                }
            };
            
            cardImage.onerror = tryNextVariation;
            
            // Start with first variation
            cardImage.src = basePath + imageVariations[0];
        }
        
        // Final fallback: hide if image fails to load after all attempts
        const finalOnError = () => {
            cardImage.style.display = 'none';
        };
        // Add as additional error handler
        cardImage.addEventListener('error', finalOnError, { once: true });
        cardImage.style.width = '100%';
        cardImage.style.height = 'auto';
        cardImage.style.maxHeight = this.type === 'monster' ? '120px' : '100px';
        cardImage.style.objectFit = 'cover';
        cardImage.style.borderRadius = '6px';
        cardImage.style.marginBottom = '8px';
        cardImage.style.display = 'block';
        
        const cost = document.createElement('div');
        cost.className = 'card-cost';
        cost.textContent = `⭐${this.cost}`;
        
        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = this.name;
        
        card.appendChild(cardImage);
        card.appendChild(cost);
        card.appendChild(name);
        
        if (this.type === 'monster') {
            const stats = document.createElement('div');
            stats.className = 'card-stats';
            stats.innerHTML = `
                <div>⚔️ ATK: ${this.data.attack}</div>
                <div>🛡️ DEF: ${this.data.defense}</div>
                <div>❤️ HP: ${this.data.health}</div>
            `;
            card.appendChild(stats);
        } else if (this.type === 'trap') {
            card.classList.add('trap');
            const desc = document.createElement('div');
            desc.className = 'card-stats';
            desc.textContent = this.description;
            desc.style.fontSize = '0.8em';
            desc.style.color = '#ffffff';
            desc.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.8), 0 0 3px rgba(0, 0, 0, 0.5)';
            card.appendChild(desc);
        } else {
            const desc = document.createElement('div');
            desc.className = 'card-stats';
            desc.textContent = this.description;
            desc.style.fontSize = '0.8em';
            card.appendChild(desc);
        }
        
        return card;
    }
}

// Card Database
const CARD_DATABASE = {
    // Monsters
    dragon: {
        id: 'dragon',
        name: 'Fire Dragon',
        type: 'monster',
        cost: 5,
        attack: 8,
        defense: 3,
        health: 12,
        description: 'A powerful dragon with high attack power.',
        abilities: []
    },
    unicorn: {
        id: 'unicorn',
        name: 'Mystic Unicorn',
        type: 'monster',
        cost: 4,
        attack: 5,
        defense: 4,
        health: 10,
        description: 'A magical creature that boosts morale.',
        abilities: ['morale_boost']
    },
    knight: {
        id: 'knight',
        name: 'Valiant Knight',
        type: 'monster',
        cost: 3,
        attack: 4,
        defense: 3,
        health: 8,
        description: 'A sturdy defender with good defense.',
        abilities: []
    },
    mage: {
        id: 'mage',
        name: 'Battle Mage',
        type: 'monster',
        cost: 4,
        attack: 6,
        defense: 2,
        health: 7,
        description: 'A spellcaster with powerful attacks.',
        abilities: []
    },
    tank: {
        id: 'tank',
        name: 'Siege Tank',
        type: 'monster',
        cost: 6,
        attack: 7,
        defense: 6,
        health: 15,
        description: 'A heavily armored war machine.',
        abilities: []
    },
    rocket: {
        id: 'rocket',
        name: 'Rocket Launcher',
        type: 'monster',
        cost: 3,
        attack: 5,
        defense: 1,
        health: 6,
        description: 'Long-range artillery unit.',
        abilities: ['direct_fort_attack']
    },
    archer: {
        id: 'archer',
        name: 'Elite Archer',
        type: 'monster',
        cost: 2,
        attack: 3,
        defense: 2,
        health: 5,
        description: 'A ranged combat specialist.',
        abilities: []
    },
    golem: {
        id: 'golem',
        name: 'Stone Golem',
        type: 'monster',
        cost: 8,
        attack: 3,
        defense: 6,
        health: 18,
        description: 'An incredibly durable guardian with weak attacks.',
        abilities: []
    },
    
    // Spells
    reload: {
        id: 'reload',
        name: 'Reload',
        type: 'spell',
        cost: 2,
        description: 'Draw 2 cards from your deck.',
        effect: 'draw_cards'
    },
    redraw: {
        id: 'redraw',
        name: 'Redraw',
        type: 'spell',
        cost: 1,
        description: 'Return a card to deck and draw a new one.',
        effect: 'redraw'
    },
    attack_boost: {
        id: 'attack_boost',
        name: 'Battle Rage',
        type: 'spell',
        cost: 3,
        description: 'All your monsters gain +2 Attack this turn.',
        effect: 'temporary_attack_boost'
    },
    fort_strike: {
        id: 'fort_strike',
        name: 'Fort Strike',
        type: 'spell',
        cost: 4,
        description: 'Deal 10 damage directly to opponent\'s fort.',
        effect: 'direct_fort_damage'
    },
    heal: {
        id: 'heal',
        name: 'Healing Light',
        type: 'spell',
        cost: 2,
        description: 'Restore 5 HP to a target monster.',
        effect: 'heal_monster'
    },
    star_burst: {
        id: 'star_burst',
        name: 'Star Burst',
        type: 'spell',
        cost: 1,
        description: 'Gain 2 additional Stars this turn.',
        effect: 'gain_stars'
    },
    
    // More Monsters
    wyvern: {
        id: 'wyvern',
        name: 'Sky Wyvern',
        type: 'monster',
        cost: 4,
        attack: 6,
        defense: 3,
        health: 9,
        description: 'A flying dragon with swift attacks.',
        abilities: []
    },
    berserker: {
        id: 'berserker',
        name: 'Blood Berserker',
        type: 'monster',
        cost: 3,
        attack: 5,
        defense: 2,
        health: 6,
        description: 'Gains attack when damaged.',
        abilities: ['rage']
    },
    paladin: {
        id: 'paladin',
        name: 'Divine Paladin',
        type: 'monster',
        cost: 5,
        attack: 5,
        defense: 6,
        health: 12,
        description: 'A holy warrior that protects allies.',
        abilities: ['protection']
    },
    necromancer: {
        id: 'necromancer',
        name: 'Dark Necromancer',
        type: 'monster',
        cost: 5,
        attack: 7,
        defense: 2,
        health: 8,
        description: 'Can revive monsters from graveyard.',
        abilities: ['revive']
    },
    phoenix: {
        id: 'phoenix',
        name: 'Fire Phoenix',
        type: 'monster',
        cost: 6,
        attack: 8,
        defense: 4,
        health: 10,
        description: 'Reborns when destroyed.',
        abilities: ['rebirth']
    },
    
    // More Spells
    lightning_bolt: {
        id: 'lightning_bolt',
        name: 'Lightning Bolt',
        type: 'spell',
        cost: 3,
        description: 'Deal 8 damage to target monster.',
        effect: 'damage_monster'
    },
    fortify: {
        id: 'fortify',
        name: 'Fortify',
        type: 'spell',
        cost: 2,
        description: 'Increase fort defense by 3.',
        effect: 'fortify_fort'
    },
    rally: {
        id: 'rally',
        name: 'Rally Cry',
        type: 'spell',
        cost: 2,
        description: 'All monsters gain +1 Attack permanently.',
        effect: 'permanent_attack_boost'
    },
    vitality_surge: {
        id: 'vitality_surge',
        name: 'Vitality Surge',
        type: 'spell',
        cost: 4,
        description: 'All monsters gain +5 Health permanently.',
        effect: 'permanent_health_boost'
    },
    upgrade_mastery: {
        id: 'upgrade_mastery',
        name: 'Upgrade Mastery',
        type: 'spell',
        cost: 3,
        description: 'Gain +1 attack and +1 defense upgrade this turn.',
        effect: 'grant_extra_upgrades',
        upgradeType: 'both'
    },
    
    // Traps (Like Yu-Gi-Oh but different)
    mirror_force: {
        id: 'mirror_force',
        name: 'Mirror Barrier',
        type: 'trap',
        cost: 3,
        description: 'When opponent attacks, reflect 50% damage back.',
        trigger: 'on_attack',
        effect: 'reflect_damage'
    },
    counter_strike: {
        id: 'counter_strike',
        name: 'Counter Strike',
        type: 'trap',
        cost: 2,
        description: 'When your monster is destroyed, deal 5 damage to attacker.',
        trigger: 'on_monster_destroyed',
        effect: 'counter_damage'
    },
    magic_shield: {
        id: 'magic_shield',
        name: 'Magic Shield',
        type: 'trap',
        cost: 2,
        description: 'Negate next spell or trap effect.',
        trigger: 'on_spell_cast',
        effect: 'negate_spell'
    },
    ambush: {
        id: 'ambush',
        name: 'Ambush',
        type: 'trap',
        cost: 3,
        description: 'When opponent attacks fort, summon a 3/3/5 defender.',
        trigger: 'on_fort_attack',
        effect: 'summon_defender'
    },
    last_stand: {
        id: 'last_stand',
        name: 'Last Stand',
        type: 'trap',
        cost: 4,
        description: 'When fort HP drops below 20, restore 30 HP.',
        trigger: 'on_low_fort_hp',
        effect: 'emergency_heal'
    },
    star_trap: {
        id: 'star_trap',
        name: 'Star Drain',
        type: 'trap',
        cost: 2,
        description: 'Steal 3 Stars from opponent when they play a card.',
        trigger: 'on_opponent_card_play',
        effect: 'steal_stars'
    }
};

function createCard(cardId) {
    try {
        const cardData = CARD_DATABASE[cardId];
        if (!cardData) {
            console.error(`[ERROR] Card "${cardId}" not found in database`);
            return null;
        }
        return new Card(cardData);
    } catch (error) {
        console.error(`[ERROR] Error creating card "${cardId}":`, error);
        return null;
    }
}

function getRandomCard() {
    const cardIds = Object.keys(CARD_DATABASE);
    const randomId = cardIds[Math.floor(Math.random() * cardIds.length)];
    return createCard(randomId);
}

function getStarterDeck() {
    // Each player starts with a balanced deck
    return [
        // Monsters
        'knight', 'knight', 'knight',
        'archer', 'archer',
        'mage', 'mage',
        'unicorn',
        'dragon',
        'golem',
        'wyvern',
        'berserker',
        // Spells
        'reload', 'reload',
        'attack_boost',
        'heal', 'heal',
        'star_burst',
        'fort_strike',
        'lightning_bolt',
        'rally',
        'vitality_surge',
        // Traps
        'mirror_force',
        'counter_strike',
        'magic_shield',
        'ambush'
    ];
}

