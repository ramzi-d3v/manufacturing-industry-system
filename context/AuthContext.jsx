"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const router = useRouter();
	const processedDeclineRef = useRef({});
	const [userDetails, setUserDetails] = useState(null);
	const [loading, setLoading] = useState(true);
	const [authError, setAuthError] = useState(null);

	useEffect(() => {
		let unsubscribeDetails = null;

		const unsubscribeAuth = onAuthStateChanged(
			auth,
			(currentUser) => {
				setUser(currentUser);
				setLoading(false);
				setAuthError(null);

				// Clean previous listener
				if (unsubscribeDetails) {
					unsubscribeDetails();
					unsubscribeDetails = null;
				}

							if (currentUser) {
								const ref = doc(db, "user_details", currentUser.uid);
								unsubscribeDetails = onSnapshot(
									ref,
									(snap) => {
										if (snap.exists()) {
											const data = snap.data();
											setUserDetails(data);

											if (data?.isDeclined) {
												try {
													if (!processedDeclineRef.current[currentUser.uid]) {
														processedDeclineRef.current[currentUser.uid] = true;
														try { localStorage.removeItem(`poststate_${currentUser.uid}`); } catch (e) {}
														router.replace("/complite-profile");
													}
												} catch (e) {
													console.warn("Decline handling failed:", e);
												}
											}
										} else {
											setUserDetails(null);
										}
									},
									(error) => {
										console.error("user_details listener error:", error);
										setAuthError(error.message || String(error));
									}
								);
							} else {
								setUserDetails(null);
							}
			},
			(err) => {
				console.error("onAuthStateChanged error:", err);
				setAuthError(err?.message || String(err));
				setLoading(false);
			}
		);

		return () => {
			try {
				unsubscribeAuth();
			} catch (e) {}
			if (unsubscribeDetails) unsubscribeDetails();
		};
	}, []);

	const value = {
		user,
		userDetails,
		loading,
		authError,
		isAuthenticated: !!user,
		isEmailVerified: !!user?.emailVerified,
		isApproved: !!userDetails?.isApproved,
		isDeclined: !!userDetails?.isDeclined,
		rejectionReason: userDetails?.rejectionReason ?? null,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

