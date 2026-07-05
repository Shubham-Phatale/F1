import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setUser, setAuthStatus, setAuthError } from '@/redux/slices/authSlice';
import { firebaseService } from '@/services/firebaseService';
import type { UserProfile } from '@/types';
import AuthForm, { AuthFormValues } from '@/components/auth/AuthForm';
import { ScreenContainer, BackButton } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

type RegisterNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Map raw Firebase auth error codes onto friendly, user-facing messages.
function mapAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for that email.';
    case 'auth/invalid-email':
      return 'That email address is invalid.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'Unable to create account. Please try again.';
  }
}

const RegisterScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<RegisterNavigationProp>();

  const [loading, setLoading] = useState(false);
  const authError = useAppSelector(state => state.auth.error);

  const handleSubmit = async (values: AuthFormValues) => {
    setLoading(true);
    dispatch(setAuthError(null));
    dispatch(setAuthStatus('loading'));
    try {
      const authUser = await firebaseService.signUp(
        values.email,
        values.password,
        values.displayName ?? ''
      );
      // Don't let a slow/failed profile read block registration — fall back to a
      // minimal profile built from the auth user.
      let profile: UserProfile | null = null;
      try {
        profile = await firebaseService.getUserProfile(authUser.uid);
      } catch {
        profile = null;
      }
      const resolved: UserProfile =
        profile ?? {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          joinedAt: new Date().toISOString(),
        };
      dispatch(setUser(resolved));
      navigation.navigate('Home', { screen: 'Profile' });
    } catch (error) {
      dispatch(setAuthError(mapAuthError(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <BackButton />
      <View style={styles.wordmarkWrap}>
        <Text style={styles.wordmark}>F1·LIVE</Text>
      </View>

      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Create Account
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sign up to get started
        </Text>
      </View>

      <AuthForm
        mode="register"
        onSubmit={handleSubmit}
        loading={loading}
        errorMessage={authError}
      />

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={styles.footerText}>
          Already have an account?
        </Text>
        <Button mode="text" onPress={() => navigation.navigate('Login')}>
          Log In
        </Button>
      </View>

      <Text style={styles.disclaimer}>
        Unofficial · Not affiliated with Formula 1
      </Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  wordmarkWrap: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  wordmark: {
    color: colors.accent,
    fontSize: 28,
    fontFamily: fontFamily.heading,
    letterSpacing: 1,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: colors.textSecondary,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default RegisterScreen;
