import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
}

export const ScreenContainer: React.FC<Props> = ({ children, scroll = true }) => {
  if (scroll) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.container, styles.content]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
});
