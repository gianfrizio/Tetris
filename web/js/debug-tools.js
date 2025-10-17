// ==================== DEBUG TOOLS (Development Only) ====================
// This file provides debug functions for testing and development
// DO NOT load this file in production builds

console.log('🔧 Loading: debug-tools.js (DEVELOPMENT MODE)');

/**
 * Debug namespace - all debug functions are under window.TetrisDebug
 */
const TetrisDebug = {
    // ==================== STATE INSPECTION ====================

    /**
     * Displays complete game state (JavaScript + C++)
     */
    checkGameState() {
        console.log('=== GAME STATE DEBUG ===');
        console.log('JavaScript state:');
        console.log('  State object:', gameState.exportState());
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
    },

    /**
     * Checks game over state details
     */
    checkGameOverState() {
        const state = gameState.exportState();
        console.log('🔍 Checking game over state:');
        console.log('  newGameOverActive:', state.newGameOverActive);
        console.log('  mobileGameOverActive:', state.mobileGameOverActive);
        console.log('  isGameOver:', state.isGameOver);
        console.log('  lastKnownScore:', state.lastKnownScore);
        console.log('  Game over overlay:', document.getElementById('gameOverOverlay')?.className);

        if (typeof Module !== 'undefined') {
            try {
                console.log('  C++ game running:', Module._isGameRunning?.());
                console.log('  C++ current score:', Module._getScore?.());
            } catch(e) {
                console.log('  C++ state: error reading');
            }
        }
    },

    /**
     * Checks if JavaScript and C++ states are synchronized
     */
    checkSyncState() {
        if (typeof Module === 'undefined') {
            console.log('❌ Module not available - cannot check sync');
            return false;
        }

        try {
            const state = gameState.exportState();
            const cppRunning = Module._isGameRunning?.() ?? true;
            const cppPaused = Module._isGamePaused?.() ?? false;

            console.log('=== SYNC STATE CHECK ===');
            console.log('JavaScript:', {
                isPaused: state.isPaused,
                isGameOver: state.isGameOver,
                isTimerRunning: state.isTimerRunning
            });
            console.log('C++:', {
                isGameRunning: cppRunning,
                isGamePaused: cppPaused
            });

            const jsExpectsPaused = state.isPaused || state.isGameOver;
            const cppIsPaused = cppPaused || !cppRunning;
            const inSync = jsExpectsPaused === cppIsPaused;

            console.log('Synchronization:', inSync ? '✅ IN SYNC' : '❌ OUT OF SYNC');
            console.log('=======================');

            return inSync;
        } catch(e) {
            console.log('Error checking sync state:', e);
            return false;
        }
    },

    // ==================== MODULE INSPECTION ====================

    /**
     * Lists all available Module functions (C++ exports)
     */
    listModuleFunctions() {
        if (typeof Module !== 'undefined') {
            console.log('Available Module functions:');
            Object.keys(Module)
                .filter(key => typeof Module[key] === 'function' && key.startsWith('_'))
                .forEach(key => console.log('  ' + key));
        } else {
            console.log('Module not available yet');
        }
    },

    // ==================== GAME OVER TESTING ====================

    /**
     * Tests game over screen with custom score
     */
    testGameOver(score = 1234, level = 5, lines = 23) {
        console.log('🧪 Testing game over with score:', score);
        const gameTime = document.getElementById('gameTime')?.textContent || '02:34';
        if (typeof showNewGameOver === 'function') {
            showNewGameOver(score, level, lines, gameTime);
        } else {
            console.error('showNewGameOver not defined');
        }
    },

    /**
     * Tests game over with new record (high score + 1000)
     */
    testNewRecordGameOver() {
        console.log('🧪 Testing new record game over');
        const currentRecord = gameState.get('highScore');
        const newScore = currentRecord + 1000;
        TetrisDebug.testGameOver(newScore, 8, 45);
    },

    /**
     * Tests game over with low score
     */
    testLowScoreGameOver() {
        console.log('🧪 Testing low score game over');
        TetrisDebug.testGameOver(150, 2, 3);
    },

    /**
     * Hides game over screen
     */
    hideGameOverTest() {
        console.log('🧪 Hiding game over screen');
        if (typeof hideNewGameOver === 'function') {
            hideNewGameOver();
        }
    },

    /**
     * Tests complete game over sequence (show, restart, show again)
     */
    testGameOverSequence() {
        console.log('🧪 Testing complete game over sequence');

        console.log('1. Showing game over...');
        TetrisDebug.testGameOver(1500, 4, 12);

        setTimeout(() => {
            console.log('2. Simulating restart...');
            if (typeof restartFromGameOver === 'function') {
                restartFromGameOver();
            }

            setTimeout(() => {
                console.log('3. Testing second game over...');
                TetrisDebug.testGameOver(2500, 6, 18);
                console.log('✅ Test sequence complete');
            }, 2000);
        }, 3000);
    },

    /**
     * Force resets all game over state
     */
    forceResetGameOverState() {
        console.log('🔧 Force resetting game over state');
        gameState.set('newGameOverActive', false);
        gameState.set('mobileGameOverActive', false);
        gameState.set('lastKnownScore', 0);

        const overlay = document.getElementById('gameOverOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
        }

        console.log('✅ Game over state force reset complete');
    },

    /**
     * Restarts game over monitoring system
     */
    restartGameOverMonitoring() {
        console.log('🔄 Restarting game over monitoring system');

        const interval = gameState.get('gameOverCheckInterval');
        if (interval) {
            clearInterval(interval);
            gameState.set('gameOverCheckInterval', null);
        }

        gameState.set('gameOverMonitoringInitialized', false);
        gameState.set('lastKnownScore', 0);

        if (typeof startGameOverMonitoring === 'function') {
            startGameOverMonitoring();
        }

        console.log('✅ Game over monitoring restarted');
    },

    // ==================== AUTO-PAUSE TESTING ====================

    /**
     * Tests auto-pause functionality
     */
    testAutoPause() {
        console.log('🧪 Testing auto-pause...');
        const state = gameState.exportState();
        if (!state.isPaused && !state.isGameOver && state.gameStartRequested) {
            gameState.set('wasAutoPaused', true);
            gameState.set('autoPauseReason', 'test');
            if (typeof forcePause === 'function') {
                forcePause('test');
            }
            console.log('✅ Auto-pause test activated');
        } else {
            console.log('❌ Cannot test - game not running or already paused');
        }
    },

    /**
     * Tests auto-resume functionality
     */
    testAutoResume() {
        console.log('🧪 Testing auto-resume...');
        if (gameState.get('wasAutoPaused') && typeof showResumeDialog === 'function') {
            showResumeDialog();
            console.log('✅ Resume dialog should appear');
        } else {
            console.log('❌ Cannot test - game was not auto-paused');
        }
    },

    /**
     * Simulates app going to background
     */
    simulateBackground() {
        console.log('🧪 Simulating background...');
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
    },

    /**
     * Simulates app coming to foreground
     */
    simulateForeground() {
        console.log('🧪 Simulating foreground...');
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
    },

    // ==================== MENU TESTING ====================

    /**
     * Shows desktop pause menu
     */
    showDesktopMenu() {
        console.log('🧪 Showing desktop pause menu...');
        if (typeof showDesktopPauseMenu === 'function') {
            showDesktopPauseMenu();
        }
    },

    /**
     * Hides desktop pause menu
     */
    hideDesktopMenu() {
        console.log('🧪 Hiding desktop pause menu...');
        if (typeof hideDesktopPauseMenu === 'function') {
            hideDesktopPauseMenu();
        }
    },

    // ==================== STATE MANIPULATION ====================

    /**
     * Resets high score to 0
     */
    resetHighScore() {
        gameState.set('highScore', 0);
        localStorage.setItem('tetris-high-score', '0');
        console.log('🗑️ High score reset to 0');
    },

    /**
     * Forces state synchronization between JS and C++
     */
    forceSyncState() {
        console.log('🔄 Forcing state synchronization...');

        if (!TetrisDebug.checkSyncState()) {
            console.log('⚠️ States out of sync - attempting to fix...');

            try {
                if (typeof Module !== 'undefined') {
                    const cppPaused = Module._isGamePaused?.() ?? false;
                    const isPaused = gameState.get('isPaused');

                    if (isPaused && !cppPaused) {
                        console.log('JS paused but C++ running - pausing C++');
                        if (typeof simulateKeyPress === 'function') {
                            simulateKeyPress('Escape', { skipFocus: true });
                        }
                    } else if (!isPaused && cppPaused) {
                        console.log('JS running but C++ paused - resuming C++');
                        if (typeof simulateKeyPress === 'function') {
                            simulateKeyPress('Escape', { restoreFocus: true });
                        }
                    }
                }
            } catch(e) {
                console.log('Error during sync:', e);
            }

            setTimeout(() => TetrisDebug.checkSyncState(), 200);
        }
    }
};

// Expose on window
window.TetrisDebug = TetrisDebug;

// Backward compatibility - expose legacy functions
window.listModuleFunctions = () => TetrisDebug.listModuleFunctions();
window.checkGameState = () => TetrisDebug.checkGameState();
window.testGameOver = (score, level, lines) => TetrisDebug.testGameOver(score, level, lines);
window.testNewRecordGameOver = () => TetrisDebug.testNewRecordGameOver();
window.testLowScoreGameOver = () => TetrisDebug.testLowScoreGameOver();
window.hideGameOverTest = () => TetrisDebug.hideGameOverTest();
window.resetHighScore = () => TetrisDebug.resetHighScore();
window.checkGameOverState = () => TetrisDebug.checkGameOverState();
window.forceResetGameOverState = () => TetrisDebug.forceResetGameOverState();
window.restartGameOverMonitoring = () => TetrisDebug.restartGameOverMonitoring();
window.testGameOverSequence = () => TetrisDebug.testGameOverSequence();
window.testAutoPause = () => TetrisDebug.testAutoPause();
window.testAutoResume = () => TetrisDebug.testAutoResume();
window.simulateBackground = () => TetrisDebug.simulateBackground();
window.simulateForeground = () => TetrisDebug.simulateForeground();
window.showDesktopMenu = () => TetrisDebug.showDesktopMenu();
window.hideDesktopMenu = () => TetrisDebug.hideDesktopMenu();
window.checkSyncState = () => TetrisDebug.checkSyncState();
window.forceSyncState = () => TetrisDebug.forceSyncState();

// Print help message
console.log('\n🔧 ==============================================');
console.log('🔧 TETRIS DEBUG TOOLS LOADED');
console.log('🔧 ==============================================');
console.log('\n📊 State Inspection:');
console.log('  TetrisDebug.checkGameState() - Full state dump');
console.log('  TetrisDebug.checkGameOverState() - Game over state');
console.log('  TetrisDebug.checkSyncState() - JS/C++ sync check');
console.log('  TetrisDebug.listModuleFunctions() - Available C++ functions');
console.log('\n🎮 Game Over Testing:');
console.log('  TetrisDebug.testGameOver(score, level, lines) - Show game over');
console.log('  TetrisDebug.testNewRecordGameOver() - Test new record');
console.log('  TetrisDebug.testLowScoreGameOver() - Test low score');
console.log('  TetrisDebug.hideGameOverTest() - Hide game over');
console.log('  TetrisDebug.testGameOverSequence() - Full sequence test');
console.log('  TetrisDebug.forceResetGameOverState() - Force reset');
console.log('  TetrisDebug.restartGameOverMonitoring() - Restart monitoring');
console.log('\n⏸️ Auto-Pause Testing:');
console.log('  TetrisDebug.testAutoPause() - Test auto-pause');
console.log('  TetrisDebug.testAutoResume() - Test auto-resume');
console.log('  TetrisDebug.simulateBackground() - Simulate background');
console.log('  TetrisDebug.simulateForeground() - Simulate foreground');
console.log('\n🖥️ Menu Testing:');
console.log('  TetrisDebug.showDesktopMenu() - Show desktop menu');
console.log('  TetrisDebug.hideDesktopMenu() - Hide desktop menu');
console.log('\n🔧 State Manipulation:');
console.log('  TetrisDebug.resetHighScore() - Reset high score');
console.log('  TetrisDebug.forceSyncState() - Force sync JS/C++');
console.log('\n💡 TIP: All functions also available as window.* for backward compatibility');
console.log('🔧 ==============================================\n');

console.log('✅ Debug tools ready - use TetrisDebug.* in console');
