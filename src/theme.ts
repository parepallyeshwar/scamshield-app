export const C = {
  bg: '#04050d',
  panel: 'rgba(255,255,255,0.045)',
  panel2: 'rgba(255,255,255,0.07)',
  line: 'rgba(255,255,255,0.10)',
  txt: '#e9ecff',
  mut: '#8a92b8',
  dim: '#5f6790',
  cy: '#22d3ee',
  vi: '#a78bfa',
  pk: '#f472b6',
  red: '#ff4d6d',
  amb: '#fbbf24',
  grn: '#34d399',
};

export const F = {
  reg: 'SpaceGrotesk_400Regular',
  med: 'SpaceGrotesk_500Medium',
  semi: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_600SemiBold',
};

export type Verdict = 'scam' | 'suspicious' | 'safe';

export const VERDICT: Record<Verdict, { label: string; c1: string; c2: string }> = {
  scam: { label: '⛔ SCAM', c1: C.red, c2: C.pk },
  suspicious: { label: '⚠️ SUSPICIOUS', c1: C.amb, c2: '#fb923c' },
  safe: { label: '✅ NO RED FLAGS', c1: C.grn, c2: C.cy },
};

export const GRAD = [C.cy, C.vi, C.pk] as const;
