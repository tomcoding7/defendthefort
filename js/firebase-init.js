// Firebase Initialization and Setup
// This file initializes Firebase and sets up authentication

let firebaseApp = null;
let firestore = null;
let auth = null;
let currentUser = null;

// Check if Firebase is loaded
function isFirebaseLoaded() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
}

// Initialize Firebase
function initializeFirebase() {
    if (isFirebaseLoaded()) {
        console.log('[FIREBASE] Firebase already initialized');
        return true;
    }
    
    // Check if config is set
    if (typeof firebaseConfig === 'undefined' || firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('[FIREBASE] Firebase config not set. Please configure firebase-config.js');
        return false;
    }
    
    try {
        // Check if Firebase is already initialized
        if (firebase.apps.length > 0) {
            firebaseApp = firebase.app();
        } else {
            // Initialize Firebase
            firebaseApp = firebase.initializeApp(firebaseConfig);
        }
        firestore = firebase.firestore();
        auth = firebase.auth();
        
        // Set up auth state listener
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            if (user) {
                console.log('[FIREBASE] User signed in:', user.uid);
                // Auto-sync when user signs in (with delay to ensure functions are loaded)
                setTimeout(() => {
                    const syncFn = (typeof syncFromCloud === 'function') ? syncFromCloud :
                                  (typeof window !== 'undefined' && typeof window.syncFromCloud === 'function') 
                                  ? window.syncFromCloud : null;
                    if (syncFn) {
                        syncFn();
                    }
                }, 1500);
            } else {
                console.log('[FIREBASE] User signed out');
            }
        });
        
        console.log('[FIREBASE] Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('[FIREBASE] Error initializing Firebase:', error);
        return false;
    }
}

// Sign in with email and password
async function signInWithEmail(email, password) {
    if (!auth) {
        console.error('[FIREBASE] Firebase not initialized');
        return { success: false, error: 'Firebase not initialized' };
    }
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        console.log('[FIREBASE] Signed in:', currentUser.uid);
        return { success: true, user: currentUser };
    } catch (error) {
        console.error('[FIREBASE] Sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign up with email and password
async function signUpWithEmail(email, password) {
    if (!auth) {
        console.error('[FIREBASE] Firebase not initialized');
        return { success: false, error: 'Firebase not initialized' };
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        console.log('[FIREBASE] Signed up:', currentUser.uid);
        
        // Create initial player data
        await savePlayerDataToCloud(currentUser.uid, getLocalPlayerData());
        
        return { success: true, user: currentUser };
    } catch (error) {
        console.error('[FIREBASE] Sign up error:', error);
        return { success: false, error: error.message };
    }
}

// Sign in with Google
async function signInWithGoogle() {
    if (!auth) {
        console.error('[FIREBASE] Firebase not initialized');
        return { success: false, error: 'Firebase not initialized' };
    }
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const userCredential = await auth.signInWithPopup(provider);
        currentUser = userCredential.user;
        console.log('[FIREBASE] Signed in with Google:', currentUser.uid);
        
        // Check if this is first time login, if so create player data
        const existingData = await loadPlayerDataFromCloud(currentUser.uid);
        if (!existingData) {
            await savePlayerDataToCloud(currentUser.uid, getLocalPlayerData());
        }
        
        return { success: true, user: currentUser };
    } catch (error) {
        console.error('[FIREBASE] Google sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign out
async function signOut() {
    if (!auth) {
        return { success: false, error: 'Firebase not initialized' };
    }
    
    try {
        await auth.signOut();
        currentUser = null;
        console.log('[FIREBASE] Signed out');
        return { success: true };
    } catch (error) {
        console.error('[FIREBASE] Sign out error:', error);
        return { success: false, error: error.message };
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is signed in
function isSignedIn() {
    return currentUser !== null;
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.initializeFirebase = initializeFirebase;
    window.signInWithEmail = signInWithEmail;
    window.signUpWithEmail = signUpWithEmail;
    window.signInWithGoogle = signInWithGoogle;
    window.signOut = signOut;
    window.getCurrentUser = getCurrentUser;
    window.isSignedIn = isSignedIn;
    window.isFirebaseLoaded = isFirebaseLoaded;
}
