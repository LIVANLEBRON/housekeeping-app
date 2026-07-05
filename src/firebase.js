import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDam2nZc3THbA0z0nOBORMg8JmeVRKHhiM",
  authDomain: "ingles-c3a94.firebaseapp.com",
  projectId: "ingles-c3a94",
  storageBucket: "ingles-c3a94.firebasestorage.app",
  messagingSenderId: "806440108952",
  appId: "1:806440108952:web:f2cf43420e6b2e942a61ed",
  measurementId: "G-NNMH8E3HX3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
