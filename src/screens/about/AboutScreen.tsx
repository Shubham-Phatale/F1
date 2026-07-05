import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { ScreenContainer, BackButton, SurfaceCard, SectionHeader, AttributionText } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

const AboutScreen: React.FC = () => (
  <ScreenContainer>
    <BackButton />
    <View style={styles.header}>
      <Text style={styles.title}>F1·LIVE</Text>
      <Text style={styles.subtitle}>Unofficial F1 stats companion</Text>
    </View>
    <SectionHeader title="Disclaimer" />
    <SurfaceCard>
      <Text style={styles.body}>
        This is an unofficial, personal project. It is not affiliated with, endorsed by, or
        associated with Formula 1, the FIA, Formula One Licensing BV, or any Formula 1 team.
        &quot;F1&quot; and &quot;Formula 1&quot; are trademarks of their respective owners.
      </Text>
    </SurfaceCard>
    <SectionHeader title="Data & Images" />
    <SurfaceCard>
      <Text style={styles.body}>Race &amp; timing data via the Ergast / Jolpica API and OpenF1.</Text>
      <AttributionText text="Data: OpenF1 (CC-BY 4.0)" />
      <AttributionText text="Driver images © Formula 1, served via the OpenF1 API" />
      <AttributionText text="Flags via flagcdn.com" />
    </SurfaceCard>
  </ScreenContainer>
);

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 26, fontFamily: fontFamily.heading },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: fontFamily.body },
});

export default AboutScreen;
