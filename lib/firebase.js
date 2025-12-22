"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ✅ Initialize Firebase once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Core exports
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ Helper getters (for older imports)
export const getFirebaseAuth = () => auth;
export const getFirestoreDB = () => db;

// ✅ Email verification helper
export const sendVerificationEmail = async (user) => {
  if (user && !user.emailVerified) {
    await sendEmailVerification(user);
  }
};
