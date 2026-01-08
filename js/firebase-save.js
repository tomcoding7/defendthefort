// Firebase Save/Load System
// Handles saving and loading player data to/from Firestore

// Get all local player data
function getLocalPlayerData() {
    return {
        // Profile
        level: (typeof window !== 'undefined' && typeof window.getPlayerLevel === 'function') 
            ? window.getPlayerLevel() : 1,
        experience: (typeof window !== 'undefined' && typeof window.getPlayerExperience === 'function') 
            ? window.getPlayerExperience() : 0,
        loginStreak: (typeof window !== 'undefined' && typeof window.getLoginStreak === 'function') 
            ? window.getLoginStreak() : 0,
        lastLoginDate: localStorage.getItem('lastLoginDate'),
        
        // Currency
        currency: (typeof playerCurrency !== 'undefined') ? playerCurrency : 
                  (typeof window !== 'undefined' && window.playerCurrency) ? window.playerCurrency : 
                  { gold: 0, arcana: 0 },
        
        // Collection
        cardCollection: (typeof window !== 'undefined' && typeof window.getCardCollection === 'function') 
            ? window.getCardCollection() : {},
        glossyCards: JSON.parse(localStorage.getItem('glossyCards') || '{}'),
        
        // Deck
        currentDeck: (typeof window !== 'undefined' && typeof window.loadDeck === 'function') 
            ? window.loadDeck() : [],
        
        // Progress
        aiWins: (typeof window !== 'undefined' && typeof window.getAIWinsCount === 'function') 
            ? window.getAIWinsCount() : 0,
        playerTitle: localStorage.getItem('playerTitle') || '',
        
        // Settings (if you have any)
        settings: {
            musicEnabled: true,
            soundEnabled: true
        }
    };
}

// Save player data to Firestore
async function savePlayerDataToCloud(userId, data) {
    if (!firestore) {
        console.error('[FIREBASE SAVE] Firestore not initialized');
        return { success: false, error: 'Firestore not initialized' };
    }
    
    try {
        const playerRef = firestore.collection('players').doc(userId);
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        await playerRef.set({
            ...data,
            lastSaved: timestamp,
            version: '1.0' // For future migrations
        }, { merge: true });
        
        console.log('[FIREBASE SAVE] Data saved successfully');
        return { success: true };
    } catch (error) {
        console.error('[FIREBASE SAVE] Error saving:', error);
        return { success: false, error: error.message };
    }
}

// Load player data from Firestore
async function loadPlayerDataFromCloud(userId) {
    if (!firestore) {
        console.error('[FIREBASE SAVE] Firestore not initialized');
        return null;
    }
    
    try {
        const playerRef = firestore.collection('players').doc(userId);
        const doc = await playerRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log('[FIREBASE SAVE] Data loaded successfully');
            return data;
        } else {
            console.log('[FIREBASE SAVE] No data found for user');
            return null;
        }
    } catch (error) {
        console.error('[FIREBASE SAVE] Error loading:', error);
        return null;
    }
}

// Sync local data to cloud
async function syncToCloud() {
    const isSignedInFn = (typeof isSignedIn === 'function') ? isSignedIn :
                        (typeof window !== 'undefined' && typeof window.isSignedIn === 'function') 
                        ? window.isSignedIn : () => false;
    
    if (!isSignedInFn()) {
        console.warn('[FIREBASE SAVE] Not signed in, cannot sync');
        return { success: false, error: 'Not signed in' };
    }
    
    const getCurrentUserFn = (typeof getCurrentUser === 'function') ? getCurrentUser :
                            (typeof window !== 'undefined' && typeof window.getCurrentUser === 'function') 
                            ? window.getCurrentUser : () => null;
    
    const user = getCurrentUserFn();
    if (!user || !user.uid) {
        return { success: false, error: 'No user found' };
    }
    
    const userId = user.uid;
    const localData = getLocalPlayerData();
    
    const result = await savePlayerDataToCloud(userId, localData);
    
    if (result.success) {
        // Show success message
        showSyncMessage('Data saved to cloud!', 'success');
    } else {
        showSyncMessage('Failed to save to cloud: ' + result.error, 'error');
    }
    
    return result;
}

// Sync cloud data to local
async function syncFromCloud() {
    const isSignedInFn = (typeof isSignedIn === 'function') ? isSignedIn :
                        (typeof window !== 'undefined' && typeof window.isSignedIn === 'function') 
                        ? window.isSignedIn : () => false;
    
    if (!isSignedInFn()) {
        console.warn('[FIREBASE SAVE] Not signed in, cannot sync');
        return { success: false, error: 'Not signed in' };
    }
    
    const getCurrentUserFn = (typeof getCurrentUser === 'function') ? getCurrentUser :
                            (typeof window !== 'undefined' && typeof window.getCurrentUser === 'function') 
                            ? window.getCurrentUser : () => null;
    
    const user = getCurrentUserFn();
    if (!user || !user.uid) {
        return { success: false, error: 'No user found' };
    }
    
    const userId = user.uid;
    const cloudData = await loadPlayerDataFromCloud(userId);
    
    if (!cloudData) {
        console.log('[FIREBASE SAVE] No cloud data found, keeping local data');
        return { success: false, error: 'No cloud data found' };
    }
    
    try {
        // Restore level
        if (cloudData.level !== undefined) {
            if (typeof window !== 'undefined' && typeof window.setPlayerLevel === 'function') {
                window.setPlayerLevel(cloudData.level);
            } else {
                localStorage.setItem('playerLevel', cloudData.level.toString());
            }
        }
        if (cloudData.experience !== undefined) {
            if (typeof window !== 'undefined' && typeof window.setPlayerExperience === 'function') {
                window.setPlayerExperience(cloudData.experience);
            } else {
                localStorage.setItem('playerExperience', cloudData.experience.toString());
            }
        }
        
        // Restore currency
        if (cloudData.currency) {
            if (typeof playerCurrency !== 'undefined') {
                playerCurrency = cloudData.currency;
            } else if (typeof window !== 'undefined') {
                window.playerCurrency = cloudData.currency;
            }
            if (typeof saveCurrency === 'function') {
                saveCurrency();
            } else if (typeof window !== 'undefined' && typeof window.saveCurrency === 'function') {
                window.saveCurrency();
            }
        }
        
        // Restore card collection
        if (cloudData.cardCollection) {
            localStorage.setItem('cardCollection', JSON.stringify(cloudData.cardCollection));
        }
        
        // Restore glossy cards
        if (cloudData.glossyCards) {
            localStorage.setItem('glossyCards', JSON.stringify(cloudData.glossyCards));
        }
        
        // Restore deck
        if (cloudData.currentDeck && typeof window !== 'undefined' && typeof window.saveDeck === 'function') {
            window.saveDeck(cloudData.currentDeck);
        }
        
        // Restore progress
        if (cloudData.aiWins !== undefined) {
            localStorage.setItem('aiWins', cloudData.aiWins.toString());
        }
        if (cloudData.playerTitle) {
            localStorage.setItem('playerTitle', cloudData.playerTitle);
        }
        
        // Restore login streak
        if (cloudData.loginStreak !== undefined) {
            localStorage.setItem('loginStreak', cloudData.loginStreak.toString());
        }
        if (cloudData.lastLoginDate) {
            localStorage.setItem('lastLoginDate', cloudData.lastLoginDate);
        }
        
        // Update UI
        if (typeof updateCurrencyDisplay === 'function') {
            updateCurrencyDisplay();
        } else if (typeof window !== 'undefined' && typeof window.updateCurrencyDisplay === 'function') {
            window.updateCurrencyDisplay();
        }
        
        console.log('[FIREBASE SAVE] Data synced from cloud');
        showSyncMessage('Data loaded from cloud!', 'success');
        return { success: true };
    } catch (error) {
        console.error('[FIREBASE SAVE] Error restoring data:', error);
        showSyncMessage('Error loading data: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Show sync message
function showSyncMessage(message, type = 'success') {
    // Create or get message element
    let messageEl = document.getElementById('firebaseSyncMessage');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'firebaseSyncMessage';
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            z-index: 30000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.style.background = type === 'success' 
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
        : 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)';
    
    messageEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        messageEl.style.opacity = '0';
        messageEl.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            messageEl.style.display = 'none';
            messageEl.style.opacity = '1';
        }, 300);
    }, 3000);
}

// Auto-save on data changes (debounced)
let saveTimeout = null;
function autoSave() {
    const isSignedInFn = (typeof isSignedIn === 'function') ? isSignedIn :
                        (typeof window !== 'undefined' && typeof window.isSignedIn === 'function') 
                        ? window.isSignedIn : () => false;
    
    if (!isSignedInFn()) return;
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        const syncFn = (typeof syncToCloud === 'function') ? syncToCloud :
                      (typeof window !== 'undefined' && typeof window.syncToCloud === 'function') 
                      ? window.syncToCloud : null;
        if (syncFn) {
            syncFn();
        }
    }, 2000); // Save 2 seconds after last change
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.savePlayerDataToCloud = savePlayerDataToCloud;
    window.loadPlayerDataFromCloud = loadPlayerDataFromCloud;
    window.syncToCloud = syncToCloud;
    window.syncFromCloud = syncFromCloud;
    window.autoSave = autoSave;
    window.getLocalPlayerData = getLocalPlayerData;
}
