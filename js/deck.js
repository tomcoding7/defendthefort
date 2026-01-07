// Deck management system
// Handles saving/loading player decks

const DECK_STORAGE_KEY = 'playerDeck';
const DEFAULT_DECK = [
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

// Save deck to localStorage
function saveDeck(deck) {
    try {
        if (!Array.isArray(deck)) {
            console.error('[DECK] Invalid deck format');
            return false;
        }
        localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
        return true;
    } catch (error) {
        console.error('[DECK] Error saving deck:', error);
        return false;
    }
}

// Load deck from localStorage
function loadDeck() {
    try {
        const saved = localStorage.getItem(DECK_STORAGE_KEY);
        if (saved) {
            const deck = JSON.parse(saved);
            if (Array.isArray(deck) && deck.length > 0) {
                return deck;
            }
        }
    } catch (error) {
        console.error('[DECK] Error loading deck:', error);
    }
    // Return default deck if no saved deck or error
    return [...DEFAULT_DECK];
}

// Get default deck (copy to avoid mutation)
function getDefaultDeck() {
    return [...DEFAULT_DECK];
}

// Get deck statistics
function getDeckStats(deck) {
    if (!Array.isArray(deck)) return null;
    
    const stats = {
        total: deck.length,
        monsters: 0,
        spells: 0,
        traps: 0,
        byCard: {}
    };
    
    deck.forEach(cardId => {
        const card = CARD_DATABASE[cardId];
        if (card) {
            stats[card.type + 's']++;
            stats.byCard[cardId] = (stats.byCard[cardId] || 0) + 1;
        }
    });
    
    return stats;
}

// Validate deck (check if all cards exist and are valid)
function validateDeck(deck) {
    if (!Array.isArray(deck)) {
        return { valid: false, errors: ['Deck must be an array'] };
    }
    
    const errors = [];
    const cardCounts = {};
    
    deck.forEach((cardId, index) => {
        if (!cardId || typeof cardId !== 'string') {
            errors.push(`Invalid card at position ${index + 1}`);
            return;
        }
        
        if (!CARD_DATABASE[cardId]) {
            errors.push(`Unknown card: ${cardId} at position ${index + 1}`);
            return;
        }
        
        cardCounts[cardId] = (cardCounts[cardId] || 0) + 1;
    });
    
    // Check for reasonable deck size (optional - can be removed if no limits desired)
    if (deck.length < 20) {
        errors.push('Deck is too small (minimum 20 cards recommended)');
    }
    if (deck.length > 30) {
        errors.push('Deck is too large (maximum 30 cards allowed)');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors,
        cardCounts: cardCounts
    };
}

// Export deck as JSON string (for sharing/backup)
function exportDeck(deck) {
    try {
        return JSON.stringify(deck, null, 2);
    } catch (error) {
        console.error('[DECK] Error exporting deck:', error);
        return null;
    }
}

// Import deck from JSON string
function importDeck(jsonString) {
    try {
        const deck = JSON.parse(jsonString);
        const validation = validateDeck(deck);
        if (validation.valid) {
            saveDeck(deck);
            return { success: true, deck: deck };
        } else {
            return { success: false, errors: validation.errors };
        }
    } catch (error) {
        return { success: false, errors: ['Invalid JSON format'] };
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.saveDeck = saveDeck;
    window.loadDeck = loadDeck;
    window.getDefaultDeck = getDefaultDeck;
    window.getDeckStats = getDeckStats;
    window.validateDeck = validateDeck;
    window.exportDeck = exportDeck;
    window.importDeck = importDeck;
}

