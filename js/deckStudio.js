// Deck Studio UI and functionality
let currentDeck = [];
let deckStudioInitialized = false;

// Initialize deck studio
function initDeckStudio() {
    if (deckStudioInitialized) return;
    
    // Load current deck
    currentDeck = loadDeck();
    
    // Setup event listeners
    const deckStudioBtn = document.getElementById('deckStudioBtn');
    const deckStudioModal = document.getElementById('deckStudioModal');
    const closeDeckStudio = document.getElementById('closeDeckStudio');
    const saveDeckBtn = document.getElementById('saveDeckBtn');
    const resetDeckBtn = document.getElementById('resetDeckBtn');
    const exportDeckBtn = document.getElementById('exportDeckBtn');
    const importDeckBtn = document.getElementById('importDeckBtn');
    
    if (deckStudioBtn) {
        deckStudioBtn.addEventListener('click', () => {
            openDeckStudio();
        });
    }
    
    if (closeDeckStudio) {
        closeDeckStudio.addEventListener('click', () => {
            closeDeckStudioModal();
        });
    }
    
    if (saveDeckBtn) {
        saveDeckBtn.addEventListener('click', () => {
            saveCurrentDeck();
        });
    }
    
    if (resetDeckBtn) {
        resetDeckBtn.addEventListener('click', () => {
            resetToDefaultDeck();
        });
    }
    
    if (exportDeckBtn) {
        exportDeckBtn.addEventListener('click', () => {
            exportCurrentDeck();
        });
    }
    
    if (importDeckBtn) {
        importDeckBtn.addEventListener('click', () => {
            importDeckFromPrompt();
        });
    }
    
    // Setup card filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            renderCardBrowser(filter);
        });
    });
    
    deckStudioInitialized = true;
}

// Open deck studio modal
function openDeckStudio() {
    console.log('[DECK STUDIO] Opening deck studio...');
    const modal = document.getElementById('deckStudioModal');
    if (!modal) {
        console.error('[DECK STUDIO] Modal element not found!');
        return;
    }
    
    // Check if dependencies are loaded
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : null;
    const createCardFn = (typeof createCard !== 'undefined') ? createCard :
                         (typeof window !== 'undefined' && window.createCard) ? window.createCard : null;
    
    if (!cardDB) {
        console.error('[DECK STUDIO] CARD_DATABASE not available');
    }
    if (!createCardFn) {
        console.error('[DECK STUDIO] createCard function not available');
    }
    
    // Reload deck in case it was changed
    if (typeof loadDeck === 'function') {
        currentDeck = loadDeck();
    } else if (typeof window !== 'undefined' && window.loadDeck) {
        currentDeck = window.loadDeck();
    } else {
        console.error('[DECK STUDIO] loadDeck function not available');
        currentDeck = [];
    }
    
    console.log('[DECK STUDIO] Current deck loaded:', currentDeck.length, 'cards');
    
    // Render the studio
    renderDeckStudio();
    
    // Show modal
    modal.style.display = 'block';
    console.log('[DECK STUDIO] Modal displayed');
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.openDeckStudio = openDeckStudio;
    window.initDeckStudio = initDeckStudio;
    window.renderDeckStudio = renderDeckStudio;
}

// Close deck studio modal
function closeDeckStudioModal() {
    const modal = document.getElementById('deckStudioModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Return to main menu if game is not started
    if (typeof game === 'undefined' || !game) {
        setTimeout(() => {
            if (typeof showMainMenu === 'function') {
                showMainMenu();
            }
        }, 100);
    }
}

// Render the entire deck studio
function renderDeckStudio() {
    console.log('[DECK STUDIO] Starting render...');
    
    // Check if dependencies are available
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : null;
    const createCardFn = (typeof createCard !== 'undefined') ? createCard :
                         (typeof window !== 'undefined' && window.createCard) ? window.createCard : null;
    
    if (!cardDB) {
        console.error('[DECK STUDIO] CARD_DATABASE not available');
        const cardBrowser = document.getElementById('cardBrowser');
        if (cardBrowser) {
            cardBrowser.innerHTML = '<p style="color: #fff; padding: 20px;">Error: Card database not loaded. Please refresh the page.</p>';
        }
        return;
    }
    
    if (!createCardFn) {
        console.error('[DECK STUDIO] createCard function not available');
        const cardBrowser = document.getElementById('cardBrowser');
        if (cardBrowser) {
            cardBrowser.innerHTML = '<p style="color: #fff; padding: 20px;">Error: Card creation function not loaded. Please refresh the page.</p>';
        }
        return;
    }
    
    console.log('[DECK STUDIO] Dependencies OK, rendering...');
    console.log('[DECK STUDIO] Card database has', Object.keys(cardDB).length, 'cards');
    
    try {
        console.log('[DECK STUDIO] Rendering card browser...');
        renderCardBrowser('all');
        console.log('[DECK STUDIO] Rendering current deck...');
        renderCurrentDeck();
        console.log('[DECK STUDIO] Updating deck stats...');
        updateDeckStats();
        console.log('[DECK STUDIO] Render complete!');
    } catch (error) {
        console.error('[DECK STUDIO] Error rendering deck studio:', error);
        console.error('[DECK STUDIO] Error stack:', error.stack);
        const cardBrowser = document.getElementById('cardBrowser');
        if (cardBrowser) {
            cardBrowser.innerHTML = `<p style="color: #fff; padding: 20px;">Error rendering deck studio: ${error.message}</p>`;
        }
    }
}

// Render card browser
function renderCardBrowser(filter = 'all') {
    console.log('[DECK STUDIO] renderCardBrowser called with filter:', filter);
    const cardBrowser = document.getElementById('cardBrowser');
    if (!cardBrowser) {
        console.error('[DECK STUDIO] cardBrowser element not found');
        return;
    }
    
    cardBrowser.innerHTML = '';
    
    // Get CARD_DATABASE from global scope if not available locally
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : null;
    
    if (!cardDB) {
        console.error('[DECK STUDIO] CARD_DATABASE not available in renderCardBrowser');
        cardBrowser.innerHTML = '<p style="color: #fff; padding: 20px;">Error: Card database not loaded.</p>';
        return;
    }
    
    // Get player's card collection (only show cards they own)
    let cardCollection = {};
    if (typeof getCardCollection === 'function') {
        cardCollection = getCardCollection();
    } else if (typeof window !== 'undefined' && typeof window.getCardCollection === 'function') {
        cardCollection = window.getCardCollection();
    }
    
    // If collection is empty, show all cards (starter deck)
    const hasCollection = Object.keys(cardCollection).length > 0;
    
    const allCards = Object.values(cardDB);
    console.log('[DECK STUDIO] Total cards in database:', allCards.length);
    console.log('[DECK STUDIO] Player collection has', Object.keys(cardCollection).length, 'card types');
    
    // Filter cards - only show cards player owns (or all if no collection yet)
    let cardsToShow = allCards.filter(card => {
        return !hasCollection || (cardCollection[card.id] && cardCollection[card.id] > 0);
    });
    
    const filteredCards = filter === 'all' 
        ? cardsToShow 
        : cardsToShow.filter(card => card.type === filter);
    console.log('[DECK STUDIO] Filtered cards:', filteredCards.length);
    
    // Sort cards by type, then by cost, then by name
    filteredCards.sort((a, b) => {
        if (a.type !== b.type) {
            const typeOrder = { monster: 0, spell: 1, trap: 2 };
            return typeOrder[a.type] - typeOrder[b.type];
        }
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.name.localeCompare(b.name);
    });
    
    console.log('[DECK STUDIO] Creating card elements...');
    // Reset debug counter
    if (typeof createCardBrowserCard !== 'undefined') {
        createCardBrowserCard._debugCount = 0;
    }
    let cardsCreated = 0;
    filteredCards.forEach(cardData => {
        const cardElement = createCardBrowserCard(cardData);
        if (cardElement) {
            cardBrowser.appendChild(cardElement);
            cardsCreated++;
        } else {
            console.warn('[DECK STUDIO] createCardBrowserCard returned null for:', cardData.id);
        }
    });
    console.log('[DECK STUDIO] Created', cardsCreated, 'card elements');
    console.log('[DECK STUDIO] cardBrowser children count:', cardBrowser.children.length);
    console.log('[DECK STUDIO] cardBrowser innerHTML length:', cardBrowser.innerHTML.length);
    
    // Final check - verify cards are actually visible
    if (cardBrowser.children.length > 0) {
        const firstCard = cardBrowser.children[0];
        const firstCardStyle = window.getComputedStyle(firstCard);
        console.log('[DECK STUDIO] First card in browser - width:', firstCardStyle.width, 'height:', firstCardStyle.height);
        console.log('[DECK STUDIO] First card in browser - display:', firstCardStyle.display, 'visibility:', firstCardStyle.visibility);
        console.log('[DECK STUDIO] First card innerHTML preview:', firstCard.innerHTML.substring(0, 100));
    } else {
        console.error('[DECK STUDIO] No children in cardBrowser after creation!');
    }
}

// Create a card element for the browser
function createCardBrowserCard(cardData) {
    if (!cardData || !cardData.id) {
        console.error('[DECK STUDIO] Invalid cardData in createCardBrowserCard');
        return null;
    }
    
    const card = document.createElement('div');
    card.className = `card-browser-item ${cardData.type}`;
    card.dataset.cardId = cardData.id;
    
    // Get createCard from global scope
    const createCardFn = (typeof createCard !== 'undefined') ? createCard :
                         (typeof window !== 'undefined' && window.createCard) ? window.createCard : null;
    
    if (!createCardFn) {
        console.error('[DECK STUDIO] createCard function not available in createCardBrowserCard');
        // Return a placeholder instead of empty div
        card.innerHTML = `<div style="padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; color: #fff;">${cardData.name || cardData.id}</div>`;
        return card;
    }
    
    try {
        const cardObj = createCardFn(cardData.id);
        if (cardObj && typeof cardObj.createElement === 'function') {
            const cardElement = cardObj.createElement();
            
            // Ensure card element is visible
            if (!cardElement) {
                console.error('[DECK STUDIO] createElement returned null for', cardData.id);
                card.innerHTML = `<div style="padding: 10px; background: rgba(255,0,0,0.3); border-radius: 5px; color: #fff; min-width: 100px; min-height: 100px;">${cardData.name || cardData.id}</div>`;
                return card;
            }
            
            // Make sure card has proper styling
            cardElement.style.cursor = 'pointer';
            cardElement.style.transform = 'scale(0.8)';
            cardElement.style.margin = '5px';
            cardElement.style.display = 'block'; // Ensure it's visible
            cardElement.style.visibility = 'visible';
            cardElement.style.opacity = '1';
            // Ensure card has minimum dimensions
            if (!cardElement.style.width && !cardElement.style.minWidth) {
                cardElement.style.minWidth = '120px';
            }
            if (!cardElement.style.height && !cardElement.style.minHeight) {
                cardElement.style.minHeight = '160px';
            }
            
            // Debug first few cards - use module-level counter
            if (typeof createCardBrowserCard._debugCount === 'undefined') {
                createCardBrowserCard._debugCount = 0;
            }
            createCardBrowserCard._debugCount++;
            if (createCardBrowserCard._debugCount <= 3) {
                console.log('[DECK STUDIO] Card', createCardBrowserCard._debugCount, '- ID:', cardData.id);
                console.log('[DECK STUDIO] Card element:', cardElement);
                console.log('[DECK STUDIO] Card innerHTML length:', cardElement.innerHTML ? cardElement.innerHTML.length : 0);
                console.log('[DECK STUDIO] Card children:', cardElement.children.length);
                if (cardElement.children.length > 0) {
                    console.log('[DECK STUDIO] First child:', cardElement.children[0]);
                }
                const computedStyle = window.getComputedStyle(cardElement);
                console.log('[DECK STUDIO] Card computed width:', computedStyle.width);
                console.log('[DECK STUDIO] Card computed height:', computedStyle.height);
                console.log('[DECK STUDIO] Card computed display:', computedStyle.display);
                console.log('[DECK STUDIO] Card computed visibility:', computedStyle.visibility);
                console.log('[DECK STUDIO] Card computed opacity:', computedStyle.opacity);
            }
            
            // Make card draggable
            cardElement.draggable = true;
            cardElement.dataset.cardId = cardData.id;
            cardElement.dataset.cardType = 'available';
            cardElement.style.cursor = 'grab';
            
            // Drag start
            cardElement.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', cardData.id);
                e.dataTransfer.setData('action', 'add');
                e.dataTransfer.effectAllowed = 'copy';
                cardElement.style.opacity = '0.5';
            });
            
            // Drag end
            cardElement.addEventListener('dragend', (e) => {
                cardElement.style.opacity = '1';
            });
            
            // Show count in deck (calculate first)
            const count = currentDeck.filter(id => id === cardData.id).length;
            
            // Add click to add to deck (alternative to drag)
            cardElement.addEventListener('click', (e) => {
                // Don't add if clicking on badge or remove button
                if (e.target.classList.contains('card-count-badge') || 
                    e.target.classList.contains('card-max-badge') ||
                    e.target.classList.contains('remove-from-deck-btn')) {
                    return;
                }
                addCardToDeck(cardData.id);
            });
            
            // Add remove button if card is in deck
            if (count > 0) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-from-deck-btn';
                removeBtn.textContent = '−';
                removeBtn.title = 'Remove from deck';
                removeBtn.style.position = 'absolute';
                removeBtn.style.bottom = '5px';
                removeBtn.style.left = '5px';
                removeBtn.style.background = 'rgba(255, 0, 0, 0.8)';
                removeBtn.style.color = '#fff';
                removeBtn.style.border = 'none';
                removeBtn.style.borderRadius = '5px';
                removeBtn.style.padding = '5px 10px';
                removeBtn.style.cursor = 'pointer';
                removeBtn.style.fontSize = '1.2em';
                removeBtn.style.fontWeight = 'bold';
                removeBtn.style.zIndex = '15';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('[DECK STUDIO] Remove button clicked for:', cardData.id);
                    removeCardFromDeck(cardData.id, 0);
                });
                cardElement.appendChild(removeBtn);
            }
            
            // Show count badge
            if (count > 0) {
                const countBadge = document.createElement('div');
                countBadge.className = 'card-count-badge';
                countBadge.textContent = `x${count}/3`;
                cardElement.appendChild(countBadge);
            }
            
            // Disable if max copies reached
            if (count >= 3) {
                cardElement.style.opacity = '0.5';
                cardElement.style.cursor = 'not-allowed';
                cardElement.draggable = false;
                const maxBadge = document.createElement('div');
                maxBadge.className = 'card-max-badge';
                maxBadge.textContent = 'MAX';
                maxBadge.style.position = 'absolute';
                maxBadge.style.top = '50%';
                maxBadge.style.left = '50%';
                maxBadge.style.transform = 'translate(-50%, -50%)';
                maxBadge.style.background = 'rgba(255, 0, 0, 0.8)';
                maxBadge.style.color = '#fff';
                maxBadge.style.padding = '5px 10px';
                maxBadge.style.borderRadius = '5px';
                maxBadge.style.fontWeight = 'bold';
                maxBadge.style.zIndex = '20';
                cardElement.appendChild(maxBadge);
            }
            
            card.appendChild(cardElement);
        } else {
            console.warn('[DECK STUDIO] Card object created but no createElement method:', cardData.id);
            // Create a visible placeholder
            const placeholder = document.createElement('div');
            placeholder.style.padding = '10px';
            placeholder.style.background = 'rgba(0,0,0,0.3)';
            placeholder.style.borderRadius = '5px';
            placeholder.style.color = '#fff';
            placeholder.style.minWidth = '100px';
            placeholder.style.minHeight = '100px';
            placeholder.textContent = cardData.name || cardData.id;
            card.appendChild(placeholder);
        }
    } catch (error) {
        console.error('[DECK STUDIO] Error creating card element for', cardData.id, ':', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.padding = '10px';
        errorDiv.style.background = 'rgba(255,0,0,0.3)';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.color = '#fff';
        errorDiv.style.minWidth = '100px';
        errorDiv.style.minHeight = '100px';
        errorDiv.textContent = `Error: ${cardData.name || cardData.id}`;
        card.appendChild(errorDiv);
    }
    
    return card;
}

// Add card to deck (max 3 copies per card, max 30 cards total)
function addCardToDeck(cardId) {
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : null;
    if (!cardDB || !cardDB[cardId]) return;
    
    // Check deck size limit (30 cards max)
    if (currentDeck.length >= 30) {
        alert(`Deck is full! Maximum 30 cards allowed.`);
        return;
    }
    
    // Check current count of this card
    const currentCount = currentDeck.filter(id => id === cardId).length;
    if (currentCount >= 3) {
        alert(`Maximum 3 copies of ${cardDB[cardId].name} allowed in deck!`);
        return;
    }
    
    currentDeck.push(cardId);
    renderCurrentDeck();
    updateDeckStats();
    renderCardBrowser(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
}

// Remove card from deck
function removeCardFromDeck(cardId, index) {
    // Find the specific instance to remove
    let foundIndex = -1;
    let count = 0;
    for (let i = 0; i < currentDeck.length; i++) {
        if (currentDeck[i] === cardId) {
            if (count === index) {
                foundIndex = i;
                break;
            }
            count++;
        }
    }
    
    if (foundIndex >= 0) {
        currentDeck.splice(foundIndex, 1);
        renderCurrentDeck();
        updateDeckStats();
        renderCardBrowser(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
    }
}

// Handle drag over deck area
function handleDeckDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    const deckList = document.getElementById('currentDeck');
    if (deckList) {
        deckList.classList.add('drag-over');
    }
}

// Handle drop on deck area
function handleDeckDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const deckList = document.getElementById('currentDeck');
    if (deckList) {
        deckList.classList.remove('drag-over');
    }
    
    const cardId = e.dataTransfer.getData('text/plain');
    const action = e.dataTransfer.getData('action');
    
    if (action === 'remove') {
        // Remove one copy from deck (dragged from deck)
        removeCardFromDeck(cardId, 0);
    } else {
        // Add card to deck (dragged from available cards)
        addCardToDeck(cardId);
    }
}

// Handle drop on available cards panel (to remove from deck)
function handleAvailableCardsDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const cardBrowser = document.getElementById('cardBrowser');
    if (cardBrowser) {
        cardBrowser.classList.remove('drag-over');
    }
    
    const cardId = e.dataTransfer.getData('text/plain');
    const action = e.dataTransfer.getData('action');
    
    console.log('[DECK STUDIO] Drop on available cards panel:', { cardId, action, effectAllowed: e.dataTransfer.effectAllowed });
    
    // Remove if action is 'remove' OR if effectAllowed is 'move' (dragged from deck)
    if (action === 'remove' || e.dataTransfer.effectAllowed === 'move') {
        // Remove one copy from deck (dragged from deck to available cards panel)
        console.log('[DECK STUDIO] Removing card from deck:', cardId);
        removeCardFromDeck(cardId, 0);
    }
}

// Handle drag over available cards panel
function handleAvailableCardsDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Try to get action from dataTransfer (may not be available on dragover in some browsers)
    let action = '';
    try {
        action = e.dataTransfer.getData('action');
    } catch (err) {
        // DataTransfer may not be accessible during dragover in some browsers
        // Check if we're dragging from deck by checking the effectAllowed
        if (e.dataTransfer.effectAllowed === 'move' || e.dataTransfer.effectAllowed === 'all') {
            action = 'remove';
        }
    }
    
    // Show drag-over if dragging from deck (action === 'remove') or if effectAllowed suggests move
    if (action === 'remove' || e.dataTransfer.effectAllowed === 'move') {
        e.dataTransfer.dropEffect = 'move';
        const cardBrowser = document.getElementById('cardBrowser');
        if (cardBrowser) {
            cardBrowser.classList.add('drag-over');
        }
    } else {
        e.dataTransfer.dropEffect = 'none';
    }
}

// Handle drag leave from available cards panel
function handleAvailableCardsDragLeave(e) {
    const cardBrowser = document.getElementById('cardBrowser');
    if (cardBrowser) {
        cardBrowser.classList.remove('drag-over');
    }
}

// Make handlers globally available
if (typeof window !== 'undefined') {
    window.handleDeckDragOver = handleDeckDragOver;
    window.handleDeckDrop = handleDeckDrop;
    window.handleAvailableCardsDragOver = handleAvailableCardsDragOver;
    window.handleAvailableCardsDrop = handleAvailableCardsDrop;
    window.handleAvailableCardsDragLeave = handleAvailableCardsDragLeave;
}

// Render current deck
function renderCurrentDeck() {
    const deckList = document.getElementById('currentDeck');
    if (!deckList) return;
    
    deckList.innerHTML = '';
    
    if (currentDeck.length === 0) {
        deckList.innerHTML = '<p style="text-align: center; color: #999;">Your deck is empty. Click cards to add them!</p>';
        return;
    }
    
    // Group cards by ID and show counts
    const cardGroups = {};
    currentDeck.forEach(cardId => {
        if (!cardGroups[cardId]) {
            cardGroups[cardId] = 0;
        }
        cardGroups[cardId]++;
    });
    
    // Get CARD_DATABASE from global scope
    const cardDB = (typeof CARD_DATABASE !== 'undefined') ? CARD_DATABASE : 
                   (typeof window !== 'undefined' && window.CARD_DATABASE) ? window.CARD_DATABASE : {};
    
    // Sort by type, then by name
    const sortedCardIds = Object.keys(cardGroups).sort((a, b) => {
        const cardA = cardDB[a];
        const cardB = cardDB[b];
        if (!cardA || !cardB) return 0;
        
        if (cardA.type !== cardB.type) {
            const typeOrder = { monster: 0, spell: 1, trap: 2 };
            return typeOrder[cardA.type] - typeOrder[cardB.type];
        }
        return cardA.name.localeCompare(cardB.name);
    });
    
    sortedCardIds.forEach(cardId => {
        const cardData = cardDB[cardId];
        if (!cardData) return;
        
        const count = cardGroups[cardId];
        const cardElement = createDeckCardElement(cardData, count);
        deckList.appendChild(cardElement);
    });
}

// Create deck card element with remove functionality and drag support
function createDeckCardElement(cardData, count) {
    const container = document.createElement('div');
    container.className = 'deck-card-item';
    container.dataset.cardId = cardData.id;
    
    // Get createCard from global scope
    const createCardFn = (typeof createCard !== 'undefined') ? createCard :
                         (typeof window !== 'undefined' && window.createCard) ? window.createCard : null;
    
    if (!createCardFn) {
        console.error('[DECK STUDIO] createCard function not available');
        return container;
    }
    
    const cardObj = createCardFn(cardData.id);
    if (cardObj) {
        const cardElement = cardObj.createElement();
        cardElement.style.transform = 'scale(0.7)';
        cardElement.style.margin = '5px';
        cardElement.style.position = 'relative';
        cardElement.style.cursor = 'grab';
        
        // Make card draggable out of deck
        cardElement.draggable = true;
        cardElement.dataset.cardId = cardData.id;
        cardElement.dataset.cardType = 'deck';
        cardElement.dataset.cardCount = count;
        
        // Drag start - remove from deck
        cardElement.addEventListener('dragstart', (e) => {
            console.log('[DECK STUDIO] Drag start from deck:', cardData.id);
            e.dataTransfer.setData('text/plain', cardData.id);
            e.dataTransfer.setData('action', 'remove');
            e.dataTransfer.effectAllowed = 'move';
            cardElement.style.opacity = '0.5';
        });
        
        // Drag end - clean up drag-over classes
        cardElement.addEventListener('dragend', (e) => {
            cardElement.style.opacity = '1';
            const cardBrowser = document.getElementById('cardBrowser');
            if (cardBrowser) {
                cardBrowser.classList.remove('drag-over');
            }
            const deckList = document.getElementById('currentDeck');
            if (deckList) {
                deckList.classList.remove('drag-over');
            }
        });
        
        // Add count display
        const countDisplay = document.createElement('div');
        countDisplay.className = 'deck-card-count';
        countDisplay.textContent = `x${count}/3`;
        cardElement.appendChild(countDisplay);
        
        // Add remove buttons for each instance
        const removeContainer = document.createElement('div');
        removeContainer.className = 'deck-card-remove';
        for (let i = 0; i < count; i++) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-card-btn';
            removeBtn.textContent = '−';
            removeBtn.title = 'Remove this card from deck';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '5px';
            removeBtn.style.left = '5px';
            removeBtn.style.background = 'rgba(255, 0, 0, 0.9)';
            removeBtn.style.color = '#fff';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '5px';
            removeBtn.style.padding = '5px 10px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.fontSize = '1.2em';
            removeBtn.style.fontWeight = 'bold';
            removeBtn.style.zIndex = '15';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('[DECK STUDIO] Remove button clicked for:', cardData.id, 'instance:', i);
                removeCardFromDeck(cardData.id, i);
            });
            removeContainer.appendChild(removeBtn);
        }
        cardElement.appendChild(removeContainer);
        
        container.appendChild(cardElement);
    }
    
    return container;
}

// Update deck statistics
function updateDeckStats() {
    const stats = getDeckStats(currentDeck);
    if (!stats) return;
    
    const statTotal = document.getElementById('statTotal');
    const statMonsters = document.getElementById('statMonsters');
    const statSpells = document.getElementById('statSpells');
    const statTraps = document.getElementById('statTraps');
    
    if (statTotal) {
        statTotal.textContent = `${stats.total}/30`;
        // Highlight if at max
        if (stats.total >= 30) {
            statTotal.style.color = '#ff6b6b';
            statTotal.style.fontWeight = 'bold';
        } else {
            statTotal.style.color = '';
            statTotal.style.fontWeight = '';
        }
    }
    if (statMonsters) statMonsters.textContent = stats.monsters;
    if (statSpells) statSpells.textContent = stats.spells;
    if (statTraps) statTraps.textContent = stats.traps;
}

// Save current deck
function saveCurrentDeck() {
    const validation = validateDeck(currentDeck);
    if (!validation.valid) {
        alert('Deck validation failed:\n' + validation.errors.join('\n'));
        return;
    }
    
    if (saveDeck(currentDeck)) {
        alert('Deck saved successfully!');
        updateDeckStats();
    } else {
        alert('Failed to save deck. Please try again.');
    }
}

// Reset to default deck
function resetToDefaultDeck() {
    if (confirm('Reset to default deck? This will replace your current deck.')) {
        currentDeck = getDefaultDeck();
        renderDeckStudio();
    }
}

// Export current deck
function exportCurrentDeck() {
    const json = exportDeck(currentDeck);
    if (json) {
        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
            alert('Deck exported to clipboard!');
        }).catch(() => {
            // Fallback: show in prompt
            prompt('Copy this deck JSON:', json);
        });
    }
}

// Import deck from prompt
function importDeckFromPrompt() {
    const json = prompt('Paste deck JSON:');
    if (json) {
        const result = importDeck(json);
        if (result.success) {
            currentDeck = result.deck;
            renderDeckStudio();
            alert('Deck imported successfully!');
        } else {
            alert('Import failed:\n' + result.errors.join('\n'));
        }
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('deckStudioModal');
    if (e.target === modal) {
        closeDeckStudioModal();
    }
});


// Initialize when DOM is ready (only if not on separate page)
// If on deck-studio.html, it will be initialized by that page's script
if (window.location.pathname.includes('deck-studio.html')) {
    // On separate page - wait for page's initialization script
    console.log('[DECK STUDIO] Running on separate page, waiting for initialization...');
} else {
    // On main page - initialize normally
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDeckStudio);
    } else {
        initDeckStudio();
    }
}

