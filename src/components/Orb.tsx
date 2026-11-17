import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

import { C } from '@/theme';

export type OrbMood = 'idle' | 'thinking' | 'scam' | 'suspicious' | 'safe';

const PALETTE: Record<OrbMood, [string, string, string, string]> = {
  idle: ['#a5f3fc', C.cy, '#7c3aed', '#1e1b4b'],
  thinking: ['#a5f3fc', C.cy, '#7c3aed', '#1e1b4b'],
  scam: ['#fecdd3', C.red, '#9f1239', '#2a0612'],
  suspicious: ['#fef3c7', C.amb, '#b45309', '#2a1704'],
  safe: ['#d1fae5', C.grn, '#047857', '#04231a'],
};

export function Orb({ size = 150, mood = 'idle' }: { size?: number; mood?: OrbMood }) {
  const spin = useSharedValue(0);
  const breathe = useSharedValue(1);
  const fast = mood === 'thinking';

  useEffect(() => {
    spin.value = 0;
    spin.value = withRepeat(withTiming(360, { duration: fast ? 1100 : 7000, easing: Easing.linear }), -1);
    breathe.value = withRepeat(withTiming(1.06, { duration: fast ? 500 : 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => {
      cancelAnimation(spin);
      cancelAnimation(breathe);
    };
  }, [fast, spin, breathe]);

  const ringA = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const ringB = useAnimatedStyle(() => ({ transform: [{ rotate: `${-spin.value * 1.4}deg` }] }));
  const core = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  const [p0, p1, p2, p3] = PALETTE[mood];
  const r = size / 2;

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      {/* halo */}
      <Animated.View style={[{ position: 'absolute', left: -size * 0.3, top: -size * 0.3 }, core]}>
        <Svg width={size * 1.6} height={size * 1.6}>
          <Defs>
            <RadialGradient id="halo">
              <Stop offset="0" stopColor={p1} stopOpacity="0.35" />
              <Stop offset="1" stopColor={p1} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={size * 0.8} cy={size * 0.8} r={size * 0.8} fill="url(#halo)" />
        </Svg>
      </Animated.View>

      {/* outer ring */}
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, ringA]}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="ra" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={C.cy} />
              <Stop offset="0.5" stopColor={C.vi} />
              <Stop offset="1" stopColor={C.pk} />
            </LinearGradient>
          </Defs>
          <Circle cx={r} cy={r} r={r - 2} stroke="url(#ra)" strokeWidth={2.5} fill="none" strokeDasharray={`${r * 1.2} ${r * 0.6}`} strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* inner ring */}
      <Animated.View style={[{ position: 'absolute', width: size, height: size, opacity: 0.7 }, ringB]}>
        <Svg width={size} height={size}>
          <Circle cx={r} cy={r} r={r * 0.82} stroke={C.vi} strokeWidth={2} fill="none" strokeDasharray={`${r * 0.9} ${r * 0.9}`} strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* core sphere */}
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, core]}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="core" cx="35%" cy="30%" r="75%">
              <Stop offset="0" stopColor="#ffffff" />
              <Stop offset="0.08" stopColor={p0} />
              <Stop offset="0.35" stopColor={p1} />
              <Stop offset="0.75" stopColor={p2} />
              <Stop offset="1" stopColor={p3} />
            </RadialGradient>
          </Defs>
          <Circle cx={r} cy={r} r={r * 0.6} fill="url(#core)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
