import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { colors, fontFamily } from '@/theme';

type Variant = 'primary' | 'secondary' | 'outline';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
}

interface VariantStyle {
  container: object;
  textColor: string;
  fontSize: number;
  iconColor: string;
}

function getVariantStyle(variant: Variant): VariantStyle {
  switch (variant) {
    case 'secondary':
      return {
        container: {
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
        },
        textColor: colors.textPrimary,
        fontSize: 16,
        iconColor: colors.textPrimary,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.lineStrong,
          padding: 15,
        },
        textColor: colors.accent,
        fontSize: 15,
        iconColor: colors.accent,
      };
    case 'primary':
    default:
      return {
        container: {
          backgroundColor: colors.accent,
          padding: 16,
        },
        textColor: '#ffffff',
        fontSize: 16,
        iconColor: '#ffffff',
      };
  }
}

export const AppButton: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
}) => {
  const v = getVariantStyle(variant);
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, v.container, isDisabled && styles.disabled]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={v.iconColor} />
        ) : (
          <>
            {icon && (
              <MaterialIcons name={icon} size={18} color={v.iconColor} />
            )}
            <Text
              style={[styles.label, { color: v.textColor, fontSize: v.fontSize }]}
            >
              {label}
            </Text>
          </>
        )}
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
  },
  disabled: {
    opacity: 0.5,
  },
});
