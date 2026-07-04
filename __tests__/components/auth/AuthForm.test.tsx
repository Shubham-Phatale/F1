import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import AuthForm from '@/components/auth/AuthForm';

// Mock react-native-paper with lightweight stand-ins so the test exercises
// AuthForm's own validation/submit logic without PaperProvider's async theming.
jest.mock('react-native-paper', () => {
  const ReactMock = require('react');
  const { Text: RNText, TextInput: RNTextInput, Pressable } = require('react-native');

  const TextInput = ({ label, value, onChangeText, onBlur, testID }: any) =>
    ReactMock.createElement(RNTextInput, {
      testID,
      accessibilityLabel: label,
      value,
      onChangeText,
      onBlur,
    });

  const Button = ({ children, onPress, disabled, testID }: any) =>
    ReactMock.createElement(
      Pressable,
      { testID, onPress, disabled, accessibilityState: { disabled: !!disabled } },
      ReactMock.createElement(RNText, null, children)
    );

  const HelperText = ({ children }: any) => ReactMock.createElement(RNText, null, children);

  const Text = ({ children, testID }: any) =>
    ReactMock.createElement(RNText, { testID }, children);

  return { TextInput, Button, HelperText, Text };
});

// Change a field's text inside an awaited `act` so React 19's deferred update
// for the controlled input flushes within the test boundary (avoids leaking an
// open act scope into the next test).
async function typeInto(testID: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID), text);
  });
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe('AuthForm', () => {
  it('renders login mode with email and password inputs, no display name', async () => {
    await render(<AuthForm mode="login" onSubmit={jest.fn()} />);

    expect(screen.getByTestId('auth-email-input')).toBeTruthy();
    expect(screen.getByTestId('auth-password-input')).toBeTruthy();
    expect(screen.queryByTestId('auth-displayName-input')).toBeNull();
    expect(screen.getByText('Log In')).toBeTruthy();
  });

  it('renders register mode with a display name input', async () => {
    await render(<AuthForm mode="register" onSubmit={jest.fn()} />);

    expect(screen.getByTestId('auth-displayName-input')).toBeTruthy();
    expect(screen.getByTestId('auth-email-input')).toBeTruthy();
    expect(screen.getByTestId('auth-password-input')).toBeTruthy();
    expect(screen.getByText('Sign Up')).toBeTruthy();
  });

  it('keeps submit disabled and does not call onSubmit while inputs are invalid', async () => {
    const onSubmit = jest.fn();
    await render(<AuthForm mode="login" onSubmit={onSubmit} />);

    await typeInto('auth-email-input', 'not-an-email');
    await typeInto('auth-password-input', '123');

    expect(screen.getByTestId('auth-submit-button').props.accessibilityState?.disabled).toBe(
      true
    );

    await press('auth-submit-button');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with values when login inputs are valid', async () => {
    const onSubmit = jest.fn();
    await render(<AuthForm mode="login" onSubmit={onSubmit} />);

    await typeInto('auth-email-input', 'user@example.com');
    await typeInto('auth-password-input', 'secret123');

    expect(screen.getByTestId('auth-submit-button').props.accessibilityState?.disabled).toBe(
      false
    );

    await press('auth-submit-button');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  it('calls onSubmit including displayName in register mode when valid', async () => {
    const onSubmit = jest.fn();
    await render(<AuthForm mode="register" onSubmit={onSubmit} />);

    await typeInto('auth-displayName-input', 'Ada Lovelace');
    await typeInto('auth-email-input', 'user@example.com');
    await typeInto('auth-password-input', 'secret123');

    await press('auth-submit-button');

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
      displayName: 'Ada Lovelace',
    });
  });

  it('surfaces a server error message when provided', async () => {
    await render(
      <AuthForm mode="login" onSubmit={jest.fn()} errorMessage="Incorrect email or password." />
    );

    expect(screen.getByText('Incorrect email or password.')).toBeTruthy();
  });
});
