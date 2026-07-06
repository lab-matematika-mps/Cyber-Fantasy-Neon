/**
 * MATH TUG OF WAR: BATTLE OF NUMBERS
 * Pure client-side JS Engine with Synthetic Web Audio API System
 */

// --- STATE MANAGEMENT GAME ---
const gameState = {
    audioEnabled: true,
    playerName: "Player",
    playerRace: "manusia",
    playerRaceChar: "👨",
    playerRaceColor: "#00f0ff",
    enemyId: "robot_jahat",
    enemyChar: "🤖",
    enemyName: "Robot Jahat",
    difficulty: "Mudah",
    scoreRight: 0,
    scoreWrong: 0,
    comboCount: 0,
    ropePosition: 50, // 0 = Player Maksimal Menang, 100 = Musuh Maksimal Menang
    currentTime: 0,
    timerInterval: null,
    aiInterval: null,
    currentAnswer: 0,
    gameActive: false,
    startTime: 0
};

// --- DATA KONFIGURASI GAME ---
const ENEMY_CONFIG = {
    robot_jahat: { name: "Robot Jahat", char: "🤖", accuracy: 0.65, minTime: 5000, maxTime: 8000, diff: "Mudah" },
    godzilla: { name: "Godzilla", char: "🦖", accuracy: 0.80, minTime: 3000, maxTime: 6000, diff: "Sedang" },
    raksasa: { name: "Raksasa", char: "👹", accuracy: 0.92, minTime: 2000, maxTime: 4000, diff: "Sulit" }
};

// --- WEB AUDIO API SYNTHESIZER ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSynthSound(type) {
    if (!gameState.audioEnabled) return;
    
    // Resume context jika tertahan kebijakan browser
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch (type) {
        case 'pop': // Klik Tombol biasa
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
            
        case 'ding': // Jawaban Benar
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
            break;

        case 'buzz': // Jawaban Salah
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.linearRampToValueAtTime(60, now + 0.25);
            gainNode.gain.setValueAtTime(0.25, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
            break;

        case 'whoosh': // Pemain Menarik Tali
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;

        case 'heavy_pull': // Musuh Menarik Tali
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;

        case 'victory': // Musik Menang Singkat
            osc.type = 'sine';
            const notes = [523, 587, 659, 698, 784, 880, 988, 1046];
            notes.forEach((freq, index) => {
                const stepOsc = audioCtx.createOscillator();
                const stepGain = audioCtx.createGain();
                stepOsc.type = 'sine';
                stepOsc.frequency.setValueAtTime(freq, now + (index * 0.08));
                stepGain.gain.setValueAtTime(0.15, now + (index * 0.08));
                stepGain.gain.linearRampToValueAtTime(0, now + (index * 0.08) + 0.15);
                stepOsc.connect(stepGain);
                stepGain.connect(audioCtx.destination);
                stepOsc.start(now + (index * 0.08));
                stepOsc.stop(now + (index * 0.08) + 0.15);
            });
            break;

        case 'gameover': // Musik Kalah Singkat (Sad Trombone)
            osc.type = 'sawtooth';
            const lowNotes = [300, 280, 260, 200];
            lowNotes.forEach((freq, index) => {
                const stepOsc = audioCtx.createOscillator();
                const stepGain = audioCtx.createGain();
                stepOsc.frequency.setValueAtTime(freq, now + (index * 0.15));
                stepGain.gain.setValueAtTime(0.2, now + (index * 0.15));
                stepGain.gain.linearRampToValueAtTime(0, now + (index * 0.15) + 0.2);
                stepOsc.connect(stepGain);
                stepGain.connect(audioCtx.destination);
                stepOsc.start(now + (index * 0.15));
                stepOsc.stop(now + (index * 0.15) + 0.2);
            });
            break;
    }
}

// --- ENGINE BACKGROUND ENGINE PARTIKEL NEON ---
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.6 - 0.3;
        this.speedY = Math.random() * 0.6 - 0.3;
        this.colors = ['#00f0ff', '#9d00ff', '#ff007f', '#00ffff', '#39ff14'];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.alpha = Math.random() * 0.5 + 0.2;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < 45; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}
initParticles();
animateParticles();

// --- SISTEM NAVIGASI DAN TRANSISI Halaman ---
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.add('active');
    }
}

// SIMULASI LOADING SCREEN
window.addEventListener('DOMContentLoaded', () => {
    let progress = 0;
    const progressFill = document.getElementById('loadingProgress');
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                navigateTo('landingPage');
            }, 400);
        }
        progressFill.style.width = `${progress}%`;
    }, 80);
});

// --- EVENT BINDING INTERFACE ---
document.getElementById('btnStartAdventure').addEventListener('click', () => {
    playSynthSound('pop');
    navigateTo('setupPage');
});

document.getElementById('btnHelp').addEventListener('click', () => {
    playSynthSound('pop');
    document.getElementById('helpModal').classList.remove('hidden');
});

document.getElementById('btnCloseHelp').addEventListener('click', () => {
    playSynthSound('pop');
    document.getElementById('helpModal').classList.add('hidden');
});

document.getElementById('btnToggleSound').addEventListener('click', () => {
    gameState.audioEnabled = !gameState.audioEnabled;
    document.getElementById('btnToggleSound').textContent = `SOUND: ${gameState.audioEnabled ? 'ON' : 'OFF'}`;
    playSynthSound('pop');
});

// Pilihan Ras Hero
const raceCards = document.querySelectorAll('.race-card');
raceCards.forEach(card => {
    card.addEventListener('click', () => {
        playSynthSound('pop');
        raceCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        gameState.playerRace = card.getAttribute('data-race');
        gameState.playerRaceChar = card.querySelector('.race-avatar').textContent;
        gameState.playerRaceColor = card.getAttribute('data-color');
    });
});

document.getElementById('btnNextToEnemy').addEventListener('click', () => {
    playSynthSound('pop');
    const nameInput = document.getElementById('playerNameInput').value.trim();
    gameState.playerName = nameInput !== "" ? nameInput : "Cyber Hero";
    navigateTo('enemyPage');
});

document.getElementById('btnBackToSetup').addEventListener('click', () => {
    playSynthSound('pop');
    navigateTo('setupPage');
});

// Pilihan Musuh Arena
const enemyCards = document.querySelectorAll('.enemy-card');
enemyCards.forEach(card => {
    card.addEventListener('click', () => {
        playSynthSound('pop');
        enemyCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        const enemyId = card.getAttribute('data-enemy');
        const conf = ENEMY_CONFIG[enemyId];
        gameState.enemyId = enemyId;
        gameState.enemyChar = conf.char;
        gameState.enemyName = conf.name;
        gameState.difficulty = conf.diff;
    });
});
// Pilih default musuh pertama kali
if (enemyCards.length > 0) enemyCards[0].classList.add('selected');

document.getElementById('btnStartBattle').addEventListener('click', () => {
    playSynthSound('pop');
    startBattleSequence();
});

// --- MATEMATIKA ENGINE GENERATOR ---
const NOMINAL_BANK = [2500, 5000, 8000, 12000, 15000, 18000, 20000, 25000, 30000, 35000, 45000, 50000, 60000, 70000, 75000, 80000, 95000, 125000];

function generateQuestion(diff) {
    let text = "";
    let ans = 0;

    if (diff === "Mudah") {
        // Penjumlahan / Pengurangan nominal bersih
        const isPlus = Math.random() > 0.5;
        const val1 = NOMINAL_BANK[Math.floor(Math.random() * (NOMINAL_BANK.length / 2)) + 4]; // Ambil nominal sedang keatas
        const val2 = NOMINAL_BANK[Math.floor(Math.random() * 4)]; // Ambil nominal kecil

        if (isPlus) {
            text = `${val1.toLocaleString('id-ID')} + ${val2.toLocaleString('id-ID')}`;
            ans = val1 + val2;
        } else {
            text = `${val1.toLocaleString('id-ID')} - ${val2.toLocaleString('id-ID')}`;
            ans = val1 - val2;
        }
    } else if (diff === "Sedang") {
        // Perkalian 2 digit (dibawah 30) x 1 digit (2 s/d 9)
        const digit2 = Math.floor(Math.random() * 18) + 11; // 11 s/d 29
        const digit1 = Math.floor(Math.random() * 8) + 2;   // 2 s/d 9
        text = `${digit2} × ${digit1}`;
        ans = digit2 * digit1;
    } else {
        // Pembagian bulat tanpa sisa
        const div1 = Math.floor(Math.random() * 8) + 2; // Pembagi: 2 s/d 9
        const ansTemp = Math.floor(Math.random() * 9) + 4; // Hasil: 4 s/d 12
        const total = div1 * ansTemp;
        text = `${total} ÷ ${div1}`;
        ans = ansTemp;
    }

    gameState.currentAnswer = ans;
    document.getElementById('questionText').textContent = text;
}

// --- GAMEPLAY SESSIONS MANAGEMENT ---
function startBattleSequence() {
    // Sinkronisasi HUD Data awal
    document.getElementById('hudPlayerName').textContent = gameState.playerName;
    document.getElementById('hudPlayerRace').textContent = gameState.playerRaceChar;
    document.getElementById('hudEnemyName').textContent = gameState.enemyName;
    document.getElementById('hudEnemyAvatar').textContent = gameState.enemyChar;
    
    document.getElementById('playerCharacter').textContent = gameState.playerRaceChar;
    document.getElementById('enemyCharacter').textContent = gameState.enemyChar;

    // Reset Variable Utama Game
    gameState.scoreRight = 0;
    gameState.scoreWrong = 0;
    gameState.comboCount = 0;
    gameState.ropePosition = 50;
    gameState.currentTime = 0;
    gameState.gameActive = false;
    
    document.getElementById('countRight').textContent = "0";
    document.getElementById('countWrong').textContent = "0";
    document.getElementById('comboDisplay').className = "combo-hide";
    updateRopeUI();

    navigateTo('gamePage');
    
    // Trigger Sesi Hitung Mundur (3..2..1..)
    const countdownOverlay = document.getElementById('countdownOverlay');
    const countdownText = document.getElementById('countdownText');
    countdownOverlay.classList.remove('hidden');
    
    let count = 3;
    countdownText.textContent = count;
    
    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
            playSynthSound('pop');
        } else if (count === 0) {
            countdownText.textContent = "BATTLE!";
            playSynthSound('ding');
        } else {
            clearInterval(countInterval);
            countdownOverlay.classList.add('hidden');
            actualGameStart();
        }
    }, 850);
}

function actualGameStart() {
    gameState.gameActive = true;
    gameState.startTime = Date.now();
    
    // Focus otomatis input user
    const inputField = document.getElementById('answerInput');
    inputField.value = "";
    inputField.focus();

    // Jalankan kalkulator Timer HUD
    gameState.timerInterval = setInterval(() => {
        gameState.currentTime++;
        const mins = Math.floor(gameState.currentTime / 60).toString().padStart(2, '0');
        const secs = (gameState.currentTime % 60).toString().padStart(2, '0');
        document.getElementById('gameTimer').textContent = `${mins}:${secs}`;
    }, 1000);

    generateQuestion(gameState.difficulty);
    scheduleEnemyAI();
}

// --- SISTEM ROBOT AI EMULASI TIMING ---
function scheduleEnemyAI() {
    if (!gameState.gameActive) return;
    if (gameState.aiInterval) clearTimeout(gameState.aiInterval);

    const config = ENEMY_CONFIG[gameState.enemyId];
    // Random delay range sesuai level musuh
    const randomDelay = Math.floor(Math.random() * (config.maxTime - config.minTime)) + config.minTime;

    gameState.aiInterval = setTimeout(() => {
        if (!gameState.gameActive) return;

        // Cek kalkulasi akurasi keberhasilan AI
        const rollDice = Math.random();
        if (rollDice <= config.accuracy) {
            // AI sukses menarik tali ke kanan
            gameState.ropePosition += (4 + Math.floor(Math.random() * 3)); // Geser 4-6 poin ke kanan
            playSynthSound('heavy_pull');
            triggerVisualEffect("⚠️ Musuh Menarik!", false);
            
            // Animasi tarikan musuh
            const eChar = document.getElementById('enemyCharacter');
            eChar.classList.remove('idle-anim');
            eChar.classList.add('pull-right-anim');
            setTimeout(() => { eChar.classList.remove('pull-right-anim'); eChar.classList.add('idle-anim'); }, 300);

            updateRopeUI();
            checkVictoryCondition();
        }
        // Jadwalkan aksi AI berikutnya
        scheduleEnemyAI();
    }, randomDelay);
}

// --- INTERAKSI INPUT PLAYER ---
document.getElementById('answerInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        processPlayerAnswer();
    }
});

let lastAnswerTime = Date.now();
function processPlayerAnswer() {
    if (!gameState.gameActive) return;

    const inputElement = document.getElementById('answerInput');
    const playerAns = parseInt(inputElement.value, 10);
    inputElement.value = ""; // Bersihkan kolom seketika
    inputElement.focus();

    if (isNaN(playerAns)) return;

    const timeTaken = Date.now() - lastAnswerTime;
    lastAnswerTime = Date.now();

    if (playerAns === gameState.currentAnswer) {
        // JAWABAN BENAR
        gameState.scoreRight++;
        gameState.comboCount++;
        document.getElementById('countRight').textContent = gameState.scoreRight;

        // Kalkulasi kekuatan tarikan (Mekanisme bonus Combo)
        let pullPower = 5;
        if (gameState.comboCount >= 3) {
            pullPower += Math.min(gameState.comboCount - 2, 5); // Maksimal bonus +5 power tarikan
        }

        gameState.ropePosition -= pullPower; // Bergerak ke kiri (Mendekati sisi Player)
        playSynthSound('ding');
        playSynthSound('whoosh');

        // Tampilkan HUD Combo text jika beruntun
        const comboHUD = document.getElementById('comboDisplay');
        if (gameState.comboCount >= 2) {
            comboHUD.textContent = `COMBO x${gameState.comboCount}`;
            comboHUD.className = "animate-pulse";
        }

        // Fitur Tambahan Efek "Perfect!" Jika kecepatan super dibawah 2 detik
        if (timeTaken < 2200) {
            triggerVisualEffect("🌟 PERFECT! 🌟", true);
        } else {
            triggerVisualEffect("⚡ BENAR! ⚡", true);
        }

        // Animasi Hero menarik tali
        const pChar = document.getElementById('playerCharacter');
        pChar.classList.remove('idle-anim');
        pChar.classList.add('pull-left-anim');
        setTimeout(() => { pChar.classList.remove('pull-left-anim'); pChar.classList.add('idle-anim'); }, 300);

        // Efek Layar bergetar (Screen Shake)
        const gameScreen = document.getElementById('gamePage');
        gameScreen.classList.add('shake');
        setTimeout(() => gameScreen.classList.remove('shake'), 300);

    } else {
        // JAWABAN SALAH
        gameState.scoreWrong++;
        gameState.comboCount = 0; // Reset total kombo runtuh
        document.getElementById('countWrong').textContent = gameState.scoreWrong;
        
        document.getElementById('comboDisplay').className = "combo-hide";
        playSynthSound('buzz');
        triggerVisualEffect("❌ SALAH", false);

        // Karakter Kecewa
        const pChar = document.getElementById('playerCharacter');
        pChar.classList.remove('idle-anim');
        pChar.classList.add('disappoint-anim');
        setTimeout(() => { pChar.classList.remove('disappoint-anim'); pChar.classList.add('idle-anim'); }, 400);
    }

    updateRopeUI();
    const isGameOver = checkVictoryCondition();
    
    // Jika game masih berlanjut, lempar soal berikutnya secara instan
    if (!isGameOver) {
        generateQuestion(gameState.difficulty);
    }
}

// --- UPDATE INDIKATOR TALI & FINISH LINE ---
function updateRopeUI() {
    // Amankan batas posisi variable di range 0 s/d 100
    if (gameState.ropePosition < 0) gameState.ropePosition = 0;
    if (gameState.ropePosition > 100) gameState.ropePosition = 100;

    const currentPos = gameState.ropePosition;
    
    // Hubungkan perubahan ke CSS DOM element visual
    document.getElementById('ropeMarker').style.left = `${currentPos}%`;
    document.getElementById('ropeCenterKnot').style.left = `${currentPos}%`;

    const fillBar = document.getElementById('ropeProgressFill');
    if (currentPos < 50) {
        // Tali condong mengarah ke sisi kiri (Player Untung)
        fillBar.style.left = `${currentPos}%`;
        fillBar.style.width = `${50 - currentPos}%`;
        fillBar.style.backgroundColor = "var(--neon-blue)";
    } else {
        // Tali condong mengarah ke kanan (Musuh Untung)
        fillBar.style.left = "50%";
        fillBar.style.width = `${currentPos - 50}%`;
        fillBar.style.backgroundColor = "var(--neon-pink)";
    }
}

// --- POP-UP EFFECT ENGINE TRIGGER ---
function triggerVisualEffect(text, isPositive) {
    const layer = document.getElementById('effectPopUp');
    const pop = document.createElement('div');
    pop.className = 'pop-effect';
    pop.textContent = text;
    pop.style.color = isPositive ? 'var(--neon-green)' : 'var(--neon-pink)';
    pop.style.textShadow = isPositive ? '0 0 10px var(--neon-green)' : '0 0 10px var(--neon-pink)';
    
    // Acak posisi kemunculan sekitar area tengah panel soal
    pop.style.left = `${Math.floor(Math.random() * 60) + 20}%`;
    pop.style.top = `${Math.floor(Math.random() * 30) - 10}px`;
    
    layer.appendChild(pop);
    setTimeout(() => pop.remove(), 600);
}

// --- EVALUASI AKHIR GAME (VICTORY / DEFEAT) ---
function checkVictoryCondition() {
    let finished = false;
    let playerWon = false;

    // Batas kemenangan mutlak finish line: Player (<= 15) vs AI (>= 85)
    if (gameState.ropePosition <= 15) {
        finished = true;
        playerWon = true;
    } else if (gameState.ropePosition >= 85) {
        finished = true;
        playerWon = false;
    }

    if (finished) {
        endTheBattle(playerWon);
    }
    return finished;
}

function endTheBattle(playerWon) {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    clearTimeout(gameState.aiInterval);

    const totalSeconds = gameState.currentTime;
    const totalQuestions = gameState.scoreRight + gameState.scoreWrong;
    
    // Hitung persentase tingkat akurasi hitung cepat
    let accuracyPct = totalQuestions > 0 ? Math.round((gameState.scoreRight / totalQuestions) * 100) : 0;

    // --- SISTEM PENENTUAN RANKING GRADASI (S, A, B, C) ---
    let rank = "C";
    if (playerWon) {
        if (accuracyPct >= 90 && totalSeconds <= 45) rank = "S";
        else if (accuracyPct >= 75 && totalSeconds <= 75) rank = "A";
        else rank = "B";
    } else {
        rank = "C";
    }

    // Set Teks UI hasil akhir pertandingan
    const mainTitle = document.getElementById('victoryDefeatTitle');
    const showAvatar = document.getElementById('endCharacterShow');
    
    if (playerWon) {
        mainTitle.textContent = "🏆 VICTORY!";
        mainTitle.className = "neon-text-blue animate-pulse";
        showAvatar.textContent = "🎉";
        playSynthSound('victory');
    } else {
        mainTitle.textContent = "💀 TRY AGAIN!";
        mainTitle.className = "neon-text-pink animate-pulse";
        showAvatar.textContent = "😂";
        playSynthSound('gameover');
    }

    document.getElementById('rankBadge').textContent = rank;
    document.getElementById('resName').textContent = gameState.playerName;
    document.getElementById('resAccuracy').textContent = `${accuracyPct}%`;
    document.getElementById('resRight').textContent = gameState.scoreRight;
    document.getElementById('resWrong').textContent = gameState.scoreWrong;
    document.getElementById('resTime').textContent = `${totalSeconds} detik`;

    // --- SISTEM MANAGEMENT HIGH SCORE (LOCAL STORAGE) ---
    const storageKey = `highScore_tugofwar_${gameState.difficulty}`;
    let savedHighScore = localStorage.getItem(storageKey) ? parseInt(localStorage.getItem(storageKey), 10) : 0;

    if (playerWon && gameState.scoreRight > savedHighScore) {
        savedHighScore = gameState.scoreRight;
        localStorage.setItem(storageKey, savedHighScore);
    }
    document.getElementById('highScoreVal').textContent = `${savedHighScore} Skor Benar (${gameState.difficulty})`;

    navigateTo('scoreBoardPage');
}

// --- TOMBOL INTERAKSI HASIL AKHIR ---
document.getElementById('btnPlayAgain').addEventListener('click', () => {
    playSynthSound('pop');
    startBattleSequence();
});

document.getElementById('btnChangeRace').addEventListener('click', () => {
    playSynthSound('pop');
    navigateTo('setupPage');
});

document.getElementById('btnChangeEnemy').addEventListener('click', () => {
    playSynthSound('pop');
    navigateTo('landingPage');
});
