// ==================== DOM ELEMENTS ==================== 

    // Elementi DOM
    const startScreen = document.getElementById('startScreen');
    const playButton = document.getElementById('playButton');
    const customLoading = document.getElementById('customLoading');
    const loadingProgress = document.getElementById('loadingProgress');
    const gameContainer = document.querySelector('.game-container');

    let gameReady = false;
    let gameStartRequested = false;

    // ==================== GLOBAL STATE VARIABLES ====================
    // Variabili globali per lo stato del gioco (devono essere dichiarate per prime)
    let isPaused = false;
    let isGameOver = false;
    let isTimerRunning = true;
    let gameStartTimeReal = null;
    let gameEndTime = null;
    let totalPausedTime = 0;
    let pauseStartTime = null;
    let lastScoreChangeTime = Date.now();

    // Variabili per il sistema di game over
    let gameOverCheckInterval = null;
    let lastKnownScore = 0;
    let newGameOverActive = false;
    let mobileGameOverActive = false;
    let gameOverMonitoringInitialized = false;

    // Variabili per il sistema di pausa mobile
    let mobilePauseActive = false;

    // Variabili per l'auto-pausa
    let wasAutoPaused = false;
    let autoPauseReason = '';

    // Variabili per le statistiche
    let lastScore = 0;
    let lastLevel = 1;
    let lastLines = 0;
    let highScore = localStorage.getItem('tetris-high-score') || 0;
