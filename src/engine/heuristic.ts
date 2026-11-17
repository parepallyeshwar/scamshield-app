/**
 * On-device rule engine. Runs instantly, offline, and is the fallback
 * whenever the AI service is unreachable or rate-limited.
 */
import type { ScanResult } from './types';

const RULES: { re: RegExp; f: string; w: number }[] = [
  { re: /\b(block(ed)?|suspend(ed)?|deactivat\w*|disconnect\w*|expire[sd]?|terminat\w*)\b/i, f: 'Threat of account block / service cut', w: 22 },
  { re: /\b(immediately|urgent(ly)?|today|tonight|within \d+ ?(hours?|hrs?|minutes?|mins?)|last (chance|warning)|act now)\b/i, f: 'Artificial urgency or deadline', w: 16 },
  { re: /\b(kyc|pan( card)?|aadhaa?r|update your (details|account)|re-?verify|verification)\b/i, f: 'Asks to update KYC / identity details', w: 20 },
  { re: /\b(share|send|tell)\b.{0,25}\b(otp|pin|cvv|password)\b/i, f: 'Asks you to share OTP, PIN or password', w: 35 },
  { re: /\b(lottery|lucky draw|you (have )?won|prize|reward points? (expir|redeem)|cashback of)\b/i, f: 'Prize / lottery bait', w: 25 },
  { re: /\b(work from home|part[- ]time|earn ₹?\s?\d|daily income|like (youtube )?videos|task(s)? (based|job)|no experience)\b/i, f: 'Too-good-to-be-true job or earning offer', w: 28 },
  { re: /\b(pay|fee|charge|deposit|transfer)\b.{0,30}(₹|rs\.?|inr)\s?\d+/i, f: 'Requests a small payment to unlock something', w: 18 },
  { re: /(₹|rs\.?|inr)\s?\d+.{0,30}\b(fee|charge|deposit)\b/i, f: 'Requests a small payment to unlock something', w: 18 },
  { re: /\b(contact|call|whatsapp)\b.{0,40}(\+?91[\s-]?)?[6-9]\d{9}\b/i, f: 'Pushes you to call / WhatsApp a personal mobile number', w: 18 },
  { re: /wa\.me\/|t\.me\//i, f: 'Moves conversation to WhatsApp / Telegram', w: 14 },
  { re: /\.apk\b|install (this|the) app|anydesk|teamviewer|quick ?support/i, f: 'Asks to install an app or remote-access tool', w: 35 },
  { re: /\b(customs|parcel|courier|shipment)\b.{0,60}\b(held|hold|pending|returned|fee)\b/i, f: 'Fake parcel / customs hold story', w: 20 },
  { re: /\b(police|cbi|cyber cell|narcotics|arrest|fedex|digital arrest)\b/i, f: 'Impersonates police / authorities', w: 30 },
  { re: /\b(dear (customer|consumer|user|sir\/madam))\b/i, f: 'Generic greeting instead of your name', w: 6 },
];

const SHORT = /(bit\.ly|tinyurl\.com|cutt\.ly|is\.gd|t\.ly|rb\.gy|shorturl\.at|goo\.gl|ow\.ly|tiny\.cc)/i;
const BAD_TLD = /\.(xyz|top|click|buzz|icu|live|shop|info|online|site|rest|cfd|sbs|lol|vip|win)(\/|$|\?)/i;
const BRANDS: Record<string, string[]> = {
  sbi: ['sbi.co.in', 'onlinesbi.sbi', 'sbi.bank.in'],
  hdfc: ['hdfcbank.com'],
  icici: ['icicibank.com'],
  axis: ['axisbank.com'],
  paytm: ['paytm.com'],
  amazon: ['amazon.in', 'amazon.com'],
  flipkart: ['flipkart.com'],
  indiapost: ['indiapost.gov.in'],
};
const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+\.(?:com|in|xyz|top|ly|gl|at|gd|cc|info|live|shop|online|site|me)\/[^\s]*)/gi;

export function analyzeLocally(text: string): ScanResult {
  const flags: ScanResult['red_flags'] = [];
  const seen = new Set<string>();
  let risk = 0;
  const add = (f: string, ev: string, w: number) => {
    if (seen.has(f)) return;
    seen.add(f);
    flags.push({ flag: f, evidence: ev });
    risk += w;
  };

  for (const r of RULES) {
    const m = text.match(r.re);
    if (m) add(r.f, `“${m[0].trim()}”`, r.w);
  }

  const urls = text.match(URL_RE) ?? [];
  for (const u of urls) {
    const host = u.replace(/^https?:\/\//i, '').split(/[/?#]/)[0].toLowerCase();
    if (/^http:\/\//i.test(u)) add('Link is not secure (http, no https)', u, 10);
    if (SHORT.test(host)) add('Shortened link hides the real destination', u, 22);
    if (BAD_TLD.test(host + '/')) add('Link uses a low-trust domain ending', host, 22);
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) add('Link points to a raw IP address', host, 25);
    for (const [b, ok] of Object.entries(BRANDS)) {
      if (host.replace(/[^a-z]/g, '').includes(b) && !ok.some((d) => host === d || host.endsWith('.' + d))) {
        add(`Lookalike domain impersonating ${b.toUpperCase()}`, host, 30);
      }
    }
  }

  const good: ScanResult['safe_signals'] = [];
  if (/\b(do not|don't|never) share\b/i.test(text)) good.push({ signal: 'Warns you not to share the code', detail: 'Genuine OTP messages from companies say this.' });
  if (!urls.length) good.push({ signal: 'No links to click', detail: 'Most phishing relies on a link.' });

  risk = Math.min(98, risk);
  const verdict = risk >= 55 ? 'scam' : risk >= 25 ? 'suspicious' : 'safe';
  const title = { scam: 'High-risk scam detected', suspicious: 'Looks suspicious — be careful', safe: 'No red flags found' }[verdict];
  const category = seen.has('Too-good-to-be-true job or earning offer')
    ? 'Job / task fraud'
    : [...seen].some((f) => /Lookalike|KYC/.test(f))
      ? 'Banking / KYC phishing'
      : seen.has('Fake parcel / customs hold story')
        ? 'Delivery-fee phishing'
        : seen.has('Threat of account block / service cut')
          ? 'Utility / account-block scam'
          : verdict === 'safe'
            ? 'Informational message'
            : 'Social engineering';

  const actions =
    verdict === 'safe'
      ? [
          { a: 'Still verify if unsure', d: 'Check via the official app, website or the number on your card / bill — not one from the message.' },
          { a: 'Never share OTP, PIN or passwords', d: 'No genuine company will ask for them, even if the message looks real.' },
        ]
      : [
          { a: "Don't click links or call numbers in it", d: 'Use the official app or the number printed on your card / bill.' },
          { a: 'Never share OTP, PIN or install apps on request', d: 'Banks and utilities never ask for these over SMS or WhatsApp.' },
          { a: 'Report & block', d: 'Report at cybercrime.gov.in or call 1930. Report spam via Sanchar Saathi (Chakshu).' },
        ];

  const summary =
    verdict === 'safe'
      ? 'No common scam patterns were found. That is not a guarantee — if anything feels off, verify through the official app or helpline.'
      : `This message shows ${flags.length} classic fraud pattern${flags.length > 1 ? 's' : ''}. Scammers combine fear or greed with urgency so you act before thinking.`;

  return { verdict, risk, title, category, summary, red_flags: flags, safe_signals: good, actions };
}
