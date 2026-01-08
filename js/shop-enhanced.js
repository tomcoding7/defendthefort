// Enhanced Shop System with Duel Links/Pokemon TCG Pocket Style Pack Opening
// Features: Tap-to-reveal, card flip animations, particle effects, sound hooks

const PACK_COST = 100;
const CARDS_PER_PACK = 5;
const FREE_PACKS_KEY = 'freePacksGiven';
const CARD_COLLECTION_KEY = 'cardCollection';

// Pack types
const PACK_TYPES = {
    starter: {
        name: 'Starter Pack',
        cost: 100,
        rarityWeights: {
            common: 0.6,
            rare: 0.3,
            epic: 0.08,
            legendary: 0.02
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

// Sound system
const SOUNDS = {
    cardFlip: 'assets/soundeffects/packopening/packopening1.wav',
    rare: 'assets/soundeffects/packopening/packopening2.wav',
    epic: 'assets/soundeffects/packopening/superrare.wav',
    legendary: 'assets/soundeffects/packopening/ultrarare.wav',
    legendary2: 'assets/soundeffects/packopening/ultrarare2.wav',
    packOpen: 'assets/soundeffects/packopening/packopening1.wav'
};

function playSound(soundName) {
    const soundPath = SOUNDS[soundName];
    if (!soundPath) return;
    
    try {
        const audio = new Audio(soundPath);
        audio.volume = 0.5;
        audio.play().catch(() => {});
    } catch (e) {}
}

function getCardRarity(cardId) {
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
    const card = cardDB[cardId];
    if (!card) return 'common';
    
    if (card.cost >= 6) return 'legendary';
    if (card.cost >= 4) return 'epic';
    if (card.cost >= 2) return 'rare';
    return 'common';
}

// Get display name for rarity (for UI labels)
function getRarityDisplayName(rarity) {
    const rarityMap = {
        'common': 'Common',
        'rare': 'Rare',
        'epic': 'Super Rare',
        'legendary': 'Ultra Rare'
    };
    return rarityMap[rarity] || 'Common';
}

// Glossy card system
const GLOSSY_CARDS_KEY = 'glossyCards';

function isCardGlossy(cardId) {
    try {
        const glossyCards = JSON.parse(localStorage.getItem(GLOSSY_CARDS_KEY) || '{}');
        return glossyCards[cardId] === true;
    } catch (e) {
        return false;
    }
}

function setCardGlossy(cardId, isGlossy = true) {
    try {
        const glossyCards = JSON.parse(localStorage.getItem(GLOSSY_CARDS_KEY) || '{}');
        glossyCards[cardId] = isGlossy;
        localStorage.setItem(GLOSSY_CARDS_KEY, JSON.stringify(glossyCards));
    } catch (e) {
        console.error('[GLOSSY] Error saving glossy status:', e);
    }
}

// Make glossy functions globally available
if (typeof window !== 'undefined') {
    window.isCardGlossy = isCardGlossy;
    window.setCardGlossy = setCardGlossy;
    window.getRarityDisplayName = getRarityDisplayName;
}

function initCardCollection() {
    if (!localStorage.getItem(CARD_COLLECTION_KEY)) {
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

function getCardCollection() {
    try {
        const saved = localStorage.getItem(CARD_COLLECTION_KEY);
        if (saved) return JSON.parse(saved);
    } catch (error) {
        console.error('[SHOP] Error loading collection:', error);
    }
    return {};
}

function saveCardCollection(collection) {
    try {
        localStorage.setItem(CARD_COLLECTION_KEY, JSON.stringify(collection));
    } catch (error) {
        console.error('[SHOP] Error saving collection:', error);
    }
}

function addCardsToCollection(cardIds) {
    const collection = getCardCollection();
    cardIds.forEach(cardId => {
        collection[cardId] = (collection[cardId] || 0) + 1;
    });
    saveCardCollection(collection);
    return collection;
}

function hasFreePacks() {
    return localStorage.getItem(FREE_PACKS_KEY) !== 'true';
}

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

function getFreePacksCount() {
    return parseInt(localStorage.getItem('freePacksCount') || '0');
}

function useFreePack() {
    let count = getFreePacksCount();
    if (count > 0) {
        count--;
        localStorage.setItem('freePacksCount', count.toString());
        return true;
    }
    return false;
}

// Admin system - only works if admin key is set AND secret parameter is present
const ADMIN_KEY = 'defendTheFortAdmin2024';
const ADMIN_MODE_KEY = 'isAdminMode';
// Secret parameter that only you know - change this to your own secret!
const ADMIN_SECRET_PARAM = 'dtf2024secret'; // Change this to something only you know

// Check if the secret admin parameter is present in URL
function hasAdminSecret() {
    if (typeof window === 'undefined' || !window.location) return false;
    const urlParams = new URLSearchParams(window.location.search);
    const secret = urlParams.get('admin');
    return secret === ADMIN_SECRET_PARAM;
}

function isAdmin() {
    // Only allow admin if BOTH conditions are met:
    // 1. Secret parameter is in URL
    // 2. Admin mode is activated in localStorage
    if (!hasAdminSecret()) {
        return false;
    }
    const adminKey = localStorage.getItem(ADMIN_MODE_KEY);
    return adminKey === ADMIN_KEY;
}

function activateAdminMode(secretKey) {
    // Check if secret parameter is present first
    if (!hasAdminSecret()) {
        console.warn('[ADMIN] Admin secret parameter not found in URL!');
        return false;
    }
    if (secretKey === ADMIN_KEY) {
        localStorage.setItem(ADMIN_MODE_KEY, ADMIN_KEY);
        console.log('[ADMIN] Admin mode activated!');
        return true;
    }
    return false;
}

function giveAdminFreePacks(amount = 5) {
    if (!isAdmin()) {
        console.warn('[ADMIN] Not in admin mode!');
        return false;
    }
    
    let currentFreePacks = getFreePacksCount();
    currentFreePacks += amount;
    localStorage.setItem('freePacksCount', currentFreePacks.toString());
    console.log(`[ADMIN] Gave ${amount} free packs! Total: ${currentFreePacks}`);
    updateShopUI();
    return true;
}

function giveAdminArcana(amount = 1000) {
    if (!isAdmin()) {
        console.warn('[ADMIN] Not in admin mode!');
        return false;
    }
    
    const currency = (typeof playerCurrency !== 'undefined') ? playerCurrency :
                     (typeof window !== 'undefined' && window.playerCurrency) ? window.playerCurrency : null;
    
    if (!currency) {
        // Create currency if it doesn't exist
        const saved = localStorage.getItem('playerCurrency');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                currency = parsed;
            } catch (e) {
                currency = { gold: 0, arcana: 0 };
            }
        } else {
            currency = { gold: 0, arcana: 0 };
        }
    }
    
    currency.arcana = (currency.arcana || 0) + amount;
    
    // Save currency
    try {
        localStorage.setItem('playerCurrency', JSON.stringify(currency));
        if (typeof window !== 'undefined' && window.playerCurrency) {
            window.playerCurrency = currency;
        }
        if (typeof playerCurrency !== 'undefined') {
            playerCurrency = currency;
        }
    } catch (e) {
        console.error('[ADMIN] Error saving currency:', e);
    }
    
    console.log(`[ADMIN] Gave ${amount} arcana! Total: ${currency.arcana}`);
    
    // Update UI
    if (typeof updateCurrencyDisplay === 'function') {
        updateCurrencyDisplay();
    } else if (typeof window !== 'undefined' && typeof window.updateCurrencyDisplay === 'function') {
        window.updateCurrencyDisplay();
    }
    
    updateShopUI();
    return true;
}

// Make admin functions available globally
if (typeof window !== 'undefined') {
    window.activateAdminMode = activateAdminMode;
    window.giveAdminFreePacks = giveAdminFreePacks;
    window.giveAdminArcana = giveAdminArcana;
    window.isAdmin = isAdmin;
    window.hasAdminSecret = hasAdminSecret; // Expose secret check function
    window.getCardRarity = getCardRarity; // Expose for daily login system
    
    // Auto-activate admin mode if key exists (for convenience)
    if (isAdmin()) {
        console.log('[ADMIN] Admin mode is active!');
        console.log('[ADMIN] Available commands:');
        console.log('[ADMIN]   window.giveAdminFreePacks(5) - Give free packs');
        console.log('[ADMIN]   window.giveAdminArcana(1000) - Give arcana');
    } else if (!hasAdminSecret()) {
        // Hide admin UI completely if secret parameter is not present
        console.log('[ADMIN] Admin secret not found - admin features hidden');
    }
    
    // Quick console commands for admin
    window.admin = {
        packs: (amount = 5) => giveAdminFreePacks(amount),
        arcana: (amount = 1000) => giveAdminArcana(amount),
        activate: (key) => activateAdminMode(key)
    };
}

function generatePackCards(packType = 'starter') {
    console.log('[SHOP] Generating pack cards...');
    const pack = PACK_TYPES[packType];
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
    
    if (Object.keys(cardDB).length === 0) {
        console.error('[SHOP] CARD_DATABASE is empty!');
        alert('Card database not loaded! Please refresh the page.');
        return [];
    }
    
    const allCardIds = Object.keys(cardDB);
    const cards = [];
    
    for (let i = 0; i < CARDS_PER_PACK; i++) {
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
        
        const cardsOfRarity = allCardIds.filter(cardId => getCardRarity(cardId) === rarity);
        
        if (cardsOfRarity.length > 0) {
            const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            cards.push({ id: randomCard, rarity: rarity });
        } else {
            const randomCard = allCardIds[Math.floor(Math.random() * allCardIds.length)];
            cards.push({ id: randomCard, rarity: getCardRarity(randomCard) });
        }
    }
    
    console.log('[SHOP] Generated cards:', cards);
    return cards;
}

async function openPack(packType = 'starter', isFree = false) {
    console.log('[SHOP] Opening pack...');
    const packCards = generatePackCards(packType);
    
    if (packCards.length === 0) {
        alert('Failed to generate cards! Please refresh the page.');
        return [];
    }
    
    showEnhancedPackOpening(packCards);
    
    const cardIds = packCards.map(c => c.id);
    addCardsToCollection(cardIds);
    
    playSound('packOpen');
    
    return packCards;
}

function showEnhancedPackOpening(cards) {
    console.log('[SHOP] showEnhancedPackOpening called with', cards.length, 'cards');
    
    const modal = document.getElementById('packOpeningModal');
    if (!modal) {
        console.error('[SHOP] Pack opening modal not found!');
        alert('Pack opening modal not found! Please check the HTML.');
        return;
    }
    
    const container = document.getElementById('packCardsContainer');
    if (!container) {
        console.error('[SHOP] Pack cards container not found!');
        return;
    }
    
    container.innerHTML = '';
    modal.style.display = 'flex';
    
    createParticleCanvas(modal);
    
    const prompt = document.createElement('div');
    prompt.className = 'reveal-prompt';
    prompt.innerHTML = 'Tap anywhere to reveal next card...';
    container.appendChild(prompt);
    
    let currentCardIndex = 0;
    let isRevealing = false;
    let modalClickHandler = null;
    
    function revealNextCard() {
        if (isRevealing) {
            console.log('[PACK] Already revealing, ignoring click');
            return;
        }
        if (currentCardIndex >= cards.length) {
            prompt.innerHTML = '✨ All cards revealed!';
            prompt.style.animation = 'pulse 1s infinite';
            // Remove modal click handler when all cards are revealed
            modal.removeEventListener('click', modalClickHandler);
            modal.style.cursor = 'default';
            showCloseButton();
            return;
        }
        
        isRevealing = true;
        const cardData = cards[currentCardIndex];
        console.log(`[PACK] Revealing card ${currentCardIndex + 1}/${cards.length}:`, cardData);
        
        const cardBack = document.createElement('div');
        cardBack.className = 'pack-card-back';
        cardBack.style.pointerEvents = 'auto';
        cardBack.style.cursor = 'pointer';
        cardBack.innerHTML = `
            <div class="card-back-design">
                <div class="card-back-shine"></div>
                <div class="card-back-pattern">🎴</div>
            </div>
        `;
        
        container.insertBefore(cardBack, prompt);
        
        setTimeout(() => {
            cardBack.classList.add('entered');
        }, 50);
        
        const flipCard = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            console.log('[PACK] Card flip triggered!');
            
            // Remove all event listeners
            const newCardBack = cardBack.cloneNode(true);
            cardBack.parentNode.replaceChild(newCardBack, cardBack);
            newCardBack.classList.add('flipping');
            newCardBack.style.pointerEvents = 'none';
            
            playSound('cardFlip');
            
            setTimeout(() => {
                const revealedCard = createRevealedCard(cardData, currentCardIndex);
                newCardBack.replaceWith(revealedCard);
                
                if (cardData.rarity === 'legendary') {
                    // Play ultra rare sound for legendary cards (randomly choose between the two)
                    const ultraRareSound = Math.random() < 0.5 ? 'legendary' : 'legendary2';
                    playSound(ultraRareSound);
                    triggerLegendaryEffect(revealedCard);
                } else if (cardData.rarity === 'epic') {
                    // Play super rare sound for epic cards
                    playSound('epic');
                    triggerEpicEffect(revealedCard);
                } else if (cardData.rarity === 'rare') {
                    playSound('rare');
                }
                
                currentCardIndex++;
                isRevealing = false;
                
                if (currentCardIndex < cards.length) {
                    prompt.innerHTML = `Tap anywhere to reveal next card... (${currentCardIndex}/${cards.length})`;
                } else {
                    revealNextCard();
                }
            }, 600);
        };
        
        // Add multiple event listeners for better compatibility
        cardBack.addEventListener('click', flipCard, { passive: false });
        cardBack.addEventListener('touchend', (e) => {
            e.preventDefault();
            flipCard(e);
        }, { passive: false });
        
        // Auto-reveal after 3 seconds if not clicked
        setTimeout(() => {
            if (currentCardIndex < cards.length && !cardBack.classList.contains('flipping')) {
                console.log('[PACK] Auto-revealing card after timeout');
                flipCard();
            }
        }, 3000);
    }
    
    // Make entire modal clickable to reveal next card
    modalClickHandler = (e) => {
        // Don't trigger if clicking on a revealed card or close button
        if (e.target.closest('.pack-card-revealed') || e.target.closest('.pack-opening-close')) {
            return;
        }
        
        // If clicking on card back, let it handle its own click
        if (e.target.closest('.pack-card-back')) {
            return;
        }
        
        // Otherwise, reveal next card
        if (!isRevealing && currentCardIndex < cards.length) {
            console.log('[PACK] Modal clicked, revealing next card');
            revealNextCard();
        }
    };
    
    modal.addEventListener('click', modalClickHandler);
    modal.style.cursor = 'pointer';
    
    // Start revealing first card
    revealNextCard();
}

function createRevealedCard(cardData, index) {
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
    const card = cardDB[cardData.id];
    
    const cardDiv = document.createElement('div');
    cardDiv.className = 'pack-card-revealed';
    cardDiv.dataset.rarity = cardData.rarity;
    
    // Check if card is glossy
    const isGlossy = isCardGlossy(cardData.id);
    if (isGlossy) {
        cardDiv.classList.add('glossy-card');
    }
    
    if (card) {
        const createCardFn = (typeof createCard !== 'undefined') ? createCard : 
                             (typeof window !== 'undefined' && typeof window.createCard === 'function') ? window.createCard : null;
        
        if (createCardFn) {
            const cardObj = createCardFn(cardData.id);
            if (cardObj && typeof cardObj.createElement === 'function') {
                const cardElement = cardObj.createElement();
                cardElement.style.width = '100%';
                cardElement.style.height = '100%';
                cardDiv.appendChild(cardElement);
            }
        } else {
            cardDiv.innerHTML = `
                <div class="pack-card-content">
                    <div class="pack-card-rarity-badge ${cardData.rarity}">${cardData.rarity.toUpperCase()}</div>
                    <div class="pack-card-name">${card.name}</div>
                    <div class="pack-card-type">${card.type}</div>
                    <div class="pack-card-cost">⭐ ${card.cost}</div>
                </div>
            `;
        }
    }
    
    // Add rarity badge overlay
    const rarityBadge = document.createElement('div');
    rarityBadge.className = 'card-rarity-label';
    rarityBadge.textContent = getRarityDisplayName(cardData.rarity);
    rarityBadge.dataset.rarity = cardData.rarity;
    cardDiv.appendChild(rarityBadge);
    
    // Add glossy indicator if card is glossy
    if (isGlossy) {
        const glossyBadge = document.createElement('div');
        glossyBadge.className = 'card-glossy-badge';
        glossyBadge.textContent = '✨ GLOSSY';
        cardDiv.appendChild(glossyBadge);
    }
    
    const glowOverlay = document.createElement('div');
    glowOverlay.className = 'card-glow-overlay';
    cardDiv.appendChild(glowOverlay);
    
    return cardDiv;
}

function createParticleCanvas(modal) {
    let canvas = modal.querySelector('.particle-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'particle-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        modal.appendChild(canvas);
    }
    return canvas;
}

function triggerLegendaryEffect(cardElement) {
    const canvas = document.querySelector('.particle-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = cardElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: centerX,
            y: centerY,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: `hsl(${45 + Math.random() * 30}, 100%, 50%)`
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let alive = 0;
        particles.forEach(p => {
            if (p.life > 0) {
                alive++;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2;
                p.life -= 0.02;
                
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        if (alive > 0) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    animate();
}

function triggerEpicEffect(cardElement) {
    cardElement.style.animation = 'epicPulse 2s ease-in-out 3';
}

function showCloseButton() {
    const closeBtn = document.getElementById('packOpeningClose');
    if (closeBtn) {
        closeBtn.style.display = 'block';
        closeBtn.classList.add('btn-appear');
    }
}

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
    
    if (freePacks > 0) {
        if (useFreePack()) {
            console.log('[SHOP] Using free pack');
            openPack(packType, true);
            updateShopUI();
            return true;
        }
    }
    
    const currency = (typeof playerCurrency !== 'undefined') ? playerCurrency :
                     (typeof window !== 'undefined' && window.playerCurrency) ? window.playerCurrency : null;
    
    if (currency && currency.arcana >= pack.cost) {
        currency.arcana -= pack.cost;
        
        if (typeof saveCurrency === 'function') {
            saveCurrency();
        } else if (typeof window !== 'undefined' && typeof window.saveCurrency === 'function') {
            window.saveCurrency();
        } else {
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

function updateShopUI() {
    if (typeof playerCurrency !== 'undefined' && typeof updateCurrencyDisplay === 'function') {
        updateCurrencyDisplay();
    } else if (typeof window !== 'undefined' && typeof window.updateCurrencyDisplay === 'function') {
        window.updateCurrencyDisplay();
    }
    
    const freePacksCount = getFreePacksCount();
    const freePacksDisplay = document.getElementById('freePacksCount');
    const freePacksBanner = document.getElementById('freePacksBanner');
    
    if (freePacksDisplay) {
        freePacksDisplay.textContent = freePacksCount;
    }
    if (freePacksBanner) {
        freePacksBanner.style.display = freePacksCount > 0 ? 'block' : 'none';
    }
    
    const buyButtons = document.querySelectorAll('.buy-pack-btn');
    buyButtons.forEach(btn => {
        const packType = btn.getAttribute('data-pack-type') || 'starter';
        if (freePacksCount > 0) {
            btn.textContent = `Use Free Pack (${freePacksCount} left)`;
            btn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        } else {
            const pack = PACK_TYPES[packType];
            btn.textContent = `Buy Pack (${pack.cost} ✨)`;
            btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    });
}

function initShop() {
    console.log('[SHOP] Initializing shop...');
    try {
        initCardCollection();
        
        if (hasFreePacks()) {
            const freePacksGiven = giveFreePacks();
            console.log('[SHOP] Gave', freePacksGiven, 'free packs to new player');
        }
        
        updateShopUI();
        console.log('[SHOP] Shop initialized successfully');
    } catch (error) {
        console.error('[SHOP] Error in initShop:', error);
    }
}

function closePackOpening() {
    const modal = document.getElementById('packOpeningModal');
    if (modal) {
        modal.style.display = 'none';
        
        const canvas = modal.querySelector('.particle-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    updateShopUI();
}

if (typeof window !== 'undefined') {
    window.buyPack = buyPack;
    window.openPack = openPack;
    window.initShop = initShop;
    window.updateShopUI = updateShopUI;
    window.getCardCollection = getCardCollection;
    window.addCardsToCollection = addCardsToCollection;
    window.getFreePacksCount = getFreePacksCount;
    window.useFreePack = useFreePack;
    window.showEnhancedPackOpening = showEnhancedPackOpening;
    window.closePackOpening = closePackOpening;
    console.log('[SHOP] Functions made globally available');
}
