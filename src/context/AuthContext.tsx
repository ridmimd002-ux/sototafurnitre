import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  IdTokenResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, checkIsAdmin } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  tokenResult: IdTokenResult | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tokenResult, setTokenResult] = useState<IdTokenResult | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdTokenResult(true);
          setTokenResult(token);
          const adminStatus = checkIsAdmin({
            uid: currentUser.uid,
            email: currentUser.email,
            claims: token.claims
          });
          setIsAdmin(adminStatus);
        } catch {
          setIsAdmin(checkIsAdmin({ uid: currentUser.uid, email: currentUser.email }));
        }
      } else {
        setTokenResult(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const token = await cred.user.getIdTokenResult(true);
    setTokenResult(token);
    setIsAdmin(checkIsAdmin({
      uid: cred.user.uid,
      email: cred.user.email,
      claims: token.claims
    }));
  };

  const register = async (email: string, pass: string, name: string, phone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    
    // Save customer record to firestore users collection
    try {
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: email.toLowerCase().trim(),
        displayName: name,
        phone: phone || '',
        role: checkIsAdmin({ uid: cred.user.uid, email }) ? 'admin' : 'customer',
        createdAt: serverTimestamp(),
        ordersCount: 0,
        totalSpent: 0
      }, { merge: true });
    } catch {
      // Allow completion even if firestore user doc write is throttled
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setTokenResult(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, logout, resetPassword, tokenResult }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
