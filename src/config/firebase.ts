import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth, type Persistence } from 'firebase/auth';
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebaseConfig';

// `getReactNativePersistence` is only exported from the React Native entry point
// of `firebase/auth` (dist/rn/index.rn.d.ts). Metro resolves that entry at
// runtime, but TypeScript's `bundler` module resolution reads the default type
// declarations, which omit it. Augment the module so the RN-only export is typed.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
// eslint-disable-next-line import/first
import { getReactNativePersistence } from 'firebase/auth';

// Initialize the Firebase app once (guard against re-init during fast refresh).
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize auth with React Native (AsyncStorage) persistence so the user
// session survives app restarts in Expo Go. If auth was already initialized
// (e.g. after a fast refresh), fall back to getAuth.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

// The default Firestore transport (WebChannel) hangs silently in React Native /
// Expo Go. Forcing long-polling makes reads/writes work reliably on device.
// `initializeFirestore` must run before any `getFirestore`; fall back if it was
// already initialized (e.g. after a fast refresh).
let db: Firestore;
try {
  db = initializeFirestore(app, { experimentalForceLongPolling: true });
} catch {
  db = getFirestore(app);
}

export { app, auth, db };
