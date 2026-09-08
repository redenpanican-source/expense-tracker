// Firebase setup for cross-device sync.
// Paste the config from your Firebase project below (Project settings → Your apps → Web app).
// These values are NOT secret — they ship to the browser; security is enforced by Firestore rules.
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCYm0Gr6uqx0hd-OTUkDxvlpvk_-YCZS8M',
  authDomain: 'expense-tracker-341ab.firebaseapp.com',
  projectId: 'expense-tracker-341ab',
  storageBucket: 'expense-tracker-341ab.firebasestorage.app',
  messagingSenderId: '704772166798',
  appId: '1:704772166798:web:cec17c3b4267f46f9565df',
}

// Only turn sync on once real config has been pasted in.
export const firebaseEnabled = !firebaseConfig.apiKey.startsWith('PASTE')

let app, auth, db, googleProvider
if (firebaseEnabled) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  googleProvider = new GoogleAuthProvider()
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
}

export { auth, db, googleProvider }
