import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Button, TextInput, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setUser, clearAuth } from '@/redux/slices/authSlice';
import { firebaseService } from '@/services/firebaseService';
import StatCard from '@/components/race/StatCard';

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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            style={styles.primaryButton}
          >
            Log In
          </Button>
          <View style={styles.registerRow}>
            <Text variant="bodyMedium">New here?</Text>
            <Button mode="text" onPress={() => navigation.navigate('Register')}>
              Sign Up
            </Button>
          </View>
        </View>
      </ScrollView>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          {user.displayName || 'Your Profile'}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {user.email}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Joined" value={formatJoined(user.joinedAt)} icon="calendar" />
      </View>

      <Divider style={styles.divider} />

      {editing ? (
        <View style={styles.section}>
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
              style={styles.flexButton}
            >
              Save
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Bio
          </Text>
          <Text variant="bodyMedium" style={styles.bodyText}>
            {user.bio || 'No bio yet. Tap "Edit Profile" to add one.'}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Favorites
          </Text>
          <Text variant="bodyMedium" style={styles.bodyText}>
            Favorite Driver: {user.favoriteDriverId || 'Not set'}
          </Text>
          <Text variant="bodyMedium" style={styles.bodyText}>
            Favorite Team: {user.favoriteConstructorId || 'Not set'}
          </Text>

          {errorMessage && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errorMessage}
            </Text>
          )}

          <Button mode="outlined" onPress={startEditing} style={styles.editButton}>
            Edit Profile
          </Button>
        </View>
      )}

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Button
          mode="contained-tonal"
          onPress={handleLogout}
          loading={loggingOut}
          disabled={loggingOut || editing}
        >
          Log Out
        </Button>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingVertical: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  divider: {
    marginVertical: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  bodyText: {
    color: '#333',
    marginBottom: 4,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
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
    color: '#c62828',
    marginBottom: 8,
  },
  promptContainer: {
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  promptText: {
    color: '#666',
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
