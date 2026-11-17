import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gauge } from '@/components/Gauge';
import { Background, CTA, Glass, GhostButton, Label, T } from '@/components/ui';
import { getRecord } from '@/engine/history';
import { C, F, VERDICT } from '@/theme';

export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = getRecord(String(id));
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  if (!r) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Background />
        <T>Result not found.</T>
        <GhostButton title="Back" onPress={() => router.back()} style={{ marginTop: 16, paddingHorizontal: 40 }} />
      </View>
    );
  }

  const v = VERDICT[r.verdict] ?? VERDICT.suspicious;

  async function copy() {
    const txt = `🛡️ ScamShield check: ${v.label} (risk ${r!.risk}/100)\n${r!.title}\n\n${r!.summary}\n\n${r!.red_flags
      .map((f) => '• ' + f.flag)
      .join('\n')}\n\nNever share OTPs. Report fraud: 1930 / cybercrime.gov.in`;
    await Clipboard.setStringAsync(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const Item = ({ kind, i, title, sub, mono }: { kind: 'bad' | 'good' | 'act'; i: number; title: string; sub: string; mono?: boolean }) => {
    const col = kind === 'bad' ? C.red : kind === 'good' ? C.grn : C.cy;
    const icon = kind === 'bad' ? '!' : kind === 'good' ? '✓' : '→';
    return (
      <Animated.View entering={FadeInDown.delay(150 + i * 80)} style={st.item}>
        <View style={[st.ic, { backgroundColor: col + '24' }]}>
          <T style={{ color: col, fontFamily: F.bold }}>{icon}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: F.semi, fontSize: 14 }}>{title}</T>
          <T style={{ color: mono ? '#c4b5fd' : C.mut, fontSize: mono ? 11.5 : 12.5, fontFamily: mono ? F.mono : F.reg, marginTop: 3, lineHeight: 18 }}>{sub}</T>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
        <Animated.View entering={FadeInDown.duration(450)}>
          <Glass style={st.verdict}>
            <Gauge value={r.risk} c1={v.c1} c2={v.c2} />
            <View style={{ flex: 1 }}>
              <View style={[st.pill, { borderColor: v.c1 + '66', backgroundColor: v.c1 + '22' }]}>
                <T style={{ color: v.c1, fontFamily: F.monoBold, fontSize: 11, letterSpacing: 1 }}>{v.label}</T>
              </View>
              <T style={{ fontFamily: F.bold, fontSize: 19, marginTop: 8, lineHeight: 24 }}>{r.title}</T>
              <T style={{ color: C.mut, fontSize: 12.5, marginTop: 4 }}>{r.category}</T>
            </View>
          </Glass>
          <Glass style={{ padding: 16, marginTop: 12 }}>
            <T style={{ lineHeight: 22, fontSize: 14.5 }}>{r.summary}</T>
          </Glass>
          <View style={st.note}>
            <T style={{ color: C.amb, fontSize: 12.5, lineHeight: 18 }}>
              {r.verdict === 'safe'
                ? 'ℹ️ No red flags doesn’t mean guaranteed safe. Never share OTP/PIN, and verify through official channels if anything feels off.'
                : 'ℹ️ Don’t reply, click or call back. Verify only through the official app, website or helpline.'}
            </T>
          </View>
        </Animated.View>

        {r.red_flags.length > 0 && (
          <>
            <Label>Red flags detected</Label>
            <Glass style={st.list}>
              {r.red_flags.map((f, i) => <Item key={i} i={i} kind="bad" title={f.flag} sub={f.evidence} mono />)}
            </Glass>
          </>
        )}
        {r.safe_signals.length > 0 && (
          <>
            <Label>Reassuring signals</Label>
            <Glass style={st.list}>
              {r.safe_signals.map((g, i) => <Item key={i} i={i} kind="good" title={g.signal} sub={g.detail} />)}
            </Glass>
          </>
        )}
        <Label>What you should do</Label>
        <Glass style={st.list}>
          {r.actions.map((a, i) => <Item key={i} i={i} kind="act" title={a.a} sub={a.d} />)}
        </Glass>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <GhostButton title={copied ? 'Copied ✓' : 'Copy warning'} onPress={copy} style={{ flex: 1 }} />
          <CTA title="Scan another" onPress={() => router.back()} style={{ flex: 1 }} />
        </View>
        <T style={st.foot}>
          {r.engine === 'ai' ? 'Analysed by AI' : 'Analysed by the on-device rule engine'} · guidance, not a guarantee.{'\n'}Report fraud: 1930 / cybercrime.gov.in
        </T>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  verdict: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  list: { paddingHorizontal: 14, paddingVertical: 4 },
  item: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  ic: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.07)' },
  foot: { color: C.dim, fontSize: 11.5, textAlign: 'center', marginTop: 16, lineHeight: 17 },
});
