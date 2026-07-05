import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Race } from '../../types';
import { formatDate, formatTime } from '../../utils/formatters';
import { SurfaceCard, Flag } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

interface RaceCardProps {
  race: Race;
  onPress?: () => void;
  highlight?: boolean;
}

const RaceCard: React.FC<RaceCardProps> = ({ race, onPress, highlight = false }) => {
  const country = race.circuit?.location?.country ?? '';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <SurfaceCard accentColor={highlight ? colors.accent : undefined}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{race.raceName}</Text>
          {country ? <Flag country={country} width={26} /> : null}
        </View>
        <Text style={styles.circuit}>{race.circuit?.circuitName ?? 'TBD'}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {race.circuit?.location
              ? `${race.circuit.location.locality}, ${country}`
              : 'Location TBD'}
          </Text>
          <Text style={styles.meta}>
            {formatDate(race.date)} · {formatTime(race.time)}
          </Text>
        </View>
      </SurfaceCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 16, fontFamily: fontFamily.heading, flex: 1 },
  circuit: { color: colors.textSecondary, fontSize: 12, marginTop: 4, fontFamily: fontFamily.body },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  meta: { color: colors.textMuted, fontSize: 11, fontFamily: fontFamily.body },
});

export default RaceCard;
