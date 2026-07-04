# Phase 3A: Firebase Foundation + Auth + Profiles - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add the backend foundation (Firebase, Expo-Go-compatible JS SDK) plus user authentication (email/password) and user profiles — the base every other Phase 3 feature builds on.

**Architecture:** Firebase JS SDK (`firebase` v10+ modular) initialized once via a config module. Auth uses `initializeAuth` with AsyncStorage persistence (Expo Go compatible). A `firebaseService` wraps auth + Firestore profile CRUD. A new `authSlice` holds the current user; a `usersSlice` caches profiles. New Auth + Profile screens. Firestore stores `users/{uid}` profile docs.

**Tech Stack:** Expo SDK 54, Firebase JS SDK (`firebase`), Firestore, Redux Toolkit, React Native Paper. Tests use the Firebase emulator or mocked firebase modules.

## Global Constraints

- **Expo Go compatibility:** Use the `firebase` JS SDK ONLY. Do NOT use `@react-native-firebase/*` (needs native build, breaks Expo Go).
- **Auth persistence:** `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`.
- **Secrets:** Firebase config lives in `src/config/firebaseConfig.ts`, which is GITIGNORED. Commit a `firebaseConfig.example.ts` template instead. Never commit real API keys.
- **Language:** TypeScript strict; `npm run type-check` must pass.
- **Testing:** jest-expo preset; full suite must stay green. Mock the `firebase/auth` and `firebase/firestore` modules in unit tests (do not hit the network).
- **Naming:** camelCase functions/vars, PascalCase components/types.
- **No AI attribution** in commit messages.

## USER ACTION REQUIRED (before this phase can run live on device)

The code is built to work the moment you provide config, but to actually log in on your phone you must:
1. Create a free Firebase project at console.firebase.google.com
2. Add a Web App to it; copy the config object (apiKey, authDomain, projectId, etc.)
3. Enable Email/Password sign-in (Authentication → Sign-in method)
4. Create a Firestore database (test mode is fine to start)
5. Paste the config into `src/config/firebaseConfig.ts` (copied from the committed example)

Until then, the app builds and all unit tests pass (they mock Firebase); only live login requires the real project.

---

## Task 1: Install Firebase + config scaffolding

**Files:**
- Modify: `package.json` (add `firebase`)
- Create: `src/config/firebaseConfig.example.ts`
- Create: `src/config/firebaseConfig.ts` (gitignored placeholder)
- Create: `src/config/firebase.ts` (initializes app, auth, firestore)
- Modify: `.gitignore` (ignore `src/config/firebaseConfig.ts`)

**Steps:**
- `npx expo install firebase`
- `firebaseConfig.example.ts`: exports a `firebaseConfig` object with placeholder strings + a comment explaining where to get each value.
- `firebaseConfig.ts`: same shape with empty-string placeholders (this is the gitignored real-config slot).
- `firebase.ts`: imports the config, calls `initializeApp`, `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`, and `getFirestore(app)`; exports `auth` and `db`. Guard against re-init (check getApps().length).
- `.gitignore`: add `src/config/firebaseConfig.ts`.
- Verify type-check; the bundle must still export (`npx expo export --platform android`, then remove dist).

**Commit:** `feat: add firebase js sdk setup with gitignored config`

---

## Task 2: firebaseService — auth methods

**Files:**
- Create: `src/services/firebaseService.ts`
- Create: `__tests__/unit/services/firebaseService.test.ts`

**Interfaces produced:**
- `signUp(email, password, displayName): Promise<User>`
- `login(email, password): Promise<User>`
- `logout(): Promise<void>`
- `getCurrentUser(): FirebaseUser | null`
- `onAuthChange(cb): unsubscribe`
Where `User` is the app's profile type (see Task 4). signUp also creates the Firestore profile doc (Task 3 CRUD) — or call the profile create here.

**Steps:**
- Wrap `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged` from `firebase/auth`.
- On signUp, set the auth displayName (`updateProfile`) and create `users/{uid}` in Firestore.
- Unit-test by mocking `firebase/auth` and `firebase/firestore` (jest.mock) — assert the right SDK calls happen and errors propagate.
- type-check + full suite green.

**Commit:** `feat: add firebase auth service (signup, login, logout, auth state)`

---

## Task 3: firebaseService — profile Firestore CRUD

**Files:**
- Modify: `src/services/firebaseService.ts`
- Modify: `__tests__/unit/services/firebaseService.test.ts`

**Interfaces produced:**
- `createUserProfile(uid, profile): Promise<void>`
- `getUserProfile(uid): Promise<UserProfile | null>`
- `updateUserProfile(uid, partial): Promise<void>`

**Steps:**
- Use `doc`, `setDoc`, `getDoc`, `updateDoc` from `firebase/firestore` against `users/{uid}`.
- Unit-test with mocked firestore.
- type-check + full suite green.

**Commit:** `feat: add firestore user profile CRUD to firebase service`

---

## Task 4: Auth types + Redux slices

**Files:**
- Modify: `src/types/index.ts` (User/UserProfile, AuthState, UsersState)
- Create: `src/redux/slices/authSlice.ts`
- Create: `src/redux/slices/usersSlice.ts`
- Modify: `src/redux/store.ts` (register `auth`, `users`)

**Types:**
- `UserProfile { uid; email; displayName; avatarUrl?; bio?; favoriteDriverId?; favoriteConstructorId?; joinedAt: string }`
- `AuthState { user: UserProfile | null; status: 'idle'|'loading'|'authenticated'|'error'; error: string | null }`
- `UsersState { byId: Record<string, UserProfile>; loading: boolean; error: string | null }`

**Steps:**
- authSlice: actions `setUser`, `setAuthStatus`, `setAuthError`, `clearAuth`.
- usersSlice: `setUserProfile`, `clearUsers`.
- Register in store (NOT persisted via redux-persist — Firebase handles auth persistence).
- type-check + full suite green.

**Commit:** `feat: add auth and users redux slices and types`

---

## Task 5: Auth screens (Login / Register)

**Files:**
- Create: `src/screens/auth/LoginScreen.tsx`
- Create: `src/screens/auth/RegisterScreen.tsx`
- Create: `src/components/auth/AuthForm.tsx` (shared form)

**Steps:**
- React Native Paper `TextInput` (email, password, displayName for register), validation (non-empty, valid email, min password length), error text, submit `Button` with loading state.
- On submit call firebaseService login/signUp; on success dispatch `setUser` + status; on error dispatch `setAuthError` and show message.
- Component test (RTL 14 async API) for AuthForm validation/render (mock the service).
- type-check + full suite green.

**Commit:** `feat: add login and register screens with validation`

---

## Task 6: Profile screen + auth gating in navigation

**Files:**
- Create: `src/screens/profile/ProfileScreen.tsx`
- Modify: `src/navigation/types.ts`, `src/navigation/RootNavigator.tsx`, `src/navigation/HomeNavigator.tsx`
- Modify: `app/index.tsx` (subscribe to auth state on startup)

**Steps:**
- ProfileScreen: shows current user's profile (displayName, email, favorite driver/team, bio), edit button → updateUserProfile, and a Logout button.
- Add a `Profile` tab (or header button) to the bottom tabs; add `Login`/`Register` routes to the root stack.
- Auth gating: in `app/index.tsx` (or a small AuthGate), subscribe via `firebaseService.onAuthChange`, dispatch `setUser`/`clearAuth`. Show the app when authenticated; the Login/Register screens are reachable when not. Keep it simple — do not force-block the existing F1 browsing (predictions/forums will require auth later); at minimum, Profile requires login.
- Verify: type-check, full suite green, `npx expo export --platform android` succeeds (then remove dist).

**Commit:** `feat: add profile screen and auth-aware navigation`

---

## Task 7: Verification

- `npm run type-check` clean
- `npm test -- --watchAll=false` full suite green
- `npx expo export --platform android` bundles cleanly (then remove dist)
- Confirm: with placeholder Firebase config the app still builds and tests pass (Firebase mocked); document that live login needs the user's real config.

**Commit:** (only if fixes needed) `test: verify phase 3a auth and profiles`

---

## Success Criteria

- Firebase JS SDK initialized (Expo Go compatible), config gitignored with a committed example
- signUp/login/logout + profile CRUD implemented and unit-tested (mocked SDK)
- Auth + users Redux slices wired
- Login/Register/Profile screens working, auth state drives navigation
- Type-check clean, full test suite green, Android bundle exports
- No secrets committed; no AI attribution in history

## Roadmap (subsequent sub-phases, separate plans)

- **Phase 3B:** Race predictions + auto-scoring against real results + leaderboard
- **Phase 3C:** Discussion forums (per-race threads, comments, likes)
- **Phase 3D:** Notifications (Expo push: race reminders, prediction results, replies)
