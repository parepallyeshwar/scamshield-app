import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { GhostButton, Glass, GradientText, T } from '@/components/ui';
import { clearHistory, loadHistory } from '@/engine/history';
import type { ScanRecord } from '@/engine/types';
import { C, F, VERDICT } from '@/theme';

export function HistoryView() {
  const [list, setList] = useState<ScanRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setList);
    }, []),
  );

  return (
    <FlatList
      data={list}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 18, paddingBottom: 130 }}
      ListHeaderComponent={
        <View style={{ marginTop: 14, marginBottom: 16 }}>
          <GradientText>Scan history</GradientText>
          <T style={{ color: C.mut, fontSize: 14, marginTop: 4 }}>Stored only on this device.</T>
        </View>
      }
      ListEmptyComponent={
        <Glass style={{ padding: 40, alignItems: 'center' }}>
          <T style={{ color: C.mut, textAlign: 'center' }}>No scans yet.{'\n'}Your checks will appear here.</T>
        </Glass>
      }
      ListFooterComponent={
        list.length ? <GhostButton title="Clear history" onPress={async () => { await clearHistory(); setList([]); }} style={{ marginTop: 8 }} /> : undefined
      }
      renderItem={({ item: r }) => {
        const v = VERDICT[r.verdict] ?? VERDICT.suspicious;
        const d = new Date(r.time);
        return (
          <Pressable onPress={() => router.push({ pathname: '/result', params: { id: r.id } })}>
            <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, marginBottom: 10 }}>
              <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, backgroundColor: v.c1 }} />
              <View style={{ flex: 1 }}>
                <T numberOfLines={1} style={{ fontSize: 13.5 }}>{r.input}</T>
                <T style={{ color: C.mut, fontSize: 11.5, fontFamily: F.mono, marginTop: 3 }}>
                  {v.label} · {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </T>
              </View>
              <T style={{ fontFamily: F.bold, fontSize: 18, color: v.c1 }}>{r.risk}</T>
            </Glass>
          </Pressable>
        );
      }}
    />
  );
}
