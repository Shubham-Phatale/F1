import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setUser, clearAuth } from '@/redux/slices/authSlice';
import { firebaseService } from '@/services/firebaseService';
import { ScreenContainer, SurfaceCard, DriverBadge } from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Format an ISO date string into a readable "joined" label. Falls back to the
// raw value when parsing fails so a malformed date never breaks the screen.
function formatJoined(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Derive avatar initials from a display name (first 2-3 chars uppercased).
function toInitials(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return 'F1';
  return trimmed.slice(0, 3).toUpperCase();
}

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<ProfileNavigationProp>();
  const user = useAppSelector(state => state.auth.user);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Not logged in: prompt the user to authenticate. F1 browsing remains
  // available elsewhere; only this screen gates on auth.
  if (!user) {
    return (
      <ScreenContainer scroll>
        <View style={styles.promptContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Your Profile
          </Text>
          <Text variant="bodyMedium" style={styles.promptText}>
            Log in to view your profile, set your favorite driver and team, and
            (soon) make race predictions.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            buttonColor={colors.accent}
            style={styles.primaryButton}
          >
            Log In
          </Button>
          <View style={styles.registerRow}>
            <Text variant="bodyMedium" style={styles.mutedText}>
              New here?
            </Text>
            <Button mode="text" onPress={() => navigation.navigate('Register')}>
              Sign Up
            </Button>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const startEditing = () => {
    setDisplayName(user.displayName ?? '');
    setBio(user.bio ?? '');
    setErrorMessage(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setErrorMessage(null);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    const partial = {
      displayName: displayName.trim(),
      bio: bio.trim(),
    };
    try {
      await firebaseService.updateUserProfile(user.uid, partial);
      dispatch(setUser({ ...user, ...partial }));
      setEditing(false);
    } catch {
      setErrorMessage('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await firebaseService.logout();
      dispatch(clearAuth());
    } catch {
      setErrorMessage('Could not log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const teamColor = getTeamColor(user.favoriteConstructorId ?? '');

  return (
    <ScreenContainer scroll>
      <SurfaceCard style={styles.headerCard}>
        <View style={styles.headerRow}>
          <DriverBadge code={toInitials(user.displayName)} teamColor={teamColor} size={56} />
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={styles.title}>
              {user.displayName || 'Your Profile'}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {user.email}
            </Text>
            <Text variant="bodySmall" style={styles.joined}>
              Joined {formatJoined(user.joinedAt)}
            </Text>
          </View>
        </View>
      </SurfaceCard>

      {editing ? (
        <SurfaceCard>
          <TextInput
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          {errorMessage && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errorMessage}
            </Text>
          )}
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={cancelEditing}
              disabled={saving}
              style={styles.flexButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              buttonColor={colors.accent}
              style={styles.flexButton}
            >
              Save
            </Button>
          </View>
        </SurfaceCard>
      ) : (
        <SurfaceCard>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Bio
          </Text>
          <Text variant="bodyMedium" style={styles.bodyText}>
            {user.bio || 'No bio yet. Tap "Edit Profile" to add one.'}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Favorites
          </Text>
          <View style={styles.favoriteRow}>
            <View style={[styles.teamDot, { backgroundColor: teamColor }]} />
            <Text variant="bodyMedium" style={styles.bodyText}>
              Favorite Driver: {user.favoriteDriverId || 'Not set'}
            </Text>
          </View>
          <View style={styles.favoriteRow}>
            <View style={[styles.teamDot, { backgroundColor: teamColor }]} />
            <Text variant="bodyMedium" style={styles.bodyText}>
              Favorite Team: {user.favoriteConstructorId || 'Not set'}
            </Text>
          </View>

          {errorMessage && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errorMessage}
            </Text>
          )}

          <Button mode="outlined" onPress={startEditing} style={styles.editButton}>
            Edit Profile
          </Button>
        </SurfaceCard>
      )}

      <SurfaceCard>
        <Button
          mode="text"
          onPress={() => navigation.navigate('About')}
          textColor={colors.textSecondary}
        >
          About & Credits
        </Button>
        <Divider style={styles.divider} />
        <Button
          mode="contained-tonal"
          onPress={handleLogout}
          loading={loggingOut}
          disabled={loggingOut || editing}
        >
          Log Out
        </Button>
      </SurfaceCard>

      <View style={styles.footer} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontFamily: fontFamily.heading,
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  joined: {
    color: colors.textMuted,
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontFamily: fontFamily.bodySemi,
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  bodyText: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  input: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  flexButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  editButton: {
    marginTop: 16,
  },
  errorText: {
    color: colors.accent,
    marginBottom: 8,
  },
  mutedText: {
    color: colors.textSecondary,
  },
  promptContainer: {
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  promptText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  primaryButton: {
    alignSelf: 'stretch',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  footer: {
    height: 24,
  },
});

export default ProfileScreen;
