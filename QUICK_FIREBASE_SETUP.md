# Quick Firebase Setup Guide

## Step 1: Add Your Firebase Config

1. Open `js/firebase-config.js`
2. Replace the placeholder values with your Firebase project config:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...", // Your actual API key
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

## Step 2: Enable Authentication in Firebase Console

1. Go to Firebase Console > Authentication > Sign-in method
2. Enable **Email/Password**
3. Enable **Google** (optional but recommended)

## Step 3: Create Firestore Database

1. Go to Firebase Console > Firestore Database
2. Click **Create database**
3. Start in **test mode** (for development)
4. Choose location
5. Click **Enable**

## Step 4: Set Security Rules

Go to Firestore Database > Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

## Step 5: Test It!

1. Open your game
2. Go to Settings
3. You should see the "Cloud Save" section
4. Click "Sign Up" to create an account
5. Your data will automatically sync!

## That's It! 🎉

Your game now has cloud save functionality. Players can:
- Sign up/Sign in with email or Google
- Save their progress to the cloud
- Access their data from any device
