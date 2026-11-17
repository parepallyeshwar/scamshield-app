import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AboutView } from '@/screens/AboutView';
import { HistoryView } from '@/screens/HistoryView';
import { ScanView } from '@/screens/ScanView';
import { Background, T } from '@/components/ui';
import { C, F } from '@/theme';

type Tab = 'scan' | 'history' | 'about';

const ICONS: Record<Tab, (c: string) => React.ReactNode> = {
  scan: (c) => <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" />,
  history: (c) => <Path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" />,
  about: (c) => (
    <>
      <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={2} fill="none" />
      <Path d="M12 16v-4M12 8h.01" stroke={c} strokeWidth={2} strokeLinecap="round" />
    </>
  ),
};

export default function Home() {
  const [tab, setTab] = useState<Tab>('scan');
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {tab === 'scan' && <ScanView />}
        {tab === 'history' && <HistoryView />}
        {tab === 'about' && <AboutView />}
      </View>

      <View style={[st.nav, { bottom: insets.bottom + 12 }]}>
        {(['scan', 'history', 'about'] as Tab[]).map((t) => {
          const on = t === tab;
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={[st.navBtn, on && st.navOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                {ICONS[t](on ? '#fff' : C.mut)}
              </Svg>
              <T style={{ fontSize: 11, fontFamily: F.semi, color: on ? '#fff' : C.mut, textTransform: 'capitalize' }}>{t}</T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  nav: {
    position: 'absolute', left: 16, right: 16, flexDirection: 'row', padding: 8, borderRadius: 22,
    backgroundColor: 'rgba(12,14,30,0.92)', borderWidth: 1, borderColor: C.line,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  navBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6, borderRadius: 14 },
  navOn: { backgroundColor: 'rgba(124,58,237,0.22)' },
});
