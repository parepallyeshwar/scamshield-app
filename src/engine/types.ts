import type { Verdict } from '@/theme';

export type Lang = 'en' | 'te' | 'hi';

export interface ScanResult {
  verdict: Verdict;
  risk: number; // 0-100
  title: string;
  category: string;
  summary: string;
  red_flags: { flag: string; evidence: string }[];
  safe_signals: { signal: string; detail: string }[];
  actions: { a: string; d: string }[];
}

export interface ScanRecord extends ScanResult {
  id: string;
  time: number;
  input: string;
  engine: 'ai' | 'local';
  lang: Lang;
}
