# Firebase Setup Guide

## Step 1: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app, click the `</>` icon to add one
7. Copy the `firebaseConfig` object values

## Step 2: Configure Firebase in Your Project

1. Open `js/firebase-config.js`
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...", // Your API key
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

## Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Enable **Google** authentication (optional, but recommended)
   - Add your domain to authorized domains if needed

## Step 4: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **test mode** (for development)
4. Choose a location (closest to your users)
5. Click **Enable**

## Step 5: Set Up Security Rules (Important!)

Go to **Firestore Database** > **Rules** and use this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Players can only read/write their own data
    match /players/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish** to save the rules.

## Step 6: Add Firebase SDK to Your HTML

Add these scripts to your `index.html` **before** your other scripts:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"></script>
```

## Step 7: Load Firebase Scripts in Order

Make sure your scripts load in this order in `index.html`:

1. Firebase SDK (from CDN)
2. `firebase-config.js`
3. `firebase-init.js`
4. `firebase-save.js`
5. Your other game scripts

## Step 8: Initialize Firebase

Firebase will auto-initialize when the page loads. You can also manually initialize:

```javascript
if (typeof initializeFirebase === 'function') {
    initializeFirebase();
}
```

## Testing

1. Open your game in a browser
2. Open the browser console (F12)
3. You should see `[FIREBASE] Firebase initialized successfully`
4. Try signing up with an email/password
5. Check Firestore Console to see your data

## Troubleshooting

### "Firebase config not set"
- Make sure you've updated `firebase-config.js` with your actual config values

### "Permission denied"
- Check your Firestore security rules
- Make sure the user is authenticated

### "Module not found"
- Make sure Firebase SDK scripts are loaded before your Firebase files
- Check the script order in `index.html`

## Next Steps

After setup, users can:
- Sign up/Sign in with email or Google
- Their game data will automatically sync to the cloud
- Data syncs across devices when they log in
