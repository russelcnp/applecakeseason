import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  type: string;
}

export default function SplashScreen() {
  const router = useRouter();
  const [particles, setParticles] = useState<Particle[]>([]);
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const particleId = useRef(0);

  useEffect(() => {
    // Spawn falling apple particles
    const interval = setInterval(() => {
      const newParticle: Particle = {
        id: particleId.current++,
        x: Math.random() * width,
        y: -20,
        opacity: 0.8 + Math.random() * 0.2,
        type: Math.random() > 0.5 ? '🍎' : Math.random() > 0.5 ? '🍏' : '🧁',
      };
      setParticles(prev => {
        const updated = [...prev, newParticle].slice(-20);
        return updated;
      });
    }, 400);

    // Animate particles falling
    const fallInterval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({ ...p, y: p.y + 15, opacity: p.opacity - 0.01 }))
          .filter(p => p.y < height + 50 && p.opacity > 0)
      );
    }, 50);

    // Staggered entrance animations
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(subtitleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    return () => {
      clearInterval(interval);
      clearInterval(fallInterval);
    };
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/game');
  };

  return (
    <LinearGradient colors={['#FAF3E0', '#F5E6C8']} style={styles.container}>
      {/* Falling particles */}
      {particles.map(p => (
        <Animated.Text
          key={p.id}
          style={[
            styles.particle,
            { left: p.x, top: p.y, opacity: p.opacity },
          ]}
        >
          {p.type}
        </Animated.Text>
      ))}

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, { opacity: logoAnim, transform: [{ scale: logoAnim }] }]}>
        <Text style={styles.logoEmoji}>🧁</Text>
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, { opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
        <Text style={styles.title}>Friendship's</Text>
        <Text style={styles.titleAccent}>Apple Cake</Text>
        <Text style={styles.title}>Season</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleAnim }]}>
        Collect apples. Bake cakes. Make friends.
      </Animated.Text>

      {/* Start Button */}
      <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim, transform: [{ translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <TouchableOpacity onPress={handleStart} activeOpacity={0.8}>
          <LinearGradient colors={['#E84848', '#C73535']} style={styles.startButton}>
            <Text style={styles.startButtonText}>TAP TO PLAY</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push('/characters')} style={styles.navButton}>
          <Text style={styles.navEmoji}>👤</Text>
          <Text style={styles.navLabel}>Characters</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.navButton}>
          <Text style={styles.navEmoji}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute', fontSize: 24 },
  logoContainer: { marginBottom: 10 },
  logoEmoji: { fontSize: 80 },
  titleContainer: { alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 36, fontFamily: 'System', color: '#2A6B6B', fontWeight: '300', letterSpacing: 2 },
  titleAccent: { fontSize: 42, fontFamily: 'System', color: '#B5451B', fontWeight: '800', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#2A6B6B', marginBottom: 40, textAlign: 'center', fontStyle: 'italic' },
  buttonContainer: { marginTop: 20 },
  startButton: { paddingHorizontal: 60, paddingVertical: 18, borderRadius: 30, elevation: 6, shadowColor: '#B5451B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  startButtonText: { color: '#FAF3E0', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  bottomNav: { position: 'absolute', bottom: 40, flexDirection: 'row', gap: 60 },
  navButton: { alignItems: 'center' },
  navEmoji: { fontSize: 28 },
  navLabel: { fontSize: 12, color: '#2A6B6B', marginTop: 4, fontWeight: '600' },
});
