# Arkanoid Game Specification

## Project Overview
- **Name**: Neon Arkanoid
- **Type**: Browser arcade game (single HTML file)
- **Core Functionality**: Classic brick-breaker with modern neon aesthetics, particle effects, and smooth gameplay
- **Target Users**: Casual gamers looking for a quick, visually impressive browser game

## Visual & Rendering Specification

### Scene Setup
- **Canvas**: Full responsive canvas with neon-themed background
- **Background**: Dark gradient (#0a0a1a to #1a0a2e) with subtle grid pattern and floating particles
- **Color Palette**: Cyan (#00f0ff), Magenta (#ff00ff), Electric Yellow (#ffff00), Lime (#00ff88)

### Visual Effects
- **Glow/Bloom**: CSS shadows and canvas blur for neon glow effect
- **Particles**: Explosion particles on brick destruction with color matching brick
- **Trail Effects**: Ball leaves a fading trail
- **Screen Shake**: Subtle shake on powerful hits
- **Animated Bricks**: Bricks pulse with subtle animation

### Game Elements
- **Paddle**: Neon cyan rectangle with glow, rounded ends
- **Ball**: Glowing orb with trailing afterimages
- **Bricks**: Gradient-filled rectangles with neon borders, 5 color rows
- **UI**: Score, level, lives displayed with neon text style

## Game Mechanics

### Paddle
- Width: 120px, Height: 16px
- Controlled by mouse (follows cursor X) or keyboard (left/right arrows)
- Constrained to canvas bounds

### Ball
- Radius: 10px
- Starting speed: 6px/frame, increases slightly per level
- Bounces off walls, paddle, and bricks
- Paddle hit angle affects ball direction

### Bricks
- Grid: 10 columns x 5 rows
- Brick size: Calculated to fit canvas with gaps
- Points by row (top to bottom): 50, 40, 30, 20, 10
- Destruction triggers particle explosion

### Progression
- 3 lives per game
- Level complete when all bricks destroyed
- Next level: faster ball, new brick pattern
- Game over when lives = 0

## Audio (Optional Web Audio)
- Simple synth sounds for: ball hit, brick break, level complete, game over

## Interaction Specification
- **Mouse**: Move paddle left/right
- **Keyboard**: Arrow keys for paddle, Space to start/pause
- **Click**: Start game / Launch ball

## Acceptance Criteria
1. Game renders at 60fps without lag
2. Ball physics feel responsive and fair
3. Particle effects enhance without overwhelming
4. All bricks breakable with proper collision
5. Score updates correctly
6. Lives system works properly
7. Level progression functions
8. Game over and restart flow works
