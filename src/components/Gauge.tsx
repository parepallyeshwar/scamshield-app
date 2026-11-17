import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { C, F } from '@/theme';
import { T } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 52;
const CIRC = 2 * Math.PI * R;

export function Gauge({ value, c1, c2, size = 118 }: { value: number; c1: string; c2: string; size?: number }) {
  const p = useSharedValue(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    p.value = 0;
    p.value = withTiming(value / 100, { duration: 1200, easing: Easing.out(Easing.cubic) });
    let n = 0;
    const iv = setInterval(() => {
      n += Math.max(1, Math.ceil((value - n) / 8));
      if (n >= value) {
        n = value;
        clearInterval(iv);
      }
      setShown(n);
    }, 30);
    return () => clearInterval(iv);
  }, [value, p]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - p.value) }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c1} />
            <Stop offset="1" stopColor={c2} />
          </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r={R} stroke="rgba(255,255,255,0.07)" strokeWidth={9} fill="none" />
        <AnimatedCircle cx="60" cy="60" r={R} stroke="url(#g)" strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={CIRC} animatedProps={props} />
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <T style={{ fontFamily: F.bold, fontSize: 32, color: c1, lineHeight: 36 }}>{shown}</T>
        <T style={{ fontFamily: F.mono, fontSize: 10, color: C.mut, letterSpacing: 1 }}>RISK</T>
      </View>
    </View>
  );
}
