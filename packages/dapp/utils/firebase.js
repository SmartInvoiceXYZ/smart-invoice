// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { child, get, getDatabase, ref } from 'firebase/database';

const {
  NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID,
} = process.env;

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const dbRef = ref(getDatabase(app));

export const getCID = async () => {
  const CID = await get(child(dbRef, `CID-revamp`))
    // eslint-disable-next-line consistent-return
    .then(snapshot => {
      if (snapshot.exists()) {
        return snapshot.val();
      }
      console.log('No firebase data available');
    })
    .catch(error => {
      console.error('firebase CID retrieval error:', error);
    });
  return CID;
};

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
