// Import the functions you need from the SDKs you need
// @ts-expect-error TS(2792): Cannot find module 'firebase/app'. Did you mean to... Remove this comment to see the full error message
import { getApp, initializeApp } from 'firebase/app';
// @ts-expect-error TS(2792): Cannot find module 'firebase/database'. Did you me... Remove this comment to see the full error message
import { child, get, getDatabase, ref } from 'firebase/database';

// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const FIREBASE_MESSAGING_SENDER_ID =
  // @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

// Initialize Firebase
function createFirebaseApp(config: any) {
  try {
    return getApp();
  } catch {
    return initializeApp(config);
  }
}

const dbRef = ref(getDatabase(createFirebaseApp(firebaseConfig)));

export const getCID = async () => {
  const CID = await get(child(dbRef, `CID-revamp`))
    // eslint-disable-next-line consistent-return
    .then((snapshot: any) => {
      if (snapshot.exists()) {
        return snapshot.val();
      }
      console.log('No firebase data available');
    })
    .catch((error: any) => {
      console.error('firebase CID retrieval error:', error);
    });
  return CID;
};

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
