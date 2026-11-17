/**
 * Cloud AI client. Talks ONLY to our own proxy (see /worker) — the model
 * API key never ships inside the app binary.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang, ScanResult } from './types';

const API_URL = process.env.EXPO_PUBLIC_SCAN_API_URL ?? '';
const DEVICE_KEY = 'scamshield.deviceId';

export const aiConfigured = () => API_URL.startsWith('https://');

async function deviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_KEY).catch(() => null);
  if (!id) {
    id = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    await AsyncStorage.setItem(DEVICE_KEY, id).catch(() => {});
  }
  return id;
}

export class AiError extends Error {
  constructor(public code: 'not_configured' | 'rate_limited' | 'network' | 'bad_response', msg?: string) {
    super(msg ?? code);
  }
}

export async function analyzeWithAI(
  input: { text: string; imageBase64?: string; imageMime?: string; lang: Lang },
  timeoutMs = 25000,
): Promise<ScanResult> {
  if (!aiConfigured()) throw new AiError('not_configured');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/v1/scan`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-device-id': await deviceId() },
      body: JSON.stringify({
        text: input.text.slice(0, 4000),
        lang: input.lang,
        image: input.imageBase64 ? { data: input.imageBase64, mime: input.imageMime ?? 'image/jpeg' } : undefined,
      }),
      signal: ctrl.signal,
    });
    if (res.status === 429) throw new AiError('rate_limited');
    if (!res.ok) throw new AiError('network', `HTTP ${res.status}`);
    const r = (await res.json()) as ScanResult;
    if (!r || !['scam', 'suspicious', 'safe'].includes(r.verdict)) throw new AiError('bad_response');
    return {
      ...r,
      risk: Math.max(0, Math.min(100, Math.round(Number(r.risk) || 0))),
      red_flags: r.red_flags ?? [],
      safe_signals: r.safe_signals ?? [],
      actions: r.actions ?? [],
    };
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw new AiError('network', String(e));
  } finally {
    clearTimeout(t);
  }
}
