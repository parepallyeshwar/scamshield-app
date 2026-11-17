import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Orb } from '@/components/Orb';
import { CTA, Glass, GradientText, Label, T } from '@/components/ui';
import { aiConfigured, AiError, analyzeWithAI } from '@/engine/ai';
import { combine } from '@/engine/combine';
import { analyzeLocally } from '@/engine/heuristic';
import { saveRecord } from '@/engine/history';
import type { Lang, ScanRecord, ScanResult } from '@/engine/types';
import { SAMPLES } from '@/samples';
import { C, F } from '@/theme';

const STEPS = ['Extracting text & links', 'Checking domains & URL patterns', 'Matching known fraud playbooks', 'AI reasoning on intent & tone', 'Building your verdict'];
const LANGS: { k: Lang; l: string }[] = [
  { k: 'en', l: 'EN' },
  { k: 'te', l: 'తెలుగు' },
  { k: 'hi', l: 'हिंदी' },
];

type Img = { uri: string; base64: string; mime: string };

export function ScanView() {
  const [text, setText] = useState('');
  const [lang, setLang] = useState<Lang>('en');
  const [img, setImg] = useState<Img | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [hint, setHint] = useState('');
  const ai = aiConfigured();
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (tick.current) clearInterval(tick.current); }, []);

  async function pickImage() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.6 });
    if (r.canceled || !r.assets?.[0]?.base64) return;
    const a = r.assets[0];
    setImg({ uri: a.uri, base64: a.base64!, mime: a.mimeType ?? 'image/jpeg' });
    setHint('');
  }

  async function scan() {
    const t = text.trim();
    if (!t && !img) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setHint('Paste a message or attach a screenshot first.');
      return;
    }
    if (!t && img && !ai) {
      setHint('Screenshot reading needs the AI service — paste the text instead.');
      return;
    }
    setHint('');
    setBusy(true);
    setStep(0);
    tick.current = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 650);
    const minWait = new Promise((r) => setTimeout(r, 2600));

    let res: ScanResult | null = null;
    let engine: 'ai' | 'local' = 'local';
    if (ai) {
      try {
        const aiRes = await analyzeWithAI({ text: t, imageBase64: img?.base64, imageMime: img?.mime, lang });
        res = t ? combine(aiRes, analyzeLocally(t)) : aiRes;
        engine = 'ai';
      } catch (e) {
        if (e instanceof AiError && e.code === 'rate_limited') setHint('AI is busy — used the on-device engine.');
      }
    }
    if (!res) {
      if (!t) {
        stop();
        setHint("Couldn't read the screenshot right now — paste the text instead.");
        return;
      }
      res = analyzeLocally(t);
    }
    await minWait;
    stop();

    const rec: ScanRecord = { ...res, id: `${Date.now()}`, time: Date.now(), input: t || '(screenshot)', engine, lang };
    await saveRecord(rec);
    Haptics.notificationAsync(
      res.verdict === 'safe' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});
    router.push({ pathname: '/result', params: { id: rec.id } });
  }

  function stop() {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    setBusy(false);
  }

  if (busy) {
    return (
      <Animated.View entering={FadeIn} style={{ flex: 1, paddingHorizontal: 18, paddingTop: 40 }}>
        <Orb mood="thinking" />
        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <GradientText>Analyzing…</GradientText>
          <T style={{ color: C.mut, marginTop: 6, fontSize: 14 }}>{ai ? 'AI threat analysis in progress' : 'Running on-device threat checks'}</T>
        </View>
        <Glass style={{ marginTop: 22, padding: 16 }}>
          {STEPS.map((sTxt, i) => {
            const done = i < step;
            const on = i === step;
            return (
              <View key={sTxt} style={st.step}>
                <View style={[st.dot, done && { borderColor: C.grn, backgroundColor: 'rgba(52,211,153,0.15)' }, on && { borderColor: C.cy }]}>
                  {done && <T style={{ color: C.grn, fontSize: 11 }}>✓</T>}
                </View>
                <T style={{ color: done || on ? C.txt : C.dim, fontSize: 14 }}>{sTxt}</T>
              </View>
            );
          })}
        </Glass>
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
        <View style={st.header}>
          <T style={{ fontFamily: F.bold, fontSize: 18 }}>
            Scam<T style={{ fontFamily: F.bold, fontSize: 18, color: C.pk }}>Shield</T>
          </T>
          <View style={st.engine}>
            <View style={[st.engineDot, { backgroundColor: ai ? C.grn : C.amb }]} />
            <T style={{ fontFamily: F.mono, fontSize: 10.5, color: C.mut }}>{ai ? 'AI ONLINE' : 'LOCAL ENGINE'}</T>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={{ marginTop: 10 }}>
            <Orb />
          </View>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <T style={{ fontFamily: F.bold, fontSize: 25 }}>Is this message</T>
            <GradientText size={25}>a scam?</GradientText>
            <T style={st.sub}>Paste an SMS, WhatsApp forward, email or link — or attach a screenshot. AI checks it in seconds.</T>
          </View>
        </Animated.View>

        <Glass style={{ padding: 12 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Paste the suspicious message here…"
            placeholderTextColor={C.dim}
            multiline
            style={st.input}
            textAlignVertical="top"
          />
          {img && (
            <View style={st.thumb}>
              <Image source={{ uri: img.uri }} style={{ width: 44, height: 44, borderRadius: 8 }} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: F.semi, fontSize: 13 }}>Screenshot attached</T>
                <T style={{ color: C.mut, fontSize: 12 }}>{ai ? 'AI will read the screenshot' : 'Needs AI service — add the text too'}</T>
              </View>
              <Pressable onPress={() => setImg(null)} hitSlop={10}>
                <T style={{ fontSize: 20, color: C.mut }}>×</T>
              </Pressable>
            </View>
          )}
          <View style={st.tools}>
            <Pressable onPress={pickImage} style={st.iconBtn} accessibilityLabel="Attach screenshot">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.txt} strokeWidth={2} strokeLinecap="round">
                <Rect x={3} y={3} width={18} height={18} rx={3} />
                <Circle cx={9} cy={9} r={2} />
                <Path d="m21 15-5-5L5 21" />
              </Svg>
            </Pressable>
            <Pressable onPress={() => { setText(''); setImg(null); }} style={st.iconBtn} accessibilityLabel="Clear">
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={C.txt} strokeWidth={2} strokeLinecap="round">
                <Path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
              </Svg>
            </Pressable>
            <View style={st.langs}>
              {LANGS.map((l) => (
                <Pressable key={l.k} onPress={() => setLang(l.k)} style={[st.langBtn, lang === l.k && st.langOn]}>
                  <T style={{ fontSize: 12, fontFamily: F.semi, color: lang === l.k ? '#fff' : C.mut }}>{l.l}</T>
                </Pressable>
              ))}
            </View>
          </View>
        </Glass>

        {!!hint && <T style={{ color: C.amb, fontSize: 13, marginTop: 10, textAlign: 'center' }}>{hint}</T>}

        <CTA title="Scan with AI" onPress={scan} style={{ marginTop: 14 }} />

        <Label>Try a real-world example</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {SAMPLES.map((x) => (
            <Pressable key={x.k} onPress={() => setText(x.t)} style={st.chip}>
              <T style={{ fontSize: 13, fontFamily: F.med }}>{x.k}</T>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  engine: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel },
  engineDot: { width: 7, height: 7, borderRadius: 4 },
  sub: { color: C.mut, textAlign: 'center', fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 18, maxWidth: 320 },
  input: { minHeight: 118, color: C.txt, fontFamily: F.reg, fontSize: 15, lineHeight: 22 },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10, marginTop: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center' },
  langs: { marginLeft: 'auto', flexDirection: 'row', gap: 4, backgroundColor: 'rgba(0,0,0,0.25)', padding: 3, borderRadius: 11, borderWidth: 1, borderColor: C.line },
  langBtn: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8 },
  langOn: { backgroundColor: 'rgba(124,58,237,0.35)' },
  thumb: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, padding: 8, borderRadius: 12, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.line },
  chip: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#39406a', alignItems: 'center', justifyContent: 'center' },
});
