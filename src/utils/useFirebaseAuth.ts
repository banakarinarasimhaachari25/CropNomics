import { useState, useEffect } from 'react';
import {
  auth,
  db,
  signInWithGoogle,
  logOut,
  onAuthStateChanged,
  User,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  phone?: string;
  district?: string;
  createdAt?: any;
  updatedAt?: any;
}

export function useFirebaseAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfileData);
          } else {
            // Initialize new user profile in Firestore
            const initialProfile: UserProfileData = {
              uid: user.uid,
              displayName: user.displayName || 'Agri User',
              email: user.email || '',
              role: 'farmer',
              phone: user.phoneNumber || '',
              district: 'Guntur, Andhra Pradesh',
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (error) {
          console.error('Error fetching/creating user profile in Firestore:', error);
          try {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          } catch (_) {}
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      return user;
    } catch (error) {
      console.error('Google Sign-in failed:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setUserProfile(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const updateUserRoleInFirestore = async (newRole: string) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userDocRef,
        {
          role: newRole,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setUserProfile((prev) => (prev ? { ...prev, role: newRole } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return {
    currentUser,
    userProfile,
    loading,
    handleGoogleLogin,
    handleLogout,
    updateUserRoleInFirestore,
  };
}
