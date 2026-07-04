import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import * as SplashScreen from 'expo-splash-screen';
import { store, persistor } from '@/redux/store';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAppDispatch } from '@/redux/hooks';
import { setUser, clearAuth } from '@/redux/slices/authSlice';
import { firebaseService, type AuthUser } from '@/services/firebaseService';
import type { UserProfile } from '@/types';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Build a minimal UserProfile from the basic auth user when no Firestore
// profile document exists yet (e.g. legacy accounts created before profiles).
function minimalProfileFrom(user: AuthUser): UserProfile {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    joinedAt: new Date().toISOString(),
  };
}

/**
 * Bridges Firebase auth state into Redux. Rendered inside the Provider so
 * `useAppDispatch` is available. Subscribes on mount and unsubscribes on
 * unmount. Does not block rendering — children always render so F1 browsing
 * remains available whether or not the user is signed in.
 */
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(async user => {
      if (user) {
        const profile = await firebaseService.getUserProfile(user.uid);
        dispatch(setUser(profile ?? minimalProfileFrom(user)));
      } else {
        dispatch(clearAuth());
      }
    });

    return unsubscribe;
  }, [dispatch]);

  return <>{children}</>;
};

const App: React.FC = () => {
  useEffect(() => {
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };

    hideSplash();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <AuthGate>
                <RootNavigator />
              </AuthGate>
            </PersistGate>
          </Provider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
