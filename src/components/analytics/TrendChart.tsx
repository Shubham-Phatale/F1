import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Canvas, Path, Circle, Line, Skia, vec } from '@shopify/react-native-skia';
import { TrendData } from '../../types';

type NumericMetric = TrendData['metricType'];

interface TrendChartProps {
  trendData: TrendData;
  /**
   * Which metric the chart represents. Defaults to the metricType stored on
   * the TrendData. The value series (`trendData.values`) is what gets plotted.
   */
  metric?: NumericMetric;
  height?: number;
}

const HORIZONTAL_PADDING = 32;
const CHART_INSET = 24;
const GRID_LINE_COUNT = 4;
const LINE_COLOR = '#e10600';
const GRID_COLOR = '#e0e0e0';
const POINT_COLOR = '#e10600';

const TrendChart: React.FC<TrendChartProps> = ({ trendData, metric, height = 300 }) => {
  const seasons = trendData?.seasons ?? [];
  const values = trendData?.values ?? [];

  // Guard against empty or misaligned data.
  const hasData = seasons.length > 0 && values.length > 0 && seasons.length === values.length;

  if (!hasData) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text variant="bodyMedium" style={styles.placeholderText}>
          No trend data available
        </Text>
      </View>
    );
  }

  const width = Dimensions.get('window').width - HORIZONTAL_PADDING;
  const chartWidth = width - CHART_INSET * 2;
  const chartHeight = height - CHART_INSET * 2;

  // Normalize: min is fixed at 0, max is the largest value (fallback to 1 to
  // avoid divide-by-zero when every value is 0).
  const maxValue = Math.max(...values, 0);
  const normalizeMax = maxValue > 0 ? maxValue : 1;

  const xFor = (index: number): number => {
    if (values.length === 1) {
      return CHART_INSET + chartWidth / 2;
    }
    return CHART_INSET + (chartWidth * index) / (values.length - 1);
  };

  const yFor = (value: number): number => {
    const ratio = value / normalizeMax;
    return CHART_INSET + chartHeight - ratio * chartHeight;
  };

  // Build the connecting line path.
  const linePath = Skia.Path.Make();
  values.forEach((value, index) => {
    const x = xFor(index);
    const y = yFor(value);
    if (index === 0) {
      linePath.moveTo(x, y);
    } else {
      linePath.lineTo(x, y);
    }
  });

  // Horizontal grid lines.
  const gridLines = Array.from({ length: GRID_LINE_COUNT + 1 }, (_, i) => {
    const y = CHART_INSET + (chartHeight * i) / GRID_LINE_COUNT;
    return y;
  });

  const activeMetric = metric ?? trendData.metricType;

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.axisLabel}>
        {activeMetric} over {seasons[0]}–{seasons[seasons.length - 1]}
      </Text>
      <Canvas style={{ width, height }}>
        {gridLines.map((y, i) => (
          <Line
            key={`grid-${i}`}
            p1={vec(CHART_INSET, y)}
            p2={vec(CHART_INSET + chartWidth, y)}
            color={GRID_COLOR}
            strokeWidth={1}
          />
        ))}

        <Path path={linePath} color={LINE_COLOR} style="stroke" strokeWidth={2.5} />

        {values.map((value, index) => (
          <Circle
            key={`point-${index}`}
            cx={xFor(index)}
            cy={yFor(value)}
            r={4}
            color={POINT_COLOR}
          />
        ))}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  axisLabel: {
    color: '#666',
    marginBottom: 4,
    marginLeft: CHART_INSET,
    textTransform: 'capitalize',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 8,
  },
  placeholderText: {
    color: '#999',
  },
});

export default TrendChart;
