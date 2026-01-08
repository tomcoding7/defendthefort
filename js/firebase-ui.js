// Firebase UI Handler
// Manages the authentication UI in settings page

function setupFirebaseUI() {
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const syncToCloudBtn = document.getElementById('syncToCloudBtn');
    const syncFromCloudBtn = document.getElementById('syncFromCloudBtn');
    const authForm = document.getElementById('firebaseAuthForm');
    const submitSignInBtn = document.getElementById('submitSignInBtn');
    const submitSignUpBtn = document.getElementById('submitSignUpBtn');
    const cancelAuthBtn = document.getElementById('cancelAuthBtn');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const authError = document.getElementById('authError');
    const authStatusText = document.getElementById('authStatusText');
    const firebaseAuthButtons = document.getElementById('firebaseAuthButtons');
    const firebaseSyncButtons = document.getElementById('firebaseSyncButtons');
    
    // Update UI based on auth state
    function updateAuthUI() {
        const signedIn = (typeof isSignedIn === 'function' && isSignedIn()) ||
                        (typeof window !== 'undefined' && typeof window.isSignedIn === 'function' && window.isSignedIn());
        const currentUser = (typeof getCurrentUser === 'function' && getCurrentUser()) ||
                           (typeof window !== 'undefined' && typeof window.getCurrentUser === 'function' && window.getCurrentUser());
        
        if (signedIn && currentUser) {
            // User is signed in
            authStatusText.textContent = `Signed in as: ${currentUser.email || 'User'}`;
            if (signInBtn) signInBtn.style.display = 'none';
            if (signUpBtn) signUpBtn.style.display = 'none';
            if (googleSignInBtn) googleSignInBtn.style.display = 'none';
            if (signOutBtn) signOutBtn.style.display = 'block';
            if (firebaseSyncButtons) firebaseSyncButtons.style.display = 'flex';
            if (authForm) authForm.style.display = 'none';
        } else {
            // User is not signed in
            authStatusText.textContent = 'Not signed in - Sign in to sync your data across devices';
            if (signInBtn) signInBtn.style.display = 'block';
            if (signUpBtn) signUpBtn.style.display = 'block';
            if (googleSignInBtn) googleSignInBtn.style.display = 'block';
            if (signOutBtn) signOutBtn.style.display = 'none';
            if (firebaseSyncButtons) firebaseSyncButtons.style.display = 'none';
            if (authForm) authForm.style.display = 'none';
        }
    }
    
    // Show auth form
    function showAuthForm(isSignUp = false) {
        if (authForm) {
            authForm.style.display = 'block';
            if (submitSignInBtn) submitSignInBtn.style.display = isSignUp ? 'none' : 'block';
            if (submitSignUpBtn) submitSignUpBtn.style.display = isSignUp ? 'block' : 'none';
            if (authError) {
                authError.style.display = 'none';
                authError.textContent = '';
            }
        }
    }
    
    // Hide auth form
    function hideAuthForm() {
        if (authForm) authForm.style.display = 'none';
        if (authEmail) authEmail.value = '';
        if (authPassword) authPassword.value = '';
        if (authError) {
            authError.style.display = 'none';
            authError.textContent = '';
        }
    }
    
    // Show error
    function showError(message) {
        if (authError) {
            authError.textContent = message;
            authError.style.display = 'block';
        }
    }
    
    // Sign In button
    if (signInBtn) {
        signInBtn.addEventListener('click', () => {
            showAuthForm(false);
        });
    }
    
    // Sign Up button
    if (signUpBtn) {
        signUpBtn.addEventListener('click', () => {
            showAuthForm(true);
        });
    }
    
    // Google Sign In button
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            const signInFn = (typeof signInWithGoogle === 'function') ? signInWithGoogle :
                            (typeof window !== 'undefined' && typeof window.signInWithGoogle) ? window.signInWithGoogle : null;
            
            if (signInFn) {
                googleSignInBtn.disabled = true;
                googleSignInBtn.textContent = 'Signing in...';
                const result = await signInFn();
                googleSignInBtn.disabled = false;
                googleSignInBtn.textContent = 'Sign In with Google';
                
                if (result.success) {
                    updateAuthUI();
                    // Auto-sync after sign in
                    setTimeout(() => {
                        if (typeof syncFromCloud === 'function') {
                            syncFromCloud();
                        } else if (typeof window !== 'undefined' && typeof window.syncFromCloud === 'function') {
                            window.syncFromCloud();
                        }
                    }, 1000);
                } else {
                    showError(result.error || 'Failed to sign in with Google');
                }
            }
        });
    }
    
    // Sign Out button
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            const signOutFn = (typeof signOut === 'function') ? signOut :
                             (typeof window !== 'undefined' && typeof window.signOut) ? window.signOut : null;
            
            if (signOutFn) {
                const result = await signOutFn();
                if (result.success) {
                    updateAuthUI();
                }
            }
        });
    }
    
    // Submit Sign In
    if (submitSignInBtn) {
        submitSignInBtn.addEventListener('click', async () => {
            const email = authEmail ? authEmail.value : '';
            const password = authPassword ? authPassword.value : '';
            
            if (!email || !password) {
                showError('Please enter email and password');
                return;
            }
            
            const signInFn = (typeof signInWithEmail === 'function') ? signInWithEmail :
                            (typeof window !== 'undefined' && typeof window.signInWithEmail) ? window.signInWithEmail : null;
            
            if (signInFn) {
                submitSignInBtn.disabled = true;
                submitSignInBtn.textContent = 'Signing in...';
                const result = await signInFn(email, password);
                submitSignInBtn.disabled = false;
                submitSignInBtn.textContent = 'Sign In';
                
                if (result.success) {
                    hideAuthForm();
                    updateAuthUI();
                    // Auto-sync after sign in
                    setTimeout(() => {
                        if (typeof syncFromCloud === 'function') {
                            syncFromCloud();
                        } else if (typeof window !== 'undefined' && typeof window.syncFromCloud === 'function') {
                            window.syncFromCloud();
                        }
                    }, 1000);
                } else {
                    showError(result.error || 'Failed to sign in');
                }
            }
        });
    }
    
    // Submit Sign Up
    if (submitSignUpBtn) {
        submitSignUpBtn.addEventListener('click', async () => {
            const email = authEmail ? authEmail.value : '';
            const password = authPassword ? authPassword.value : '';
            
            if (!email || !password) {
                showError('Please enter email and password');
                return;
            }
            
            if (password.length < 6) {
                showError('Password must be at least 6 characters');
                return;
            }
            
            const signUpFn = (typeof signUpWithEmail === 'function') ? signUpWithEmail :
                            (typeof window !== 'undefined' && typeof window.signUpWithEmail) ? window.signUpWithEmail : null;
            
            if (signUpFn) {
                submitSignUpBtn.disabled = true;
                submitSignUpBtn.textContent = 'Signing up...';
                const result = await signUpFn(email, password);
                submitSignUpBtn.disabled = false;
                submitSignUpBtn.textContent = 'Sign Up';
                
                if (result.success) {
                    hideAuthForm();
                    updateAuthUI();
                    showError('Account created! Your data has been saved to the cloud.');
                    setTimeout(() => {
                        if (authError) authError.style.display = 'none';
                    }, 3000);
                } else {
                    showError(result.error || 'Failed to sign up');
                }
            }
        });
    }
    
    // Cancel button
    if (cancelAuthBtn) {
        cancelAuthBtn.addEventListener('click', () => {
            hideAuthForm();
        });
    }
    
    // Sync to Cloud button
    if (syncToCloudBtn) {
        syncToCloudBtn.addEventListener('click', async () => {
            const syncFn = (typeof syncToCloud === 'function') ? syncToCloud :
                          (typeof window !== 'undefined' && typeof window.syncToCloud) ? window.syncToCloud : null;
            
            if (syncFn) {
                syncToCloudBtn.disabled = true;
                syncToCloudBtn.textContent = 'Saving...';
                const result = await syncFn();
                syncToCloudBtn.disabled = false;
                syncToCloudBtn.textContent = '💾 Save to Cloud';
            }
        });
    }
    
    // Sync from Cloud button
    if (syncFromCloudBtn) {
        syncFromCloudBtn.addEventListener('click', async () => {
            const syncFn = (typeof syncFromCloud === 'function') ? syncFromCloud :
                          (typeof window !== 'undefined' && typeof window.syncFromCloud) ? window.syncFromCloud : null;
            
            if (syncFn) {
                syncFromCloudBtn.disabled = true;
                syncFromCloudBtn.textContent = 'Loading...';
                const result = await syncFn();
                syncFromCloudBtn.disabled = false;
                syncFromCloudBtn.textContent = '⬇️ Load from Cloud';
            }
        });
    }
    
    // Initial UI update
    updateAuthUI();
    
    // Update UI when auth state changes (polling for now, could use event listener)
    setInterval(() => {
        updateAuthUI();
    }, 2000);
}

// Make function globally available
if (typeof window !== 'undefined') {
    window.setupFirebaseUI = setupFirebaseUI;
}
