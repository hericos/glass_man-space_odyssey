/**
 * GLASS MAN: SPACE ODYSSEY - Core Game Engine
 */

// --- Audio Synthesizer (Web Audio API) ---
const AudioSynth = (() => {
  let ctx = null;
  let schedulerTimerId = null;
  let nextNoteTime = 0.0;
  let currentStep = 0;
  let activeAudioNodes = [];
  let musicType = null;

  let musicVolume = 0.5;
  let sfxVolume = 0.7;
  let musicGainNode = null;
  let sfxGainNode = null;

  const scheduleAheadTime = 0.1; // how far ahead to schedule audio (sec)
  const lookahead = 25.0; // how frequently to call scheduler (ms)

  function init() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Create separate gain nodes for volume control
      musicGainNode = ctx.createGain();
      musicGainNode.gain.setValueAtTime(musicVolume, ctx.currentTime);
      musicGainNode.connect(ctx.destination);

      sfxGainNode = ctx.createGain();
      sfxGainNode.gain.setValueAtTime(sfxVolume, ctx.currentTime);
      sfxGainNode.connect(ctx.destination);

      // Hook up UI range controls
      const sfxSlider = document.getElementById('volume-sfx');
      const musicSlider = document.getElementById('volume-music');

      if (sfxSlider) {
        sfxVolume = parseFloat(sfxSlider.value);
        sfxGainNode.gain.setValueAtTime(sfxVolume, ctx.currentTime);
        sfxSlider.addEventListener('input', (e) => {
          sfxVolume = parseFloat(e.target.value);
          if (sfxGainNode) {
            sfxGainNode.gain.setValueAtTime(sfxVolume, ctx.currentTime);
          }
        });
      }

      if (musicSlider) {
        musicVolume = parseFloat(musicSlider.value);
        musicGainNode.gain.setValueAtTime(musicVolume, ctx.currentTime);
        musicSlider.addEventListener('input', (e) => {
          musicVolume = parseFloat(e.target.value);
          if (musicGainNode) {
            musicGainNode.gain.setValueAtTime(musicVolume, ctx.currentTime);
          }
        });
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function getContext() {
    return ctx;
  }

  function midiToFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function scheduleNote(step, time) {
    if (!ctx || !musicGainNode) return;

    // Normal Room music
    if (musicType === 'normal') {
      // Treble arpeggiator (Triangle wave, soft, spacey)
      const treblePattern = [60, 63, 67, 70, 72, 70, 67, 63, 58, 62, 65, 68, 70, 68, 65, 62];
      const bassPattern = [36, null, null, null, 34, null, null, null, 32, null, null, null, 34, null, null, null];

      const trebleNote = treblePattern[step % treblePattern.length];
      const bassNote = bassPattern[step % bassPattern.length];

      // Play Treble
      if (trebleNote !== null) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(midiToFreq(trebleNote), time);

        // Lowpass filter for warm space feel
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, time);

        gain.gain.setValueAtTime(0.0, time);
        gain.gain.linearRampToValueAtTime(0.04, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGainNode);

        osc.start(time);
        osc.stop(time + 0.35);

        activeAudioNodes.push({ osc, stopTime: time + 0.35 });
      }

      // Play Bass
      if (bassNote !== null) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(midiToFreq(bassNote), time);

        gain.gain.setValueAtTime(0.0, time);
        gain.gain.linearRampToValueAtTime(0.08, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

        osc.connect(gain);
        gain.connect(musicGainNode);

        osc.start(time);
        osc.stop(time + 0.85);

        activeAudioNodes.push({ osc, stopTime: time + 0.85 });
      }
    }
    // Boss Room music (Faster, intense sawtooth synthwave)
    else if (musicType === 'boss') {
      const bassPattern = [36, 36, 48, 36, 39, 39, 51, 39, 41, 41, 53, 41, 43, 43, 55, 43];
      const treblePattern = [null, null, 72, null, null, null, 75, null, null, null, 77, null, 79, 80, 79, 77];

      const bassNote = bassPattern[step % bassPattern.length];
      const trebleNote = treblePattern[step % treblePattern.length];

      // Play driving bass
      if (bassNote !== null) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(midiToFreq(bassNote), time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, time);

        // Punchy envelope
        gain.gain.setValueAtTime(0.0, time);
        gain.gain.linearRampToValueAtTime(0.08, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGainNode);

        osc.start(time);
        osc.stop(time + 0.2);

        activeAudioNodes.push({ osc, stopTime: time + 0.2 });
      }

      // Play high melody stabs
      if (trebleNote !== null) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(midiToFreq(trebleNote), time);

        gain.gain.setValueAtTime(0.0, time);
        gain.gain.linearRampToValueAtTime(0.03, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(gain);
        gain.connect(musicGainNode);

        osc.start(time);
        osc.stop(time + 0.3);

        activeAudioNodes.push({ osc, stopTime: time + 0.3 });
      }
    }

    // Clean up activeAudioNodes array periodically
    activeAudioNodes = activeAudioNodes.filter(nodeObj => {
      return nodeObj.stopTime > ctx.currentTime;
    });
  }

  function scheduler() {
    if (!ctx) return;
    while (nextNoteTime < ctx.currentTime + scheduleAheadTime) {
      scheduleNote(currentStep, nextNoteTime);

      // Advance nextNoteTime based on tempo
      const bpm = musicType === 'boss' ? 140 : 110;
      const secondsPerBeat = 60.0 / bpm;
      // We are scheduling 16th notes (4 notes per beat)
      const noteLength = 0.25 * secondsPerBeat;

      nextNoteTime += noteLength;
      currentStep++;
    }
  }

  function startMusic(type) {
    init();
    if (!ctx) return;

    if (musicType === type) return; // already playing this music type

    stopMusic();

    musicType = type;
    nextNoteTime = ctx.currentTime + 0.05;
    currentStep = 0;

    schedulerTimerId = setInterval(scheduler, lookahead);
  }

  function stopMusic() {
    if (schedulerTimerId) {
      clearInterval(schedulerTimerId);
      schedulerTimerId = null;
    }

    // Stop all active/scheduled oscillator nodes
    activeAudioNodes.forEach(nodeObj => {
      try {
        nodeObj.osc.stop();
      } catch (e) { }
    });
    activeAudioNodes = [];
    musicType = null;
  }

  function play(type) {
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const dest = sfxGainNode || ctx.destination;

      switch (type) {
        case 'shoot': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
          break;
        }
        case 'hit': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.25);

          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);

          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
          break;
        }
        case 'shatter': {
          // Play a crunchy glass shattering sound
          for (let i = 0; i < 5; i++) {
            const delay = i * 0.03;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const baseFreq = 1200 + Math.random() * 2000;
            osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + delay);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + delay + 0.2);

            gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);

            osc.connect(gain);
            gain.connect(dest);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.2);
          }
          break;
        }
        case 'enemy_death': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2);

          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
          break;
        }
        case 'boss_death': {
          // Deep heavy rumble explosion
          const dur = 1.0;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(20, ctx.currentTime + dur);

          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          osc.stop(ctx.currentTime + dur);

          // Crackling high pitch debris
          for (let i = 0; i < 15; i++) {
            const delay = Math.random() * dur;
            const debrisOsc = ctx.createOscillator();
            const debrisGain = ctx.createGain();
            debrisOsc.type = 'triangle';
            debrisOsc.frequency.setValueAtTime(400 + Math.random() * 800, ctx.currentTime + delay);
            debrisOsc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + delay + 0.15);
            debrisGain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
            debrisGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.15);
            debrisOsc.connect(debrisGain);
            debrisGain.connect(dest);
            debrisOsc.start(ctx.currentTime + delay);
            debrisOsc.stop(ctx.currentTime + delay + 0.15);
          }
          break;
        }
        case 'door': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.4);

          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
          break;
        }
        case 'powerup': {
          const now = ctx.currentTime;
          const notes = [261.63, 329.63, 392.00, 523.25]; // C major arpeggio
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            gain.gain.setValueAtTime(0.12, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.2);
          });
          break;
        }
      }
    } catch (e) {
      console.warn("Audio Context blocked or failed to initialize", e);
    }
  }

  return { init, getContext, startMusic, stopMusic, play };
})();

// --- Game Settings & Setup ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const WIDTH = 900;
const HEIGHT = 600;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const STATE = {
  START: 'start',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover',
  VICTORY: 'victory',
  CHEAT: 'cheat'
};

const FLOORS = [
  {
    name: "Cinturão de Asteroides",
    gridColor: 'rgba(0, 240, 255, 0.09)',
    borderColor: 'rgba(0, 240, 255, 0.45)',
    bgColor: '#040714',
    ambientColor: 'rgba(10, 18, 42, 0.6)',
    allowedEnemies: ['floater', 'dasher'],
    bossType: 'octopus'
  },
  {
    name: "Névoa de Plasma",
    gridColor: 'rgba(188, 19, 254, 0.09)',
    borderColor: 'rgba(188, 19, 254, 0.45)',
    bgColor: '#0c0414',
    ambientColor: 'rgba(30, 10, 42, 0.6)',
    allowedEnemies: ['floater', 'dasher', 'spitter'],
    bossType: 'kraken'
  },
  {
    name: "Estrela Negra",
    gridColor: 'rgba(255, 110, 0, 0.09)',
    borderColor: 'rgba(255, 110, 0, 0.45)',
    bgColor: '#140504',
    ambientColor: 'rgba(42, 14, 10, 0.6)',
    allowedEnemies: ['floater', 'dasher', 'spitter', 'lurker'],
    bossType: 'voidlord'
  }
];

let gameState = STATE.START;
let keys = {};
let joystickLeft = { active: false, startX: 0, startY: 0, vx: 0, vy: 0, touchId: null };
let joystickRight = { active: false, startX: 0, startY: 0, vx: 0, vy: 0, touchId: null };
let player = null;
let enemies = [];
let projectiles = [];
let enemyProjectiles = [];
let particles = [];
let items = [];
let roomIndex = 1; // 1 to 3
let floorIndex = 1; // Increases after each boss
let score = 0;
let roomCleared = false;
let screenShake = 0;

// Player Ranking and Registration session variables
let playerName = '';
let playerId = localStorage.getItem('glassman_player_id') || null;

// Combo System variables
let comboCount = 0;
let comboMultiplier = 1;
let comboTimer = 0;

// Cheat Easter Egg variables
let healthBarClicks = 0;
let healthBarClickTimeout = null;

// Pre-fill pilot name from localStorage and initialize cheat menu hooks
window.addEventListener('DOMContentLoaded', () => {
  const savedName = localStorage.getItem('glassman_player_name');
  const nameInput = document.getElementById('player-name-input');
  if (savedName && nameInput) {
    nameInput.value = savedName;
  }

  // Initialize cheat items grid buttons
  initCheatMenu();

  // Health Bar / Life HUD click detector for Easter Egg
  const healthHud = document.getElementById('health-hud-panel');
  if (healthHud) {
    healthHud.addEventListener('click', () => {
      if (gameState !== STATE.PLAYING) return;
      if (!playerName || playerName.toLowerCase() !== 'easteregger') return;

      healthBarClicks++;

      clearTimeout(healthBarClickTimeout);
      healthBarClickTimeout = setTimeout(() => {
        healthBarClicks = 0;
      }, 3000);

      if (healthBarClicks >= 10) {
        healthBarClicks = 0;
        clearTimeout(healthBarClickTimeout);
        openCheatMenu();
      }
    });
  }

  // Cheat close button
  const cheatCloseBtn = document.getElementById('cheat-close-btn');
  if (cheatCloseBtn) {
    cheatCloseBtn.addEventListener('click', closeCheatMenu);
  }
});

// Records / High Scores (Persisted via LocalStorage)
let highScore = parseInt(localStorage.getItem('glassman_high_score') || '0');
let maxFloor = parseInt(localStorage.getItem('glassman_max_floor') || '1');

function updateRecordUI() {
  const scoreEl = document.getElementById('record-score');
  const floorEl = document.getElementById('record-floor');
  if (scoreEl) {
    scoreEl.innerText = String(highScore).padStart(6, '0');
  }
  if (floorEl) {
    floorEl.innerText = `PISO ${maxFloor}`;
  }
}

function checkAndSaveRecords() {
  let updated = false;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('glassman_high_score', highScore);
    updated = true;
  }
  if (floorIndex > maxFloor) {
    maxFloor = floorIndex;
    localStorage.setItem('glassman_max_floor', maxFloor);
    updated = true;
  }
  if (updated) {
    updateRecordUI();
  }
}

// Initial UI sync
updateRecordUI();

// Doors logic
const DOOR_SIZE = 60;
let doors = []; // Left, Right, Top, Bottom doors

// Floating Texts for damage numbers, item names
let floatTexts = [];

// Canvas bounds for the Glass Platform (leaving padding for the space background)
const ARENA = {
  x: 80,
  y: 80,
  w: WIDTH - 160,
  h: HEIGHT - 160
};

// --- Keyboard Event Listeners ---
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === 'p' && gameState === STATE.PLAYING) {
    pauseGame();
  } else if (e.key.toLowerCase() === 'p' && gameState === STATE.PAUSED) {
    resumeGame();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener('blur', () => {
  keys = {};
});

// --- Ranking & Registration Webhooks ---
async function registerPlayer(name) {
  playerName = name.trim();
  try {
    const response = await fetch('https://n8n.grupodailydeals.tech/webhook/novo-jogador', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: playerName })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    playerId = data.id || data.userId || 'fallback-' + Math.random().toString(36).substr(2, 9);
    console.log("Player registered with ID:", playerId);
    localStorage.setItem('glassman_player_id', playerId);
  } catch (error) {
    console.error("Failed to register player:", error);
    // Use fallback ID
    playerId = localStorage.getItem('glassman_player_id') || 'local_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('glassman_player_id', playerId);
    console.log("Using fallback ID:", playerId);
  }
}

async function submitScore(points) {
  if (!playerName || !playerId) {
    console.warn("Player name or ID not set. Cannot submit score.");
    return;
  }

  // Protect the leaderboard by skipping saving scores for the cheat pilot name
  if (playerName.toLowerCase() === 'easteregger') {
    console.log("Cheat pilot name detected. Skipping score submission.");
    return;
  }

  try {
    const response = await fetch('https://n8n.grupodailydeals.tech/webhook/salvar-pontuacao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: playerName,
        userId: playerId,
        points: points
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log("Score submitted successfully");
  } catch (error) {
    console.error("Failed to submit score:", error);
  }
}

async function showLeaderboard() {
  // Hide other overlays
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('victory-screen').classList.add('hidden');
  document.getElementById('pause-screen').classList.add('hidden');

  // Show leaderboard screen
  const lbScreen = document.getElementById('leaderboard-screen');
  lbScreen.classList.remove('hidden');

  const loadingEl = document.getElementById('leaderboard-loading');
  const tableEl = document.getElementById('leaderboard-container');
  const tbody = document.getElementById('leaderboard-body');

  loadingEl.classList.remove('hidden');
  loadingEl.innerHTML = 'Carregando ranking...';
  tableEl.classList.add('hidden');
  tbody.innerHTML = '';

  try {
    const response = await fetch('https://n8n.grupodailydeals.tech/webhook/ranking');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Sort descending by points
    data.sort((a, b) => {
      const pA = parseFloat(a.points) || 0;
      const pB = parseFloat(b.points) || 0;
      return pB - pA;
    });

    // Take Top 10
    const top10 = data.slice(0, 10);

    // Render rows
    if (top10.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="3" style="text-align: center;">Nenhuma pontuação registrada ainda.</td>`;
      tbody.appendChild(row);
    } else {
      top10.forEach((item, index) => {
        const row = document.createElement('tr');

        // Highlight current player's entry if matching
        const isCurrentPlayer = (item.userId && String(item.userId) === String(playerId)) ||
          (item.name === playerName && (parseFloat(item.points) === score || score === 0));
        if (isCurrentPlayer) {
          row.classList.add('current-player-row');
        }

        const rank = index + 1;
        let rankBadge = `${rank}`;
        if (rank === 1) rankBadge = '🥇';
        else if (rank === 2) rankBadge = '🥈';
        else if (rank === 3) rankBadge = '🥉';

        row.innerHTML = `
          <td class="rank-col">${rankBadge}</td>
          <td class="name-col">${escapeHTML(item.name)}</td>
          <td class="points-col">${item.points}</td>
        `;
        tbody.appendChild(row);
      });
    }

    // Check if current player is in Top 10
    const isInTop10 = top10.some(item => (item.userId && String(item.userId) === String(playerId)) ||
      (item.name === playerName && (parseFloat(item.points) === score || score === 0)));
    if (isInTop10 && score > 0) {
      const titleEl = document.querySelector('#leaderboard-screen h2');
      if (titleEl && !titleEl.innerHTML.includes('🎉')) {
        titleEl.innerHTML = '🎉 VOCÊ ESTÁ NO TOP 10! 🎉';
        titleEl.classList.add('glow-text-green');
      }
      spawnConfetti(WIDTH / 2, HEIGHT / 2, 60);
    } else {
      const titleEl = document.querySelector('#leaderboard-screen h2');
      if (titleEl) {
        titleEl.innerHTML = 'CLASSIFICAÇÃO GERAL';
        titleEl.classList.remove('glow-text-green');
      }
    }

    loadingEl.classList.add('hidden');
    tableEl.classList.remove('hidden');
  } catch (error) {
    console.error("Failed to load ranking:", error);
    loadingEl.innerHTML = `<span class="danger-text">Erro ao carregar ranking.</span><br><button id="leaderboard-retry-btn" class="glow-btn" style="margin-top: 15px; padding: 10px 20px;">Tentar Novamente</button>`;

    const retryBtn = document.getElementById('leaderboard-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', showLeaderboard);
    }
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Click handlers for UI Buttons
document.getElementById('start-btn').addEventListener('click', () => {
  const nameInput = document.getElementById('player-name-input');
  const nameError = document.getElementById('name-error-msg');
  const startBtn = document.getElementById('start-btn');

  if (!nameInput || !nameInput.value.trim()) {
    if (nameError) nameError.classList.remove('hidden');
    if (nameInput) nameInput.classList.add('input-error');
    const startModal = document.querySelector('#start-screen .modal');
    if (startModal) {
      startModal.classList.remove('animate-fade-in');
      void startModal.offsetWidth; // Trigger reflow
      startModal.classList.add('animate-shake');
    }
    return;
  }

  if (nameError) nameError.classList.add('hidden');
  if (nameInput) nameInput.classList.remove('input-error');

  const selectedName = nameInput.value.trim();
  localStorage.setItem('glassman_player_name', selectedName);

  // Show loading state
  startBtn.disabled = true;
  startBtn.innerText = "REGISTRANDO PILOTO...";
  nameInput.disabled = true;

  registerPlayer(selectedName).then(() => {
    startBtn.disabled = false;
    startBtn.innerText = "INICIAR JORNADA";
    nameInput.disabled = false;
    AudioSynth.init();
    startGame();
  });
});

document.getElementById('restart-btn').addEventListener('click', () => {
  showLeaderboard();
});

document.getElementById('victory-restart-btn').addEventListener('click', () => {
  showLeaderboard();
});

document.getElementById('leaderboard-close-btn').addEventListener('click', () => {
  document.getElementById('leaderboard-screen').classList.add('hidden');
  startGame();
});

document.getElementById('resume-btn').addEventListener('click', resumeGame);

// --- Game Initialization ---
function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('victory-screen').classList.add('hidden');
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  const mobileControls = document.getElementById('mobile-controls');
  if (mobileControls) mobileControls.classList.add('visible');

  gameState = STATE.PLAYING;
  document.body.classList.add('lock-scroll');
  score = 0;
  roomIndex = 1;
  floorIndex = 1;
  roomCleared = false;

  // Reset lists
  enemies = [];
  projectiles = [];
  enemyProjectiles = [];
  particles = [];
  items = [];
  floatTexts = [];

  // Initialize player (Glass Man)
  player = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: 18,
    speed: 5.0,
    health: 6, // 6 hit points = 3 glass hearts
    maxHealth: 6,
    shootCooldown: 0,
    shootRate: 350, // ms between shots
    damage: 1,
    range: 1000,
    bulletSpeed: 7,
    crackedAmount: 0,
    invulFrames: 0,
    color: '#00f0ff',

    // Upgrades stats
    helperCount: 0,
    shotCount: 1,
    luckFactor: 0.05,
    petCount: 0,
    petAngle: 0,

    // New mechanics
    hasShield: false,
    tripleShotTimer: 0
  };

  // Reset combo
  comboCount = 0;
  comboMultiplier = 1;
  comboTimer = 0;
  updateComboHUD();

  // Hide record badges
  const goBadge = document.getElementById('gameover-record-badge');
  if (goBadge) goBadge.classList.add('hidden');
  const vicBadge = document.getElementById('victory-record-badge');
  if (vicBadge) vicBadge.classList.add('hidden');

  updateHUD();
  spawnRoomEnemies();
  AudioSynth.play('door');
}

function pauseGame() {
  gameState = STATE.PAUSED;
  document.body.classList.remove('lock-scroll');
  document.getElementById('pause-screen').classList.remove('hidden');
  const mobileControls = document.getElementById('mobile-controls');
  if (mobileControls) mobileControls.classList.remove('visible');
  const context = AudioSynth.getContext();
  if (context && context.state !== 'suspended') {
    context.suspend();
  }
}

function resumeGame() {
  gameState = STATE.PLAYING;
  document.body.classList.add('lock-scroll');
  document.getElementById('pause-screen').classList.add('hidden');
  const mobileControls = document.getElementById('mobile-controls');
  if (mobileControls) mobileControls.classList.add('visible');
  AudioSynth.init();
}

// --- Cheat Easter Egg Functions ---
function openCheatMenu() {
  if (gameState !== STATE.PLAYING) return;
  if (!playerName || playerName.toLowerCase() !== 'easteregger') return;
  gameState = STATE.CHEAT;
  document.body.classList.remove('lock-scroll');
  document.getElementById('cheat-screen').classList.remove('hidden');
  const mobileControls = document.getElementById('mobile-controls');
  if (mobileControls) mobileControls.classList.remove('visible');
  const context = AudioSynth.getContext();
  if (context && context.state !== 'suspended') {
    context.suspend();
  }
}

function closeCheatMenu() {
  if (gameState !== STATE.CHEAT) return;
  gameState = STATE.PLAYING;
  document.body.classList.add('lock-scroll');
  document.getElementById('cheat-screen').classList.add('hidden');
  const mobileControls = document.getElementById('mobile-controls');
  if (mobileControls) mobileControls.classList.add('visible');
  AudioSynth.init();
}

function initCheatMenu() {
  const grid = document.getElementById('cheat-items-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const powerUps = [
    { type: 'heart', label: 'Cristal de Vida', color: '#00f0ff' },
    { type: 'damage', label: 'Estilhaço Afiado', color: '#ff007f' },
    { type: 'speed', label: 'Polimento de Vidro', color: '#39ff14' },
    { type: 'firerate', label: 'Vidro Temperado', color: '#ffeb3b' },
    { type: 'range', label: 'Lente Côncava', color: '#00e5ff' },
    { type: 'defense', label: 'Vidro Blindado', color: '#9c27b0' },
    { type: 'helper', label: 'Mini Clone de Vidro', color: '#e91e63' },
    { type: 'multishot', label: 'Estilhaço Múltiplo', color: '#ff5722' },
    { type: 'luck', label: 'Cristal da Sorte', color: '#4caf50' },
    { type: 'pet', label: 'Escudo Orbital', color: '#e040fb' },
    { type: 'shield', label: 'Escudo de Vidro', color: '#00f0ff' },
    { type: 'tripleshot', label: 'Tiro Triplo Temporal', color: '#e040fb' }
  ];

  powerUps.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'cheat-btn';
    btn.style.borderColor = item.color;
    btn.style.color = item.color;
    btn.innerText = item.label;
    btn.addEventListener('click', () => {
      spawnCheatPowerUp(item.type);
    });
    grid.appendChild(btn);
  });
}

function spawnCheatPowerUp(type) {
  if (gameState !== STATE.CHEAT || !player) return;

  // Calculate spawn coordinates close to the player
  // Default offset: 45px to the right of the player, clamped inside ARENA
  const offset = 45;
  let spawnX = player.x + offset;
  let spawnY = player.y;

  // Clamp coordinates within ARENA bounds with 20px padding from the walls
  const minX = ARENA.x + 20;
  const maxX = ARENA.x + ARENA.w - 20;
  const minY = ARENA.y + 20;
  const maxY = ARENA.y + ARENA.h - 20;

  if (spawnX > maxX) {
    spawnX = player.x - offset; // Try left side
  }

  // Final clamping
  spawnX = Math.max(minX, Math.min(maxX, spawnX));
  spawnY = Math.max(minY, Math.min(maxY, spawnY));

  // Spawn the item
  spawnPowerUp(spawnX, spawnY, type);

  // Floating text feedback
  addFloatText(spawnX, spawnY - 15, "MATERIALIZADO!", '#ff007f', 12);

  // Close the secret menu and resume gameplay
  closeCheatMenu();
}

function triggerGameOver() {
  gameState = STATE.GAMEOVER;
  document.body.classList.remove('lock-scroll');

  // Check record before updating it
  const isNewRecord = (score > highScore);
  if (isNewRecord) {
    const badge = document.getElementById('gameover-record-badge');
    if (badge) badge.classList.remove('hidden');
    spawnConfetti(WIDTH / 2, HEIGHT / 2, 80);
  }

  checkAndSaveRecords();
  document.getElementById('final-score').innerText = score;
  document.getElementById('final-rooms').innerText = (floorIndex - 1) * 3 + roomIndex - 1;
  document.getElementById('game-over-screen').classList.remove('hidden');
  const mobileControls = document.getElementById('mobile-controls');
  if (mobileControls) mobileControls.classList.remove('visible');
  AudioSynth.stopMusic();
  AudioSynth.play('shatter');

  // Submit score in background
  submitScore(score);
}

function triggerVictory() {
  gameState = STATE.VICTORY;
  document.body.classList.remove('lock-scroll');

  // Check record before updating it
  const isNewRecord = (score > highScore);
  if (isNewRecord) {
    const badge = document.getElementById('victory-record-badge');
    if (badge) badge.classList.remove('hidden');
    spawnConfetti(WIDTH / 2, HEIGHT / 2, 80);
  }

  checkAndSaveRecords();
  document.getElementById('victory-score').innerText = score;
  document.getElementById('victory-kills').innerText = Math.floor(score / 50);
  document.getElementById('victory-screen').classList.remove('hidden');
  const mobileControls = document.getElementById('mobile-controls');
  if (mobileControls) mobileControls.classList.remove('visible');
  AudioSynth.stopMusic();
  AudioSynth.play('powerup');

  // Submit score in background
  submitScore(score);
}

// --- Spawning & Rooms ---
function spawnRoomEnemies() {
  enemies = [];
  projectiles = [];
  enemyProjectiles = [];
  roomCleared = false;
  doors = [];

  const currentFloor = FLOORS[(floorIndex - 1) % FLOORS.length];

  // Floating text indicating the room/floor
  const isBossRoom = roomIndex === 3;
  addFloatText(WIDTH / 2, HEIGHT / 2 - 50, isBossRoom ? `CONFRONTO: ${currentFloor.name.toUpperCase()}` : `${currentFloor.name} - SALA ${roomIndex}`, isBossRoom ? '#ff007f' : '#00f0ff', 24);

  if (isBossRoom) {
    // Boss Room
    enemies.push(spawnBoss(floorIndex));
    AudioSynth.startMusic('boss');
  } else {
    // Normal Room: enemy count scales with Floor Index
    const count = 3 + floorIndex * 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const type = currentFloor.allowedEnemies[Math.floor(Math.random() * currentFloor.allowedEnemies.length)];
      enemies.push(spawnEnemy(type));
    }
    AudioSynth.startMusic('normal');
  }
}

function spawnEnemy(type) {
  // Spawn outside or around the player
  let x, y;
  do {
    x = ARENA.x + 50 + Math.random() * (ARENA.w - 100);
    y = ARENA.y + 50 + Math.random() * (ARENA.h - 100);
  } while (Math.hypot(x - player.x, y - player.y) < 150);

  const defense = (floorIndex - 1) * 0.4;

  if (type === 'floater') {
    return {
      x, y,
      type: 'floater',
      radius: 16,
      speed: 1.2 + floorIndex * 0.15,
      health: 2 + floorIndex,
      maxHealth: 2 + floorIndex,
      defense: defense,
      shootCooldown: Math.random() * 2000,
      color: '#39ff14',
      value: 100
    };
  } else if (type === 'dasher') {
    return {
      x, y,
      type: 'dasher',
      radius: 14,
      speed: 2.2 + floorIndex * 0.2,
      health: 1 + floorIndex,
      maxHealth: 1 + floorIndex,
      defense: defense,
      dashCooldown: 1000 + Math.random() * 1500,
      isDashing: false,
      dashTimer: 0,
      dashVx: 0,
      dashVy: 0,
      color: '#bc13fe',
      value: 120
    };
  } else if (type === 'spitter') {
    return {
      x, y,
      type: 'spitter',
      radius: 17,
      speed: 1.0 + floorIndex * 0.1,
      health: 3 + floorIndex,
      maxHealth: 3 + floorIndex,
      defense: defense,
      shootCooldown: 1000 + Math.random() * 1000,
      color: '#ff9800',
      value: 150
    };
  } else if (type === 'lurker') {
    return {
      x, y,
      type: 'lurker',
      radius: 15,
      speed: 1.4 + floorIndex * 0.1,
      health: 2 + floorIndex,
      maxHealth: 2 + floorIndex,
      defense: defense,
      teleportCooldown: 2000 + Math.random() * 1000,
      isTeleporting: false,
      teleportTimer: 0,
      color: '#00e5ff',
      value: 200
    };
  }
  return null;
}

function spawnBoss(floor) {
  const currentFloor = FLOORS[(floor - 1) % FLOORS.length];
  const subtype = currentFloor.bossType;

  let color = '#ff007f';
  let health = 25 + floor * 15;

  if (subtype === 'kraken') {
    color = '#ff9800';
    health = 35 + floor * 15;
  } else if (subtype === 'voidlord') {
    color = '#bc13fe';
    health = 45 + floor * 15;
  }

  return {
    x: WIDTH / 2,
    y: HEIGHT / 2 - 100,
    type: 'boss',
    subtype,
    radius: 40,
    speed: 1.0,
    health,
    maxHealth: health,
    defense: (floor - 1) * 1.0,
    shootCooldown: 0,
    attackPattern: 0,
    patternTimer: 0,
    color,
    value: 1000 + floor * 200,
    isBoss: true
  };
}

function createDoors() {
  doors = [];
  // For simplicity, a door opens on the Right side when room is cleared
  // If it is room 3 (boss), a portal opens in the center instead
  if (roomIndex === 3) {
    doors.push({
      x: WIDTH / 2,
      y: HEIGHT / 2,
      type: 'portal',
      radius: 25,
      angle: 0
    });
  } else {
    doors.push({
      x: ARENA.x + ARENA.w,
      y: ARENA.y + ARENA.h / 2,
      type: 'door',
      w: 20,
      h: DOOR_SIZE
    });
  }
  AudioSynth.play('door');
}

// --- Game Logic Updates ---
function update(dt) {
  if (gameState !== STATE.PLAYING) {
    // Update particles (e.g. confetti, end-game effects)
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.va || 0;
      if (p.type === 'confetti') {
        p.vy += 0.08; // gravity
      }
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    // Update float texts
    floatTexts.forEach(t => {
      t.y -= 0.5;
      t.life -= dt;
    });
    floatTexts = floatTexts.filter(t => t.life > 0);
    return;
  }

  // Decrement power-up timers
  if (player.tripleShotTimer && player.tripleShotTimer > 0) {
    player.tripleShotTimer -= dt;
  }

  // Decrement combo timer
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) {
      comboCount = 0;
      comboMultiplier = 1;
      updateComboHUD();
    }
  }

  // Invulnerability frames cooldown
  if (player.invulFrames > 0) {
    player.invulFrames -= dt;
  }

  // Screen shake cooldown
  if (screenShake > 0) {
    screenShake -= dt * 0.1;
    if (screenShake < 0) screenShake = 0;
  }

  // 1. Move Player
  let dx = 0;
  let dy = 0;
  if (joystickLeft.active) {
    dx = joystickLeft.vx;
    dy = joystickLeft.vy;
  } else {
    if (keys['w'] || keys['z']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a'] || keys['q']) dx -= 1;
    if (keys['d']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      // Normalize diagonal speed
      dx *= 0.7071;
      dy *= 0.7071;
    }
  }

  player.x += dx * player.speed;
  player.y += dy * player.speed;

  // Walk cycle animation update
  if (dx !== 0 || dy !== 0) {
    player.walkCycle = (player.walkCycle || 0) + 0.15 * (dt / 16.66);
  } else {
    player.walkCycle = 0;
  }

  // Keep player inside Glass Platform Arena (allow walking into the right door area slightly if room is cleared)
  const maxX = roomCleared ? (ARENA.x + ARENA.w + 10) : (ARENA.x + ARENA.w - player.radius);
  player.x = Math.max(ARENA.x + player.radius, Math.min(maxX, player.x));
  player.y = Math.max(ARENA.y + player.radius, Math.min(ARENA.y + ARENA.h - player.radius, player.y));

  // Update Pet angle
  player.petAngle = (player.petAngle || 0) + 0.04 * (dt / 16.66);

  // Update helpers shooting
  if (player.helperCount > 0) {
    player.helperShootCooldown = (player.helperShootCooldown || 0) - dt;
    if (player.helperShootCooldown <= 0) {
      let nearest = null;
      let minDist = 999999;
      enemies.forEach(e => {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < minDist) {
          minDist = d;
          nearest = e;
        }
      });
      if (nearest) {
        const ang = Math.atan2(nearest.y - player.y, nearest.x - player.x);
        for (let i = 0; i < player.helperCount; i++) {
          const hAngle = (i / player.helperCount) * Math.PI * 2 + (Date.now() * 0.0015);
          const hx = player.x + Math.cos(hAngle) * 32;
          const hy = player.y + Math.sin(hAngle) * 32;
          projectiles.push({
            x: hx,
            y: hy,
            vx: Math.cos(ang) * player.bulletSpeed,
            vy: Math.sin(ang) * player.bulletSpeed,
            radius: 4,
            damage: Math.max(1, Math.floor(player.damage * 0.7)),
            life: player.range / player.bulletSpeed * 10,
            bounces: 0,
            color: '#e0f7fa'
          });
        }
        AudioSynth.play('shoot');
        player.helperShootCooldown = 800;
      }
    }
  }

  // 2. Player Shooting
  if (player.shootCooldown > 0) {
    player.shootCooldown -= dt;
  }

  let shootDx = 0;
  let shootDy = 0;
  if (joystickRight.active) {
    const dist = Math.hypot(joystickRight.vx, joystickRight.vy);
    if (dist > 0.3) {
      shootDx = joystickRight.vx / dist;
      shootDy = joystickRight.vy / dist;
    }
  } else {
    if (keys['arrowup']) shootDy = -1;
    else if (keys['arrowdown']) shootDy = 1;
    else if (keys['arrowleft']) shootDx = -1;
    else if (keys['arrowright']) shootDx = 1;
  }

  if ((shootDx !== 0 || shootDy !== 0) && player.shootCooldown <= 0) {
    fireProjectile(shootDx, shootDy);
    player.shootCooldown = player.shootRate;
  }

  // 3. Update Projectiles
  projectiles.forEach((p, idx) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt;

    // Bounce off walls once, or break
    if (p.x - p.radius < ARENA.x || p.x + p.radius > ARENA.x + ARENA.w) {
      if (p.bounces > 0) {
        p.vx *= -1;
        p.bounces--;
      } else {
        p.life = 0;
        spawnGlassParticles(p.x, p.y, 4, p.vx * -0.5, p.vy * 0.5);
      }
    }
    if (p.y - p.radius < ARENA.y || p.y + p.radius > ARENA.y + ARENA.h) {
      if (p.bounces > 0) {
        p.vy *= -1;
        p.bounces--;
      } else {
        p.life = 0;
        spawnGlassParticles(p.x, p.y, 4, p.vx * 0.5, p.vy * -0.5);
      }
    }
  });
  projectiles = projectiles.filter(p => p.life > 0);

  // 4. Update Enemy Projectiles
  enemyProjectiles.forEach(p => {
    if (p.isSeeking) {
      const angle = Math.atan2(player.y - p.y, player.x - p.x);
      const targetVx = Math.cos(angle) * 2.5;
      const targetVy = Math.sin(angle) * 2.5;
      p.vx += (targetVx - p.vx) * 0.02 * (dt / 16.66);
      p.vy += (targetVy - p.vy) * 0.02 * (dt / 16.66);
    }
    if (!p.isAcidPool) {
      p.x += p.vx;
      p.y += p.vy;
    }
    p.life -= dt;

    // Check if hit orbital shield pet
    if (player.petCount > 0 && !p.isAcidPool) {
      for (let i = 0; i < player.petCount; i++) {
        const angle = player.petAngle + (i / player.petCount) * Math.PI * 2;
        const petX = player.x + Math.cos(angle) * 38;
        const petY = player.y + Math.sin(angle) * 38;
        const dist = Math.hypot(p.x - petX, p.y - petY);
        if (dist < p.radius + 6) {
          p.life = 0; // destroy projectile
          spawnGlassParticles(petX, petY, 4, 0, 0); // block particles
          AudioSynth.play('hit');
          break;
        }
      }
    }
  });
  enemyProjectiles = enemyProjectiles.filter(p => p.life > 0);

  // 5. Update Enemies
  enemies.forEach(enemy => {
    if (enemy.type === 'floater') {
      // Float towards player slowly
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.x += Math.cos(angle) * enemy.speed;
      enemy.y += Math.sin(angle) * enemy.speed;

      // Shooting logic
      enemy.shootCooldown -= dt;
      if (enemy.shootCooldown <= 0) {
        fireEnemyProjectile(enemy, angle);
        enemy.shootCooldown = 1500 + Math.random() * 1000;
      }
    }
    else if (enemy.type === 'dasher') {
      if (enemy.isDashing) {
        enemy.x += enemy.dashVx;
        enemy.y += enemy.dashVy;
        enemy.dashTimer -= dt;
        if (enemy.dashTimer <= 0) {
          enemy.isDashing = false;
          enemy.dashCooldown = 1200 + Math.random() * 800;
        }
      } else {
        // Track player and cooldown dash
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        enemy.dashCooldown -= dt;
        if (enemy.dashCooldown <= 0) {
          enemy.isDashing = true;
          enemy.dashTimer = 400; // dash duration
          enemy.dashVx = Math.cos(angle) * (enemy.speed * 2.5);
          enemy.dashVy = Math.sin(angle) * (enemy.speed * 2.5);
        }
      }
    }
    else if (enemy.type === 'spitter') {
      // Moves slowly, circles player at distance
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      let moveAngle = angle;
      if (dist < 180) {
        moveAngle += Math.PI; // back away
      } else if (dist > 250) {
        moveAngle = angle; // approach
      } else {
        moveAngle += Math.PI / 2; // circle
      }
      enemy.x += Math.cos(moveAngle) * enemy.speed;
      enemy.y += Math.sin(moveAngle) * enemy.speed;

      enemy.shootCooldown -= dt;
      if (enemy.shootCooldown <= 0) {
        const baseSpeed = 3.0;
        for (let i = -1; i <= 1; i++) {
          const spreadAngle = angle + i * 0.25;
          enemyProjectiles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(spreadAngle) * baseSpeed,
            vy: Math.sin(spreadAngle) * baseSpeed,
            radius: 5,
            life: 3000,
            color: enemy.color
          });
        }
        enemy.shootCooldown = 2000 + Math.random() * 1000;
      }
    }
    else if (enemy.type === 'lurker') {
      enemy.teleportCooldown -= dt;
      if (enemy.isTeleporting) {
        enemy.teleportTimer -= dt;
        if (enemy.teleportTimer <= 0) {
          enemy.isTeleporting = false;
          const ang = Math.random() * Math.PI * 2;
          const dist = 120 + Math.random() * 60;
          enemy.x = Math.max(ARENA.x + enemy.radius, Math.min(ARENA.x + ARENA.w - enemy.radius, player.x + Math.cos(ang) * dist));
          enemy.y = Math.max(ARENA.y + enemy.radius, Math.min(ARENA.y + ARENA.h - enemy.radius, player.y + Math.sin(ang) * dist));

          spawnSlimeParticles(enemy.x, enemy.y, 8, enemy.color);

          const baseSpeed = 2.8;
          for (let i = 0; i < 4; i++) {
            const shootAng = (i * Math.PI) / 2;
            enemyProjectiles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(shootAng) * baseSpeed,
              vy: Math.sin(shootAng) * baseSpeed,
              radius: 5,
              life: 3000,
              color: enemy.color
            });
          }
        }
      } else {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        if (enemy.teleportCooldown <= 0) {
          enemy.isTeleporting = true;
          enemy.teleportTimer = 600;
          enemy.teleportCooldown = 3500 + Math.random() * 1500;
          spawnSlimeParticles(enemy.x, enemy.y, 6, enemy.color);
        }
      }
    }
    else if (enemy.type === 'boss') {
      // Boss pattern
      enemy.patternTimer += dt;

      // Gentle floating in arena center
      const targetX = WIDTH / 2 + Math.sin(enemy.patternTimer / 1000) * 120;
      const targetY = HEIGHT / 2 - 100 + Math.cos(enemy.patternTimer / 1500) * 40;
      enemy.x += (targetX - enemy.x) * 0.03;
      enemy.y += (targetY - enemy.y) * 0.03;

      enemy.shootCooldown -= dt;
      if (enemy.shootCooldown <= 0) {
        executeBossAttack(enemy);
      }
    }

    // Keep enemies inside arena boundaries
    enemy.x = Math.max(ARENA.x + enemy.radius, Math.min(ARENA.x + ARENA.w - enemy.radius, enemy.x));
    enemy.y = Math.max(ARENA.y + enemy.radius, Math.min(ARENA.y + ARENA.h - enemy.radius, enemy.y));
  });

  // 6. Collision: Player bullets hitting enemies
  projectiles.forEach(proj => {
    enemies.forEach(enemy => {
      const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
      if (dist < proj.radius + enemy.radius) {
        proj.life = 0; // Destroy projectile

        // Defense reduces damage (minimum of 0.5 damage)
        const def = enemy.defense || 0;
        const actualDamage = Math.max(0.5, proj.damage - def);
        enemy.health -= actualDamage;

        // Spawn hit particle effect
        spawnGlassParticles(proj.x, proj.y, 6, proj.vx * -0.3, proj.vy * -0.3);
        spawnSlimeParticles(enemy.x, enemy.y, 4, enemy.color);
        addFloatText(enemy.x, enemy.y - 10, `-${actualDamage.toFixed(1).replace('.0', '')}`, '#ffffff', 14);

        if (enemy.health <= 0) {
          // Kill enemy
          comboCount++;
          comboTimer = 3000; // 3 seconds combo window
          comboMultiplier = Math.min(5, 1 + Math.floor(comboCount / 3));
          updateComboHUD();

          const pointsEarned = enemy.value * comboMultiplier;
          score += pointsEarned;
          updateHUD();

          addFloatText(enemy.x, enemy.y - 20, `+${pointsEarned}`, enemy.color, 18);
          if (comboMultiplier > 1) {
            addFloatText(enemy.x, enemy.y - 35, `Combo x${comboMultiplier}!`, '#ff007f', 13);
          }

          spawnSlimeParticles(enemy.x, enemy.y, 15, enemy.color, true);

          if (enemy.isBoss) {
            AudioSynth.play('boss_death');
            screenShake = 15;
            // Spawns multiple upgrades
            spawnPowerUp(enemy.x, enemy.y);
          } else {
            AudioSynth.play('enemy_death');
            // Powerup drop chance scales with player's luckFactor
            const dropChance = (player && typeof player.luckFactor === 'number') ? player.luckFactor : 0.15;
            if (Math.random() < dropChance) {
              spawnPowerUp(enemy.x, enemy.y);
            }
          }
        } else {
          AudioSynth.play('hit');
        }
      }
    });
  });

  // Filter dead enemies
  const initialEnemyCount = enemies.length;
  enemies = enemies.filter(e => e.health > 0);
  if (initialEnemyCount > 0 && enemies.length === 0) {
    roomCleared = true;
    createDoors();
  }

  // 7. Collision: Enemy bullets hitting player
  enemyProjectiles.forEach(proj => {
    const dist = Math.hypot(proj.x - player.x, proj.y - player.y);
    if (dist < proj.radius + player.radius) {
      if (proj.isAcidPool) {
        damagePlayer();
      } else {
        proj.life = 0;
        damagePlayer();
      }
    }
  });

  // 8. Collision: Enemy body contact hitting player
  enemies.forEach(enemy => {
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < enemy.radius + player.radius) {
      damagePlayer();
    }
  });

  // 9. Collision: Player picking up items
  items.forEach((item, idx) => {
    const dist = Math.hypot(item.x - player.x, item.y - player.y);
    if (dist < item.radius + player.radius) {
      applyItem(item);
      items.splice(idx, 1);
    }
  });

  // 10. Door / Portal collision
  if (roomCleared) {
    doors.forEach(door => {
      if (door.type === 'portal') {
        const dist = Math.hypot(door.x - player.x, door.y - player.y);
        if (dist < door.radius + player.radius) {
          // Go to next tier
          floorIndex++;
          roomIndex = 1;
          player.x = WIDTH / 2;
          player.y = HEIGHT / 2;
          spawnRoomEnemies();
          updateHUD();
        }
      } else {
        // Normal door on Right: Check with a 5px buffer to prevent floating-point precision stuck issues
        if (player.x + player.radius >= door.x - 5) {
          // Transition to next room
          roomIndex++;
          player.x = ARENA.x + player.radius + 15;
          spawnRoomEnemies();
          updateHUD();
        }
      }
    });
  }

  // 11. Update particles
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.angle += p.va || 0;
    p.life -= dt;
  });
  particles = particles.filter(p => p.life > 0);

  // 12. Update float texts
  floatTexts.forEach(t => {
    t.y -= 0.5;
    t.life -= dt;
  });
  floatTexts = floatTexts.filter(t => t.life > 0);
}

// --- Shooting & Damage functions ---
function fireProjectile(vx, vy) {
  const baseAngle = Math.atan2(vy, vx);
  const isTriple = player.tripleShotTimer > 0;

  if (player.shotCount === 1 && !isTriple) {
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: vx * player.bulletSpeed,
      vy: vy * player.bulletSpeed,
      radius: 5,
      damage: player.damage,
      life: player.range / player.bulletSpeed * 10,
      bounces: 1, // Shards bounce once
      color: '#e0f7fa'
    });
  } else {
    const spread = 0.22; // angle step
    const count = player.shotCount * (isTriple ? 3 : 1);
    const startAngle = baseAngle - ((count - 1) * spread) / 2;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * spread;
      projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * player.bulletSpeed,
        vy: Math.sin(angle) * player.bulletSpeed,
        radius: 4.5,
        damage: player.damage,
        life: player.range / player.bulletSpeed * 10,
        bounces: 1, // Shards bounce once
        color: isTriple ? '#ff007f' : '#e0f7fa' // Pink/magenta shards for Triple Shot!
      });
    }
  }
  AudioSynth.play('shoot');
}

function fireEnemyProjectile(enemy, baseAngle) {
  const speed = 3.5;
  enemyProjectiles.push({
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(baseAngle) * speed,
    vy: Math.sin(baseAngle) * speed,
    radius: 6,
    life: 3000,
    color: enemy.color
  });
}

function executeBossAttack(boss) {
  boss.attackPattern = (boss.attackPattern + 1) % 3;
  const subtype = boss.subtype || 'octopus';

  if (subtype === 'octopus') {
    if (boss.attackPattern === 0) {
      // Ring fire pattern
      const count = 12 + floorIndex * 2;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        enemyProjectiles.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          radius: 6,
          life: 4000,
          color: '#ff007f'
        });
      }
      boss.shootCooldown = 2000;
    } else if (boss.attackPattern === 1) {
      // Targeted spray pattern
      let delay = 0;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (gameState !== STATE.PLAYING || !enemies.includes(boss)) return;
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + (Math.random() - 0.5) * 0.3;
          enemyProjectiles.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * 4.5,
            vy: Math.sin(angle) * 4.5,
            radius: 7,
            life: 3500,
            color: '#ff007f'
          });
        }, delay);
        delay += 150;
      }
      boss.shootCooldown = 2500;
    } else {
      // Spawn minion dasher alien
      if (enemies.length < 4) {
        enemies.push({
          x: boss.x + (Math.random() - 0.5) * 80,
          y: boss.y + 40,
          type: 'dasher',
          radius: 12,
          speed: 2.0,
          health: 2,
          maxHealth: 2,
          dashCooldown: 800,
          isDashing: false,
          dashTimer: 0,
          dashVx: 0,
          dashVy: 0,
          color: '#ff007f',
          value: 50
        });
        addFloatText(boss.x, boss.y + 30, "LACAIO!", '#ff007f', 14);
      }
      boss.shootCooldown = 1500;
    }
  }
  else if (subtype === 'kraken') {
    if (boss.attackPattern === 0) {
      // Spiral fire pattern
      let delay = 0;
      for (let i = 0; i < 16; i++) {
        setTimeout(() => {
          if (gameState !== STATE.PLAYING || !enemies.includes(boss)) return;
          const angle = (i * 0.4) + (boss.patternTimer / 500);
          enemyProjectiles.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * 3.5,
            vy: Math.sin(angle) * 3.5,
            radius: 7,
            life: 4000,
            color: '#ff9800'
          });
        }, delay);
        delay += 80;
      }
      boss.shootCooldown = 2200;
    } else if (boss.attackPattern === 1) {
      // Drop acid pools on the glass platform
      for (let i = 0; i < 4; i++) {
        const rx = ARENA.x + 40 + Math.random() * (ARENA.w - 80);
        const ry = ARENA.y + 40 + Math.random() * (ARENA.h - 80);
        enemyProjectiles.push({
          x: rx,
          y: ry,
          vx: 0,
          vy: 0,
          radius: 15,
          life: 6000,
          isAcidPool: true,
          color: '#39ff14' // neon green acid
        });
        addFloatText(rx, ry, "ÁCIDO!", '#39ff14', 12);
      }
      boss.shootCooldown = 2000;
    } else {
      // Spawn minion floater alien
      if (enemies.length < 4) {
        enemies.push({
          x: boss.x + (Math.random() - 0.5) * 80,
          y: boss.y + 40,
          type: 'floater',
          radius: 12,
          speed: 1.5,
          health: 3,
          maxHealth: 3,
          shootCooldown: 1000,
          color: '#ff9800',
          value: 60
        });
        addFloatText(boss.x, boss.y + 30, "LACAIO!", '#ff9800', 14);
      }
      boss.shootCooldown = 2000;
    }
  }
  else if (subtype === 'voidlord') {
    if (boss.attackPattern === 0) {
      // Seeking void orbs
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
        enemyProjectiles.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * 1.5,
          vy: Math.sin(angle) * 1.5,
          radius: 8,
          life: 5000,
          isSeeking: true,
          color: '#bc13fe'
        });
      }
      boss.shootCooldown = 2400;
    } else if (boss.attackPattern === 1) {
      // Spasmodic cross burst
      const count = 16;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (boss.patternTimer / 200);
        enemyProjectiles.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * 4,
          vy: Math.sin(angle) * 4,
          radius: 6,
          life: 3000,
          color: '#bc13fe'
        });
      }
      boss.shootCooldown = 1800;
    } else {
      // Teleport and radial blast
      const targetX = ARENA.x + 100 + Math.random() * (ARENA.w - 200);
      const targetY = ARENA.y + 100 + Math.random() * (ARENA.h - 200);

      spawnSlimeParticles(boss.x, boss.y, 20, boss.color, true);
      boss.x = targetX;
      boss.y = targetY;
      spawnSlimeParticles(boss.x, boss.y, 20, boss.color, true);

      addFloatText(boss.x, boss.y - 30, "TELEPORTE!", '#bc13fe', 16);

      // Blast ring
      const count = 10;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        enemyProjectiles.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          radius: 6,
          life: 3000,
          color: '#00e5ff'
        });
      }
      boss.shootCooldown = 2200;
    }
  }
}

function damagePlayer(amount = 1) {
  if (player.invulFrames > 0) return;

  if (player.hasShield) {
    player.hasShield = false;
    player.invulFrames = 600; // 0.6s invulnerability
    screenShake = 6;
    addFloatText(player.x, player.y - 25, "Escudo Bloqueou!", '#00f0ff', 16);
    spawnGlassParticles(player.x, player.y, 15, 0, 0, true);
    AudioSynth.play('shatter');

    // Shoot shards in 8 directions
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * player.bulletSpeed,
        vy: Math.sin(angle) * player.bulletSpeed,
        radius: 4,
        damage: player.damage * 1.5,
        life: player.range / player.bulletSpeed * 10,
        bounces: 1,
        color: '#00f0ff'
      });
    }
    return;
  }

  // Reset combo on taking damage
  comboCount = 0;
  comboMultiplier = 1;
  updateComboHUD();

  const finalDamage = amount * (1 + (floorIndex - 1) * 0.25);
  player.health -= finalDamage;
  player.invulFrames = 1200; // 1.2s invulnerability
  screenShake = 12;

  // Cracks effect indicator
  player.crackedAmount = Math.min(1, Math.max(0, 1 - (player.health / player.maxHealth)));

  // Display floating text on player showing damage taken
  addFloatText(player.x, player.y - 25, `-${finalDamage.toFixed(1).replace('.0', '')} HP`, '#ff007f', 16);

  // Shatter shards flying off player
  spawnGlassParticles(player.x, player.y, 12, 0, 0, true);
  AudioSynth.play('shatter');
  updateHUD();

  if (player.health <= 0) {
    triggerGameOver();
  }
}

// --- Items & Power-ups ---
function spawnPowerUp(x, y, specificType = null) {
  const types = ['heart', 'damage', 'speed', 'firerate', 'range', 'defense', 'helper', 'multishot', 'luck', 'pet', 'shield', 'tripleshot'];
  const type = specificType || types[Math.floor(Math.random() * types.length)];

  let color = '#fff';
  let label = '';

  if (type === 'heart') { color = '#00f0ff'; label = 'Cristal de Vida'; }
  else if (type === 'damage') { color = '#ff007f'; label = 'Estilhaço Afiado'; }
  else if (type === 'speed') { color = '#39ff14'; label = 'Polimento de Vidro'; }
  else if (type === 'firerate') { color = '#ffeb3b'; label = 'Vidro Temperado'; }
  else if (type === 'range') { color = '#00e5ff'; label = 'Lente Côncava'; }
  else if (type === 'defense') { color = '#9c27b0'; label = 'Vidro Blindado'; }
  else if (type === 'helper') { color = '#e91e63'; label = 'Mini Clone de Vidro'; }
  else if (type === 'multishot') { color = '#ff5722'; label = 'Estilhaço Múltiplo'; }
  else if (type === 'luck') { color = '#4caf50'; label = 'Cristal da Sorte'; }
  else if (type === 'pet') { color = '#e040fb'; label = 'Escudo Orbital'; }
  else if (type === 'shield') { color = '#00f0ff'; label = 'Escudo de Vidro'; }
  else if (type === 'tripleshot') { color = '#e040fb'; label = 'Tiro Triplo Temporal'; }

  items.push({
    x, y,
    type,
    radius: 12,
    color,
    label,
    bobAngle: 0
  });
}

function applyItem(item) {
  AudioSynth.play('powerup');

  if (item.type === 'heart') {
    player.health = Math.min(player.maxHealth, player.health + 2); // heal 1 heart (2 hp)
    addFloatText(player.x, player.y - 20, "+Vida", item.color, 16);
  } else if (item.type === 'damage') {
    player.damage += 1;
    addFloatText(player.x, player.y - 20, "+Dano", item.color, 16);
  } else if (item.type === 'speed') {
    player.speed += 0.5;
    addFloatText(player.x, player.y - 20, "+Velocidade", item.color, 16);
  } else if (item.type === 'firerate') {
    player.shootRate = Math.max(150, player.shootRate - 60);
    addFloatText(player.x, player.y - 20, "+Cadência", item.color, 16);
  } else if (item.type === 'range') {
    player.range += 500;
    player.bulletSpeed += 1;
    addFloatText(player.x, player.y - 20, "+Alcance", item.color, 16);
  } else if (item.type === 'defense') {
    player.maxHealth = Math.min(14, player.maxHealth + 2);
    player.health += 2;
    addFloatText(player.x, player.y - 20, "+Max Defesa", item.color, 16);
  } else if (item.type === 'helper') {
    player.helperCount = Math.min(3, player.helperCount + 1);
    addFloatText(player.x, player.y - 20, "+Ajudante de Vidro", item.color, 16);
  } else if (item.type === 'multishot') {
    player.shotCount += 1;
    addFloatText(player.x, player.y - 20, "+Fragmentação", item.color, 16);
  } else if (item.type === 'luck') {
    player.luckFactor = Math.min(0.3, player.luckFactor + 0.05);
    addFloatText(player.x, player.y - 20, "+Sorte", item.color, 16);
  } else if (item.type === 'pet') {
    player.petCount = Math.min(3, player.petCount + 1);
    addFloatText(player.x, player.y - 20, "+Escudo Orbital", item.color, 16);
  } else if (item.type === 'shield') {
    player.hasShield = true;
    addFloatText(player.x, player.y - 20, "+Escudo de Vidro", item.color, 16);
  } else if (item.type === 'tripleshot') {
    player.tripleShotTimer = 10000; // 10s
    addFloatText(player.x, player.y - 20, "+Tiro Triplo", item.color, 16);
  }

  player.crackedAmount = 1 - (player.health / player.maxHealth);
  updateHUD();
}

// --- Visual HUD Management ---
function updateHUD() {
  const currentFloor = FLOORS[(floorIndex - 1) % FLOORS.length];
  document.getElementById('score-val').innerText = String(score).padStart(6, '0');
  document.getElementById('floor-val').innerText = `${floorIndex}: ${currentFloor.name}`;
  document.getElementById('room-banner').innerText = roomIndex === 3 ? "SALA DO CHEFE" : `SALA ${roomIndex} / 3`;

  // Update health bar in HUD
  const healthPct = Math.max(0, (player.health / player.maxHealth) * 100);
  const barFill = document.getElementById('health-bar-fill');
  if (barFill) {
    barFill.style.width = `${healthPct}%`;
    if (healthPct > 50) {
      barFill.style.background = 'linear-gradient(90deg, var(--neon-cyan) 0%, #0072ff 100%)';
    } else if (healthPct > 25) {
      barFill.style.background = 'linear-gradient(90deg, #ffeb3b 0%, #f57c00 100%)';
    } else {
      barFill.style.background = 'linear-gradient(90deg, #ff007f 0%, #d50000 100%)';
    }
  }
}

function updateComboHUD() {
  const val = document.getElementById('combo-val');
  if (val) {
    val.innerText = `x${comboMultiplier}`;
  }
}

// --- Floating Text Helpers ---
function addFloatText(x, y, text, color, size) {
  floatTexts.push({
    x, y,
    text,
    color,
    size: size || 16,
    life: 1000 // 1 second lifetime
  });
}

// --- Particle Effects Generators ---
function spawnGlassParticles(x, y, count, baseVx, baseVy, isBig = false) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (isBig ? 2 : 1) + Math.random() * (isBig ? 4 : 2.5);
    const life = 500 + Math.random() * 500;
    particles.push({
      x, y,
      vx: (baseVx || 0) + Math.cos(angle) * speed,
      vy: (baseVy || 0) + Math.sin(angle) * speed,
      va: (Math.random() - 0.5) * 0.1, // angular speed
      angle: Math.random() * Math.PI,
      radius: (isBig ? 5 : 2) + Math.random() * (isBig ? 6 : 4),
      life,
      initialLife: life,
      type: 'glass'
    });
  }
}

function spawnSlimeParticles(x, y, count, color, isExplosion = false) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * (isExplosion ? 4.5 : 2);
    const life = 400 + Math.random() * 400;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * (isExplosion ? 6 : 3),
      life,
      initialLife: life,
      type: 'slime',
      color
    });
  }
}

function spawnConfetti(x, y, count) {
  const colors = ['#00f0ff', '#ff007f', '#39ff14', '#ffeb3b', '#ff9800', '#e040fb'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    const life = 1500 + Math.random() * 1000;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5, // slightly upwards
      va: (Math.random() - 0.5) * 0.2, // rotation speed
      angle: Math.random() * Math.PI,
      radius: 3 + Math.random() * 5,
      life,
      initialLife: life,
      type: 'confetti',
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

// --- Canvas Rendering Loop ---
function draw() {
  ctx.save();

  // Screen Shake effect
  if (screenShake > 0) {
    const sx = (Math.random() - 0.5) * screenShake;
    const sy = (Math.random() - 0.5) * screenShake;
    ctx.translate(sx, sy);
  }

  const currentFloor = FLOORS[(floorIndex - 1) % FLOORS.length];
  // Clear Canvas with a grid on the Space Glass Platform
  ctx.fillStyle = currentFloor.bgColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw space arena boundaries & glass floor details
  drawGlassPlatform();

  // Draw Portal or Doors
  if (roomCleared) {
    drawDoors();
  }

  // Draw Items
  items.forEach(item => {
    item.bobAngle += 0.05;
    const bobY = Math.sin(item.bobAngle) * 4;

    ctx.save();
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x, item.y + bobY, item.radius, 0, Math.PI * 2);
    ctx.fill();

    // Floating gem/heart core visual
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(item.x, item.y + bobY, item.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw Player (Glass Man)
  if (player && gameState !== STATE.GAMEOVER) {
    ctx.save();

    // Invulnerability blink effect
    if (player.invulFrames > 0 && Math.floor(player.invulFrames / 100) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }

    // No shadow blur for performance

    // Draw Glass body panels
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';

    // Determine movement direction & shooting aim direction
    let moveDx = 0;
    let moveDy = 0;
    if (joystickLeft.active) {
      moveDx = joystickLeft.vx;
      moveDy = joystickLeft.vy;
    } else {
      if (keys['w'] || keys['z']) moveDy -= 1;
      if (keys['s']) moveDy += 1;
      if (keys['a'] || keys['q']) moveDx -= 1;
      if (keys['d']) moveDx += 1;
    }

    let aimDx = 0;
    let aimDy = 0;
    if (joystickRight.active) {
      const dist = Math.hypot(joystickRight.vx, joystickRight.vy);
      if (dist > 0.3) {
        aimDx = joystickRight.vx / dist;
        aimDy = joystickRight.vy / dist;
      }
    } else {
      if (keys['arrowup']) aimDy = -1;
      else if (keys['arrowdown']) aimDy = 1;
      else if (keys['arrowleft']) aimDx = -1;
      else if (keys['arrowright']) aimDx = 1;
    }

    // 1. Draw Legs (Walking animation)
    const cycle = player.walkCycle || 0;
    const legSwing = Math.sin(cycle) * 8;

    // Left Leg
    ctx.beginPath();
    ctx.moveTo(player.x - 5, player.y + 6);
    ctx.lineTo(player.x - 6 + legSwing, player.y + 16);
    ctx.stroke();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(player.x + 5, player.y + 6);
    ctx.lineTo(player.x + 4 - legSwing, player.y + 16);
    ctx.stroke();

    // 2. Draw Torso (Glass chest block)
    ctx.beginPath();
    ctx.moveTo(player.x - 7, player.y - 7);
    ctx.lineTo(player.x + 7, player.y - 7);
    ctx.lineTo(player.x + 5, player.y + 6);
    ctx.lineTo(player.x - 5, player.y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Draw Head (Glass spherical helmet)
    ctx.beginPath();
    ctx.arc(player.x, player.y - 14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4. Draw Arms (Aiming / idle)
    ctx.beginPath();
    if (aimDx !== 0 || aimDy !== 0) {
      // Extends pointing arm in shooting direction
      ctx.moveTo(player.x - 6, player.y - 5);
      ctx.lineTo(player.x + aimDx * 15, player.y - 5 + aimDy * 12);

      ctx.moveTo(player.x + 6, player.y - 5);
      ctx.lineTo(player.x + aimDx * 15, player.y - 5 + aimDy * 12);
    } else {
      // Idle / running arm swing
      const armSwing = Math.cos(cycle) * 6;
      ctx.moveTo(player.x - 7, player.y - 5);
      ctx.lineTo(player.x - 11, player.y + armSwing);

      ctx.moveTo(player.x + 7, player.y - 5);
      ctx.lineTo(player.x + 11, player.y - armSwing);
    }
    ctx.stroke();

    // 5. Draw Glowing Humanoid Eyes (Looking in movement or aim direction)
    let lookX = 0;
    let lookY = 0;
    if (aimDx !== 0 || aimDy !== 0) {
      lookX = aimDx * 2.5;
      lookY = aimDy * 2;
    } else if (moveDx !== 0 || moveDy !== 0) {
      lookX = moveDx * 2;
      lookY = moveDy * 1.5;
    }

    ctx.fillStyle = '#ffffff';

    // Left eye
    ctx.beginPath();
    ctx.arc(player.x - 2.5 + lookX, player.y - 14.5 + lookY, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.arc(player.x + 2.5 + lookX, player.y - 14.5 + lookY, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Draw Cracks inside head & torso if damage taken
    if (player.crackedAmount > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();

      const seedRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      const crackLines = Math.floor(player.crackedAmount * 8);
      for (let j = 0; j < crackLines; j++) {
        // Torso cracks (branching & jagged)
        ctx.moveTo(player.x, player.y - 1);
        let cx = player.x;
        let cy = player.y - 1;
        let ang = seedRandom(j * 4) * Math.PI * 2;
        let segments = 2 + Math.floor(seedRandom(j * 4 + 1) * 2);
        for (let s = 0; s < segments; s++) {
          let len = (14 / segments) * (0.5 + seedRandom(j * 4 + s + 2) * 0.6);
          ang += (seedRandom(j * 4 + s + 3) - 0.5) * 0.7; // angle variation
          cx += Math.cos(ang) * len;
          cy += Math.sin(ang) * len;
          ctx.lineTo(cx, cy);

          // Small branch
          if (seedRandom(j * 4 + s + 7) > 0.6) {
            ctx.moveTo(cx, cy);
            let branchAng = ang + (seedRandom(j * 4 + s + 8) - 0.5) * 1.5;
            let branchLen = len * 0.7;
            ctx.lineTo(cx + Math.cos(branchAng) * branchLen, cy + Math.sin(branchAng) * branchLen);
            ctx.moveTo(cx, cy);
          }
        }

        // Head cracks (branching & jagged)
        ctx.moveTo(player.x, player.y - 14);
        cx = player.x;
        cy = player.y - 14;
        ang = seedRandom(j * 4 + 10) * Math.PI * 2;
        segments = 2;
        for (let s = 0; s < segments; s++) {
          let len = (8 / segments) * (0.4 + seedRandom(j * 4 + s + 11) * 0.6);
          ang += (seedRandom(j * 4 + s + 12) - 0.5) * 0.7;
          cx += Math.cos(ang) * len;
          cy += Math.sin(ang) * len;
          ctx.lineTo(cx, cy);

          if (seedRandom(j * 4 + s + 15) > 0.65) {
            ctx.moveTo(cx, cy);
            let branchAng = ang + (seedRandom(j * 4 + s + 16) - 0.5) * 1.3;
            let branchLen = len * 0.6;
            ctx.lineTo(cx + Math.cos(branchAng) * branchLen, cy + Math.sin(branchAng) * branchLen);
            ctx.moveTo(cx, cy);
          }
        }
      }
      ctx.stroke();
    }

    // Glowing core (heart/energy center inside chest)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 1, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 6.5 Draw Glass Shield bubble if active
    if (player.hasShield) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.8;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(player.x, player.y - 4, player.radius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 7. Draw Pets (Shield orbitals)
    for (let i = 0; i < player.petCount; i++) {
      const angle = player.petAngle + (i / player.petCount) * Math.PI * 2;
      const petX = player.x + Math.cos(angle) * 38;
      const petY = player.y + Math.sin(angle) * 38;
      ctx.save();
      ctx.fillStyle = '#e040fb'; // glowing purple neon
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.translate(petX, petY);
      ctx.rotate(player.petAngle * 1.5);
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 8. Draw Helpers (Mini-Clones hovering near)
    for (let i = 0; i < player.helperCount; i++) {
      const hAngle = (i / player.helperCount) * Math.PI * 2 + (Date.now() * 0.0015);
      const hx = player.x + Math.cos(hAngle) * 32;
      const hy = player.y + Math.sin(hAngle) * 32;
      ctx.save();
      ctx.fillStyle = 'rgba(233, 30, 99, 0.45)';
      ctx.strokeStyle = '#e91e63';
      ctx.lineWidth = 1.2;

      // Mini head
      ctx.beginPath();
      ctx.arc(hx, hy - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mini body
      ctx.beginPath();
      ctx.moveTo(hx - 3, hy - 1);
      ctx.lineTo(hx + 3, hy - 1);
      ctx.lineTo(hx + 2, hy + 4);
      ctx.lineTo(hx - 2, hy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw Enemies
  enemies.forEach(enemy => {
    ctx.save();
    ctx.fillStyle = enemy.color;

    if (enemy.type === 'floater') {
      // 1. Draw Spaceship Saucer Base (Silver/Grey)
      ctx.fillStyle = '#607d8b';
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y + 4, enemy.radius * 1.25, enemy.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Yellow lights on saucer
      ctx.fillStyle = '#ffeb3b';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(enemy.x + i * 5, enemy.y + 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Wavy tentacles dangling from saucer
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2.0;
      const wave = Math.sin((enemy.shootCooldown || 0) * 0.05) * 3;

      // Left tentacle
      ctx.beginPath();
      ctx.moveTo(enemy.x - 5, enemy.y + 5);
      ctx.quadraticCurveTo(enemy.x - 9 + wave, enemy.y + 11, enemy.x - 6, enemy.y + 15);
      ctx.stroke();

      // Center tentacle
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y + 5);
      ctx.quadraticCurveTo(enemy.x - wave, enemy.y + 12, enemy.x + wave, enemy.y + 16);
      ctx.stroke();

      // Right tentacle
      ctx.beginPath();
      ctx.moveTo(enemy.x + 5, enemy.y + 5);
      ctx.quadraticCurveTo(enemy.x + 9 - wave, enemy.y + 11, enemy.x + 6, enemy.y + 15);
      ctx.stroke();

      // 3. Green Octopus Head
      ctx.fillStyle = '#39ff14';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 4, enemy.radius * 0.7, Math.PI, 0); // semi-circle head
      ctx.lineTo(enemy.x + enemy.radius * 0.7, enemy.y + 1);
      ctx.lineTo(enemy.x - enemy.radius * 0.7, enemy.y + 1);
      ctx.closePath();
      ctx.fill();

      // 4. Antennas
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(enemy.x - 3, enemy.y - 10);
      ctx.quadraticCurveTo(enemy.x - 7, enemy.y - 16, enemy.x - 5, enemy.y - 19);
      ctx.stroke();
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(enemy.x - 5, enemy.y - 19, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(enemy.x + 3, enemy.y - 10);
      ctx.quadraticCurveTo(enemy.x + 7, enemy.y - 16, enemy.x + 5, enemy.y - 19);
      ctx.stroke();
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(enemy.x + 5, enemy.y - 19, 2, 0, Math.PI * 2);
      ctx.fill();

      // 5. Octopus Eyes (Glowing pink)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(enemy.x - 2.5, enemy.y - 5, 2.2, 0, Math.PI * 2);
      ctx.arc(enemy.x + 2.5, enemy.y - 5, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(enemy.x - 2.5, enemy.y - 5, 0.8, 0, Math.PI * 2);
      ctx.arc(enemy.x + 2.5, enemy.y - 5, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (enemy.type === 'dasher') {
      // 1. Sleeker aerodynamic spaceship saucer
      ctx.fillStyle = '#455a64';
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - 4);
      ctx.lineTo(enemy.x + enemy.radius * 1.3, enemy.y + 6);
      ctx.lineTo(enemy.x - enemy.radius * 1.3, enemy.y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red thruster light at the back/bottom
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y + 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Swept-back tentacles
      ctx.strokeStyle = '#26e600';
      ctx.lineWidth = 2.0;
      const swing = Math.sin((enemy.dashTimer || 0) * 0.08) * 2;

      ctx.beginPath();
      ctx.moveTo(enemy.x - 6, enemy.y + 5);
      ctx.quadraticCurveTo(enemy.x - 12, enemy.y + 8, enemy.x - 14 + swing, enemy.y + 12);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(enemy.x + 6, enemy.y + 5);
      ctx.quadraticCurveTo(enemy.x + 12, enemy.y + 8, enemy.x + 14 - swing, enemy.y + 12);
      ctx.stroke();

      // 3. Green Octopus Head
      ctx.fillStyle = '#26e600'; // slightly different green
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 6, enemy.radius * 0.65, Math.PI, 0);
      ctx.lineTo(enemy.x + enemy.radius * 0.65, enemy.y - 1);
      ctx.lineTo(enemy.x - enemy.radius * 0.65, enemy.y - 1);
      ctx.closePath();
      ctx.fill();

      // 4. Antennas (swept back)
      ctx.strokeStyle = '#26e600';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(enemy.x - 2, enemy.y - 11);
      ctx.quadraticCurveTo(enemy.x - 8, enemy.y - 15, enemy.x - 10, enemy.y - 17);
      ctx.stroke();
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(enemy.x - 10, enemy.y - 17, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(enemy.x + 2, enemy.y - 11);
      ctx.quadraticCurveTo(enemy.x + 8, enemy.y - 15, enemy.x + 10, enemy.y - 17);
      ctx.stroke();
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(enemy.x + 10, enemy.y - 17, 2, 0, Math.PI * 2);
      ctx.fill();

      // 5. Angry slant eyes
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(enemy.x - 2.5, enemy.y - 6, 2.0, 0, Math.PI * 2);
      ctx.arc(enemy.x + 2.5, enemy.y - 6, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(enemy.x - 2.5, enemy.y - 6, 0.7, 0, Math.PI * 2);
      ctx.arc(enemy.x + 2.5, enemy.y - 6, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (enemy.type === 'spitter') {
      // 1. Spitter Spaceship (Orange themed)
      ctx.fillStyle = '#ff5722'; // bright deep orange
      ctx.strokeStyle = '#ffcc80';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y + 4, enemy.radius * 1.25, enemy.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Green thruster/spit glow at bottom center
      ctx.fillStyle = '#39ff14';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y + 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Wavy tentacles
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 2.0;
      const wave = Math.sin((enemy.shootCooldown || 0) * 0.05) * 3;

      ctx.beginPath();
      ctx.moveTo(enemy.x - 5, enemy.y + 5);
      ctx.quadraticCurveTo(enemy.x - 9 + wave, enemy.y + 11, enemy.x - 6, enemy.y + 15);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(enemy.x + 5, enemy.y + 5);
      ctx.quadraticCurveTo(enemy.x + 9 - wave, enemy.y + 11, enemy.x + 6, enemy.y + 15);
      ctx.stroke();

      // 3. Orange Octopus Head
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 4, enemy.radius * 0.7, Math.PI, 0);
      ctx.lineTo(enemy.x + enemy.radius * 0.7, enemy.y + 1);
      ctx.lineTo(enemy.x - enemy.radius * 0.7, enemy.y + 1);
      ctx.closePath();
      ctx.fill();

      // 4. Large single glowing yellow eye
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 5, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (enemy.type === 'lurker') {
      // Lurker fade-out opacity
      ctx.save();
      if (enemy.isTeleporting) {
        ctx.globalAlpha = Math.max(0.1, enemy.teleportTimer / 600);
      }

      // 1. Phantasmal Purple/Blue Spaceship Saucer
      ctx.fillStyle = '#3f51b5';
      ctx.strokeStyle = '#b3e5fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y + 4, enemy.radius * 1.25, enemy.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 2. Phantom glowing tentacles
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.0;
      const wave = Math.sin((enemy.teleportCooldown || 0) * 0.05) * 3;

      ctx.beginPath();
      ctx.moveTo(enemy.x - 5, enemy.y + 5);
      ctx.quadraticCurveTo(enemy.x - 9 + wave, enemy.y + 12, enemy.x - 6, enemy.y + 16);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(enemy.x + 5, enemy.y + 5);
      ctx.quadraticCurveTo(enemy.x + 9 - wave, enemy.y + 12, enemy.x + 6, enemy.y + 16);
      ctx.stroke();

      // 3. Cyan/White Octopus Head
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 4, enemy.radius * 0.7, Math.PI, 0);
      ctx.lineTo(enemy.x + enemy.radius * 0.7, enemy.y + 1);
      ctx.lineTo(enemy.x - enemy.radius * 0.7, enemy.y + 1);
      ctx.closePath();
      ctx.fill();

      // 4. White glowing star antenna
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - 11);
      ctx.lineTo(enemy.x, enemy.y - 19);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 19, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Dual glowing white eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(enemy.x - 2.5, enemy.y - 5, 2.0, 0, Math.PI * 2);
      ctx.arc(enemy.x + 2.5, enemy.y - 5, 2.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    else if (enemy.type === 'boss') {
      const subtype = enemy.subtype || 'octopus';

      if (subtype === 'octopus') {
        // --- 1. OCTOPUS BOSS (Floor 1: Classic Saucer + Green Octopus) ---
        // Spaceship base
        ctx.fillStyle = '#37474f';
        ctx.strokeStyle = '#78909c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y + 10, enemy.radius * 1.4, enemy.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Neon lights
        ctx.fillStyle = '#00f0ff';
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(enemy.x + i * 11, enemy.y + 11, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Left Cannon
        ctx.fillStyle = '#263238';
        ctx.strokeStyle = '#b0bec5';
        ctx.beginPath();
        ctx.rect(enemy.x - enemy.radius * 1.5, enemy.y + 2, 12, 10);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(enemy.x - enemy.radius * 1.5, enemy.y + 7);
        ctx.lineTo(enemy.x - enemy.radius * 1.9, enemy.y + 17);
        ctx.lineWidth = 4;
        ctx.stroke();

        // Right Cannon
        ctx.beginPath();
        ctx.rect(enemy.x + enemy.radius * 1.5 - 12, enemy.y + 2, 12, 10);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.radius * 1.5, enemy.y + 7);
        ctx.lineTo(enemy.x + enemy.radius * 1.9, enemy.y + 17);
        ctx.lineWidth = 4;
        ctx.stroke();

        // Tentacles
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 4.0;
        const wave = Math.sin((enemy.patternTimer || 0) * 0.003) * 6;
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue;
          ctx.beginPath();
          ctx.moveTo(enemy.x + i * 12, enemy.y + 15);
          ctx.quadraticCurveTo(enemy.x + i * 25 + wave * (i > 0 ? 1 : -1), enemy.y + 35, enemy.x + i * 18, enemy.y + 50);
          ctx.stroke();
        }

        // Octopus Head
        ctx.fillStyle = '#39ff14';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 8, enemy.radius * 0.8, Math.PI, 0);
        ctx.lineTo(enemy.x + enemy.radius * 0.8, enemy.y + 8);
        ctx.lineTo(enemy.x - enemy.radius * 0.8, enemy.y + 8);
        ctx.closePath();
        ctx.fill();

        // Antennas
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2.5;
        for (let side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(enemy.x + side * 8, enemy.y - 36);
          ctx.quadraticCurveTo(enemy.x + side * 22, enemy.y - 50, enemy.x + side * 18, enemy.y - 58);
          ctx.stroke();
          ctx.fillStyle = '#00f0ff';
          ctx.beginPath();
          ctx.arc(enemy.x + side * 18, enemy.y - 58, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Eyes
        ctx.fillStyle = '#000000';
        const eyeOffsets = [{ dx: -14, dy: -14 }, { dx: 0, dy: -24 }, { dx: 14, dy: -14 }];
        eyeOffsets.forEach(pos => {
          ctx.beginPath();
          ctx.arc(enemy.x + pos.dx, enemy.y + pos.dy, 6, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = '#ff007f';
        eyeOffsets.forEach(pos => {
          ctx.beginPath();
          ctx.arc(enemy.x + pos.dx, enemy.y + pos.dy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      else if (subtype === 'kraken') {
        // --- 2. KRAKEN BOSS (Floor 2: Heavy Brass Tank + Yellow Kraken) ---
        // Spaceship base (Heavy angular spikes)
        ctx.fillStyle = '#4e342e'; // dark brass/brown
        ctx.strokeStyle = '#ffb74d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Angular armor hull
        ctx.moveTo(enemy.x - enemy.radius * 1.5, enemy.y + 15);
        ctx.lineTo(enemy.x - enemy.radius * 1.2, enemy.y - 5);
        ctx.lineTo(enemy.x + enemy.radius * 1.2, enemy.y - 5);
        ctx.lineTo(enemy.x + enemy.radius * 1.5, enemy.y + 15);
        ctx.lineTo(enemy.x + enemy.radius * 0.7, enemy.y + 22);
        ctx.lineTo(enemy.x - enemy.radius * 0.7, enemy.y + 22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Industrial orange glowing ports
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(enemy.x - 20, enemy.y + 10, 4, 0, Math.PI * 2);
        ctx.arc(enemy.x + 20, enemy.y + 10, 4, 0, Math.PI * 2);
        ctx.fill();

        // 4 Heavy Gun Barrels pointing downwards
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 6;
        for (let offset of [-45, -20, 20, 45]) {
          ctx.beginPath();
          ctx.moveTo(enemy.x + offset, enemy.y + 12);
          ctx.lineTo(enemy.x + offset * 1.1, enemy.y + 26);
          ctx.stroke();
        }

        // Kraken Tentacles (thick orange/yellow wrapping loop)
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 5.0;
        const wave = Math.sin((enemy.patternTimer || 0) * 0.004) * 8;
        for (let side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(enemy.x + side * 15, enemy.y + 18);
          // Loop tentacles outwards to sides
          ctx.quadraticCurveTo(enemy.x + side * 55 + wave, enemy.y + 30, enemy.x + side * 45 + wave, enemy.y + 52);
          ctx.quadraticCurveTo(enemy.x + side * 30 + wave, enemy.y + 60, enemy.x + side * 15, enemy.y + 45);
          ctx.stroke();
        }

        // Kraken Head (Yellow/Orange organic lump)
        ctx.fillStyle = '#ffc107';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 12, enemy.radius * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Massive Double Yellow Glowing Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(enemy.x - 12, enemy.y - 12, 9, 0, Math.PI * 2);
        ctx.arc(enemy.x + 12, enemy.y - 12, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(enemy.x - 12, enemy.y - 12, 4.5, 0, Math.PI * 2);
        ctx.arc(enemy.x + 12, enemy.y - 12, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      else if (subtype === 'voidlord') {
        // --- 3. VOIDLORD BOSS (Floor 3: Sharp Star Cruiser + Purple Voidlord) ---
        // Star-shaped sharp black cruiser hull
        ctx.fillStyle = '#120b24'; // almost black deep purple
        ctx.strokeStyle = '#d500f9'; // neon violet
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        // Draw sharp star wings
        ctx.moveTo(enemy.x, enemy.y - 15);
        ctx.lineTo(enemy.x + enemy.radius * 1.9, enemy.y + 5); // Right wing tip
        ctx.lineTo(enemy.x + enemy.radius * 0.9, enemy.y + 12);
        ctx.lineTo(enemy.x, enemy.y + 28); // Bottom tail
        ctx.lineTo(enemy.x - enemy.radius * 0.9, enemy.y + 12);
        ctx.lineTo(enemy.x - enemy.radius * 1.9, enemy.y + 5); // Left wing tip
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pulsing dark void core in center of ship
        const coreSize = 6 + Math.sin((enemy.patternTimer || 0) * 0.01) * 2;
        ctx.fillStyle = '#d500f9';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y + 8, coreSize, 0, Math.PI * 2);
        ctx.fill();

        // Sharp void weapon nozzles on wingtips
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(enemy.x - enemy.radius * 1.9, enemy.y + 5);
        ctx.lineTo(enemy.x - enemy.radius * 2.2, enemy.y + 14);
        ctx.moveTo(enemy.x + enemy.radius * 1.9, enemy.y + 5);
        ctx.lineTo(enemy.x + enemy.radius * 2.2, enemy.y + 14);
        ctx.stroke();

        // Purple phantasmal tentacles (long, thin, with glowing cyan tips)
        ctx.strokeStyle = '#bc13fe';
        ctx.lineWidth = 2.5;
        const wave = Math.sin((enemy.patternTimer || 0) * 0.005) * 10;
        for (let i = -3; i <= 3; i++) {
          if (i === 0) continue;
          ctx.beginPath();
          ctx.moveTo(enemy.x + i * 8, enemy.y + 15);
          ctx.quadraticCurveTo(enemy.x + i * 20 + wave * i, enemy.y + 35, enemy.x + i * 15 + wave * 0.5, enemy.y + 60);
          ctx.stroke();

          // Glowing tips
          ctx.fillStyle = '#00e5ff';
          ctx.beginPath();
          ctx.arc(enemy.x + i * 15 + wave * 0.5, enemy.y + 60, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Voidlord Head (Ghostly purple cluster)
        ctx.fillStyle = '#bc13fe';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 18, enemy.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // One giant central eye + 2 tiny side eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 18, 7, 0, Math.PI * 2); // main
        ctx.arc(enemy.x - 11, enemy.y - 20, 3, 0, Math.PI * 2); // left
        ctx.arc(enemy.x + 11, enemy.y - 20, 3, 0, Math.PI * 2); // right
        ctx.fill();

        ctx.fillStyle = '#00e5ff'; // glowing cyan pupils
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 18, 3, 0, Math.PI * 2);
        ctx.arc(enemy.x - 11, enemy.y - 20, 1, 0, Math.PI * 2);
        ctx.arc(enemy.x + 11, enemy.y - 20, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Health bar for Boss (Unified drawing)
      const barW = 200;
      const barH = 8;
      const barX = enemy.x - barW / 2;
      const barY = enemy.y - enemy.radius - 28;

      // bg
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);

      // fg
      const pct = Math.max(0, enemy.health / enemy.maxHealth);
      ctx.fillStyle = enemy.color;
      ctx.fillRect(barX, barY, barW * pct, barH);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    ctx.restore();
  });

  // Draw Player Projectiles (Glass Shards)
  projectiles.forEach(p => {
    ctx.save();
    ctx.fillStyle = p.color;

    // Draw triangular shards
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - p.radius);
    ctx.lineTo(p.x + p.radius * 0.7, p.y + p.radius * 0.7);
    ctx.lineTo(p.x - p.radius * 0.7, p.y + p.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // Draw Enemy Projectiles (Alien Slime Ball / Laser)
  enemyProjectiles.forEach(p => {
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw Particles
  particles.forEach(p => {
    ctx.save();

    const maxLife = p.initialLife || 1000;
    const alpha = Math.max(0, p.life / maxLife);
    ctx.globalAlpha = alpha;

    if (p.type === 'glass') {
      ctx.fillStyle = '#e0f7fa';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
      ctx.lineWidth = 1;

      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.beginPath();
      ctx.moveTo(0, -p.radius);
      ctx.lineTo(p.radius, p.radius);
      ctx.lineTo(-p.radius, p.radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.type === 'confetti') {
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.beginPath();
      ctx.rect(-p.radius, -p.radius * 0.5, p.radius * 2, p.radius);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });

  // Draw Floating Damage & Bonus text
  floatTexts.forEach(t => {
    ctx.save();
    ctx.font = `900 ${t.size}px ${t.color.includes('ff007f') || t.color.includes('ff0000') ? 'Orbitron' : 'Outfit'}`;
    ctx.fillStyle = t.color;
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  });

  ctx.restore();
}

function drawGlassPlatform() {
  const currentFloor = FLOORS[(floorIndex - 1) % FLOORS.length];
  // Semi-reflective futuristic grid platform
  ctx.save();

  // Platform Surface fill
  ctx.fillStyle = currentFloor.ambientColor;
  ctx.fillRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);

  // Glowing boundary lines
  ctx.strokeStyle = currentFloor.borderColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);

  // Sub grid lines for neon look
  ctx.strokeStyle = currentFloor.gridColor;
  ctx.lineWidth = 1;
  const gridSize = 40;

  for (let x = ARENA.x + gridSize; x < ARENA.x + ARENA.w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, ARENA.y);
    ctx.lineTo(x, ARENA.y + ARENA.h);
    ctx.stroke();
  }

  for (let y = ARENA.y + gridSize; y < ARENA.y + ARENA.h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(ARENA.x, y);
    ctx.lineTo(ARENA.x + ARENA.w, y);
    ctx.stroke();
  }

  // Draw some reflective glass crack patterns on the floor for theme details
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Fixed cracks in corner
  ctx.moveTo(ARENA.x + 100, ARENA.y);
  ctx.lineTo(ARENA.x + 140, ARENA.y + 40);
  ctx.lineTo(ARENA.x + 120, ARENA.y + 80);
  ctx.moveTo(ARENA.x + 140, ARENA.y + 40);
  ctx.lineTo(ARENA.x + 200, ARENA.y + 50);

  ctx.moveTo(ARENA.x + ARENA.w - 100, ARENA.y + ARENA.h);
  ctx.lineTo(ARENA.x + ARENA.w - 140, ARENA.y + ARENA.h - 40);
  ctx.lineTo(ARENA.x + ARENA.w - 120, ARENA.y + ARENA.h - 80);
  ctx.stroke();

  ctx.restore();
}

function drawDoors() {
  doors.forEach(door => {
    ctx.save();
    if (door.type === 'portal') {
      // Spinning galactic wormhole/portal in center
      door.angle += 0.03;

      ctx.translate(door.x, door.y);
      ctx.rotate(door.angle);

      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, door.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#00f0ff');
      grad.addColorStop(0.7, '#ff007f');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Draw spiral shape
      ctx.arc(0, 0, door.radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Glass Sliding Door on Right wall
      ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;

      ctx.fillRect(door.x - 5, door.y - door.h / 2, door.w, door.h);
      ctx.strokeRect(door.x - 5, door.y - door.h / 2, door.w, door.h);

      // Arrow indicator pointing to exit
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(door.x - 10, door.y - 6);
      ctx.lineTo(door.x, door.y);
      ctx.lineTo(door.x - 10, door.y + 6);
      ctx.fill();
    }
    ctx.restore();
  });
}

// --- Main Game Loop ---
let lastTime = 0;
function gameLoop(time) {
  if (!lastTime) lastTime = time;
  const dt = time - lastTime;
  lastTime = time;

  // Cap DT to prevent calculations jumping on background tabs
  const cappedDt = Math.min(dt, 100);

  update(cappedDt);
  draw();

  requestAnimationFrame(gameLoop);
}

// Start visual tick
requestAnimationFrame(gameLoop);

// --- Responsive Sizing & Proportional Scaling for Mobile/iPad ---
function resizeGame() {
  const wrapper = document.getElementById('game-wrapper');
  if (!wrapper) return;

  const targetWidth = 900;
  const targetHeight = 600;

  // Add small padding to prevent clipping on edge-to-edge device screens
  const windowWidth = window.innerWidth - 16;
  const windowHeight = window.innerHeight - 16;

  const scaleX = windowWidth / targetWidth;
  const scaleY = windowHeight / targetHeight;

  // Choose the lower scale to fully fit the window, upscaling is allowed on larger screens
  const scale = Math.min(scaleX, scaleY);

  // Apply the CSS scale transformation
  wrapper.style.transform = `scale(${scale})`;
  wrapper.style.transformOrigin = 'center';
}

// Event Listeners for window resize and orientation changes
window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', resizeGame);
// Run on initial load
window.addEventListener('DOMContentLoaded', resizeGame);
resizeGame();

// --- Mobile Touch Joystick Input Emulation (Brawl Stars Style) ---
function initTouchControls() {
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
  if (isTouchDevice) {
    document.body.classList.add('is-touch');
  }

  const container = document.getElementById('game-container');
  if (!container) return;

  const leftJoy = document.getElementById('joystick-left');
  const rightJoy = document.getElementById('joystick-right');
  const leftKnob = leftJoy ? leftJoy.querySelector('.joystick-knob') : null;
  const rightKnob = rightJoy ? rightJoy.querySelector('.joystick-knob') : null;

  const maxDistance = 50; // Max drag radius in pixels

  // Helper to get touch coordinates relative to game-container client rect
  function getContainerCoords(touch) {
    const rect = container.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  container.addEventListener('touchstart', (e) => {
    if (gameState !== STATE.PLAYING) return;
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const coords = getContainerCoords(touch);

      // Left half is movement joystick
      if (coords.x < window.innerWidth / 2) {
        if (!joystickLeft.active) {
          joystickLeft.active = true;
          joystickLeft.touchId = touch.identifier;
          joystickLeft.startX = coords.x;
          joystickLeft.startY = coords.y;
          joystickLeft.vx = 0;
          joystickLeft.vy = 0;

          if (leftJoy) {
            leftJoy.style.left = `${coords.x}px`;
            leftJoy.style.top = `${coords.y}px`;
            leftJoy.classList.add('active');
            if (leftKnob) {
              leftKnob.style.transform = 'translate(-50%, -50%)';
            }
          }
        }
      }
      // Right half is shooting joystick
      else {
        if (!joystickRight.active) {
          joystickRight.active = true;
          joystickRight.touchId = touch.identifier;
          joystickRight.startX = coords.x;
          joystickRight.startY = coords.y;
          joystickRight.vx = 0;
          joystickRight.vy = 0;

          if (rightJoy) {
            rightJoy.style.left = `${coords.x}px`;
            rightJoy.style.top = `${coords.y}px`;
            rightJoy.classList.add('active');
            if (rightKnob) {
              rightKnob.style.transform = 'translate(-50%, -50%)';
            }
          }
        }
      }
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    if (gameState !== STATE.PLAYING) return;
    e.preventDefault();

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const coords = getContainerCoords(touch);

      if (joystickLeft.active && touch.identifier === joystickLeft.touchId) {
        let dx = coords.x - joystickLeft.startX;
        let dy = coords.y - joystickLeft.startY;
        const dist = Math.hypot(dx, dy);

        if (dist > maxDistance) {
          dx = (dx / dist) * maxDistance;
          dy = (dy / dist) * maxDistance;
        }

        joystickLeft.vx = dx / maxDistance;
        joystickLeft.vy = dy / maxDistance;

        if (leftKnob) {
          leftKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        }
      }
      else if (joystickRight.active && touch.identifier === joystickRight.touchId) {
        let dx = coords.x - joystickRight.startX;
        let dy = coords.y - joystickRight.startY;
        const dist = Math.hypot(dx, dy);

        if (dist > maxDistance) {
          dx = (dx / dist) * maxDistance;
          dy = (dy / dist) * maxDistance;
        }

        joystickRight.vx = dx / maxDistance;
        joystickRight.vy = dy / maxDistance;

        if (rightKnob) {
          rightKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        }
      }
    }
  }, { passive: false });

  const handleTouchEnd = (e) => {
    if (gameState === STATE.PLAYING) {
      e.preventDefault();
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (joystickLeft.active && touch.identifier === joystickLeft.touchId) {
        joystickLeft.active = false;
        joystickLeft.touchId = null;
        joystickLeft.vx = 0;
        joystickLeft.vy = 0;
        if (leftJoy) {
          leftJoy.classList.remove('active');
        }
      }
      else if (joystickRight.active && touch.identifier === joystickRight.touchId) {
        joystickRight.active = false;
        joystickRight.touchId = null;
        joystickRight.vx = 0;
        joystickRight.vy = 0;
        if (rightJoy) {
          rightJoy.classList.remove('active');
        }
      }
    }
  };

  container.addEventListener('touchend', handleTouchEnd, { passive: false });
  container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  // Disable pinch-to-zoom gestures completely on iOS Safari
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());
}

// Initialize touch controls
initTouchControls();
