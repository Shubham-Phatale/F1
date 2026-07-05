import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export const BackButton: React.FC = () => {
  const navigation = useNavigation();

  if (!navigation.canGoBack()) {
    return null;
  }

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={styles.button}
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,20,27,0.7)',
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 12,
    marginTop: 8,
    marginBottom: 4,
  },
});
