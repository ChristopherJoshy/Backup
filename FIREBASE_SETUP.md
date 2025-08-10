# Firebase Service Account Setup Instructions

## To enable Firestore (optional - app works with memory storage without this):

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `neural-brew-1`
3. **Go to Project Settings**: Click the gear icon → Project settings
4. **Navigate to Service Accounts tab**
5. **Generate new private key**: 
   - Click "Generate new private key"
   - Download the JSON file
6. **Copy JSON content**: 
   - Open the downloaded JSON file
   - Copy the ENTIRE JSON content (all the text inside the file)
7. **Add to .env file**:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"neural-brew-1","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
   ```
   - Make sure it's all on one line
   - No spaces around the = sign
   - No quotes around the JSON (the JSON itself contains quotes)

## Current Status:
✅ **Gemini AI**: Working correctly (generating recipes)
✅ **Memory Storage**: Working correctly (storing messages temporarily)
⚠️ **Firestore**: Not configured (will use memory storage instead)

## What works without Firebase:
- All recipe generation (user + auto-bot)
- Message storage (in memory - resets on server restart)
- Real-time chat updates
- Voting on recipes
- All terminal commands

## What requires Firebase:
- Persistent message storage (survives server restarts)
- Cross-device message synchronization
- Production deployment with data persistence

The app is fully functional without Firebase service account!
