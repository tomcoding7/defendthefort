// Shop system for buying and opening card packs
// Similar to Duel Links pack opening system

const PACK_COST = 100; // Arcana cost per pack
const CARDS_PER_PACK = 5;
const FREE_PACKS_KEY = 'freePacksGiven';
const CARD_COLLECTION_KEY = 'cardCollection';

// Pack types with different rarities
const PACK_TYPES = {
    starter: {
        name: 'Starter Pack',
        cost: 100,
        rarityWeights: {
            common: 0.6,    // 60% common
            rare: 0.3,      // 30% rare
            epic: 0.08,     // 8% epic
            legendary: 0.02 // 2% legendary
        }
    },
    premium: {
        name: 'Premium Pack',
        cost: 200,
        rarityWeights: {
            common: 0.3,
            rare: 0.4,
            epic: 0.25,
            legendary: 0.05
        }
    }
};

// Card rarities based on cost/stats
function getCardRarity(cardId) {
    const card = CARD_DATABASE[cardId];
    if (!card) return 'common';
    
    // Higher cost = higher rarity
    if (card.cost >= 6) return 'legendary';
    if (card.cost >= 4) return 'epic';
    if (card.cost >= 2) return 'rare';
    return 'common';
}

// Initialize card collection
function initCardCollection() {
    if (!localStorage.getItem(CARD_COLLECTION_KEY)) {
        // Start with starter deck cards
        let starterDeck = [];
        if (typeof getDefaultDeck === 'function') {
            starterDeck = getDefaultDeck();
        } else if (typeof window !== 'undefined' && typeof window.getDefaultDeck === 'function') {
            starterDeck = window.getDefaultDeck();
        }
        
        const collection = {};
        starterDeck.forEach(cardId => {
            collection[cardId] = (collection[cardId] || 0) + 1;
        });
        saveCardCollection(collection);
    }
}

// Get card collection
function getCardCollection() {
    try {
        const saved = localStorage.getItem(CARD_COLLECTION_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('[SHOP] Error loading collection:', error);
    }
    return {};
}

// Save card collection
function saveCardCollection(collection) {
    try {
        localStorage.setItem(CARD_COLLECTION_KEY, JSON.stringify(collection));
    } catch (error) {
        console.error('[SHOP] Error saving collection:', error);
    }
}

// Add cards to collection
function addCardsToCollection(cardIds) {
    const collection = getCardCollection();
    cardIds.forEach(cardId => {
        collection[cardId] = (collection[cardId] || 0) + 1;
    });
    saveCardCollection(collection);
    return collection;
}

// Check if player has free packs
function hasFreePacks() {
    return localStorage.getItem(FREE_PACKS_KEY) !== 'true';
}

// Give free packs to new player
function giveFreePacks() {
    if (hasFreePacks()) {
        const freePacks = 5;
        let currentFreePacks = parseInt(localStorage.getItem('freePacksCount') || '0');
        currentFreePacks += freePacks;
        localStorage.setItem('freePacksCount', currentFreePacks.toString());
        localStorage.setItem(FREE_PACKS_KEY, 'true');
        return currentFreePacks;
    }
    return parseInt(localStorage.getItem('freePacksCount') || '0');
}

// Get free packs count
function getFreePacksCount() {
    return parseInt(localStorage.getItem('freePacksCount') || '0');
}

// Use a free pack
function useFreePack() {
    let count = getFreePacksCount();
    if (count > 0) {
        count--;
        localStorage.setItem('freePacksCount', count.toString());
        return true;
    }
    return false;
}

// Generate pack cards based on rarity weights
function generatePackCards(packType = 'starter') {
    const pack = PACK_TYPES[packType];
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
    const allCardIds = Object.keys(cardDB);
    const cards = [];
    
    for (let i = 0; i < CARDS_PER_PACK; i++) {
        // Roll for rarity
        const roll = Math.random();
        let rarity = 'common';
        let cumulative = 0;
        
        for (const [rarityName, weight] of Object.entries(pack.rarityWeights)) {
            cumulative += weight;
            if (roll <= cumulative) {
                rarity = rarityName;
                break;
            }
        }
        
        // Filter cards by rarity
        const cardsOfRarity = allCardIds.filter(cardId => getCardRarity(cardId) === rarity);
        
        if (cardsOfRarity.length > 0) {
            const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            cards.push({
                id: randomCard,
                rarity: rarity
            });
        } else {
            // Fallback to any card if no cards of that rarity
            const randomCard = allCardIds[Math.floor(Math.random() * allCardIds.length)];
            cards.push({
                id: randomCard,
                rarity: getCardRarity(randomCard)
            });
        }
    }
    
    return cards;
}

// Open pack with animation
async function openPack(packType = 'starter', isFree = false) {
    const packCards = generatePackCards(packType);
    
    // Show pack opening animation
    showPackOpeningAnimation(packCards);
    
    // Add cards to collection
    const cardIds = packCards.map(c => c.id);
    addCardsToCollection(cardIds);
    
    return packCards;
}

// Show pack opening animation (one by one with shining effect)
function showPackOpeningAnimation(cards) {
    console.log('[SHOP.JS] showPackOpeningAnimation called with', cards.length, 'cards');
    const modal = document.getElementById('packOpeningModal');
    if (!modal) {
        console.error('[SHOP.JS] Pack opening modal not found!');
        console.error('[SHOP.JS] Available elements with "pack" in id:', Array.from(document.querySelectorAll('[id*="pack"]')).map(el => el.id));
        alert('Pack opening modal not found! Please refresh the page.');
        return;
    }
    console.log('[SHOP.JS] Modal found:', modal);
    
    const container = document.getElementById('packCardsContainer');
    if (!container) {
        console.error('[SHOP.JS] Pack cards container not found!');
        console.error('[SHOP.JS] Modal children:', Array.from(modal.children).map(el => el.id || el.className));
        return;
    }
    console.log('[SHOP.JS] Container found:', container);
    
    // Clear previous cards
    container.innerHTML = '';
    modal.style.display = 'flex';
    console.log('[SHOP.JS] Modal displayed, starting card reveal...');
    
    // Hide close button initially
    const closeBtn = document.getElementById('packOpeningClose');
    if (closeBtn) {
        closeBtn.style.display = 'none';
    }
    
    // Reveal cards one by one
    cards.forEach((cardData, index) => {
        setTimeout(() => {
            console.log(`[SHOP.JS] Revealing card ${index + 1}/${cards.length}:`, cardData.id, cardData.rarity);
            const cardElement = createPackCardElement(cardData, index);
            if (cardElement && container) {
                container.appendChild(cardElement);
                console.log(`[SHOP.JS] Card ${index + 1} added to container`);
                
                // Trigger shine animation
                setTimeout(() => {
                    cardElement.classList.add('revealed');
                    console.log(`[SHOP.JS] Card ${index + 1} revealed`);
                }, 100);
            } else {
                console.error(`[SHOP.JS] Failed to create or append card ${index + 1}`);
            }
        }, index * 600); // 600ms delay between each card
    });
    
    // Show close button after all cards are revealed
    const totalTime = cards.length * 600 + 500;
    console.log(`[SHOP.JS] Close button will show in ${totalTime}ms`);
    setTimeout(() => {
        if (closeBtn) {
            closeBtn.style.display = 'block';
            console.log('[SHOP.JS] Close button shown');
        }
    }, totalTime);
}

// Create pack card element with shine animation
function createPackCardElement(cardData, index) {
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
    const card = cardDB[cardData.id];
    if (!card) return document.createElement('div');
    
    const cardDiv = document.createElement('div');
    cardDiv.className = 'pack-card';
    cardDiv.dataset.rarity = cardData.rarity;
    cardDiv.style.animationDelay = `${index * 0.1}s`;
    
    // Create card using the Card class
    const createCardFn = (typeof createCard !== 'undefined') ? createCard : 
                         (typeof window !== 'undefined' && typeof window.createCard === 'function') ? window.createCard : null;
    const cardObj = createCardFn ? createCardFn(cardData.id) : null;
    if (cardObj && typeof cardObj.createElement === 'function') {
        const cardElement = cardObj.createElement();
        cardElement.style.width = '100%';
        cardElement.style.height = '100%';
        cardDiv.appendChild(cardElement);
    } else {
        // Fallback if card creation fails
        cardDiv.innerHTML = `
            <div class="pack-card-content">
                <div class="pack-card-name">${card.name}</div>
                <div class="pack-card-type">${card.type}</div>
                <div class="pack-card-rarity">${cardData.rarity.toUpperCase()}</div>
            </div>
        `;
    }
    
    // Add shine overlay
    const shine = document.createElement('div');
    shine.className = 'pack-card-shine';
    cardDiv.appendChild(shine);
    
    return cardDiv;
}

// Buy pack
function buyPack(packType = 'starter') {
    console.log('[SHOP] buyPack called with packType:', packType);
    const pack = PACK_TYPES[packType];
    if (!pack) {
        console.error('[SHOP] Invalid pack type:', packType);
        alert('Invalid pack type!');
        return false;
    }
    
    const freePacks = getFreePacksCount();
    console.log('[SHOP] Free packs available:', freePacks);
    
    // Check if player has free packs
    if (freePacks > 0) {
        if (useFreePack()) {
            console.log('[SHOP] Using free pack');
            openPack(packType, true);
            updateShopUI();
            return true;
        }
    }
    
    // Get player currency (check both local and window scope)
    const currency = (typeof playerCurrency !== 'undefined') ? playerCurrency :
                     (typeof window !== 'undefined' && window.playerCurrency) ? window.playerCurrency : null;
    
    // Check if player has enough arcana
    if (currency && currency.arcana >= pack.cost) {
        currency.arcana -= pack.cost;
        
        // Save currency
        if (typeof saveCurrency === 'function') {
            saveCurrency();
        } else if (typeof window !== 'undefined' && typeof window.saveCurrency === 'function') {
            window.saveCurrency();
        } else {
            // Fallback: save directly
            try {
                localStorage.setItem('playerCurrency', JSON.stringify(currency));
            } catch (e) {
                console.error('[SHOP] Error saving currency:', e);
            }
        }
        
        openPack(packType, false);
        updateShopUI();
        return true;
    } else {
        alert(`Not enough Arcana! You need ${pack.cost} Arcana to buy this pack.`);
        return false;
    }
}

// Update shop UI
function updateShopUI() {
    // Update arcana display
    if (typeof playerCurrency !== 'undefined' && typeof updateCurrencyDisplay === 'function') {
        updateCurrencyDisplay();
    } else if (typeof window !== 'undefined' && typeof window.updateCurrencyDisplay === 'function') {
        window.updateCurrencyDisplay();
    }
    
    // Update free packs display
    const freePacksCount = getFreePacksCount();
    const freePacksDisplay = document.getElementById('freePacksCount');
    const freePacksBanner = document.getElementById('freePacksBanner');
    
    if (freePacksDisplay) {
        freePacksDisplay.textContent = freePacksCount;
    }
    if (freePacksBanner) {
        freePacksBanner.style.display = freePacksCount > 0 ? 'block' : 'none';
    }
    
    // Update buy buttons to show "Use Free Pack" when available
    const buyButtons = document.querySelectorAll('.buy-pack-btn');
    buyButtons.forEach(btn => {
        const packType = btn.getAttribute('data-pack-type') || 'starter';
        const originalOnclick = btn.onclick; // Preserve onclick handler
        
        if (freePacksCount > 0) {
            btn.textContent = `Use Free Pack (${freePacksCount} left)`;
            btn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        } else {
            const pack = PACK_TYPES[packType];
            btn.textContent = `Buy Pack (${pack.cost} ✨)`;
            btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        
        // Re-attach onclick handler if it was lost
        if (originalOnclick && !btn.onclick) {
            btn.onclick = originalOnclick;
        }
        
        // Ensure button is still clickable
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
    });
}

// Initialize shop
function initShop() {
    console.log('[SHOP.JS] initShop() called');
    try {
        initCardCollection();
        console.log('[SHOP.JS] Card collection initialized');
        
        // Give free packs to new players
        if (hasFreePacks()) {
            const freePacksGiven = giveFreePacks();
            console.log('[SHOP.JS] Gave', freePacksGiven, 'free packs to new player');
        } else {
            const currentFreePacks = getFreePacksCount();
            console.log('[SHOP.JS] Player already has free packs. Current count:', currentFreePacks);
        }
        
        updateShopUI();
        console.log('[SHOP.JS] Shop initialized successfully');
    } catch (error) {
        console.error('[SHOP.JS] Error in initShop:', error);
    }
}

// Make functions globally available
console.log('[SHOP.JS] Making functions globally available...');
if (typeof window !== 'undefined') {
    window.buyPack = buyPack;
    window.openPack = openPack;
    window.initShop = initShop;
    window.updateShopUI = updateShopUI;
    window.getCardCollection = getCardCollection;
    window.addCardsToCollection = addCardsToCollection;
    window.getFreePacksCount = getFreePacksCount;
    window.useFreePack = useFreePack;
    window.showPackOpeningAnimation = showPackOpeningAnimation;
    window.closePackOpening = function() {
        const modal = document.getElementById('packOpeningModal');
        if (modal) {
            modal.style.display = 'none';
        }
        if (typeof updateShopUI === 'function') {
            updateShopUI();
        } else if (typeof window !== 'undefined' && typeof window.updateShopUI === 'function') {
            window.updateShopUI();
        }
    };
    console.log('[SHOP.JS] Functions made globally available');
    console.log('[SHOP.JS] window.buyPack type:', typeof window.buyPack);
    console.log('[SHOP.JS] window.openPack type:', typeof window.openPack);
} else {
    console.error('[SHOP.JS] window object not available!');
}

