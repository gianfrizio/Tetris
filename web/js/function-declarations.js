// ==================== FUNCTION DECLARATIONS ====================
// Questo file dichiara le funzioni che verranno definite in altri file
// ma che potrebbero essere chiamate prima del caricamento di quei file.

console.log('📦 Loading: function-declarations.js');

// Placeholder functions - will be overridden by actual implementations
let startGameOverMonitoring = function() {
    console.warn('startGameOverMonitoring called before definition');
};

let showDesktopPauseMenu = function() {
    console.warn('showDesktopPauseMenu called before definition');
};

let showNewGameOver = function(score, level, lines, gameTime) {
    console.warn('showNewGameOver called before definition');
};

let hideNewGameOver = function() {
    console.warn('hideNewGameOver called before definition');
};

let hideDesktopPauseMenu = function() {
    console.warn('hideDesktopPauseMenu called before definition');
};

let updateDesktopPauseMenuStats = function() {
    console.warn('updateDesktopPauseMenuStats called before definition');
};

let showResumeDialog = function() {
    console.warn('showResumeDialog called before definition');
};

let restartFromGameOver = function() {
    console.warn('restartFromGameOver called before definition');
};

let calculateGameOverData = function(score, level, lines, gameTime) {
    console.warn('calculateGameOverData called before definition');
};

let updateGameOverElements = function() {
    console.warn('updateGameOverElements called before definition');
};

let addGameOverKeyboardListeners = function() {
    console.warn('addGameOverKeyboardListeners called before definition');
};

let removeGameOverKeyboardListeners = function() {
    console.warn('removeGameOverKeyboardListeners called before definition');
};

let startGameTimer = function() {
    console.warn('startGameTimer called before definition');
};

// Test immediato per vedere quando le funzioni vengono sovrascritte
setTimeout(() => {
    console.log('🔍 Testing function overrides after 100ms...');
    console.log('  - showNewGameOver:', showNewGameOver.toString().includes('REAL FUNCTION') ? '✅ Overridden' : '❌ Still placeholder');
    console.log('  - startGameOverMonitoring:', startGameOverMonitoring.toString().includes('chiamata prima') ? '❌ Still placeholder' : '✅ Overridden');
    console.log('  - addGameOverKeyboardListeners:', addGameOverKeyboardListeners.toString().includes('chiamata prima') ? '❌ Still placeholder' : '✅ Overridden');
}, 100);
