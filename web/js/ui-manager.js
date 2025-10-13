// ==================== UI MANAGER AND LAYOUT ====================

console.log('📦 Loading: ui-manager.js');

// NOTA: Le funzioni pauseTimer, resumeTimer, stopTimer, restartTimer
// vengono esposte come window.* nei file dove sono definite (stats-updater.js, game-over.js)

// Funzioni FORZATE che funzionano sempre
function forceCompleteRestart() {
    console.log('� SAFE COMPLETE RESTART - Timer + Game');
    
    // STEP 1: RESETTA TUTTO JavaScript
    gameStartTimeReal = Date.now();
    isTimerRunning = true;
    isGameOver = false;
    isPaused = false;
    totalPausedTime = 0;
    pauseStartTime = null;
    gameEndTime = null;
    lastScore = 0;
    
    // RESET GAME OVER STATE - CRUCIALE!
    newGameOverActive = false;
    mobileGameOverActive = false;
    lastKnownScore = 0;
    lastScoreChangeTime = Date.now();
    
    // STEP 2: AGGIORNA DISPLAY SUBITO
    const gameTimeElement = document.getElementById('gameTime');
    const gameStateElement = document.getElementById('gameState');
    
    if (gameTimeElement) {
        gameTimeElement.style.color = '';
        gameTimeElement.textContent = '00:00';
    }
    
    if (gameStateElement) {
        gameStateElement.style.color = '';
        gameStateElement.textContent = 'In corso';
    }
    
    // STEP 3: RIAVVIA IL GIOCO C++ IN MODO SICURO
    console.log('🎮 Trying safe C++ restart...');
    
    try {
        if (typeof Module !== 'undefined') {
            // Prova prima _restartTetrisGame
            if (Module._restartTetrisGame) {
                console.log('Calling _restartTetrisGame...');
                Module._restartTetrisGame();
                console.log('✅ _restartTetrisGame called successfully');
            }
            // Se non esiste, prova _startTetrisGame
            else if (Module._startTetrisGame) {
                console.log('Calling _startTetrisGame...');
                Module._startTetrisGame();
                console.log('✅ _startTetrisGame called successfully');
            }
            // Ultimo tentativo: usa ccall se disponibile
            else if (Module.ccall) {
                try {
                    console.log('Trying ccall method...');
                    Module.ccall('restartTetrisGame', null, []);
                    console.log('✅ ccall restart succeeded');
                } catch(e) {
                    try {
                        Module.ccall('startTetrisGame', null, []);
                        console.log('✅ ccall start succeeded');
                    } catch(e2) {
                        console.log('❌ ccall methods failed');
                    }
                }
            }
            else {
                console.log('❌ No C++ restart methods available');
                console.log('Available Module functions:');
                window.listModuleFunctions();
            }
        } else {
            console.log('❌ Module not available');
        }
    } catch(e) {
        console.error('❌ C++ restart failed:', e);
    }
    
    console.log('✅ RESTART COMPLETED - Timer is running, C++ hopefully restarted');
}

function forcePause(reason = 'manual') {
    console.log('💥 FORCING PAUSE (' + reason + ')');
    
    if (!isPaused && !isGameOver) {
        isPaused = true;
        isTimerRunning = false;  // FERMA IL TIMER SUBITO
        pauseStartTime = Date.now();
        
        // AGGIORNA DISPLAY SUBITO
        const gameStateElement = document.getElementById('gameState');
        if (gameStateElement) {
            if (reason === 'background' || reason === 'auto') {
                gameStateElement.textContent = 'Auto-pausa';
                gameStateElement.style.color = '#ff9800';
            } else {
                gameStateElement.textContent = 'In pausa';
                gameStateElement.style.color = '#ffa726';
            }
        }
        
        console.log('✅ PAUSE FORCED - Timer stopped (' + reason + ')');
    }
}

function forceResume(reason = 'manual') {
    console.log('💥 FORCING RESUME (' + reason + ')');
    
    if (isPaused && !isGameOver) {
        if (pauseStartTime) {
            const pauseDuration = Date.now() - pauseStartTime;
            totalPausedTime += pauseDuration;
            console.log('⏱️ Added pause duration:', pauseDuration, 'ms');
        }
        
        isPaused = false;
        isTimerRunning = true;  // RIPRENDI IL TIMER SUBITO
        pauseStartTime = null;
        
        // Reset auto-pause state when resuming
        if (reason === 'auto' || reason === 'background') {
            wasAutoPaused = false;
            autoPauseReason = '';
        }
        
        // AGGIORNA DISPLAY SUBITO
        const gameStateElement = document.getElementById('gameState');
        if (gameStateElement) {
            gameStateElement.textContent = 'In corso';
            gameStateElement.style.color = '';
        }
        
        console.log('✅ RESUME FORCED - Timer running (' + reason + ')');
    }
}

// Funzioni aggiuntive per controllo manuale
// Override the placeholder function
startGameTimer = function() {
    console.log('🎮 Starting game timer manually');
    gameStartTimeReal = Date.now();
    isTimerRunning = true;
    isGameOver = false;
    isPaused = false;
    totalPausedTime = 0;
    pauseStartTime = null;
    gameEndTime = null;

    const gameStateElement = document.getElementById('gameState');
    if (gameStateElement) {
        gameStateElement.textContent = 'In corso';
        gameStateElement.style.color = '';
    }
};

// Esponi anche come window.startGameTimer per compatibilità
window.startGameTimer = startGameTimer;

window.stopGameTimer = function() {
    console.log('🎮 Stopping game timer manually');
    isGameOver = true;
    isTimerRunning = false;
    gameEndTime = Date.now();
    
    const gameStateElement = document.getElementById('gameState');
    if (gameStateElement) {
        gameStateElement.textContent = 'Game Over';
        gameStateElement.style.color = '#ff5722';
    }
};

window.forceCompleteRestart = forceCompleteRestart;
window.forcePause = forcePause;
window.forceResume = forceResume;

// Debug function to see available Module functions
window.listModuleFunctions = function() {
    if (typeof Module !== 'undefined') {
        console.log('Available Module functions:');
        for (let key in Module) {
            if (typeof Module[key] === 'function' && key.startsWith('_')) {
                console.log('  ' + key);
            }
        }
    } else {
        console.log('Module not available yet');
    }
};

// Debug function to check game state
window.checkGameState = function() {
    console.log('=== GAME STATE DEBUG ===');
    console.log('JavaScript state:');
    console.log('  isTimerRunning:', isTimerRunning);
    console.log('  isPaused:', isPaused);
    console.log('  isGameOver:', isGameOver);
    console.log('  gameStartTimeReal:', gameStartTimeReal);
    console.log('  wasAutoPaused:', wasAutoPaused);
    console.log('  autoPauseReason:', autoPauseReason);
    console.log('  document.hidden:', document.hidden);
    console.log('  document.visibilityState:', document.visibilityState);
    
    if (typeof Module !== 'undefined') {
        console.log('C++ state:');
        try {
            if (Module._isGameRunning) console.log('  isGameRunning:', Module._isGameRunning());
            if (Module._isGamePaused) console.log('  isGamePaused:', Module._isGamePaused());
            if (Module._getScore) console.log('  score:', Module._getScore());
        } catch(e) {
            console.log('  Error reading C++ state:', e);
        }
    } else {
        console.log('C++ Module not available');
    }
    console.log('========================');
};

// Debug functions for testing auto-pause
window.testAutoPause = function() {
    console.log('🧪 Testing auto-pause...');
    if (!isPaused && !isGameOver && gameStartRequested) {
        wasAutoPaused = true;
        autoPauseReason = 'test';
        forcePause('test');
        console.log('✅ Auto-pause test activated - game should be paused');
    } else {
        console.log('❌ Cannot test auto-pause - game not running or already paused');
    }
};

// ==================== DEBUG FUNCTIONS PER GAME OVER ====================

window.testGameOver = function(score = 1234, level = 5, lines = 23) {
    console.log('🧪 Testing new game over screen with score:', score);
    const gameTime = document.getElementById('gameTime')?.textContent || '02:34';
    showNewGameOver(score, level, lines, gameTime);
};

window.testNewRecordGameOver = function() {
    console.log('🧪 Testing new record game over screen');
    const currentRecord = parseInt(localStorage.getItem('tetris-high-score') || '0');
    const newScore = currentRecord + 1000;
    showNewGameOver(newScore, 8, 45, '05:23');
};

window.testLowScoreGameOver = function() {
    console.log('🧪 Testing low score game over screen');
    showNewGameOver(150, 2, 3, '01:12');
};

window.hideGameOverTest = function() {
    console.log('🧪 Hiding game over screen');
    hideNewGameOver();
};

window.resetHighScore = function() {
    localStorage.removeItem('tetris-high-score');
    console.log('🗑️ High score reset');
};

window.checkGameOverState = function() {
    console.log('🔍 Checking game over state:');
    console.log('  newGameOverActive:', newGameOverActive);
    console.log('  mobileGameOverActive:', mobileGameOverActive);
    console.log('  isGameOver:', isGameOver); 
    console.log('  lastKnownScore:', lastKnownScore);
    console.log('  Game over overlay classes:', document.getElementById('gameOverOverlay')?.className);
    
    if (typeof Module !== 'undefined') {
        try {
            console.log('  C++ game running:', Module._isGameRunning ? Module._isGameRunning() : 'unknown');
            console.log('  C++ current score:', Module._getScore ? Module._getScore() : 'unknown');
        } catch(e) {
            console.log('  C++ state: error reading');
        }
    }
};

window.forceResetGameOverState = function() {
    console.log('🔧 Force resetting game over state');
    newGameOverActive = false;
    mobileGameOverActive = false;
    lastKnownScore = 0;
    
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
    }
    
    console.log('✅ Game over state force reset complete');
};

window.restartGameOverMonitoring = function() {
    console.log('🔄 Restarting game over monitoring system');
    
    // Stop existing monitoring
    if (gameOverCheckInterval) {
        clearInterval(gameOverCheckInterval);
        gameOverCheckInterval = null;
    }
    
    // Reset flags
    gameOverMonitoringInitialized = false;
    lastKnownScore = 0;
    
    // Restart monitoring
    startGameOverMonitoring();
    
    console.log('✅ Game over monitoring restarted');
};

window.testGameOverSequence = function() {
    console.log('🧪 Testing complete game over sequence');
    
    // Step 1: Simulate game over
    console.log('1. Showing game over...');
    testGameOver(1500, 4, 12);
    
    setTimeout(() => {
        console.log('2. Simulating restart click...');
        restartFromGameOver();
        
        setTimeout(() => {
            console.log('3. Testing second game over...');
            testGameOver(2500, 6, 18);
            
            console.log('✅ Test sequence complete - check if both game overs showed');
        }, 2000);
    }, 3000);
};

window.testAutoResume = function() {
    console.log('🧪 Testing auto-resume...');
    if (wasAutoPaused) {
        showResumeDialog();
        console.log('✅ Resume dialog should appear');
    } else {
        console.log('❌ Cannot test auto-resume - game was not auto-paused');
    }
};

// Debug helper to simulate background/foreground
window.simulateBackground = function() {
    console.log('🧪 Simulating background...');
    // Manually trigger the visibility change handler
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
};

window.simulateForeground = function() {
    console.log('🧪 Simulating foreground...');
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
};

// Debug functions for desktop pause menu
window.showDesktopMenu = function() {
    console.log('🧪 Showing desktop pause menu...');
    showDesktopPauseMenu();
};

window.hideDesktopMenu = function() {
    console.log('🧪 Hiding desktop pause menu...');
    hideDesktopPauseMenu();
};

// Function to check if JS and C++ states are synchronized
window.checkSyncState = function() {
    if (typeof Module === 'undefined') {
        console.log('❌ Module not available - cannot check sync');
        return false;
    }
    
    try {
        const cppRunning = Module._isGameRunning ? Module._isGameRunning() : true;
        const cppPaused = Module._isGamePaused ? Module._isGamePaused() : false;
        
        console.log('=== SYNC STATE CHECK ===');
        console.log('JavaScript state:');
        console.log('  isPaused:', isPaused);
        console.log('  isGameOver:', isGameOver);
        console.log('  isTimerRunning:', isTimerRunning);
        console.log('C++ state:');
        console.log('  isGameRunning:', cppRunning);
        console.log('  isGamePaused:', cppPaused);
        
        const jsExpectsPaused = isPaused || isGameOver;
        const cppIsPaused = cppPaused || !cppRunning;
        const inSync = jsExpectsPaused === cppIsPaused;
        
        console.log('Synchronization:', inSync ? '✅ IN SYNC' : '❌ OUT OF SYNC');
        console.log('=======================');
        
        return inSync;
    } catch(e) {
        console.log('Error checking sync state:', e);
        return false;
    }
};

// Function to force synchronization
window.forceSyncState = function() {
    console.log('🔄 Forcing state synchronization...');
    
    if (!checkSyncState()) {
        console.log('⚠️ States out of sync - attempting to fix...');
        
        try {
            if (typeof Module !== 'undefined') {
                const cppPaused = Module._isGamePaused ? Module._isGamePaused() : false;
                
                if (isPaused && !cppPaused) {
                    console.log('JS paused but C++ running - pausing C++');
                    simulateKeyPress('Escape', { skipFocus: true });
                } else if (!isPaused && cppPaused) {
                    console.log('JS running but C++ paused - resuming C++');
                    simulateKeyPress('Escape', { restoreFocus: true });
                }
            }
        } catch(e) {
            console.log('Error during sync:', e);
        }
        
        // Recheck after sync attempt
        setTimeout(() => {
            checkSyncState();
        }, 200);
    }
};

