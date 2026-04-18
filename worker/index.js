/**
 * Cloudflare Worker for Neon Arkanoid game
 * Serves the game as a single HTML file with proper MIME type
 */

const GAME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Arkanoid</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #0a0a1a;
      font-family: 'Orbitron', monospace;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #gameContainer {
      position: relative;
      width: 100%;
      height: 100%;
      max-width: 100vmin;
      max-height: 100vmin;
      margin: auto;
      border: 2px solid #00f0ff;
      box-shadow: 0 0 20px #00f0ff, 0 0 40px #00f0ff33, inset 0 0 60px #00f0ff11;
      border-radius: 4px;
    }

    #gameCanvas {
      display: block;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 100%);
    }

    #ui {
      position: absolute;
      top: 2%;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 0 5%;
      pointer-events: none;
      font-size: clamp(10px, 2.5vmin, 16px);
    }

    .ui-text {
      color: #00f0ff;
      font-weight: 700;
      text-shadow: 0 0 10px #00f0ff, 0 0 20px #00f0ff;
      letter-spacing: 2px;
    }

    #overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(10, 10, 26, 0.85);
      backdrop-filter: blur(4px);
      transition: opacity 0.3s;
    }

    #overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }

    #overlay h1 {
      color: #ff00ff;
      font-size: clamp(24px, 8vmin, 48px);
      font-weight: 900;
      text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 60px #ff00ff;
      margin-bottom: 10px;
      letter-spacing: 4px;
    }

    #overlay .subtitle {
      color: #00f0ff;
      font-size: clamp(10px, 3vmin, 14px);
      text-shadow: 0 0 10px #00f0ff;
      margin-bottom: 30px;
      letter-spacing: 3px;
    }

    #overlay .prompt {
      color: #ffff00;
      font-size: clamp(12px, 3vmin, 16px);
      text-shadow: 0 0 10px #ffff00;
      animation: pulse 1.5s ease-in-out infinite;
      letter-spacing: 2px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.98); }
    }

    #finalScore {
      color: #00ff88;
      font-size: clamp(16px, 4vmin, 24px);
      text-shadow: 0 0 15px #00ff88;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div id="gameContainer">
    <canvas id="gameCanvas"></canvas>
    <div id="ui">
      <span class="ui-text" id="scoreDisplay">SCORE: 0</span>
      <span class="ui-text" id="levelDisplay">LEVEL: 1</span>
      <span class="ui-text" id="livesDisplay">LIVES: 3</span>
    </div>
    <div id="overlay">
      <h1>ARKANOID</h1>
      <div class="subtitle">NEON EDITION</div>
      <div id="finalScore" style="display: none;"></div>
      <div class="prompt">CLICK OR PRESS SPACE TO START</div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('overlay');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const finalScoreEl = document.getElementById('finalScore');
    const promptEl = overlay.querySelector('.prompt');

    const W = 800;
    const H = 600;
    canvas.width = W;
    canvas.height = H;

    const COLORS = {
      cyan: '#00f0ff',
      magenta: '#ff00ff',
      yellow: '#ffff00',
      lime: '#00ff88',
      orange: '#ff8800',
      pink: '#ff0088'
    };

    const BRICK_COLORS = [COLORS.magenta, COLORS.pink, COLORS.orange, COLORS.yellow, COLORS.lime];

    let gameState = 'start';
    let score = 0;
    let level = 1;
    let lives = 3;
    let shakeIntensity = 0;
    let shakeDecay = 0.9;

    const paddle = {
      width: 120,
      height: 16,
      x: W / 2 - 60,
      y: H - 40,
      speed: 8,
      targetX: W / 2 - 60
    };

    const ball = {
      x: W / 2,
      y: H - 60,
      radius: 10,
      dx: 0,
      dy: 0,
      speed: 7,
      trail: []
    };

    const BRICK_ROWS = 5;
    const BRICK_COLS = 10;
    const BRICK_HEIGHT = 28;
    const BRICK_GAP = 6;
    const BRICK_TOP = 80;
    let bricks = [];

    let particles = [];
    let bgParticles = [];

    for (let i = 0; i < 50; i++) {
      bgParticles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 2 + 0.5,
        speedY: Math.random() * 0.3 + 0.1,
        speedX: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.5 + 0.2,
        color: BRICK_COLORS[Math.floor(Math.random() * BRICK_COLORS.length)]
      });
    }

    const keys = { left: false, right: false };
    let mouseX = W / 2;
    let lastMouseX = W / 2;
    let usingMouse = false;

    let audioCtx = null;

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
    }

    function playTone(freq, duration, type = 'square', volume = 0.1) {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }

    function playHit() { playTone(220, 0.1, 'sine', 0.08); }
    function playBounce() { playTone(440, 0.05, 'sine', 0.06); }
    function playBreak() {
      playTone(600, 0.1, 'square', 0.06);
      setTimeout(() => playTone(800, 0.08, 'square', 0.04), 30);
    }
    function playLevelUp() {
      playTone(523, 0.15, 'sine', 0.1);
      setTimeout(() => playTone(659, 0.15, 'sine', 0.1), 100);
      setTimeout(() => playTone(784, 0.2, 'sine', 0.1), 200);
    }
    function playGameOver() {
      playTone(200, 0.3, 'sawtooth', 0.1);
      setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.1), 200);
    }

    const LEVEL_PATTERNS = [
      [[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1]],
      [[1,0,1,0,1,0,1,0,1,0],[0,1,0,1,0,1,0,1,0,1],[1,0,1,0,1,0,1,0,1,0],[0,1,0,1,0,1,0,1,0,1],[1,0,1,0,1,0,1,0,1,0]],
      [[0,1,0,1,0,1,0,1,0,1],[1,0,1,0,1,0,1,0,1,0],[0,1,0,1,0,1,0,1,0,1],[1,0,1,0,1,0,1,0,1,0],[0,1,0,1,0,1,0,1,0,1]],
      [[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,0],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1]],
      [[0,0,0,0,1,1,0,0,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,1,1,0,0,0,0]],
      [[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,0],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1]],
      [[0,0,0,0,0,0,0,0,0,0],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,0]],
      [[1,1,1,1,1,1,1,1,1,1],[1,0,1,1,1,1,1,1,0,1],[1,1,1,1,0,0,1,1,1,1],[1,0,1,1,1,1,1,1,0,1],[1,1,1,1,1,1,1,1,1,1]],
      [[1,0,1,1,0,0,1,1,0,1],[0,1,1,0,1,1,0,1,1,0],[1,1,0,1,1,1,1,0,1,1],[1,0,1,1,0,1,1,1,0,0],[0,1,1,0,1,0,1,1,1,1]]
    ];

    let usedLevels1_7 = [];

    function createBricks() {
      bricks = [];
      const totalWidth = BRICK_COLS * (BRICK_COLS + 1) * BRICK_GAP;
      const brickW = (W - totalWidth) / BRICK_COLS;

      let pattern;
      if (level <= 7) {
        if (usedLevels1_7.length >= 7) usedLevels1_7 = [];
        let available = [0,1,2,3,4,5,6].filter(i => !usedLevels1_7.includes(i));
        let pick = available[Math.floor(Math.random() * available.length)];
        usedLevels1_7.push(pick);
        pattern = LEVEL_PATTERNS[pick];
      } else {
        pattern = LEVEL_PATTERNS[level - 1];
      }

      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          if (pattern[r][c] === 1) {
            bricks.push({
              x: c * (brickW + BRICK_GAP) + BRICK_GAP,
              y: BRICK_TOP + r * (BRICK_HEIGHT + BRICK_GAP),
              width: brickW,
              height: BRICK_HEIGHT,
              color: BRICK_COLORS[r],
              points: (BRICK_ROWS - r) * 10,
              alive: true,
              pulse: Math.random() * Math.PI * 2
            });
          }
        }
      }
    }

    function resetBall() {
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius - 5;
      ball.dx = 0;
      ball.dy = 0;
      ball.trail = [];
    }

    function launchBall() {
      const angle = (Math.random() * 0.5 + 0.25) * Math.PI;
      ball.dx = Math.cos(angle) * ball.speed;
      ball.dy = -Math.abs(Math.sin(angle) * ball.speed);
    }

    function spawnParticles(x, y, color, count = 15) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        particles.push({
          x, y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color,
          life: 1,
          decay: Math.random() * 0.03 + 0.02
        });
      }
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.1;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
      }

      for (const p of bgParticles) {
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < 0) {
          p.y = H;
          p.x = Math.random() * W;
        }
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
      }
    }

    function drawParticles() {
      for (const p of bgParticles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    function drawGrid() {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    function drawPaddle() {
      const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
      gradient.addColorStop(0, '#00f0ff');
      gradient.addColorStop(1, '#0080aa');

      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.cyan;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(paddle.x + 4, paddle.y + 2, paddle.width - 8, 4, 2);
      ctx.fill();
    }

    function drawBall() {
      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const alpha = (i / ball.trail.length) * 0.4;
        const size = ball.radius * (i / ball.trail.length) * 0.8;
        ctx.beginPath();
        ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.cyan;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const gradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, ball.radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, COLORS.cyan);
      gradient.addColorStop(1, '#006688');

      ctx.shadowBlur = 25;
      ctx.shadowColor = COLORS.cyan;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function drawBricks() {
      const time = Date.now() * 0.002;
      for (const b of bricks) {
        if (!b.alive) continue;

        const pulse = Math.sin(time + b.pulse) * 0.1 + 0.9;
        const w = b.width * pulse;
        const h = b.height * pulse;
        const x = b.x - (w - b.width) / 2;
        const y = b.y - (h - b.height) / 2;

        ctx.shadowBlur = 15;
        ctx.shadowColor = b.color;

        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, b.color);
        gradient.addColorStop(1, shadeColor(b.color, -40));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowBlur = 0;
      }
    }

    function shadeColor(color, percent) {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, Math.min(255, (num >> 16) + amt));
      const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
      const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
      return \`rgb(\${R}, \${G}, \${B})\`;
    }

    function updatePaddle() {
      if (keys.left) {
        paddle.targetX -= paddle.speed;
        usingMouse = false;
      } else if (keys.right) {
        paddle.targetX += paddle.speed;
        usingMouse = false;
      }

      paddle.targetX = Math.max(0, Math.min(W - paddle.width, paddle.targetX));

      if (usingMouse) {
        paddle.x += (lastMouseX - paddle.width / 2 - paddle.x) * 0.2;
      } else {
        paddle.x = paddle.targetX;
      }
    }

    function updateBall() {
      if (gameState !== 'playing') return;

      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 12) ball.trail.shift();

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.dx = Math.abs(ball.dx);
        playBounce();
      }
      if (ball.x + ball.radius > W) {
        ball.x = W - ball.radius;
        ball.dx = -Math.abs(ball.dx);
        playBounce();
      }
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy = Math.abs(ball.dy);
        playBounce();
      }

      if (ball.y + ball.radius > H) {
        lives--;
        updateUI();
        playGameOver();
        if (lives <= 0) {
          gameState = 'gameover';
          showOverlay('GAME OVER', \`FINAL SCORE: \${score}\`);
        } else {
          resetBall();
          gameState = 'start';
          showOverlay('READY', \`LIVES: \${lives}\`);
        }
        return;
      }

      if (ball.dy > 0 &&
          ball.y + ball.radius > paddle.y &&
          ball.y - ball.radius < paddle.y + paddle.height &&
          ball.x > paddle.x &&
          ball.x < paddle.x + paddle.width) {

        const hitPos = (ball.x - paddle.x) / paddle.width;
        const angle = (hitPos - 0.5) * Math.PI * 0.7;
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

        ball.dx = Math.sin(angle) * speed;
        ball.dy = -Math.cos(angle) * speed;
        ball.y = paddle.y - ball.radius - 1;

        playHit();
        spawnParticles(ball.x, ball.y, COLORS.cyan, 5);
      }

      for (const b of bricks) {
        if (!b.alive) continue;

        if (ball.x + ball.radius > b.x &&
            ball.x - ball.radius < b.x + b.width &&
            ball.y + ball.radius > b.y &&
            ball.y - ball.radius < b.y + b.height) {

          const overlapLeft = ball.x + ball.radius - b.x;
          const overlapRight = b.x + b.width - (ball.x - ball.radius);
          const overlapTop = ball.y + ball.radius - b.y;
          const overlapBottom = b.y + b.height - (ball.y - ball.radius);

          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);

          if (minOverlapX < minOverlapY) {
            ball.dx = -ball.dx;
          } else {
            ball.dy = -ball.dy;
          }

          b.alive = false;
          score += b.points;
          updateUI();
          playBreak();
          spawnParticles(b.x + b.width / 2, b.y + b.height / 2, b.color, 20);
          shakeIntensity = 4;

          if (bricks.every(brick => !brick.alive)) {
            level++;
            ball.speed = Math.min(14, ball.speed + 0.4);

            if (level > 9) {
              level = 1;
              usedLevels1_7 = [];
            }

            createBricks();
            resetBall();
            updateUI();
            gameState = 'start';
            playLevelUp();
            showOverlay(\`LEVEL \${level}\`, 'CLICK TO CONTINUE');
          }
          break;
        }
      }
    }

    function updateUI() {
      scoreDisplay.textContent = \`SCORE: \${score}\`;
      levelDisplay.textContent = \`LEVEL: \${level}\`;
      livesDisplay.textContent = \`LIVES: \${lives}\`;
    }

    function showOverlay(title, subtitle) {
      overlay.querySelector('h1').textContent = title;
      if (subtitle) {
        finalScoreEl.textContent = subtitle;
        finalScoreEl.style.display = 'block';
      } else {
        finalScoreEl.style.display = 'none';
      }
      overlay.classList.remove('hidden');
    }

    function hideOverlay() {
      overlay.classList.add('hidden');
    }

    function draw() {
      ctx.save();
      if (shakeIntensity > 0.5) {
        ctx.translate(
          (Math.random() - 0.5) * shakeIntensity,
          (Math.random() - 0.5) * shakeIntensity
        );
        shakeIntensity *= shakeDecay;
      }

      ctx.fillStyle = 'rgba(10, 10, 26, 0.3)';
      ctx.fillRect(0, 0, W, H);

      drawGrid();
      drawParticles();
      drawBricks();
      drawPaddle();

      if (gameState !== 'start' || ball.dx !== 0) {
        drawBall();
      } else {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 5;
        drawBall();
      }

      ctx.restore();
    }

    function gameLoop() {
      updatePaddle();
      updateBall();
      updateParticles();
      draw();
      requestAnimationFrame(gameLoop);
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * (W / rect.width);
      lastMouseX = mouseX;
      usingMouse = true;
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mouseX = (touch.clientX - rect.left) * (W / rect.width);
      lastMouseX = mouseX;
      usingMouse = true;
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
      if (gameState === 'start') {
        handleStart();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      usingMouse = false;
    });

    canvas.addEventListener('click', handleStart);

    overlay.addEventListener('touchstart', (e) => {
      if (gameState === 'start') {
        e.preventDefault();
        handleStart();
      }
    }, { passive: false });

    overlay.addEventListener('click', handleStart);

    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.left = true;
        usingMouse = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.right = true;
        usingMouse = false;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleStart();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    });

    function handleStart() {
      initAudio();

      if (gameState === 'start') {
        hideOverlay();
        gameState = 'playing';
        launchBall();
      } else if (gameState === 'gameover') {
        score = 0;
        level = 1;
        lives = 3;
        ball.speed = 7;
        usedLevels1_7 = [];
        createBricks();
        resetBall();
        updateUI();
        showOverlay('ARKANOID', 'NEON EDITION');
        gameState = 'start';
      }
    }

    createBricks();
    resetBall();
    updateUI();
    showOverlay('ARKANOID', 'NEON EDITION');
    gameLoop();
  </script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(GAME_HTML, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};