"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirestoreDB } from "@/lib/firebase";

import { Spinner } from "@/components/ui/spinner";
export function ApprovalGuard({ user, children }) {
  const [isApproved, setIsApproved] = useState(false);
  const db = getFirestoreDB();

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setIsApproved(!!snap.data()?.isApproved); // check Firestore field
      }
    });

    return () => unsub();
  }, [user, db]);

  if (!isApproved) {
    return (
      <div className="flex items-center justify-center min-h-screen">
      <div className="w-4/5 flex flex-col items-center justify-center h-2/3 border-white rounded-3xl p-8 text-white">
        <Spinner className="h-16 w-16 text-white mb-6" />
        <h2 className="text-2xl font-bold mb-4 text-center">
          Wait For Admin Approval
        </h2>
        <p className="text-center mb-2">
          Your account is under review. An administrator will approve your account shortly.
        </p>
        <p className="text-center text-sm text-gray-300">
          Once approved, you'll be able to complete your profile and access all features.
        </p>
        <p className="text-center mt-4 text-sm text-gray-400">
            Thank you for your patience!
        </p>
      </div>
    </div>
    );
  }

  return <>{children}</>;
}
