// Game State
const state = {
    difficulty: 'medium', // easy, medium, hard
    score: 0,
    totalTime: 3 * 60, // 3 minutes in seconds
    currentTime: 0,
    gameTimerInterval: null,
    
    currentTarget: {
        name: '',
        number: '',
        formattedNumber: ''
    },
    
    currentInput: '',
    
    names: [
        "ป้าแมว", "ลุงชัย", "น้าสมหญิง", "พี่ก้อง", "เจ๊น้ำ", 
        "หมอจ๋าย", "ครูแอน", "เฮียตี๋", "ตาชุ่ม", "ยายปริก",
        "เพื่อนเอก", "น้องบี", "เจ๊จู", "ลุงพล", "ป้าศรี"
    ]
};

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    phonebook: document.getElementById('phonebook-screen'),
    keypad: document.getElementById('keypad-screen'),
    end: document.getElementById('end-screen')
};

// Start Screen elements
const diffBtns = document.querySelectorAll('.btn-diff');
const diffDesc = document.getElementById('diff-desc');
const startBtn = document.getElementById('start-btn');

// Phonebook elements
const targetNameEl = document.getElementById('target-name');
const targetNumberEl = document.getElementById('target-number');
const memorizeTimerBar = document.getElementById('memorize-timer-bar');

// Keypad elements
const scoreDisplay = document.getElementById('score-display');
const timeDisplay = document.getElementById('time-display');
const namePrompt = document.getElementById('name-prompt');
const inputDisplay = document.getElementById('input-display');
const keyBtns = document.querySelectorAll('.btn-key');
const clearBtn = document.querySelector('.btn-clear');
const delBtn = document.querySelector('.btn-del');
const callBtn = document.getElementById('call-btn');

// End Screen elements
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Audio elements
const sfxKey = document.getElementById('sfx-key');
const sfxCorrect = document.getElementById('sfx-correct');
const sfxWrong = document.getElementById('sfx-wrong');
const bgm = document.getElementById('bgm');

// Initialize Events
function initEvents() {
    // Difficulty Selection
    diffBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            playSound(sfxKey);
            diffBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.difficulty = e.target.dataset.diff;
            diffDesc.textContent = e.target.dataset.desc;
        });
    });

    // Start Game
    startBtn.addEventListener('click', () => {
        playSound(sfxCorrect);
        bgm.volume = 0.3;
        bgm.play().catch(e => console.log("Audio autoplay prevented", e));
        startGame();
    });

    // Restart Game
    restartBtn.addEventListener('click', () => {
        playSound(sfxCorrect);
        showScreen('start');
    });

    // Keypad Input
    keyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            playSound(sfxKey);
            handleInput(e.target.textContent);
        });
    });

    // Clear & Delete
    clearBtn.addEventListener('click', () => {
        playSound(sfxKey);
        state.currentInput = '';
        updateInputDisplay();
    });

    delBtn.addEventListener('click', () => {
        playSound(sfxKey);
        state.currentInput = state.currentInput.slice(0, -1);
        updateInputDisplay();
    });

    // Call Button
    callBtn.addEventListener('click', () => {
        checkAnswer();
    });
}

// Utility: Play sound with overlap support
function playSound(audioEl) {
    if (!audioEl) return;
    audioEl.currentTime = 0;
    audioEl.play().catch(e => {});
}

// Format number based on length
function generateNumber() {
    let numStr = "";
    let formattedStr = "";
    
    if (state.difficulty === 'easy') {
        // 4 digits (e.g. 1150)
        for(let i=0; i<4; i++) numStr += Math.floor(Math.random() * 10);
        formattedStr = numStr;
    } 
    else if (state.difficulty === 'medium') {
        // 7 digits (e.g. 02-xxx-xxxx -> we just do 7 digits total or 02 + 7 digits)
        // Let's do 7 digits total starting with 02
        numStr = "02";
        for(let i=0; i<7; i++) numStr += Math.floor(Math.random() * 10);
        // format: 02-XXX-XXXX
        formattedStr = `${numStr.substring(0,2)}-${numStr.substring(2,5)}-${numStr.substring(5)}`;
    }
    else {
        // 10 digits (e.g. 081-xxx-xxxx)
        const prefixes = ["081", "086", "089", "092", "061"];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        numStr = prefix;
        for(let i=0; i<7; i++) numStr += Math.floor(Math.random() * 10);
        // format: 081-XXX-XXXX
        formattedStr = `${numStr.substring(0,3)}-${numStr.substring(3,6)}-${numStr.substring(6)}`;
    }
    
    return { clean: numStr, formatted: formattedStr };
}

// System Functions
function startGame() {
    state.score = 0;
    state.currentTime = state.totalTime;
    updateScore();
    updateTimeDisplay();
    
    clearInterval(state.gameTimerInterval);
    state.gameTimerInterval = setInterval(gameTick, 1000);
    
    startRound();
}

function startRound() {
    state.currentInput = '';
    updateInputDisplay();
    
    // Generate new target
    const name = state.names[Math.floor(Math.random() * state.names.length)];
    const numberObj = generateNumber();
    
    state.currentTarget = {
        name: name,
        number: numberObj.clean,
        formattedNumber: numberObj.formatted
    };
    
    // Show phonebook
    targetNameEl.textContent = name;
    targetNumberEl.textContent = numberObj.formatted;
    
    showScreen('phonebook');
    
    // Timer animation for memorization (5 to 10 seconds depending on diff)
    let memoTime = 5;
    if(state.difficulty === 'medium') memoTime = 7;
    if(state.difficulty === 'hard') memoTime = 10;
    
    memorizeTimerBar.style.transition = 'none';
    memorizeTimerBar.style.transform = 'scaleX(1)';
    
    setTimeout(() => {
        memorizeTimerBar.style.transition = `transform ${memoTime}s linear`;
        memorizeTimerBar.style.transform = 'scaleX(0)';
    }, 50);
    
    // Transition to keypad
    setTimeout(() => {
        if(screens.phonebook.classList.contains('active')) {
            showKeypad();
        }
    }, memoTime * 1000);
}

function showKeypad() {
    namePrompt.textContent = `โทรหา: ${state.currentTarget.name}`;
    inputDisplay.classList.remove('error');
    showScreen('keypad');
}

function handleInput(digit) {
    if (state.currentInput.length < state.currentTarget.number.length + 2) {
        state.currentInput += digit;
        updateInputDisplay();
    }
}

function formatInput(raw) {
    // Attempt to format input as they type to match target format
    if(state.difficulty === 'easy') return raw;
    
    if(state.difficulty === 'medium') { // 02-XXX-XXXX (9 digits total)
        if(raw.length <= 2) return raw;
        if(raw.length <= 5) return `${raw.substring(0,2)}-${raw.substring(2)}`;
        return `${raw.substring(0,2)}-${raw.substring(2,5)}-${raw.substring(5)}`;
    }
    
    if(state.difficulty === 'hard') { // 081-XXX-XXXX (10 digits total)
        if(raw.length <= 3) return raw;
        if(raw.length <= 6) return `${raw.substring(0,3)}-${raw.substring(3)}`;
        return `${raw.substring(0,3)}-${raw.substring(3,6)}-${raw.substring(6)}`;
    }
    return raw;
}

function updateInputDisplay() {
    inputDisplay.textContent = formatInput(state.currentInput);
}

function checkAnswer() {
    if (state.currentInput === state.currentTarget.number) {
        // Correct
        playSound(sfxCorrect);
        state.score += 20;
        updateScore();
        fireConfetti();
        
        // Brief pause then next round
        setTimeout(() => {
            startRound();
        }, 1500);
        
    } else {
        // Wrong
        playSound(sfxWrong);
        
        // Formatting input error feedback
        const panel = document.querySelector('.phone-panel');
        panel.classList.remove('wiggle');
        void panel.offsetWidth; // trigger reflow
        panel.classList.add('wiggle');
        
        inputDisplay.classList.add('error');
        setTimeout(() => inputDisplay.classList.remove('error'), 500);
        
        // Remove last digit on wrong check, penalty
        if (state.score > 0) state.score = Math.max(0, state.score - 5);
        updateScore();
        
        // Optionally auto-clear or let them delete manually
        // state.currentInput = '';
        // updateInputDisplay();
    }
}

function gameTick() {
    state.currentTime--;
    updateTimeDisplay();
    
    if (state.currentTime <= 0) {
        endGame();
    }
}

function updateTimeDisplay() {
    const m = Math.floor(state.currentTime / 60).toString().padStart(2, '0');
    const s = (state.currentTime % 60).toString().padStart(2, '0');
    timeDisplay.textContent = `${m}:${s}`;
}

function updateScore() {
    scoreDisplay.textContent = `คะแนน: ${state.score}`;
}

function endGame() {
    clearInterval(state.gameTimerInterval);
    finalScoreEl.textContent = state.score;
    bgm.pause();
    showScreen('end');
}

function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenId].classList.add('active');
}

function fireConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB09C', '#98E8D5', '#95D5FF', '#FFE58F']
    });
}

// Initialize
window.addEventListener('DOMContentLoaded', initEvents);
