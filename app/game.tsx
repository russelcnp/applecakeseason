import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { PanGestureHandler, GestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// — Config —
const LANES = 5;
const LANE_HEIGHT = SCREEN_HEIGHT / (LANES + 2);
const PLAYER_SIZE = 36;
const APPLE_SIZE = 28;
const OBSTACLE_SIZE = 32;
const BASE_SPEED = 200; // pixels per second
const DIFFICULTY_INTERVAL = 20;
const DIFFICULTY_SCALE = 0.08;

// — Types —
interface Entity {
  id: number;
  x: number;
  y: number;
  lane: number;
  type: string;
  active: boolean;
}

interface GameState {
  score: number;
  apples: number;
  lives: number;
  distance: number;
  cakeProgress: number;
  combo: number;
  streakCount: number;
  goldenActive: boolean;
  goldenTimer: number;
  rainbowActive: boolean;
  rainbowTimer: number;
  frozen: boolean;
  frozenTimer: number;
}

// — Helpers —
let nextId = 0;
const getId = () => ++nextId;

const APPLE_TYPES = [
  { emoji: '🍏', points: 10, weight: 60 },
  { emoji: '🍎', points: 25, weight: 25 },
  { emoji: '🌟', points: 50, weight: 10 },
  { emoji: '🌈', points: 100, weight: 5 },
];

const OBSTACLE_TYPES = [
  { emoji: '👻', name: 'red', speed: 1.0 },
  { emoji: '🔵', name: 'blue', speed: 0.6 },
  { emoji: '🟡', name: 'yellow', speed: 0.3 },
  { emoji: '🟢', name: 'green', speed: 0.8 },
];

const randomAppleType = () => {
  const total = APPLE_TYPES.reduce((s, a) => s + a.weight, 0);
  let r = Math.random() * total;
  for (const a of APPLE_TYPES) { r -= a.weight; if (r <= 0) return a; }
  return APPLE_TYPES[0];
};

export default function GameScreen() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>({
    score: 0, apples: 0, lives: 3, distance: 0,
    cakeProgress: 0, combo: 1, streakCount: 0,
    goldenActive: false, goldenTimer: 0,
    rainbowActive: false, rainbowTimer: 0,
    frozen: false, frozenTimer: 0,
  });
  const [playerLane, setPlayerLane] = useState(2);
  const [apples, setApples] = useState<Entity[]>([]);
  const [obstacles, setObstacles] = useState<Entity[]>([]);
  const [particles, setParticles] = useState<any[]>([]);
  const [gameRunning, setGameRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [screenShake] = useState(new Animated.Value(0));
  const [flashOpacity] = useState(new Animated.Value(0));
  const [closeCallText, setCloseCallText] = useState('');
  const gameRef = useRef(gameState);
  const applesRef = useRef(apples);
  const obstaclesRef = useRef(obstacles);
  const playerLaneRef = useRef(playerLane);
  const runningRef = useRef(true);
  const elapsedRef = useRef(0);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const appleTimerRef = useRef(0);
  const obstacleTimerRef = useRef(0);
  const difficultyMultRef = useRef(1);
  const gameLoopRef = useRef<any>(null);

  const playerY = (playerLane + 0.5) * LANE_HEIGHT;
  const playerX = 60;

  // — Swipe handling —
  const onGestureEvent = useCallback((event: any) => {
    if (!runningRef.current) return;
    const { translationX, translationY, state } = event.nativeEvent;
    if (state === State.END) {
      if (Math.abs(translationY) > Math.abs(translationX)) {
        if (translationY < -20) moveUp();
        else if (translationY > 20) moveDown();
      } else {
        if (translationX < -20) { /* dash left — no lanes left of player */ }
        else if (translationX > 20) dashForward();
      }
    }
  }, []);

  const moveUp = useCallback(() => {
    if (!runningRef.current) return;
    setPlayerLane(l => { const nl = Math.max(0, l - 1); playerLaneRef.current = nl; return nl; });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const moveDown = useCallback(() => {
    if (!runningRef.current) return;
    setPlayerLane(l => { const nl = Math.min(LANES - 1, l + 1); playerLaneRef.current = nl; return nl; });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const dashForward = useCallback(() => {
    if (!runningRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Dash gives brief invulnerability and forward burst (handled in collision)
    dashRef.current = true;
    setTimeout(() => { dashRef.current = false; }, 300);
  }, []);

  const dashRef = useRef(false);

  // — Game over —
  const triggerGameOver = useCallback(() => {
    runningRef.current = false;
    setGameRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTimeout(() => {
      router.push({
        pathname: '/score',
        params: {
          score: String(gameRef.current.score),
          apples: String(gameRef.current.apples),
          distance: String(Math.floor(gameRef.current.distance)),
          cakeProgress: String(Math.floor(gameRef.current.cakeProgress)),
        },
      });
    }, 800);
  }, [router]);

  // — Effects —
  const addParticle = useCallback((x: number, y: number, emoji: string) => {
    const id = getId();
    setParticles(p => [...p, { id, x, y, emoji, age: 0 }]);
    // Auto-remove after animation
    setTimeout(() => setParticles(p => p.filter(pp => pp.id !== id)), 600);
  }, []);

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(screenShake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(screenShake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(screenShake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(screenShake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const triggerFlash = useCallback(() => {
    flashOpacity.setValue(1);
    Animated.timing(flashOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  }, []);

  const showCloseCall = useCallback(() => {
    setCloseCallText('Close Call! +5');
    setTimeout(() => setCloseCallText(''), 800);
  }, []);

  // — Main game loop —
  useEffect(() => {
    runningRef.current = true;
    lastTimeRef.current = Date.now();

    const loop = () => {
      if (!runningRef.current) return;

      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      frameRef.current++;

      const gs = gameRef.current;

      // Difficulty scaling
      const difficulty = 1 + Math.floor(elapsedRef.current / DIFFICULTY_INTERVAL) * DIFFICULTY_SCALE;
      difficultyMultRef.current = difficulty;

      // Update elapsed
      elapsedRef.current += dt;
      setElapsedSeconds(elapsedRef.current);

      // Timers
      if (gs.goldenActive) {
        const nt = gs.goldenTimer - dt;
        if (nt <= 0) {
          gs.goldenActive = false;
          gs.goldenTimer = 0;
        } else {
          gs.goldenTimer = nt;
        }
      }
      if (gs.rainbowActive) {
        const nt = gs.rainbowTimer - dt;
        if (nt <= 0) {
          gs.rainbowActive = false;
          gs.rainbowTimer = 0;
        } else {
          gs.rainbowTimer = nt;
        }
      }
      if (gs.frozen) {
        const nt = gs.frozenTimer - dt;
        if (nt <= 0) {
          gs.frozen = false;
          gs.frozenTimer = 0;
        } else {
          gs.frozenTimer = nt;
        }
      }

      // Spawn apples
      appleTimerRef.current -= dt;
      if (appleTimerRef.current <= 0) {
        appleTimerRef.current = 0.8 / difficulty;
        const at = randomAppleType();
        const lane = Math.floor(Math.random() * LANES);
        setApples(prev => [...prev, {
          id: getId(), x: SCREEN_WIDTH + APPLE_SIZE, y: (lane + 0.5) * LANE_HEIGHT,
          lane, type: at.emoji, active: true,
        }]);
      }

      // Spawn obstacles
      obstacleTimerRef.current -= dt;
      if (obstacleTimerRef.current <= 0) {
        obstacleTimerRef.current = 2.0 / difficulty;
        const ot = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
        const lane = Math.floor(Math.random() * LANES);
        setObstacles(prev => [...prev, {
          id: getId(), x: SCREEN_WIDTH + OBSTACLE_SIZE, y: (lane + 0.5) * LANE_HEIGHT,
          lane, type: ot.emoji, active: true,
        }]);
      }

      // Move apples
      const speed = BASE_SPEED * difficulty;
      setApples(prev => prev
        .map(a => ({ ...a, x: a.x - speed * dt }))
        .filter(a => a.x > -APPLE_SIZE)
      );

      // Move obstacles (skip if frozen)
      if (!gs.frozen) {
        setObstacles(prev => prev
          .map(o => ({ ...o, x: o.x - speed * dt * 0.8 }))
          .filter(o => o.x > -OBSTACLE_SIZE)
        );
      }

      // Distance
      gs.distance += speed * dt * 0.1;

      setGameState({ ...gs });
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, []);

  // — Collision detection —
  useEffect(() => {
    if (!gameRunning) return;
    const interval = setInterval(() => {
      if (!runningRef.current) return;
      const pl = playerLaneRef.current;
      const py = (pl + 0.5) * LANE_HEIGHT + LANE_HEIGHT; // lane position on screen
      const px = playerX + PLAYER_SIZE / 2;

      // Apple collision
      let scoreGained = 0;
      let applesGained = 0;
      let goldenTriggered = false;
      let rainbowTriggered = false;

      const remaining = applesRef.current.filter(a => {
        if (!a.active) return false;
        const dist = Math.hypot(a.x - px, a.y - py);
        if (dist < (PLAYER_SIZE + APPLE_SIZE) / 2) {
          const at = APPLE_TYPES.find(t => t.emoji === a.type);
          if (at) {
            scoreGained += at.points;
            applesGained++;
            addParticle(a.x, a.y, at.emoji);
            if (at.emoji === '🌟') goldenTriggered = true;
            if (at.emoji === '🌈') rainbowTriggered = true;
          }
          return false;
        }
        return true;
      });

      if (remaining.length !== applesRef.current.length) {
        setApples(remaining);
        applesRef.current = remaining;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const gs = gameRef.current;
        gs.streakCount += applesGained;
        if (gs.streakCount >= 10) {
          gs.combo = Math.min(gs.combo + 1, 5);
          gs.streakCount = 0;
          setCloseCallText(`Sweet Streak x${gs.combo}!`);
          setTimeout(() => setCloseCallText(''), 1000);
        }
        gs.score += scoreGained * gs.combo;
        gs.apples += applesGained;
        gs.cakeProgress = Math.min(100, gs.cakeProgress + applesGained * 1.5);

        if (goldenTriggered) {
          gs.goldenActive = true;
          gs.goldenTimer = 5;
        }
        if (rainbowTriggered) {
          gs.rainbowActive = true;
          gs.rainbowTimer = 3;
          gs.frozen = true;
          gs.frozenTimer = 3;
        }

        setGameState({ ...gs });
      }

      // Obstacle collision
      if (!dashRef.current) {
        const hitConsumed = new Set<number>();
        const remainingObs = obstaclesRef.current.filter(o => {
          if (hitConsumed.has(o.id)) return false;
          const dist = Math.hypot(o.x - px, o.y - py);
          const nearThreshold = (PLAYER_SIZE + OBSTACLE_SIZE) / 2 + 8;
          const hitThreshold = (PLAYER_SIZE + OBSTACLE_SIZE) / 2;

          // Near miss
          if (dist < nearThreshold && dist > hitThreshold && !dashRef.current) {
            // Only trigger once per obstacle per frame
            return true;
          }

          if (dist < hitThreshold) {
            hitConsumed.add(o.id);
            return false;
          }
          return true;
        });

        // Check if any actual hit
        if (hitConsumed.size > 0) {
          const gs = gameRef.current;
          gs.lives -= hitConsumed.size;
          gs.combo = 1;
          gs.streakCount = 0;
          triggerShake();
          triggerFlash();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

          setObstacles(prev => prev.filter(o => !hitConsumed.has(o.id)));
          obstaclesRef.current = obstaclesRef.current.filter(o => !hitConsumed.has(o.id));

          if (gs.lives <= 0) {
            gs.lives = 0;
            setGameState({ ...gs });
            triggerGameOver();
            return;
          }
          setGameState({ ...gs });
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameRunning, addParticle, triggerShake, triggerFlash, triggerGameOver]);

  // — Render —
  const laneY = (playerLane + 0.5) * LANE_HEIGHT + LANE_HEIGHT;

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent}>
      <LinearGradient colors={['#E8F5E9', '#F5E6C8', '#FAF3E0']} style={styles.container}>
        {/* Red flash overlay */}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'red', opacity: flashOpacity, pointerEvents: 'none' }]} />

        {/* Lane lines */}
        {Array.from({ length: LANES + 1 }).map((_, i) => (
          <View key={i} style={[styles.laneLine, { top: (i + 1) * LANE_HEIGHT }]} />
        ))}

        {/* Apples */}
        {apples.map(a => (
          <Text key={a.id} style={[styles.apple, { left: a.x - APPLE_SIZE / 2, top: a.y - APPLE_SIZE / 2 }]}>
            {a.type}
          </Text>
        ))}

        {/* Obstacles */}
        {obstacles.map(o => (
          <Text key={o.id} style={[styles.obstacle, { left: o.x - OBSTACLE_SIZE / 2, top: o.y - OBSTACLE_SIZE / 2 }]}>
            {o.type}
          </Text>
        ))}

        {/* Player */}
        <Animated.View style={[
          styles.player,
          {
            left: playerX - PLAYER_SIZE / 2,
            top: laneY - PLAYER_SIZE / 2,
            transform: [{ translateX: screenShake }],
          },
        ]}>
          <Text style={styles.playerEmoji}>
            {gameState.goldenActive ? '⚡' : gameState.rainbowActive ? '🌈' : '🧑‍🌾'}
          </Text>
        </Animated.View>

        {/* UI HUD */}
        <View style={styles.hud}>
          {/* Lives */}
          <View style={styles.livesContainer}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Text key={i} style={styles.heart}>{i < gameState.lives ? '❤️' : '🖤'}</Text>
            ))}
          </View>

          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>🍎 {gameState.apples}</Text>
            <Text style={styles.scoreText}>⭐ {gameState.score}</Text>
            <Text style={styles.distText}>{Math.floor(gameState.distance)}m</Text>
          </View>

          {/* Cake meter */}
          <View style={styles.cakeContainer}>
            <Text style={styles.cakeEmoji}>🧁</Text>
            <View style={styles.cakeBarBg}>
              <View style={[styles.cakeBarFill, { width: `${gameState.cakeProgress}%` }]} />
            </View>
          </View>

          {/* Combo */}
          {gameState.combo > 1 && (
            <View style={styles.comboBadge}>
              <Text style={styles.comboText}>x{gameState.combo}</Text>
            </View>
          )}

          {/* Power-up indicators */}
          {gameState.goldenActive && (
            <View style={styles.powerIndicator}>
              <Text style={styles.powerText}>⚡ {Math.ceil(gameState.goldenTimer)}s</Text>
            </View>
          )}
          {gameState.frozen && (
            <View style={styles.powerIndicator}>
              <Text style={styles.powerText}>❄️ {Math.ceil(gameState.frozenTimer)}s</Text>
            </View>
          )}
        </View>

        {/* Close call text */}
        {closeCallText !== '' && (
          <View style={styles.closeCallContainer}>
            <Text style={styles.closeCallText}>{closeCallText}</Text>
          </View>
        )}
      </LinearGradient>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  laneLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(42,107,107,0.08)' },
  player: { position: 'absolute', width: PLAYER_SIZE, height: PLAYER_SIZE, borderRadius: PLAYER_SIZE / 2, backgroundColor: 'rgba(181,69,27,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  playerEmoji: { fontSize: PLAYER_SIZE - 4 },
  apple: { position: 'absolute', fontSize: APPLE_SIZE, zIndex: 5 },
  obstacle: { position: 'absolute', fontSize: OBSTACLE_SIZE, zIndex: 5 },
  hud: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 20 },
  livesContainer: { flexDirection: 'row', gap: 2 },
  heart: { fontSize: 18 },
  scoreContainer: { alignItems: 'flex-end' },
  scoreText: { color: '#2A6B6B', fontSize: 14, fontWeight: '700' },
  distText: { color: '#2A6B6B', fontSize: 12, fontWeight: '500', opacity: 0.7 },
  cakeContainer: { position: 'absolute', bottom: 100, right: 16, alignItems: 'center' },
  cakeEmoji: { fontSize: 20 },
  cakeBarBg: { width: 40, height: 8, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 4, marginTop: 2, overflow: 'hidden' },
  cakeBarFill: { height: '100%', backgroundColor: '#B5451B', borderRadius: 4 },
  comboBadge: { position: 'absolute', top: 90, left: 16, backgroundColor: '#E84848', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  comboText: { color: '#FAF3E0', fontWeight: '900', fontSize: 14 },
  powerIndicator: { position: 'absolute', top: 130, left: 16, backgroundColor: 'rgba(42,107,107,0.9)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  powerText: { color: '#FAF3E0', fontWeight: '700', fontSize: 12 },
  closeCallContainer: { position: 'absolute', top: SCREEN_HEIGHT / 2 - 40, left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  closeCallText: { fontSize: 22, fontWeight: '900', color: '#E84848', textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
