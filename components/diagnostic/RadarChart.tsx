import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Circle as SvgCircle,
  Line,
  Circle,
  Path,
  Text as SvgText,
} from "react-native-svg";
import { COLORS, FONT_SIZE, SPACING } from "@/constants/app";

type RadarDataPoint = {
  label: string;
  value: number; // 0-5
  segmentValue?: number; // 0-5 (comparison)
};

type RadarChartProps = {
  data: RadarDataPoint[];
  size?: number;
  segmentLabel?: string;
};

const LEVELS = 5;

// Build a smooth closed curve through points using cubic Bézier
function smoothClosedPath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n < 3) return "";

  const tension = 0.3;
  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}

export function RadarChart({ data, size = 340, segmentLabel }: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 55;
  const angleStep = (2 * Math.PI) / data.length;
  const startAngle = -Math.PI / 2;

  function getPoint(index: number, value: number): { x: number; y: number } {
    const angle = startAngle + index * angleStep;
    const r = (value / LEVELS) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  }

  function getPoints(values: number[]): { x: number; y: number }[] {
    return values.map((v, i) => getPoint(i, v));
  }

  // Axis lines (spokes)
  const axisLines = data.map((_, i) => {
    const p = getPoint(i, LEVELS);
    return { x1: center, y1: center, x2: p.x, y2: p.y };
  });

  // Labels
  const labels = data.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const labelR = radius + 20;
    const x = center + labelR * Math.cos(angle);
    const y = center + labelR * Math.sin(angle);
    let textAnchor: "start" | "middle" | "end" = "middle";
    if (Math.cos(angle) > 0.3) textAnchor = "start";
    else if (Math.cos(angle) < -0.3) textAnchor = "end";
    return { x, y, label: d.label, textAnchor };
  });

  // Smooth paths for data
  const userPoints = getPoints(data.map((d) => d.value));
  const userPath = smoothClosedPath(userPoints);

  const hasSegment = data.some((d) => d.segmentValue != null);
  const segmentPath = hasSegment
    ? smoothClosedPath(getPoints(data.map((d) => d.segmentValue ?? 0)))
    : "";

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Circular grid rings */}
        {Array.from({ length: LEVELS }, (_, level) => {
          const r = ((level + 1) / LEVELS) * radius;
          return (
            <SvgCircle
              key={`grid-${level}`}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke={COLORS.border}
              strokeWidth={level === LEVELS - 1 ? 1.2 : 0.6}
              strokeDasharray={level < LEVELS - 1 ? "4,4" : undefined}
            />
          );
        })}

        {/* Axis spokes */}
        {axisLines.map((line, i) => (
          <Line
            key={`axis-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={COLORS.border}
            strokeWidth={0.6}
          />
        ))}

        {/* Segment comparison (smooth) */}
        {hasSegment && segmentPath && (
          <Path
            d={segmentPath}
            fill="rgba(148, 163, 184, 0.12)"
            stroke={COLORS.textMuted}
            strokeWidth={1.5}
            strokeDasharray="6,4"
          />
        )}

        {/* User data (smooth) */}
        <Path
          d={userPath}
          fill="rgba(99, 102, 241, 0.18)"
          stroke={COLORS.primary}
          strokeWidth={2.5}
        />

        {/* User data points */}
        {userPoints.map((p, i) => (
          <Circle
            key={`point-${i}`}
            cx={p.x}
            cy={p.y}
            r={4.5}
            fill={COLORS.primary}
            stroke={COLORS.background}
            strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {labels.map((l, i) => (
          <SvgText
            key={`label-${i}`}
            x={l.x}
            y={l.y}
            textAnchor={l.textAnchor}
            alignmentBaseline="middle"
            fontSize={10}
            fontWeight="500"
            fontFamily="System"
            fill={COLORS.textPrimary}
          >
            {l.label}
          </SvgText>
        ))}

        {/* Level numbers */}
        {[1, 3, 5].map((level) => {
          const p = getPoint(0, level);
          return (
            <SvgText
              key={`level-${level}`}
              x={p.x + 8}
              y={p.y}
              fontSize={9}
              fontFamily="System"
              fill={COLORS.textMuted}
              textAnchor="start"
              alignmentBaseline="middle"
            >
              {level}
            </SvgText>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Tu resultado</Text>
        </View>
        {hasSegment && segmentLabel && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotSegment]} />
            <Text style={styles.legendText}>{segmentLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  legend: {
    flexDirection: "row",
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotSegment: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
});
