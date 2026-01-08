// Player Level System
// Handles player level, experience, and level-up rewards

const PLAYER_LEVEL_KEY = 'playerLevel';
const PLAYER_EXP_KEY = 'playerExperience';

// Calculate experience needed for next level
function getExpForLevel(level) {
    // Exponential growth: 100 * level^1.5
    return Math.floor(100 * Math.pow(level, 1.5));
}

// Get player level
function getPlayerLevel() {
    try {
        return parseInt(localStorage.getItem(PLAYER_LEVEL_KEY) || '1');
    } catch (e) {
        return 1;
    }
}

// Get player experience
function getPlayerExperience() {
    try {
        return parseInt(localStorage.getItem(PLAYER_EXP_KEY) || '0');
    } catch (e) {
        return 0;
    }
}

// Set player level
function setPlayerLevel(level) {
    try {
        localStorage.setItem(PLAYER_LEVEL_KEY, level.toString());
    } catch (e) {
        console.error('[PLAYER LEVEL] Error saving level:', e);
    }
}

// Set player experience
function setPlayerExperience(exp) {
    try {
        localStorage.setItem(PLAYER_EXP_KEY, exp.toString());
    } catch (e) {
        console.error('[PLAYER LEVEL] Error saving experience:', e);
    }
}

// Make setter functions globally available
if (typeof window !== 'undefined') {
    window.setPlayerLevel = setPlayerLevel;
    window.setPlayerExperience = setPlayerExperience;
}

// Add experience and check for level up
function addExperience(amount) {
    const currentLevel = getPlayerLevel();
    let currentExp = getPlayerExperience();
    const expNeeded = getExpForLevel(currentLevel);
    
    currentExp += amount;
    
    // Check for level up
    if (currentExp >= expNeeded) {
        const newLevel = currentLevel + 1;
        const remainingExp = currentExp - expNeeded;
        
        setPlayerLevel(newLevel);
        setPlayerExperience(remainingExp);
        
        // Award level up rewards
        awardLevelUpRewards(newLevel);
        
        // Play level up sound
        playLevelUpSound();
        
        // Show level up notification
        showLevelUpNotification(newLevel);
        
        return {
            leveledUp: true,
            newLevel: newLevel,
            remainingExp: remainingExp
        };
    } else {
        setPlayerExperience(currentExp);
        return {
            leveledUp: false,
            currentExp: currentExp,
            expNeeded: expNeeded
        };
    }
}

// Award level up rewards
function awardLevelUpRewards(level) {
    const currency = (typeof playerCurrency !== 'undefined') ? playerCurrency :
                     (typeof window !== 'undefined' && window.playerCurrency) ? window.playerCurrency : null;
    
    if (!currency) {
        // Try to load currency
        if (typeof loadCurrency === 'function') {
            loadCurrency();
            currency = (typeof playerCurrency !== 'undefined') ? playerCurrency :
                       (typeof window !== 'undefined' && window.playerCurrency) ? window.playerCurrency : null;
        }
    }
    
    // Base rewards that scale with level
    const goldReward = 50 + (level * 10);
    const arcanaReward = 25 + (level * 5);
    
    if (currency) {
        currency.gold = (currency.gold || 0) + goldReward;
        currency.arcana = (currency.arcana || 0) + arcanaReward;
        
        // Save currency
        if (typeof saveCurrency === 'function') {
            saveCurrency();
        } else if (typeof window !== 'undefined' && typeof window.saveCurrency === 'function') {
            window.saveCurrency();
        } else {
            try {
                localStorage.setItem('playerCurrency', JSON.stringify(currency));
            } catch (e) {
                console.error('[PLAYER LEVEL] Error saving currency:', e);
            }
        }
        
        // Update currency display
        if (typeof updateCurrencyDisplay === 'function') {
            updateCurrencyDisplay();
        } else if (typeof window !== 'undefined' && typeof window.updateCurrencyDisplay === 'function') {
            window.updateCurrencyDisplay();
        }
    }
    
    // Every 5 levels, award a random card
    if (level % 5 === 0) {
        awardRandomCard(level);
    }
    
    return {
        gold: goldReward,
        arcana: arcanaReward,
        card: level % 5 === 0
    };
}

// Award a random card based on level
function awardRandomCard(level) {
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
    
    if (!cardDB || Object.keys(cardDB).length === 0) {
        console.warn('[PLAYER LEVEL] Card database not available');
        return null;
    }
    
    // Higher levels have better card chances
    let rarity = 'common';
    const rarityRoll = Math.random();
    
    if (level >= 20) {
        // Level 20+: 10% legendary, 20% epic, 30% rare, 40% common
        if (rarityRoll < 0.1) rarity = 'legendary';
        else if (rarityRoll < 0.3) rarity = 'epic';
        else if (rarityRoll < 0.6) rarity = 'rare';
    } else if (level >= 10) {
        // Level 10-19: 5% legendary, 15% epic, 30% rare, 50% common
        if (rarityRoll < 0.05) rarity = 'legendary';
        else if (rarityRoll < 0.2) rarity = 'epic';
        else if (rarityRoll < 0.5) rarity = 'rare';
    } else if (level >= 5) {
        // Level 5-9: 10% epic, 30% rare, 60% common
        if (rarityRoll < 0.1) rarity = 'epic';
        else if (rarityRoll < 0.4) rarity = 'rare';
    } else {
        // Level 1-4: 20% rare, 80% common
        if (rarityRoll < 0.2) rarity = 'rare';
    }
    
    // Get rarity function
    let getRarityFn = null;
    if (typeof window !== 'undefined' && typeof window.getCardRarity === 'function') {
        getRarityFn = window.getCardRarity;
    }
    
    let cardId = null;
    
    if (getRarityFn) {
        const allCards = Object.entries(cardDB);
        const cardsOfRarity = allCards.filter(([id, cardData]) => {
            return getRarityFn(id) === rarity;
        });
        
        if (cardsOfRarity.length > 0) {
            const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            cardId = randomCard[0];
        }
    }
    
    // Fallback: determine by cost
    if (!cardId) {
        const allCards = Object.entries(cardDB);
        const cardsOfRarity = allCards.filter(([id, cardData]) => {
            if (rarity === 'legendary') return cardData.cost >= 6;
            if (rarity === 'epic') return cardData.cost >= 4 && cardData.cost < 6;
            if (rarity === 'rare') return cardData.cost >= 2 && cardData.cost < 4;
            return cardData.cost < 2;
        });
        
        if (cardsOfRarity.length > 0) {
            const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            cardId = randomCard[0];
        } else {
            // Ultimate fallback: any card
            const allCardIds = Object.keys(cardDB);
            cardId = allCardIds[Math.floor(Math.random() * allCardIds.length)];
        }
    }
    
    // Add card to collection
    if (cardId) {
        const addCardsFn = (typeof addCardsToCollection !== 'undefined') ? addCardsToCollection :
                          (typeof window !== 'undefined' && typeof window.addCardsToCollection) ? window.addCardsToCollection : null;
        
        if (addCardsFn) {
            addCardsFn([cardId]);
        }
    }
    
    return cardId;
}

// Play level up sound
function playLevelUpSound() {
    const sounds = [
        'assets/soundeffects/rewards/levelup.wav',
        'assets/soundeffects/rewards/levelup2.wav',
        'assets/soundeffects/rewards/levelup3.wav'
    ];
    
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    
    try {
        const audio = new Audio(randomSound);
        audio.volume = 0.7;
        audio.play().catch((error) => {
            console.debug('[PLAYER LEVEL] Could not play level up sound:', error);
        });
    } catch (e) {
        console.debug('[PLAYER LEVEL] Error playing level up sound:', e);
    }
}

// Show level up notification
function showLevelUpNotification(level) {
    // Create or get notification element
    let notification = document.getElementById('levelUpNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'levelUpNotification';
        notification.className = 'level-up-notification';
        document.body.appendChild(notification);
    }
    
    notification.innerHTML = `
        <div class="level-up-content">
            <div class="level-up-icon">⭐</div>
            <div class="level-up-text">
                <div class="level-up-title">LEVEL UP!</div>
                <div class="level-up-level">Level ${level}</div>
            </div>
        </div>
    `;
    
    notification.style.display = 'flex';
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    }, 3000);
}

// Get experience progress (0-1)
function getExperienceProgress() {
    const level = getPlayerLevel();
    const exp = getPlayerExperience();
    const expNeeded = getExpForLevel(level);
    return exp / expNeeded;
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.getPlayerLevel = getPlayerLevel;
    window.getPlayerExperience = getPlayerExperience;
    window.addExperience = addExperience;
    window.getExpForLevel = getExpForLevel;
    window.getExperienceProgress = getExperienceProgress;
}
