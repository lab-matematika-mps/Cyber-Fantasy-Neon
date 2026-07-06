/**
 * MATH TUG OF WAR - PREMIUM REVISION EDITION
 * Web Audio BGM Generator Synthesizer, Slider Lore, Multiple Choice & Special Skill Effects.
 */

const gameState = {
    audioEnabled: false,
    playerName: "Player",
    playerRace: "manusia",
    playerRaceChar: "👨",
    enemyId: "robot_jahat",
    enemyChar: "🤖",
    enemyName: "Robot Jahat",
    difficulty: "Mudah",
    scoreRight: 0,
    scoreWrong: 0,
    comboCount: 0,
    ropePosition: 50,
    currentTime: 0,
    currentAnswer: 0,
    questionCounter: 0,
    isSpecialQuestion: false,
    gameActive: false,
    // System Status Effect
    enemyStunned: false,
    playerBoostActive: false,
    
    // Engine Control
    timerInterval: null,
    aiInterval: null,
    bgmInterval: null,
    bgmStep: 0
};

// --- DATA LORE UNIK RAS & MUSUH (SLIDER DATA) ---
const RACES_DATA = [
    { id: "manusia", char: "👨", name: "Manusia (Cyber Squad)", lore: "Pasukan adaptasi tinggi yang menguasai algoritma digital bumi kuno.", buff: "KEUNTUNGAN: Bonus tarikan +1 Poin setiap jawaban benar!" },
    { id: "alien", char: "👽", name: "Alien (Cosmic Quant)", lore: "Ksatria Nebula yang menghitung matematika secepat kecepatan cahaya bintang.", buff: "KEUNTUNGAN: Mengurangi waktu pemulihan jika melakukan salah jawab!" },
    { id: "elf", char: "🧝", name: "Elf (Neon Ranger)", lore: "Bangsa immortal penjaga serat optik magis, memiliki refleks super.", buff: "KEUNTUNGAN: Peluang 25% melipatgandakan efek Soal Spesial!" },
    { id: "dwarf", char: "⚒️", name: "Dwarf (Mecha Smith)", lore: "Penempa mesin tangguh, mampu menahan tarikan seberat meteor.", buff: "KEUNTUNGAN: Tarikan AI musuh dikurangi sebesar 15% beban!" },
    { id: "robot", char: "🤖", name: "Robot Baik (Helper AI)", lore: "Android super ramah yang diprogram untuk perdamaian matematika galaksi.", buff: "KEUNTUNGAN: Tambahan waktu berpikir di mode sulit!" }
];

const ENEMIES_DATA = [
    { id: "robot_jahat", char: "🤖", name: "Robot Jahat", diff: "Mudah", accuracy: 0.65, minTime: 5000, maxTime: 8000, lore: "Mesin kalkulator usang korup yang ingin menghapus seluruh angka nol di dunia.", arena: "Arena: Scrap Cyber Dump" },
    { id: "godzilla", char: "🦖", name: "Godzilla (Kaiju)", diff: "Sedang", accuracy: 0.80, minTime: 3000, maxTime: 6000, lore: "Monster purba yang bermutasi akibat radiasi gelombang server ilegal.", arena: "Arena: Neon Tokyo Ruins" },
    { id: "raksasa", char: "👹", name: "Raksasa (Titan Core)", diff: "Sulit", accuracy: 0.92, minTime: 2000, maxTime: 4000, lore: "Penguasa Cyber Fantasy kuno dengan kekuatan tarikan magis tak tertandingi.", arena: "Arena: Black Hole Nexus" }
];

let currentRaceIdx = 0;
let currentEnemyIdx = 0;

// --- WEB AUDIO API ENGINE (SFX & INSTRUMEN BGM LOOP) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function startBGMSequencer() {
    if (gameState.bgmInterval) clearInterval(gameState.bgmInterval);
    
    // Nada Instrumen Fantasi (Melodi Arpeggio Cyber)
    const melody = [261.63, 293.66, 329.63, 392.00, 329.63, 392.00, 440.00, 523.25]; // C - D - E - G - E - G - A - C
    
    gameState.bgmInterval = setInterval(() => {
        if (!gameState.audioEnabled) return;
        
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'triangle'; 
        // Melodi berjalan otomatis berpola ganti frekuensi
        let currentFreq = melody[gameState.bgmStep % melody.length];
        
        // Buat variasi bass chord pada ketukan tertentu agar berasa instrumen penuh
        if (gameState.bgmStep % 4 === 0) {
            const bassOsc = audioCtx.createOscillator();
            const bassGain = audioCtx.createGain();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(currentFreq / 2, now);
            bassGain.gain.setValueAtTime(0.06, now);
            bassGain.gain.linearRampToValueAtTime(0, now + 0.4);
            bassOsc.connect(bassGain);
            bassGain.connect(audioCtx.destination);
            bassOsc.start(now);
            bassOsc.stop(now + 0.4);
        }

        osc.frequency.setValueAtTime(currentFreq, now);
        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.25);
        
        gameState.bgmStep++;
    }, 250); // Kecepatan tempo instrumen
}

function playSFX(type) {
    if (!gameState.audioEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    switch (type) {
        case 'pop':
            osc.type = 'sine'; osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(550, now + 0.08);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.08);
            osc.start(now); osc.stop(now + 0.08);
            break;
        case 'ding':
            osc.type = 'sine'; osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.setValueAtTime(880, now + 0.07); // A5
            gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
            break;
        case 'buzz':
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(110, now);
            gainNode.gain.setValueAtTime(0.25, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
            break;
        case 'special': // Bunyi Soal Spesial Muncul
            osc.type = 'square'; osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.25);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
            osc.start(now); osc.stop(now + 0.25);
            break;
        case 'victory':
            osc.type = 'sine';
            [440, 554, 659, 880].forEach((f, i) => {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.frequency.setValueAtTime(f, now + (i * 0.1)); g.gain.setValueAtTime(0.15, now + (i * 0.1));
                g.gain.linearRampToValueAtTime(0, now + (i * 0.1) + 0.2); o.connect(g); g.connect(audioCtx.destination);
                o.start(now + (i * 0.1)); o.stop(now + (i * 0.1) + 0.2);
            });
            break;
    }
}

// --- CANVAS BACKGROUND ---
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1; this.speedX = Math.random() * 0.4 - 0.2; this.speedY = Math.random() * 0.4 - 0.2;
        this.color = ['#00f0ff', '#9d00ff', '#ff007f'][Math.floor(Math.random() * 3)]; this.alpha = Math.random() * 0.5 + 0.2;
    }
    update() { this.x += this.speedX; this.y += this.speedY; if (this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height) this.reset(); }
    draw() { ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
}
for (let i = 0; i < 35; i++) particles.push(new Particle());
function animateParticles() { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animateParticles); }
animateParticles();

// --- NAVIGATION SYSTEM ---
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// SIMULASI LOADING SCREEN
window.addEventListener('DOMContentLoaded', () => {
    let p = 0;
    const bar = document.getElementById('loadingProgress');
    const loadInv = setInterval(() => {
        p += Math.floor(Math.random() * 20) + 5;
        if (p >= 100) { p = 100; clearInterval(loadInv); setTimeout(() => navigateTo('landingPage'), 300); }
        bar.style.width = `${p}%`;
    }, 70);
    renderRaceSlide();
    renderEnemySlide();
});

// INTERACTION HANDLERS
document.getElementById('btnStartAdventure').addEventListener('click', () => { playSFX('pop'); navigateTo('setupPage'); });
document.getElementById('btnHelp').addEventListener('click', () => { playSFX('pop'); document.getElementById('helpModal').classList.remove('hidden'); });
document.getElementById('btnCloseHelp').addEventListener('click', () => { playSFX('pop'); document.getElementById('helpModal').classList.add('hidden'); });

document.getElementById('btnToggleSound').addEventListener('click', () => {
    gameState.audioEnabled = !gameState.audioEnabled;
    document.getElementById('btnToggleSound').textContent = `BGM & SFX: ${gameState.audioEnabled ? 'ON' : 'OFF'}`;
    playSFX('pop');
    if (gameState.audioEnabled) startBGMSequencer();
    else clearInterval(gameState.bgmInterval);
});

// --- ENGINE SLIDER RAS ---
function renderRaceSlide() {
    const r = RACES_DATA[currentRaceIdx];
    const container = document.getElementById('raceSliderContainer');
    container.innerHTML = `
        <div class="slide-card">
            <span class="slide-avatar animate-pulse">${r.char}</span>
            <h3>${r.name}</h3>
            <p class="slide-lore">"${r.lore}"</p>
            <p class="slide-buff">${r.buff}</p>
        </div>
    `;
    gameState.playerRace = r.id;
    gameState.playerRaceChar = r.char;
}
document.getElementById('btnPrevRace').addEventListener('click', () => { playSFX('pop'); currentRaceIdx = (currentRaceIdx === 0) ? RACES_DATA.length - 1 : currentRaceIdx - 1; renderRaceSlide(); });
document.getElementById('btnNextRace').addEventListener('click', () => { playSFX('pop'); currentRaceIdx = (currentRaceIdx === RACES_DATA.length - 1) ? 0 : currentRaceIdx + 1; renderRaceSlide(); });

document.getElementById('btnNextToEnemy').addEventListener('click', () => {
    playSFX('pop');
    const inp = document.getElementById('playerNameInput').value.trim();
    gameState.playerName = inp !== "" ? inp : "Cyber Hero";
    navigateTo('enemyPage');
});

// --- ENGINE SLIDER LAWAN ---
function renderEnemySlide() {
    const e = ENEMIES_DATA[currentEnemyIdx];
    const container = document.getElementById('enemySliderContainer');
    container.innerHTML = `
        <div class="slide-card" style="border-color: var(--neon-pink)">
            <span class="slide-avatar" style="transform: scale(1.1);">${e.char}</span>
            <h3 style="color:var(--neon-pink)">${e.name} (${e.diff})</h3>
            <p class="slide-lore">"${e.lore}"</p>
            <p style="font-size:0.8rem; margin-bottom:5px; color:#ffaa00;">Akurasi Koding AI: ${e.accuracy*100}%</p>
            <p style="font-size:0.75rem; color:var(--neon-cyan); font-weight:bold;">${e.arena}</p>
        </div>
    `;
    gameState.enemyId = e.id;
    gameState.enemyChar = e.char;
    gameState.enemyName = e.name;
    gameState.difficulty = e.diff;
}
document.getElementById('btnPrevEnemy').addEventListener('click', () => { playSFX('pop'); currentEnemyIdx = (currentEnemyIdx === 0) ? ENEMIES_DATA.length - 1 : currentEnemyIdx - 1; renderEnemySlide(); });
document.getElementById('btnNextEnemy').addEventListener('click', () => { playSFX('pop'); currentEnemyIdx = (currentEnemyIdx === ENEMIES_DATA.length - 1) ? 0 : currentEnemyIdx + 1; renderEnemySlide(); });

document.getElementById('btnBackToSetup').addEventListener('click', () => { playSFX('pop'); navigateTo('setupPage'); });
document.getElementById('btnStartBattle').addEventListener('click', () => { playSFX('pop'); startBattleSequence(); });


// --- MATEMATIKA MULTIPLE CHOICE ENGINE ---
const NOMINAL_BANK = [2500, 5000, 8000, 12000, 15000, 20000, 25000, 50000, 75000, 100000];

function makeQuestion() {
    gameState.questionCounter++;
    // Tiap kelipatan 3 soal, nyalakan status Soal Spesial
    gameState.isSpecialQuestion = (gameState.questionCounter % 3 === 0);
    
    const label = document.getElementById('specialLabel');
    const panel = document.getElementById('questionPanelBlock');
    
    if (gameState.isSpecialQuestion) {
        label.classList.remove('hidden');
        panel.classList.add('special-panel-active');
        playSFX('special');
    } else {
        label.classList.add('hidden');
        panel.classList.remove('special-panel-active');
    }

    let qText = "";
    let correctAns = 0;
    const diff = gameState.difficulty;

    if (diff === "Mudah") {
        const isPlus = Math.random() > 0.5;
        const v1 = NOMINAL_BANK[Math.floor(Math.random() * 5) + 3];
        const v2 = NOMINAL_BANK[Math.floor(Math.random() * 3)];
        qText = isPlus ? `${v1.toLocaleString('id-ID')} + ${v2.toLocaleString('id-ID')}` : `${v1.toLocaleString('id-ID')} - ${v2.toLocaleString('id-ID')}`;
        correctAns = isPlus ? (v1 + v2) : (v1 - v2);
    } else if (diff === "Sedang") {
        const d2 = Math.floor(Math.random() * 15) + 11; // 11-25
        const d1 = Math.floor(Math.random() * 7) + 3;  // 3-9
        qText = `${d2} × ${d1}`;
        correctAns = d2 * d1;
    } else {
        const div = Math.floor(Math.random() * 7) + 3;
        const ansT = Math.floor(Math.random() * 8) + 4;
        qText = `${div * ansT} ÷ ${div}`;
        correctAns = ansT;
    }

    gameState.currentAnswer = correctAns;
    document.getElementById('questionText').textContent = qText;

    // Generate Pilihan Ganda Palsu (Distractor)
    let options = [correctAns];
    while (options.length < 4) {
        let offset = (Math.floor(Math.random() * 3) + 1) * (diff === "Mudah" ? 2500 : (Math.random() > 0.5 ? 1 : -1));
        let wrongAns = correctAns + offset;
        if (wrongAns > 0 && !options.includes(wrongAns)) {
            options.push(wrongAns);
        }
    }
    // Acak Urutan Pilihan
    options.sort(() => Math.random() - 0.5);

    // Render ke Button UI
    const container = document.getElementById('optionsContainer');
    container.innerHTML = "";
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "btn-option";
        btn.textContent = opt.toLocaleString('id-ID');
        btn.addEventListener('click', () => checkPlayerChoice(opt));
        container.appendChild(btn);
    });
}

// --- CORE GAMEPLAY SESSION ---
function startBattleSequence() {
    document.getElementById('hudPlayerName').textContent = gameState.playerName;
    document.getElementById('hudPlayerRace').textContent = gameState.playerRaceChar;
    document.getElementById('hudEnemyName').textContent = gameState.enemyName;
    document.getElementById('hudEnemyAvatar').textContent = gameState.enemyChar;
    document.getElementById('playerCharacter').textContent = gameState.playerRaceChar;
    document.getElementById('enemyCharacter').textContent = gameState.enemyChar;

    gameState.scoreRight = 0; gameState.scoreWrong = 0; gameState.comboCount = 0;
    gameState.ropePosition = 50; gameState.currentTime = 0; gameState.questionCounter = 0;
    gameState.enemyStunned = false; gameState.playerBoostActive = false;

    document.getElementById('countRight').textContent = "0";
    document.getElementById('countWrong').textContent = "0";
    document.getElementById('comboDisplay').className = "combo-hide";
    document.getElementById('statusEffectBadge').className = "effect-badge-hide";
    
    updateRopeUI();
    navigateTo('gamePage');

    const overlay = document.getElementById('countdownOverlay');
    const text = document.getElementById('countdownText');
    overlay.classList.remove('hidden');
    let cd = 3; text.textContent = cd;

    const cdInv = setInterval(() => {
        cd--;
        if (cd > 0) { text.textContent = cd; playSFX('pop'); }
        else if (cd === 0) { text.textContent = "TARIK BERKUALITAS!"; playSFX('ding'); }
        else { clearInterval(cdInv); overlay.classList.add('hidden'); runMainGame(); }
    }, 850);
}

function runMainGame() {
    gameState.gameActive = true;
    gameState.timerInterval = setInterval(() => {
        gameState.currentTime++;
        const m = Math.floor(gameState.currentTime / 60).toString().padStart(2, '0');
        const s = (gameState.currentTime % 60).toString().padStart(2, '0');
        document.getElementById('gameTimer').textContent = `${m}:${s}`;
    }, 1000);

    makeQuestion();
    loopEnemyAI();
}

// SIMULASI AKSI LAWAN (AI ENGINE)
function loopEnemyAI() {
    if (!gameState.gameActive) return;
    const targetEnemy = ENEMIES_DATA.find(e => e.id === gameState.enemyId);
    const delay = Math.floor(Math.random() * (targetEnemy.maxTime - targetEnemy.minTime)) + targetEnemy.minTime;

    gameState.aiInterval = setTimeout(() => {
        if (!gameState.gameActive) return;

        // Validasi jika musuh terkena status efek STUN dari soal spesial
        if (gameState.enemyStunned) {
            loopEnemyAI(); // Loop skip action
            return;
        }

        if (Math.random() <= targetEnemy.accuracy) {
            // AI Berhasil menarik tali
            gameState.ropePosition += 5; // Geser ke Kanan
            
            // Efek Animasi & visual Asap Tarikan Kanan
            triggerPullParticle(false);
            const eChar = document.getElementById('enemyCharacter');
            eChar.classList.add('pull-right-anim');
            setTimeout(() => eChar.classList.remove('pull-right-anim'), 300);

            updateRopeUI();
            checkMatchEnd();
        }
        loopEnemyAI();
    }, delay);
}

// EVALUASI JAWABAN PILIHAN GANDA USER
function checkPlayerChoice(chosenValue) {
    if (!gameState.gameActive) return;

    if (chosenValue === gameState.currentAnswer) {
        gameState.scoreRight++;
        gameState.comboCount++;
        document.getElementById('countRight').textContent = gameState.scoreRight;

        let basePull = 5;
        
        // Cek Mekanisme Efek Tambahan Soal Spesial
        if (gameState.isSpecialQuestion) {
            const randomSkill = Math.random() > 0.5 ? 'STUN' : 'BOOST';
            if (randomSkill === 'STUN') {
                gameState.enemyStunned = true;
                const badge = document.getElementById('statusEffectBadge');
                badge.textContent = "MUSUH TER-STUN (2s) 😵";
                badge.className = "animate-pulse";
                triggerFloatText("🔥 SKILL: STUN AI! 🔥", true);
                
                setTimeout(() => {
                    gameState.enemyStunned = false;
                    document.getElementById('statusEffectBadge').className = "effect-badge-hide";
                }, 2000);
            } else {
                gameState.playerBoostActive = true;
                triggerFloatText("🔥 SKILL: DOUBLE POWER! 🔥", true);
            }
        }

        // Jalankan Efek Boost Ganda jika aktif
        if (gameState.playerBoostActive) {
            basePull *= 2;
            gameState.playerBoostActive = false; // Gunakan langsung habis
        }

        gameState.ropePosition -= basePull; // Geser ke Kiri (Sisi Kemenangan Player)
        playSFX('ding');
        triggerPullParticle(true);

        // Kombo check HUD
        if (gameState.comboCount >= 2) {
            const cb = document.getElementById('comboDisplay');
            cb.textContent = `COMBO x${gameState.comboCount}`;
            cb.className = "animate-pulse";
        }

        // Karakter Beraksi Menarik
        const pChar = document.getElementById('playerCharacter');
        pChar.classList.add('pull-left-anim');
        setTimeout(() => pChar.classList.remove('pull-left-anim'), 300);

        // Screen Shake effect
        document.getElementById('gamePage').classList.add('shake');
        setTimeout(() => document.getElementById('gamePage').classList.remove('shake'), 250);

    } else {
        // JAWABAN SALAH
        gameState.scoreWrong++;
        gameState.comboCount = 0;
        document.getElementById('countWrong').textContent = gameState.scoreWrong;
        document.getElementById('comboDisplay').className = "combo-hide";
        
        playSFX('buzz');
        triggerFloatText("❌ MISSED!", false);

        const pChar = document.getElementById('playerCharacter');
        pChar.classList.add('pull-right-anim'); // Tertarik paksa oleh tali
        setTimeout(() => pChar.classList.remove('pull-right-anim'), 300);
    }

    updateRopeUI();
    const gameEnded = checkMatchEnd();
    if (!gameEnded) makeQuestion();
}

function triggerPullParticle(isLeftPlayer) {
    const effId = isLeftPlayer ? 'playerPullEffect' : 'enemyPullEffect';
    const element = document.getElementById(effId);
    element.classList.add('pull-eff-active');
    setTimeout(() => element.classList.remove('pull-eff-active'), 400);
}

function triggerFloatText(text, isGood) {
    const layer = document.getElementById('effectPopUp');
    const f = document.createElement('div');
    f.className = 'pop-effect'; f.textContent = text;
    f.style.color = isGood ? 'var(--neon-green)' : 'var(--neon-pink)';
    f.style.left = '40%'; f.style.top = '10px';
    layer.appendChild(f);
    setTimeout(() => f.remove(), 600);
}

function updateRopeUI() {
    if (gameState.ropePosition < 0) gameState.ropePosition = 0;
    if (gameState.ropePosition > 100) gameState.ropePosition = 100;

    const pos = gameState.ropePosition;
    document.getElementById('ropeMarker').style.left = `${pos}%`;
    document.getElementById('ropeCenterKnot').style.left = `${pos}%`;

    const fill = document.getElementById('ropeProgressFill');
    if (pos < 50) {
        fill.style.left = `${pos}%`; fill.style.width = `${50 - pos}%`; fill.style.backgroundColor = "var(--neon-blue)";
    } else {
        fill.style.left = "50%"; fill.style.width = `${pos - 50}%`; fill.style.backgroundColor = "var(--neon-pink)";
    }
}

// --- REVISI TERBESAR: POPUP MODAL DIALOG EVALUASI Kemenangan ---
function checkMatchEnd() {
    let over = false; let win = false;
    if (gameState.ropePosition <= 15) { over = true; win = true; }
    else if (gameState.ropePosition >= 85) { over = true; win = false; }

    if (over) {
        gameState.gameActive = false;
        clearInterval(gameState.timerInterval);
        clearTimeout(gameState.aiInterval);

        const totalQ = gameState.scoreRight + gameState.scoreWrong;
        let acc = totalQ > 0 ? Math.round((gameState.scoreRight / totalQ) * 100) : 0;
        let rank = win ? (acc >= 85 ? "S" : "A") : "B";

        const pTitle = document.getElementById('popResultTitle');
        const pAvatar = document.getElementById('popResultAvatar');
        
        if (win) {
            pTitle.textContent = "🏆 VICTORY!"; pTitle.className = "neon-text-blue";
            pAvatar.textContent = "🎉👑✨"; playSFX('victory');
        } else {
            pTitle.textContent = "💀 TRY AGAIN!"; pTitle.className = "neon-text-pink";
            pAvatar.textContent = "💥👹🦖"; playSFX('buzz');
        }

        document.getElementById('popRankBadge').textContent = rank;
        document.getElementById('popResName').textContent = gameState.playerName;
        document.getElementById('popResAccuracy').textContent = `${acc}%`;
        document.getElementById('popResTime').textContent = `${gameState.currentTime} detik`;

        const key = `highScore_${gameState.difficulty}`;
        let currentHigh = localStorage.getItem(key) ? parseInt(localStorage.getItem(key), 10) : 0;
        if (win && gameState.scoreRight > currentHigh) {
            currentHigh = gameState.scoreRight; localStorage.setItem(key, currentHigh);
        }
        document.getElementById('popHighScoreVal').textContent = `${currentHigh} Poin`;

        // Buka Pop Up secara Interaktif mewah
        document.getElementById('endGameModal').classList.remove('hidden');
    }
    return over;
}

// BUTTONS REWARD MODAL TRIGGER ACTION
document.getElementById('btnPopPlayAgain').addEventListener('click', () => {
    playSFX('pop');
    document.getElementById('endGameModal').classList.add('hidden');
    startBattleSequence();
});

document.getElementById('btnPopMainMenu').addEventListener('click', () => {
    playSFX('pop');
    document.getElementById('endGameModal').classList.add('hidden');
    navigateTo('landingPage');
});
