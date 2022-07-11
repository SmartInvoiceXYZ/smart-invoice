// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';

import { getDatabase, ref, child, get } from 'firebase/database';

const {
  REACT_APP_FIREBASE_API_KEY,
  REACT_APP_FIREBASE_AUTH_DOMAIN,
  REACT_APP_FIREBASE_PROJECT_ID,
  REACT_APP_FIREBASE_STORAGE_BUCKET,
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  REACT_APP_FIREBASE_APP_ID,
} = process.env;

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: REACT_APP_FIREBASE_API_KEY,
  authDomain: REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const dbRef = ref(getDatabase(app));

export const getCID = async () => {
  const CID = await get(child(dbRef, `CID`))
    .then(snapshot => {
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.log('No firebase data available');
      }
    })
    .catch(error => {
      console.error('firebase CID retrieval error:', error);
    });
  return CID;
};

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
