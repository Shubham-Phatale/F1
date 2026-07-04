import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  variant?: 'default' | 'success' | 'warning';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, variant = 'default' }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return '#e8f5e9';
      case 'warning':
        return '#fff3e0';
      case 'default':
      default:
        return '#f5f5f5';
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <View style={styles.content}>
        {icon && (
          <MaterialCommunityIcons name={icon as any} size={20} color="#666" style={styles.icon} />
        )}
        <View style={styles.textContainer}>
          <Text variant="labelSmall" style={styles.label}>
            {label}
          </Text>
          <Text variant="headlineSmall" style={styles.value}>
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontWeight: 'bold',
  },
});

export default StatCard;
