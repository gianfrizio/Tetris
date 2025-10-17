// ==================== DOM ELEMENTS AND GLOBAL VARIABLES ====================
// Central registry of DOM elements and global variables used across the application
// This file serves as documentation for the global scope

console.log('📦 Loading: dom-elements.js');

// ==================== DOM ELEMENT REFERENCES ====================
// These are accessed frequently throughout the application

// Start screen elements
const startScreen = document.getElementById('startScreen');
const playButton = document.getElementById('playButton');
const customLoading = document.getElementById('customLoading');
const loadingProgress = document.getElementById('loadingProgress');

// Game container
const gameContainer = document.querySelector('.game-container');

// Canvas element (main game display)
const canvas = document.getElementById('canvas');

// Game statistics panel elements
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const linesDisplay = document.getElementById('linesDisplay');
const highScoreElement = document.getElementById('highScore');
const gameTimeElement = document.getElementById('gameTime');
const gameStateElement = document.getElementById('gameState');

// Pause menu elements
const mobilePauseMenu = document.getElementById('mobilePauseMenu');
const desktopPauseMenu = document.getElementById('desktopPauseMenu');

// Game over elements
const gameOverOverlay = document.getElementById('gameOverOverlay');

// Audio control elements
const volumeSlider = document.getElementById('volume-slider');
const muteButton = document.getElementById('mute-button');

// Expose as namespace for easy access
window.DOMElements = {
    startScreen,
    playButton,
    customLoading,
    loadingProgress,
    gameContainer,
    canvas,
    scoreDisplay,
    levelDisplay,
    linesDisplay,
    highScore: highScoreElement,
    gameTime: gameTimeElement,
    gameStateDisplay: gameStateElement,
    mobilePauseMenu,
    desktopPauseMenu,
    gameOverOverlay,
    volumeSlider,
    muteButton
};

// ==================== LEGACY GLOBAL VARIABLES ====================
// These globals are NOT managed by gameState and exist for backward compatibility
// TODO: Migrate these to gameState or refactor them out

// Game initialization state
let gameReady = false;              // Set to true when game module is ready
let gameStartRequested = false;     // Set to true when user clicks "Play"

// ==================== LEGACY GLOBAL VARIABLES (DECLARED IN OTHER FILES) ====================
// These globals are declared in their respective files but listed here for documentation
//
// Touch control state (declared in touch-controls.js):
//   - longPressTriggered, lastTapTime, recentTaps, canvasTouchActive
//
// Timer and game state (declared in various files, PARTIALLY in gameState):
//   - gameStartTimeReal, isTimerRunning, isPaused, isGameOver
//   - totalPausedTime, pauseStartTime, gameEndTime
//
// Auto-pause state (declared in visibility-manager.js):
//   - wasAutoPaused, autoPauseReason
//
// Score tracking (declared in game-start.js):
//   - lastScore, lastLevel, lastLines, highScore, lastScoreChangeTime
//
// Game over detection (already in gameState, declared in pause-system.js):
//   - lastKnownScore, newGameOverActive, mobileGameOverActive
//   - gameOverCheckInterval, gameOverMonitoringInitialized
//
// Stats updater (declared in game-start.js):
//   - statsUpdateInterval

console.log('✅ DOM elements registered');
console.log('⚠️ Note: Multiple legacy global variables are declared across various files');
console.log('   See comments above for documentation. Migration to gameState recommended.');
