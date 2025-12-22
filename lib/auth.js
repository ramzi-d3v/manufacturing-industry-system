"use client";

import { getFirebaseAuth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

export const signup = async (email, password, displayName) => {
  const auth = getFirebaseAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential;
};

export const login = async (email, password) => {
  const auth = getFirebaseAuth();
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  const auth = getFirebaseAuth();
  return await signOut(auth);
};

export const getCurrentUser = () => {
  const auth = getFirebaseAuth();
  return auth.currentUser;
};


