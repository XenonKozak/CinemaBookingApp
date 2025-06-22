import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB4w-lcoKUw4gw_h-69DDUGkRMHw8TM1L0",
  authDomain: "cinemabookapi.firebaseapp.com",
  projectId: "cinemabookapi",
  storageBucket: "cinemabookapi.firebasestorage.app",
  messagingSenderId: "1073959904426",
  appId: "1:1073959904426:web:103635ec79ecc3bf9c9cd3",
  measurementId: "G-ZWKEHNRPL9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app; 




