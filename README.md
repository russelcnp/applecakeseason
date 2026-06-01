# Friendship's Apple Cake Season

Playable React Native / Expo iOS prototype for **Friendship's Apple Cake Season**.

The game uses placeholder art only: emoji characters, colored shapes, simple obstacle blocks, and tiny generated local sound effects. It is built so the gameplay can be tested first, then replaced with final art later.

## What is included

- Animated splash screen with falling apple and cake particles
- Main menu with apple counter, character shortcut, settings shortcut, and level select
- Character select with 4 helpers from the GDD:
  - Apple Picker Pup
  - Baker-Bot
  - Duck Decorator
  - Sailor Bear
- Settings screen:
  - Sound toggle
  - Music toggle placeholder
  - Reset progress with confirmation
  - Version number
- Level 1: **The Great Apple Race**
  - Top-down 2D mobile obstacle race
  - Drag joystick movement
  - Phase 1: obstacle course
  - Phase 2: 60-second apple collection arena
  - Phase 3: final sprint to finish line
  - 5 NPC racers
  - Conveyor belts, spinners, falling bridges, bounce pads
  - Apples, score, finish placement, star rating
- Results screen with replay and menu navigation
- AsyncStorage save data:
  - total apples
  - selected character
  - stars per level
  - best score per level
  - settings
- Expo AV sound effects
- Expo Haptics feedback
- React Native Reanimated button/splash/game-feel animations
- Expo Router navigation

## Tech stack

- Expo + React Native
- Expo Router
- React Native Reanimated
- Expo AV
- Expo Haptics
- AsyncStorage
- Expo Linear Gradient

## Install

```bash
cd friendships-apple-cake-season
npm install
```

Expo recommends creating/running projects with the current CLI (`npx expo ...`). This project uses Expo Router through `main: "expo-router/entry"`.

## Run locally

```bash
npm start
```

Then press:

- `i` to open iOS Simulator
- or scan the QR code with Expo Go on your iPhone if your installed Expo Go supports the SDK version installed by `npm install`

You can also run:

```bash
npm run ios
```

## Test on a physical iPhone

1. Install Expo Go from the App Store.
2. Connect your Mac and iPhone to the same Wi-Fi.
3. Run:

```bash
npm start
```

4. Scan the QR code with your iPhone camera or Expo Go.
5. Test:
   - tap through splash
   - select a character
   - start Level 1
   - drag joystick to move
   - collect apples in Phase 2
   - finish the final sprint
   - confirm score/stars save after returning to menu

## Build for iOS with EAS

Install and log into EAS:

```bash
npm install -g eas-cli
eas login
```

Configure the project:

```bash
eas build:configure
```

Create a development build:

```bash
eas build --platform ios --profile development
```

Create a production build:

```bash
eas build --platform ios --profile production
```

## Gameplay notes

### Level 1 controls

Use the on-screen joystick at the bottom-left.

### Phase 1: Obstacle Course

Reach the top finish gate. Avoid red spinners and time the falling bridge. Conveyors push you sideways. Bounce pads launch you forward.

### Phase 2: Apple Arena

Collect as many apples as possible in 60 seconds. Red apples are basic, green apples are bonus, and gold apples are worth more.

### Phase 3: Final Sprint

Race to the top finish line. NPCs can finish before you, which affects your finish-position bonus.

## Save data

Save data lives in AsyncStorage under:

```txt
@friendships_apple_cake_save_v1
```

Use Settings → Reset Progress to clear it.

## Replacing placeholder art later

Suggested upgrade path:

1. Replace emoji character tokens with transparent PNG sprites.
2. Replace colored obstacle views with sprite sheets or SVGs.
3. Replace generated WAV beeps with final SFX/music.
4. Add an animated branded splash asset.
5. Add real cake/order-board artwork from the Friendships visual system.
6. Add levels 2-4 using the same `LevelOneGame` structure as a template.

## File map

```txt
app/
  _layout.js          Expo Router root + GameProvider
  index.js            Splash screen
  menu.js             Main menu and level select
  characters.js       Character select
  settings.js         Settings + reset progress
  game.js             Level 1 route
  results.js          Win/results screen

src/
  components/         Reusable UI
  context/            GameContext and persistence actions
  data/               Theme, characters, levels
  game/               LevelOneGame playable prototype
  utils/              AsyncStorage + sound helpers

assets/sounds/        Tiny generated placeholder WAV files
```

## Known prototype limitations

- Music toggle is saved but no looping background music is included yet.
- Level 2-4 are locked preview cards only.
- NPCs use simple pathing, not full collision AI.
- Placeholder graphics are intentionally simple for fast gameplay validation.
