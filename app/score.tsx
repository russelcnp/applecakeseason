import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ScoreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const score = Number(params.score) || 0;
  const apples = Number(params.apples) || 0;
  const distance = Number(params.distance) || 0;
  const cakeProgress = Number(params.cakeProgress) || 0;

  const stars = cakeProgress >= 100 ? 3 : cakeProgress >= 67 ? 3 : cakeProgress >= 34 ? 2 : 1;
  const cakeLabel = cakeProgress >= 100 ? 'PERFECT CAKE! 🎂' : cakeProgress >= 67 ? 'Golden! ✨' : cakeProgress >= 34 ? 'Almost! 🤏' : 'Burnt! 🔥';
  const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/game');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🧁 I scored ${score} points in Friendship's Apple Cake Season! Collected ${apples} apples and baked a ${cakeLabel}! Can you beat me?`,
      });
    } catch {}
  };

  return (
    <LinearGradient colors={['#FAF3E0', '#F5E6C8']} style={styles.container}>
      {/* Stars */}
      <Text style={styles.stars}>{starStr}</Text>
      <Text style={styles.cakeLabel}>{cakeLabel}</Text>

      {/* Score card */}
      <View style={styles.card}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>🍎 Apples</Text>
          <Text style={styles.scoreValue}>{apples}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>📏 Distance</Text>
          <Text style={styles.scoreValue>{distance}m</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>🧁 Cake</Text>
          <Text style={styles.scoreValue}>{Math.floor(cakeProgress)}%</Text>
        </View>
      </View>

      {/* Buttons */}
      <TouchableOpacity onPress={handleRetry} activeOpacity={0.8} style={styles.retryButton}>
        <LinearGradient colors={['#E84848', '#C73535']} style={styles.buttonBg}>
          <Text style={styles.buttonText}>TRY AGAIN</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={styles.shareButton}>
        <View style={styles.shareBg}>
          <Text style={styles.shareText}>📤 Share Score</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/')} style={styles.homeButton}>
        <Text style={styles.homeText}>🏠 Home</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stars: { fontSize: 50, color: '#B5451B', marginBottom: 8, letterSpacing: 8 },
  cakeLabel: { fontSize: 22, fontWeight: '800', color: '#2A6B6B', marginBottom: 30 },
  card: { width: width - 60, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: 24, marginBottom: 30, elevation: 4 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  scoreLabel: { fontSize: 16, color: '#2A6B6B', fontWeight: '600' },
  scoreValue: { fontSize: 18, color: '#B5451B', fontWeight: '800' },
  divider: { height: 1, backgroundColor: 'rgba(42,107,107,0.1)' },
  retryButton: { width: width - 80, marginBottom: 12, borderRadius: 25, overflow: 'hidden', elevation: 4 },
  buttonBg: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#FAF3E0', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  shareButton: { width: width - 80, marginBottom: 12 },
  shareBg: { paddingVertical: 14, alignItems: 'center', borderRadius: 25, borderWidth: 2, borderColor: '#2A6B6B' },
  shareText: { color: '#2A6B6B', fontSize: 16, fontWeight: '700' },
  homeButton: { marginTop: 8 },
  homeText: { color: '#2A6B6B', fontSize: 14, fontWeight: '500' },
});
