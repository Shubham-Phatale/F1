import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setUser, clearAuth } from '@/redux/slices/authSlice';
import { firebaseService } from '@/services/firebaseService';
import { ScreenContainer, SurfaceCard, AppButton, Reveal } from '@/components/ui';
import { colors, fontFamily, radii, SCREEN_GUTTER } from '@/theme';

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
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Profile</Text>
        </View>
        <Reveal index={0}>
          <SurfaceCard>
            <Text style={styles.cardTitle}>Your Profile</Text>
            <Text style={styles.bodyText}>
              Log in to view your profile, set your favorite driver and team, and
              (soon) make race predictions.
            </Text>
            <View style={styles.promptButtons}>
              <AppButton
                label="Log In"
                variant="primary"
                onPress={() => navigation.navigate('Login')}
              />
              <AppButton
                label="Sign Up"
                variant="outline"
                onPress={() => navigation.navigate('Register')}
              />
            </View>
          </SurfaceCard>
        </Reveal>
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

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Profile</Text>
      </View>

      {/* Identity card */}
      <Reveal index={0}>
        <SurfaceCard style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{toInitials(user.displayName)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name} numberOfLines={1}>
              {user.displayName || 'Your Profile'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
            <Text style={styles.joined}>JOINED {formatJoined(user.joinedAt)}</Text>
          </View>
        </SurfaceCard>
      </Reveal>

      {/* Bio / Favorites card */}
      <Reveal index={1}>
        <SurfaceCard>
          {editing ? (
            <>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.inputMultiline]}
              />
              {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
              <View style={styles.editButtons}>
                <View style={styles.editButton}>
                  <AppButton
                    label="Cancel"
                    variant="outline"
                    onPress={cancelEditing}
                    disabled={saving}
                  />
                </View>
                <View style={styles.editButton}>
                  <AppButton
                    label="Save"
                    variant="primary"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Bio</Text>
              <Text style={styles.bodyText}>
                {user.bio || 'No bio yet. Tap "Edit Profile" to add one.'}
              </Text>

              <View style={styles.hairline} />

              <Text style={styles.favoritesLabel}>FAVORITES</Text>

              <View style={styles.favoriteRow}>
                <Text style={styles.favoriteLabel}>Favorite Driver</Text>
                {user.favoriteDriverId ? (
                  <Text style={styles.favoriteValue}>{user.favoriteDriverId}</Text>
                ) : (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Not set</Text>
                  </View>
                )}
              </View>

              <View style={styles.favoriteRow}>
                <Text style={styles.favoriteLabel}>Favorite Team</Text>
                {user.favoriteConstructorId ? (
                  <Text style={styles.favoriteValue}>
                    {user.favoriteConstructorId}
                  </Text>
                ) : (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Not set</Text>
                  </View>
                )}
              </View>

              {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

              <View style={styles.editProfileButton}>
                <AppButton
                  label="Edit Profile"
                  variant="outline"
                  onPress={startEditing}
                />
              </View>
            </>
          )}
        </SurfaceCard>
      </Reveal>

      {/* Settings card */}
      <Reveal index={2}>
        <SurfaceCard style={styles.settingsCard}>
          <Pressable
            style={styles.settingsRow}
            onPress={() => navigation.navigate('About')}
          >
            <Text style={styles.settingsLabel}>About &amp; Credits</Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
          <View style={styles.hairline} />
          <Pressable style={styles.settingsRow} disabled>
            <Text style={styles.settingsLabel}>Notifications</Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
        </SurfaceCard>
      </Reveal>

      {/* Log out */}
      <Reveal index={3}>
        <View style={styles.logoutWrap}>
          <AppButton
            label="Log Out"
            variant="secondary"
            icon="logout"
            onPress={handleLogout}
            loading={loggingOut}
            disabled={loggingOut || editing}
          />
        </View>
      </Reveal>

      <View style={styles.footer} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 8,
    paddingBottom: 4,
  },
  screenTitle: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: fontFamily.display,
  },
  // Identity card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.heading,
    fontSize: 18,
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  identityText: {
    flex: 1,
  },
  name: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.textPrimary,
  },
  email: {
    fontFamily: fontFamily.mono,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  joined: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginTop: 6,
  },
  // Bio / favorites
  cardTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 16,
    color: colors.textPrimary,
  },
  bodyText: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 6,
  },
  hairline: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  favoritesLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  favoriteLabel: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  favoriteValue: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    color: colors.textPrimary,
  },
  chip: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.textSecondary,
  },
  editProfileButton: {
    marginTop: 20,
  },
  // Edit mode
  inputLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
  },
  errorText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.accent,
    marginTop: 12,
  },
  // Settings
  settingsCard: {
    padding: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingsLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  // Log out
  logoutWrap: {
    marginHorizontal: SCREEN_GUTTER,
    marginBottom: 12,
  },
  promptButtons: {
    gap: 12,
    marginTop: 20,
  },
  footer: {
    height: 24,
  },
});

export default ProfileScreen;
