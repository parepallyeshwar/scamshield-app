import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, TextProps, View, ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Line, RadialGradient, Rect, Stop } from 'react-native-svg';

import { C, F, GRAD } from '@/theme';

export function T({ style, ...p }: TextProps) {
  return <Text {...p} style={[{ color: C.txt, fontFamily: F.reg, fontSize: 15 }, style]} />;
}

export function Glass({ style, ...p }: ViewProps) {
  return <View {...p} style={[s.glass, style]} />;
}

export function Label({ children }: { children: string }) {
  return <T style={s.label}>{children.toUpperCase()}</T>;
}

export function GradientText({ children, size = 26 }: { children: string; size?: number }) {
  // Lightweight "gradient" headline: cyan → violet split across words.
  const words = children.split(' ');
  const cols = [C.cy, C.vi, C.pk];
  return (
    <T style={{ fontFamily: F.bold, fontSize: size }}>
      {words.map((w, i) => (
        <T key={i} style={{ fontFamily: F.bold, fontSize: size, color: cols[Math.min(i, 2)] }}>
          {w + (i < words.length - 1 ? ' ' : '')}
        </T>
      ))}
    </T>
  );
}

export function CTA({ title, onPress, icon, style }: { title: string; onPress: () => void; icon?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}>
        {icon}
        <T style={{ color: '#05060f', fontFamily: F.bold, fontSize: 16 }}>{title}</T>
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ title, onPress, style }: { title: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.ghost, { opacity: pressed ? 0.7 : 1 }, style]}>
      <T style={{ fontFamily: F.semi }}>{title}</T>
    </Pressable>
  );
}

/** Ambient sci-fi background: glowing blobs + fading grid. */
export function Background() {
  const lines = Array.from({ length: 30 }, (_, i) => i * 34);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="b1" cx="0%" cy="0%" r="70%">
            <Stop offset="0" stopColor="#7c3aed" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="b2" cx="100%" cy="100%" r="70%">
            <Stop offset="0" stopColor="#0891b2" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#0891b2" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="b3" cx="80%" cy="45%" r="35%">
            <Stop offset="0" stopColor="#db2777" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#db2777" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={C.bg} />
        {lines.map((y) => (
          <Line key={'h' + y} x1="0" y1={y} x2="100%" y2={y} stroke="#ffffff" strokeOpacity={Math.max(0, 0.04 - y / 26000)} />
        ))}
        {lines.slice(0, 14).map((x) => (
          <Line key={'v' + x} x1={x} y1="0" x2={x} y2="420" stroke="#ffffff" strokeOpacity="0.03" />
        ))}
        <Rect width="100%" height="100%" fill="url(#b1)" />
        <Rect width="100%" height="100%" fill="url(#b2)" />
        <Rect width="100%" height="100%" fill="url(#b3)" />
      </Svg>
    </View>
  );
}

export const s = StyleSheet.create({
  glass: { backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, borderRadius: 20 },
  label: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5, color: C.mut, marginTop: 22, marginBottom: 10, marginHorizontal: 4 },
  cta: { borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ghost: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', backgroundColor: C.panel, borderColor: C.line, borderWidth: 1 },
});
