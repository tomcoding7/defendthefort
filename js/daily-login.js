// Daily Login Reward System
// Gives players rewards when they log in each day

const LAST_LOGIN_KEY = 'lastLoginDate';
const LOGIN_STREAK_KEY = 'loginStreak';

// Get today's date as a string (YYYY-MM-DD)
function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Get the last login date
function getLastLoginDate() {
    try {
        return localStorage.getItem(LAST_LOGIN_KEY);
    } catch (e) {
        return null;
    }
}

// Set the last login date to today
function setLastLoginDate() {
    try {
        localStorage.setItem(LAST_LOGIN_KEY, getTodayDateString());
    } catch (e) {
        console.error('[DAILY LOGIN] Error saving last login date:', e);
    }
}

// Check if player has logged in today
function hasLoggedInToday() {
    const lastLogin = getLastLoginDate();
    const today = getTodayDateString();
    return lastLogin === today;
}

// Get login streak
function getLoginStreak() {
    try {
        return parseInt(localStorage.getItem(LOGIN_STREAK_KEY) || '0');
    } catch (e) {
        return 0;
    }
}

// Update login streak
function updateLoginStreak() {
    const lastLogin = getLastLoginDate();
    const today = getTodayDateString();
    let streak = getLoginStreak();
    
    if (!lastLogin) {
        // First time logging in
        streak = 1;
    } else {
        const lastLoginDate = new Date(lastLogin);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate - lastLoginDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            // Consecutive day
            streak += 1;
        } else if (daysDiff > 1) {
            // Streak broken
            streak = 1;
        }
        // If daysDiff === 0, already logged in today, don't update streak
    }
    
    try {
        localStorage.setItem(LOGIN_STREAK_KEY, streak.toString());
    } catch (e) {
        console.error('[DAILY LOGIN] Error saving login streak:', e);
    }
    
    return streak;
}

// Generate daily reward based on day of week (for variety)
function generateDailyReward() {
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const streak = getLoginStreak();
    
    // Reward types: 'arcana', 'gold', 'rare_card', 'super_rare_card'
    const rewardTypes = ['arcana', 'gold', 'rare_card', 'super_rare_card'];
    
    // Use day of week to determine reward type (cycles through types)
    const rewardTypeIndex = dayOfWeek % rewardTypes.length;
    const rewardType = rewardTypes[rewardTypeIndex];
    
    let reward = {
        type: rewardType,
        amount: 0,
        cardId: null,
        cardRarity: null
    };
    
    switch (rewardType) {
        case 'arcana':
            // 50-100 arcana, bonus for streak
            reward.amount = 50 + Math.floor(Math.random() * 51) + (streak * 5);
            break;
            
        case 'gold':
            // 100-200 gold, bonus for streak
            reward.amount = 100 + Math.floor(Math.random() * 101) + (streak * 10);
            break;
            
        case 'rare_card':
            reward.cardRarity = 'rare';
            reward.cardId = getRandomCardByRarity('rare');
            break;
            
        case 'super_rare_card':
            reward.cardRarity = 'epic';
            reward.cardId = getRandomCardByRarity('epic');
            break;
    }
    
    return reward;
}

// Get a random card by rarity
function getRandomCardByRarity(rarity) {
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
    
    if (!cardDB || Object.keys(cardDB).length === 0) {
        console.warn('[DAILY LOGIN] Card database not available');
        return null;
    }
    
    // Get rarity function - try from shop-enhanced.js first
    let getRarityFn = null;
    if (typeof window !== 'undefined') {
        // Check if shop-enhanced.js is loaded (it has getCardRarity)
        if (typeof window.getCardRarity === 'function') {
            getRarityFn = window.getCardRarity;
        } else {
            // Try to access from shop-enhanced.js scope (if loaded)
            try {
                if (typeof getCardRarity === 'function') {
                    getRarityFn = getCardRarity;
                }
            } catch (e) {}
        }
    }
    
    if (!getRarityFn) {
        // Fallback: determine rarity by cost
        const allCards = Object.entries(cardDB);
        const cardsOfRarity = allCards.filter(([cardId, cardData]) => {
            if (rarity === 'rare') {
                return cardData.cost >= 2 && cardData.cost < 4;
            } else if (rarity === 'epic') {
                return cardData.cost >= 4 && cardData.cost < 6;
            }
            return false;
        });
        
        if (cardsOfRarity.length > 0) {
            const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            return randomCard[0]; // Return card ID
        }
    } else {
        // Use getCardRarity function
        const allCards = Object.entries(cardDB);
        const cardsOfRarity = allCards.filter(([cardId, cardData]) => {
            return getRarityFn(cardId) === rarity;
        });
        
        if (cardsOfRarity.length > 0) {
            const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            return randomCard[0]; // Return card ID
        }
    }
    
    // Fallback: return any card
    const allCardIds = Object.keys(cardDB);
    return allCardIds[Math.floor(Math.random() * allCardIds.length)];
}

// Claim daily reward
function claimDailyReward(reward) {
    // Award currency
    if (reward.type === 'arcana' || reward.type === 'gold') {
        const currency = (typeof playerCurrency !== 'undefined') ? playerCurrency :
                         (typeof window !== 'undefined' && window.playerCurrency) ? window.playerCurrency : null;
        
        if (currency) {
            if (reward.type === 'arcana') {
                currency.arcana = (currency.arcana || 0) + reward.amount;
            } else if (reward.type === 'gold') {
                currency.gold = (currency.gold || 0) + reward.amount;
            }
            
            // Save currency
            if (typeof saveCurrency === 'function') {
                saveCurrency();
            } else if (typeof window !== 'undefined' && typeof window.saveCurrency === 'function') {
                window.saveCurrency();
            } else {
                try {
                    localStorage.setItem('playerCurrency', JSON.stringify(currency));
                } catch (e) {
                    console.error('[DAILY LOGIN] Error saving currency:', e);
                }
            }
            
            // Update currency display
            if (typeof updateCurrencyDisplay === 'function') {
                updateCurrencyDisplay();
            } else if (typeof window !== 'undefined' && typeof window.updateCurrencyDisplay === 'function') {
                window.updateCurrencyDisplay();
            }
        }
    }
    
    // Award card
    if (reward.type === 'rare_card' || reward.type === 'super_rare_card') {
        if (reward.cardId) {
            const addCardsFn = (typeof addCardsToCollection !== 'undefined') ? addCardsToCollection :
                              (typeof window !== 'undefined' && typeof window.addCardsToCollection) ? window.addCardsToCollection : null;
            
            if (addCardsFn) {
                addCardsFn([reward.cardId]);
            }
        }
    }
}

// Check and process daily login
function checkDailyLogin() {
    console.log('[DAILY LOGIN] checkDailyLogin called');
    
    if (hasLoggedInToday()) {
        // Already logged in today
        console.log('[DAILY LOGIN] Already logged in today');
        return null;
    }
    
    console.log('[DAILY LOGIN] New login detected, processing reward...');
    
    // Update streak
    const streak = updateLoginStreak();
    console.log('[DAILY LOGIN] Login streak:', streak);
    
    // Generate reward
    const reward = generateDailyReward();
    console.log('[DAILY LOGIN] Generated reward:', reward);
    
    // Claim reward
    claimDailyReward(reward);
    console.log('[DAILY LOGIN] Reward claimed');
    
    // Set last login date
    setLastLoginDate();
    console.log('[DAILY LOGIN] Last login date set');
    
    return {
        reward: reward,
        streak: streak
    };
}

// Show daily login reward modal
function showDailyLoginModal(reward, streak) {
    console.log('[DAILY LOGIN] showDailyLoginModal called with:', { reward, streak });
    
    const modal = document.getElementById('dailyLoginModal');
    if (!modal) {
        console.error('[DAILY LOGIN] Modal element not found!');
        return;
    }
    
    const rewardContainer = document.getElementById('dailyLoginReward');
    const streakValue = document.getElementById('streakValue');
    const claimBtn = document.getElementById('dailyLoginClaim');
    const closeBtn = document.getElementById('dailyLoginClose');
    
    if (!rewardContainer || !streakValue || !claimBtn) {
        console.error('[DAILY LOGIN] Required modal elements not found!', {
            rewardContainer: !!rewardContainer,
            streakValue: !!streakValue,
            claimBtn: !!claimBtn
        });
        return;
    }
    
    // Update streak
    if (streakValue) {
        streakValue.textContent = streak;
    }
    
    // Clear previous reward content
    rewardContainer.innerHTML = '';
    
    // Create reward display based on type
    let rewardHTML = '';
    let rewardIcon = '';
    let rewardText = '';
    
    switch (reward.type) {
        case 'arcana':
            rewardIcon = '✨';
            rewardText = `${reward.amount} Arcana`;
            break;
        case 'gold':
            rewardIcon = '🪙';
            rewardText = `${reward.amount} Gold`;
            break;
        case 'rare_card':
            rewardIcon = '🃏';
            const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                           (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
            const cardName = cardDB[reward.cardId] ? cardDB[reward.cardId].name : 'Rare Card';
            rewardText = `1 Rare Card: ${cardName}`;
            break;
        case 'super_rare_card':
            rewardIcon = '🃏';
            const cardDB2 = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                            (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
            const cardName2 = cardDB2[reward.cardId] ? cardDB2[reward.cardId].name : 'Super Rare Card';
            rewardText = `1 Super Rare Card: ${cardName2}`;
            break;
    }
    
    rewardHTML = `
        <div class="daily-reward-icon">${rewardIcon}</div>
        <div class="daily-reward-text">${rewardText}</div>
    `;
    
    rewardContainer.innerHTML = rewardHTML;
    
    // Show modal
    console.log('[DAILY LOGIN] Displaying modal...');
    modal.style.display = 'flex';
    
    // Force modal to be visible (in case CSS is hiding it)
    modal.style.zIndex = '20000';
    modal.style.position = 'fixed';
    
    // Close button handler
    if (closeBtn) {
        closeBtn.onclick = () => {
            console.log('[DAILY LOGIN] Close button clicked');
            modal.style.display = 'none';
        };
    }
    
    // Claim button handler (reward already claimed, just close)
    claimBtn.onclick = () => {
        console.log('[DAILY LOGIN] Claim button clicked');
        modal.style.display = 'none';
    };
    
    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            console.log('[DAILY LOGIN] Background clicked, closing modal');
            modal.style.display = 'none';
        }
    };
    
    console.log('[DAILY LOGIN] Modal should now be visible');
}

// Test function to manually trigger daily login (for debugging)
function testDailyLogin() {
    // Clear last login date to simulate new login
    localStorage.removeItem(LAST_LOGIN_KEY);
    console.log('[DAILY LOGIN] Test: Cleared last login date');
    
    // Check daily login
    const result = checkDailyLogin();
    if (result && result.reward) {
        showDailyLoginModal(result.reward, result.streak);
    } else {
        console.log('[DAILY LOGIN] Test: No reward to show');
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.checkDailyLogin = checkDailyLogin;
    window.getLoginStreak = getLoginStreak;
    window.hasLoggedInToday = hasLoggedInToday;
    window.showDailyLoginModal = showDailyLoginModal;
    window.testDailyLogin = testDailyLogin; // For testing
}
