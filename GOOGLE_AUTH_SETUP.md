# Google Sign-In Setup Guide

This guide will help you enable Google sign-in for your manufacturing management system.

## Prerequisites
- Firebase project already created (you have this)
- Google Cloud Console access for your Firebase project

## Step-by-Step Setup

### 1. Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **manufacturing-industry-1**
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Toggle it **ON**
6. Add your support email
7. Click **Save**

### 2. Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **manufacturing-industry-1**
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Select **External** user type
5. Click **Create**
6. Fill in the application details:
   - **App name**: Manufacturing Industry System
   - **User support email**: Your email
   - **Developer contact information**: Your email
7. Click **Save and Continue**
8. On Scopes page: Click **Save and Continue** (default scopes are fine)
9. On Summary page: Click **Back to Dashboard**

### 3. Add Authorized Redirect URIs

1. Go to **APIs & Services** → **Credentials**
2. Find and click on your **Web client ID** (look for type "OAuth 2.0 Client IDs")
3. Under **Authorized redirect URIs**, add these URLs:
   - `http://localhost:3000` (for local development)
   - `http://127.0.0.1:3000` (alternative localhost)
   - Your production domain (when deployed): `https://yourdomain.com`
4. Click **Save**

### 4. Additional Configuration for Web Apps

If you need to configure additional settings:

1. Go to **APIs & Services** → **Credentials**
2. Find your **Web client ID**
3. Download the JSON configuration (optional, already configured via environment variables)

## Current Implementation

✅ **Sign-In**: Uses Google popup authentication
✅ **Sign-Up**: Uses Google popup authentication with auto-profile setup
✅ **Error Handling**: Comprehensive error messages
✅ **Scopes Requested**: `profile` and `email`

## Testing Locally

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/signin` or `http://localhost:3000/signup`

3. Click "Continue with Google"

4. A popup should appear with Google login

5. Sign in with your Google account

### Troubleshooting

#### Popup is blocked
- Check your browser popup settings
- Allow popups for `localhost:3000`

#### "Operation not allowed"
- Google Sign-In provider not enabled in Firebase
- Follow Step 1 above

#### Authentication succeeds but redirect fails
- Check browser console for errors
- Ensure redirect URIs match your domain exactly

#### CORS errors
- These usually indicate OAuth consent screen setup issues
- Re-verify the OAuth consent screen is configured correctly

## Firebase Configuration (Already Set)

Your environment variables in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDRy01PGXGZumrZbLvihV6AUS1usOq4SLM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=manufacturing-industry-1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=manufacturing-industry-1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=manufacturing-industry-1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=539429905400
NEXT_PUBLIC_FIREBASE_APP_ID=1:539429905400:web:ac48848a9b582853faec0d
```

## Code Changes Made

### Updated Files:
1. **components/signin-form.jsx**
   - Changed from `signInWithRedirect` to `signInWithPopup`
   - Added proper error handling
   - Improved user feedback with toast notifications

2. **components/signup-form.jsx**
   - Changed from `signInWithRedirect` to `signInWithPopup`
   - Auto-captures Google profile information
   - Enhanced error messages

### Benefits of Using Popup Authentication:
✅ Better user experience (no page redirects)
✅ Works in development without complex setup
✅ More reliable error handling
✅ Faster authentication flow
✅ Better security

## Next Steps

1. Complete the Firebase Console configuration above
2. Test locally by visiting `/signin` and `/signup`
3. Deploy to production (when ready)
4. Add production domain to authorized redirect URIs

## Support

If Google Sign-In still isn't working:
1. Check browser console for error messages (F12 → Console)
2. Verify Firebase console shows Google provider is "Enabled"
3. Ensure OAuth consent screen is configured
4. Clear browser cache and cookies
5. Try in an incognito/private window

---
Last Updated: April 13, 2026
