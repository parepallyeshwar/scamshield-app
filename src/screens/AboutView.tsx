import { Linking, Pressable, ScrollView, View } from 'react-native';

import { Orb } from '@/components/Orb';
import { Glass, GradientText, T } from '@/components/ui';
import { C, F } from '@/theme';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? '';

const FLOW = [
  'Input — text or screenshot',
  'On-device rule engine — URLs, lookalike domains, urgency, OTP/KYC patterns',
  'LLM reasoning via a secure serverless proxy (keys never in the app)',
  'Explainable verdict — risk score, evidence, next steps',
];
const TAGS = ['React Native', 'Expo SDK 58', 'Reanimated', 'Cloudflare Workers', 'Gemini API', 'OWASP MASVS'];

export function AboutView() {
  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 130 }}>
      <View style={{ marginTop: 6 }}>
        <Orb size={96} />
      </View>
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <GradientText>How ScamShield works</GradientText>
        <T style={{ color: C.mut, textAlign: 'center', fontSize: 14, marginTop: 8, marginBottom: 6 }}>
          Privacy-first AI that explains why a message is dangerous — in your language.
        </T>
      </View>

      <Glass style={{ padding: 16, marginTop: 12 }}>
        <T style={{ fontFamily: F.semi, marginBottom: 10 }}>🧠 Architecture</T>
        {FLOW.map((f, i) => (
          <View key={f}>
            <View style={{ flexDirection: 'row', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel2 }}>
              <T style={{ fontFamily: F.mono, fontSize: 10.5, color: C.cy }}>{String(i + 1).padStart(2, '0')}</T>
              <T style={{ fontSize: 13, flex: 1 }}>{f}</T>
            </View>
            {i < FLOW.length - 1 && <T style={{ textAlign: 'center', color: '#4b5280', fontSize: 12, marginVertical: 3 }}>↓</T>}
          </View>
        ))}
      </Glass>

      <Glass style={{ padding: 16, marginTop: 12 }}>
        <T style={{ fontFamily: F.semi, marginBottom: 6 }}>🔒 Privacy by design</T>
        <T style={{ color: '#c9cdea', fontSize: 14, lineHeight: 21 }}>
          No accounts. We don&apos;t store your messages. History lives only on your phone. API keys never ship inside the app.
        </T>
        {!!PRIVACY_URL && (
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <T style={{ color: C.cy, marginTop: 8, fontSize: 13 }}>Read the privacy policy →</T>
          </Pressable>
        )}
      </Glass>

      <Glass style={{ padding: 16, marginTop: 12 }}>
        <T style={{ fontFamily: F.semi, marginBottom: 8 }}>⚙️ Built with</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {TAGS.map((t) => (
            <View key={t} style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(167,139,250,0.1)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)' }}>
              <T style={{ fontFamily: F.mono, fontSize: 11.5, color: '#c4b5fd' }}>{t}</T>
            </View>
          ))}
        </View>
      </Glass>

      <T style={{ color: C.dim, fontSize: 11.5, textAlign: 'center', marginTop: 16, lineHeight: 17 }}>
        Built by <T style={{ color: C.txt, fontSize: 11.5 }}>Eshwar Parepally</T>
        {'\n'}ScamShield gives guidance, not guarantees. When in doubt, call your bank on its official number, or report at cybercrime.gov.in / 1930.
      </T>
    </ScrollView>
  );
}
