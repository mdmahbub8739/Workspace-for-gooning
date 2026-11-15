import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/use-theme';

const CLOUD = 'M340 700 H700 A120 120 0 0 0 730 462 A170 170 0 0 0 420 410 A150 150 0 0 0 340 700 Z';

/**
 * Material You expressive organic tonal canvas backdrop.
 * Uses subtle layered tonal circles derived from the active dynamic seed palette.
 */
export function BrandGradient({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.primaryContainer, overflow: 'hidden' }, style]}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice">
        <Circle cx="330" cy="40" r="160" fill={colors.tertiaryContainer} opacity={0.65} />
        <Circle cx="65" cy="250" r="145" fill={colors.secondaryContainer} opacity={0.85} />
        <Circle cx="215" cy="175" r="110" fill={colors.primary} opacity={0.14} />
      </Svg>
    </View>
  );
}

interface BrandMarkProps {
  size?: number;
  bare?: boolean;
}

export function BrandMark({ size = 64, bare }: BrandMarkProps) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox={bare ? '172 205 680 540' : '0 0 1024 1024'}>
      <Defs>
        <LinearGradient id="markTile" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.primaryLight} />
          <Stop offset="1" stopColor={colors.primary} />
        </LinearGradient>
        <LinearGradient id="markSwitch" x1="0" y1="0" x2="1" y2="0.6">
          <Stop offset="0" stopColor={colors.primaryLight} />
          <Stop offset="1" stopColor={colors.primary} />
        </LinearGradient>
      </Defs>
      {!bare && <Rect width="1024" height="1024" rx="280" fill="url(#markTile)" />}
      <G transform="translate(512 512) scale(1.06) translate(-532 -505)">
        <Path d={CLOUD} fill="#FFFFFF" />
      </G>
      <Rect x="372" y="508" width="270" height="130" rx="65" fill="url(#markSwitch)" />
      <Circle cx="577" cy="573" r="47" fill="#FFFFFF" />
    </Svg>
  );
}
