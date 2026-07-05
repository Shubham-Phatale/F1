import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Text } from 'react-native-paper';
import { colors } from '@/theme/colors';

export type AuthMode = 'login' | 'register';

export interface AuthFormValues {
  email: string;
  password: string;
  displayName?: string;
}

interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (values: AuthFormValues) => void;
  loading?: boolean;
  errorMessage?: string | null;
}

// Basic email format check: something@something.tld
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, loading = false, errorMessage }) => {
  const isRegister = mode === 'register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Track which fields have been interacted with so inline errors only show
  // after the user has touched the field.
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    displayName: false,
  });

  const emailError = !EMAIL_REGEX.test(email.trim())
    ? 'Enter a valid email address'
    : '';
  const passwordError =
    password.length < MIN_PASSWORD_LENGTH
      ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      : '';
  const displayNameError =
    isRegister && displayName.trim().length === 0 ? 'Display name is required' : '';

  const isValid = useMemo(() => {
    if (emailError || passwordError) return false;
    if (isRegister && displayNameError) return false;
    return true;
  }, [emailError, passwordError, displayNameError, isRegister]);

  const handleSubmit = () => {
    if (!isValid) return;
    const values: AuthFormValues = {
      email: email.trim(),
      password,
    };
    if (isRegister) {
      values.displayName = displayName.trim();
    }
    onSubmit(values);
  };

  return (
    <View style={styles.container}>
      {isRegister && (
        <View style={styles.field}>
          <TextInput
            label="Display Name"
            mode="outlined"
            value={displayName}
            onChangeText={setDisplayName}
            onBlur={() => setTouched(t => ({ ...t, displayName: true }))}
            autoCapitalize="words"
            testID="auth-displayName-input"
          />
          {touched.displayName && !!displayNameError && (
            <HelperText type="error" visible>
              {displayNameError}
            </HelperText>
          )}
        </View>
      )}

      <View style={styles.field}>
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setTouched(t => ({ ...t, email: true }))}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          testID="auth-email-input"
        />
        {touched.email && !!emailError && (
          <HelperText type="error" visible>
            {emailError}
          </HelperText>
        )}
      </View>

      <View style={styles.field}>
        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched(t => ({ ...t, password: true }))}
          secureTextEntry
          autoCapitalize="none"
          testID="auth-password-input"
        />
        {touched.password && !!passwordError && (
          <HelperText type="error" visible>
            {passwordError}
          </HelperText>
        )}
      </View>

      {!!errorMessage && (
        <Text style={styles.serverError} testID="auth-server-error">
          {errorMessage}
        </Text>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={!isValid || loading}
        style={styles.submit}
        buttonColor={colors.accent}
        testID="auth-submit-button"
      >
        {isRegister ? 'Sign Up' : 'Log In'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  field: {
    marginBottom: 4,
  },
  serverError: {
    color: colors.accent,
    marginTop: 4,
    marginBottom: 8,
  },
  submit: {
    marginTop: 8,
  },
});

export default AuthForm;
