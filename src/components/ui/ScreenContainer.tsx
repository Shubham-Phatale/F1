import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
}

export const ScreenContainer: React.FC<Props> = ({ children, scroll = true }) => {
  const insets = useSafeAreaInsets();

  if (scroll) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <View style={[styles.container, styles.content, { paddingTop: insets.top }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
});
