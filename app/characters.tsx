import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHARACTERS = [
  { id: 'farmer', emoji: '🧑‍🌾', name: 'Farmer Sam', desc: 'Reliable and steady. A classic.', unlocked: true, color: '#B5451B' },
  { id: 'baker', emoji: '👩‍🍳', name: 'Baker Bea', desc: 'Quick hands, warm heart.', unlocked: false, appledNeeded: 50, color: '#E84848' },
  { id: 'kid', emoji: '👦', name: 'Little Max', desc: 'Small but mighty fast!', unlocked: false, applesNeeded: 150, color: '#2A6B6B' },
  { id: 'dog', emoji: '🐕', name: 'Biscuit', desc: 'Loyal and always hungry for apples.', unlocked: false, applesNeeded: 300, color: '#D4A44C' },
];

export default function CharactersScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('farmer');
  const [totalApples, setTotalApples] = useState(0);

  React.useEffect(() => {
    AsyncStorage.getItem('totalApples').then(v => setTotalApples(Number(v) || 0));
  }, []);

  const handleSelect = async (id: string, unlocked: boolean) => {
    if (!unlocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setSelected(id);
    await AsyncStorage.setItem('selectedCharacter', id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  return (
    <LinearGradient colors={['#FAF3E0', '#F5E6C8']} style={styles.container}>
      <Text style={styles.title}>Characters</Text>
      <Text style={styles.subtitle}>Total Apples: 🍎 {totalApples}</Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {CHARACTERS.map(c => {
          const isUnlocked = c.unlocked || totalApples >= (c.applesNeeded || 0);
          const isSelected = selected === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => handleSelect(c.id, isUnlocked)}
              style={[styles.card, isSelected && styles.cardSelected, !isUnlocked && styles.cardLocked]}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{isUnlocked ? c.emoji : '🔒'}</Text>
              <View style={styles.info}>
                <Text style={[styles.charName, !isUnlocked && { opacity: 0.5 }]}>{c.name}</Text>
                <Text style={styles.charDesc}>{isUnlocked ? c.desc : `Collect ${c.applesNeeded} total apples to unlock`}</Text>
              </View>
              {isSelected && <Text style={styles.check}>✅</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: '800', color: '#B5451B', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#2A6B6B', textAlign: 'center', marginBottom: 20 },
  list: { flex: 1 },
  listContent: { padding: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  cardSelected: { borderColor: '#B5451B', backgroundColor: 'rgba(181,69,27,0.1)' },
  cardLocked: { opacity: 0.6 },
  emoji: { fontSize: 40, marginRight: 16 },
  info: { flex: 1 },
  charName: { fontSize: 18, fontWeight: '700', color: '#2A6B6B' },
  charDesc: { fontSize: 13, color: '#2A6B6B', opacity: 0.7, marginTop: 2 },
  check: { fontSize: 24 },
  backButton: { padding: 20, alignItems: 'center' },
  backText: { fontSize: 16, color: '#2A6B6B', fontWeight: '700' },
});
