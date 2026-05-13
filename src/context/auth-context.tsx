"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let role: User['role'] = 'employee';
        let displayName = firebaseUser.displayName;
        let photoURL = firebaseUser.photoURL;
        try {
          const snap = await getDoc(doc(db, 'employees', firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            const r = data?.metadata?.role;
            if (['admin', 'hr', 'manager', 'employee'].includes(r)) role = r;
            const fullName = [data?.firstName, data?.lastName].filter(Boolean).join(' ');
            if (fullName) displayName = fullName;
            if (data?.photoURL) photoURL = data.photoURL;
          } else if (firebaseUser.email === 'admin@hr.local') {
            role = 'admin';
            if (!displayName) displayName = 'Administrator';
          }
        } catch {
          if (firebaseUser.email === 'admin@hr.local') role = 'admin';
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName,
          photoURL,
          role,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
