/**
 * Defence-in-depth: the AI can be fooled (e.g. a message crafted to say
 * "this is safe"), so the on-device rule engine always runs too and the
 * final result can only be made MORE cautious, never less.
 */
import type { Verdict } from '@/theme';
import type { ScanResult } from './types';

const RANK: Record<Verdict, number> = { safe: 0, suspicious: 1, scam: 2 };

export function combine(ai: ScanResult, local: ScanResult): ScanResult {
  const upgraded = RANK[local.verdict] > RANK[ai.verdict];
  const risk = Math.max(ai.risk, local.risk);
  const verdict: Verdict = upgraded ? local.verdict : ai.verdict;

  // Add rule-engine flags the AI didn't report (matched on evidence text).
  const seen = new Set(ai.red_flags.map((f) => f.evidence.toLowerCase()));
  const extra = local.red_flags.filter((f) => !seen.has(f.evidence.toLowerCase()));
  const red_flags = [...ai.red_flags, ...(upgraded || risk > ai.risk ? extra : [])].slice(0, 7);

  if (!upgraded) return { ...ai, risk, red_flags };

  return {
    ...ai,
    verdict,
    risk,
    title: local.title,
    category: local.category,
    summary: `On-device checks found warning signs the AI missed. ${ai.summary}`,
    red_flags,
    safe_signals: [],
    actions: local.actions,
  };
}
