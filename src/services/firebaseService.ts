import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { UserProfile } from '@/types';

// Re-export so existing consumers importing `UserProfile` from this service
// continue to work; the canonical definition now lives in `src/types`.
export type { UserProfile };

/**
 * Minimal, consistent shape returned by every auth method. A formal
 * `UserProfile` type (with Firestore-backed fields) is introduced in Task 4;
 * until then this lightweight interface is the single source of truth for the
 * basic authenticated-user shape ({ uid, email, displayName }).
 */
export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
}

/**
 * Map a Firebase `User` onto our basic `AuthUser` shape. Firebase's `email` and
 * `displayName` are nullable, so they are normalized to empty strings to keep a
 * consistent, non-null contract across the app.
 */
function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
  };
}

/**
 * Thin wrapper around the Firebase JS SDK modular auth API. All methods use the
 * modular `firebase/auth` functions (Expo Go compatible) and let Firebase errors
 * propagate to the caller so UI layers can map error codes to messages.
 */
export class FirebaseService {
  /**
   * Create a new account with email/password, set the display name on the auth
   * profile, and return the basic user info.
   *
   * NOTE: Firestore profile-document creation is added in Task 3. This is the
   * seam for it: once `createUserProfile` exists, call it here after
   * `updateProfile` before returning.
   */
  async signUp(email: string, password: string, displayName: string): Promise<AuthUser> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });

    const uid = userCredential.user.uid;
    const resolvedEmail = userCredential.user.email ?? email;
    await this.createUserProfile({
      uid,
      email: resolvedEmail,
      displayName,
      joinedAt: new Date().toISOString(),
    });

    return {
      uid,
      email: resolvedEmail,
      displayName,
    };
  }

  /**
   * Create the Firestore profile document for a user. Uses `setDoc` against the
   * `users` collection with the user's `uid` as the document id.
   */
  async createUserProfile(profile: UserProfile): Promise<void> {
    await setDoc(doc(db, 'users', profile.uid), profile);
  }

  /**
   * Read a user's Firestore profile document, or null if it does not exist.
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  /**
   * Apply a partial update to a user's Firestore profile document.
   */
  async updateUserProfile(uid: string, partial: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), partial);
  }

  /**
   * Sign in with email/password and return the basic user info.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(userCredential.user);
  }

  /**
   * Sign the current user out.
   */
  async logout(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Synchronously read the currently authenticated user, or null if none.
   */
  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? toAuthUser(user) : null;
  }

  /**
   * Subscribe to auth-state changes. The callback receives the mapped
   * `AuthUser` (or null when signed out). Returns the unsubscribe function.
   */
  onAuthChange(cb: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, user => {
      cb(user ? toAuthUser(user) : null);
    });
  }
}

export const firebaseService = new FirebaseService();
