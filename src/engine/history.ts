import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScanRecord } from './types';

const KEY = 'scamshield.history.v1';
const MAX = 50;

// In-memory cache so the Result screen can read a record synchronously.
const cache = new Map<string, ScanRecord>();

export async function loadHistory(): Promise<ScanRecord[]> {
  try {
    const list = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]') as ScanRecord[];
    list.forEach((r) => cache.set(r.id, r));
    return list;
  } catch {
    return [];
  }
}

export async function saveRecord(r: ScanRecord) {
  cache.set(r.id, r);
  const list = await loadHistory();
  await AsyncStorage.setItem(KEY, JSON.stringify([r, ...list.filter((x) => x.id !== r.id)].slice(0, MAX))).catch(() => {});
}

export async function clearHistory() {
  cache.clear();
  await AsyncStorage.removeItem(KEY).catch(() => {});
}

export const getRecord = (id: string) => cache.get(id);
