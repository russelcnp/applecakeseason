import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('soundOn').then(v => { if (v !== null) setSoundOn(v === 'true'); });
    AsyncStorage.getItem('musicOn').then(v => { if (v !== null) setMusicOn(v === 'true'); });
  }, []);

  const toggleSound = async (val: boolean) => {
    setSoundOn(val);
    await AsyncStorage.setItem('soundOn', String(val));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleMusic = async (val: boolean) => {
    setMusicOn(val);
    await AsyncStorage.setItem('musicOn', String(val));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetProgress = async () => {
    await AsyncStorage.multiRemove(['totalApples', 'selectedCharacter', 'bestScore']);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  return (
    <LinearGradient colors={['#FAF3E0', '#F5E6C8']} style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>🔊 Sound Effects</Text>
          <Switch value={soundOn} onValueChange={toggleSound} trackColor={{ false: '#ccc', true: '#B5451B' }} thumbColor={soundOn ? '#FAF3E0' : '#f4f3f4'} />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>🎵 Music</Text>
          <Switch value={musicOn} onValueChange={toggleMusic} trackColor={{ false: '#ccc', true: '#B5451B' }} thumbColor={musicOn ? '#FAF3E0' : '#f4f3f4'} />
        </View>
      </View>

      <TouchableOpacity onPress={resetProgress} style={styles.resetButton}>
        <Text style={styles.resetText}>Reset Progress</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.version}>v1.0.0 — Friendships Apple Cake Season</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#B5451B', textAlign: 'center', marginBottom: 30 },
  card: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 20, marginBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 16, color: '#2A6B6B', fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(42,107,107,0.1)', marginVertical: 4 },
  resetButton: { backgroundColor: 'rgba(232,72,72,0.15)', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E84848' },
  resetText: { color: '#E84848', fontSize: 16, fontWeight: '700' },
  backButton: { marginTop: 30, alignItems: 'center' },
  backText: { color: '#2A6B6B', fontSize: 16, fontWeight: '700' },
  version: { position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: '#2A6B6B', opacity: 0.4 },
});
