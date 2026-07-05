import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { DriverBadge } from '@/components/ui';
import { colors, fontFamily, getTeamColor, SCREEN_GUTTER } from '@/theme';
import type { Driver } from '@/types';

type Slot = 0 | 1 | 2;

interface DriverPickerProps {
  drivers: Driver[];
  selected: [string, string, string];
  onChange: (slot: Slot, driverId: string) => void;
}

const SLOT_LABELS = ['P1', 'P2', 'P3'] as const;

export const DriverPicker: React.FC<DriverPickerProps> = ({
  drivers,
  selected,
  onChange,
}) => {
  return (
    <View>
      {SLOT_LABELS.map((label, slotIndex) => {
        const slot = slotIndex as Slot;
        return (
          <View key={label} style={styles.slotRow}>
            <Text style={styles.slotLabel}>{label}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipList}
            >
              {drivers.map((driver) => {
                const code =
                  driver.code || driver.familyName.slice(0, 3).toUpperCase();
                const isSelected = selected[slot] === driver.driverId;
                const usedElsewhere = selected.some(
                  (id, i) => i !== slot && id === driver.driverId
                );
                const disabled = usedElsewhere;

                return (
                  <Pressable
                    key={driver.driverId}
                    onPress={() => onChange(slot, driver.driverId)}
                    disabled={disabled}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                      disabled && styles.chipDisabled,
                    ]}
                  >
                    <DriverBadge
                      code={code}
                      teamColor={getTeamColor(driver.nationality)}
                      size={32}
                    />
                    <Text
                      style={[styles.chipName, isSelected && styles.chipNameSelected]}
                      numberOfLines={1}
                    >
                      {driver.familyName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  slotRow: {
    marginBottom: 12,
  },
  slotLabel: {
    color: colors.accent,
    fontFamily: fontFamily.heading,
    fontSize: 14,
    marginBottom: 8,
    marginHorizontal: SCREEN_GUTTER,
  },
  chipList: {
    gap: 8,
    paddingHorizontal: SCREEN_GUTTER,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceRaised,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipName: {
    color: colors.textSecondary,
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
  },
  chipNameSelected: {
    color: colors.textPrimary,
  },
});
