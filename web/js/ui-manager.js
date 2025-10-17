// ==================== UI MANAGER AND LAYOUT ====================

logger.log('ui', 'loading...');

// NOTA: Le funzioni pauseTimer, resumeTimer, stopTimer, restartTimer
// vengono esposte come window.* nei file dove sono definite (stats-updater.js, game-over.js)

// Funzioni FORZATE che funzionano sempre
/**
 * Force complete restart - delegates to centralized gameState.resetForNewGame()
 * This wrapper provides backward compatibility for existing code
 */
function forceCompleteRestart() {
    logger.log('ui', 'Force complete restart requested');
    gameState.resetForNewGame();
}

function forcePause(reason = 'manual') {
    logger.log('pause', 'FORCING PAUSE (' + reason + ')');

    if (!gameState.get('isPaused') && !gameState.get('isGameOver')) {
        gameState.set('isPaused', true);
        gameState.set('isTimerRunning', false);  // FERMA IL TIMER SUBITO
        gameState.set('pauseStartTime', Date.now());

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

        logger.success('pause', 'PAUSE FORCED - Timer stopped (' + reason + ')');
    }
}

function forceResume(reason = 'manual') {
    logger.log('pause', 'FORCING RESUME (' + reason + ')');

    if (gameState.get('isPaused') && !gameState.get('isGameOver')) {
        const pauseStartTime = gameState.get('pauseStartTime');
        if (pauseStartTime) {
            const pauseDuration = Date.now() - pauseStartTime;
            gameState.set('totalPausedTime', gameState.get('totalPausedTime') + pauseDuration);
            logger.log('pause', 'Added pause duration: ' + pauseDuration + ' ms');
        }

        gameState.set('isPaused', false);
        gameState.set('isTimerRunning', true);  // RIPRENDI IL TIMER SUBITO
        gameState.set('pauseStartTime', null);

        // Reset auto-pause state when resuming
        if (reason === 'auto' || reason === 'background') {
            gameState.set('wasAutoPaused', false);
            gameState.set('autoPauseReason', '');
        }

        // AGGIORNA DISPLAY SUBITO
        const gameStateElement = document.getElementById('gameState');
        if (gameStateElement) {
            gameStateElement.textContent = 'In corso';
            gameStateElement.style.color = '';
        }

        logger.success('pause', 'RESUME FORCED - Timer running (' + reason + ')');
    }
}

// Funzioni aggiuntive per controllo manuale
// Override the placeholder function
startGameTimer = function() {
    logger.log('ui', 'Starting game timer manually');
    gameState.set('gameStartTimeReal', Date.now());
    gameState.set('isTimerRunning', true);
    gameState.set('isGameOver', false);
    gameState.set('isPaused', false);
    gameState.set('totalPausedTime', 0);
    gameState.set('pauseStartTime', null);
    gameState.set('gameEndTime', null);

    const gameStateElement = document.getElementById('gameState');
    if (gameStateElement) {
        gameStateElement.textContent = 'In corso';
        gameStateElement.style.color = '';
    }
};

// Esponi anche come window.startGameTimer per compatibilità
window.startGameTimer = startGameTimer;

window.stopGameTimer = function() {
    logger.log('ui', 'Stopping game timer manually');
    gameState.set('isGameOver', true);
    gameState.set('isTimerRunning', false);
    gameState.set('gameEndTime', Date.now());

    const gameStateElement = document.getElementById('gameState');
    if (gameStateElement) {
        gameStateElement.textContent = 'Game Over';
        gameStateElement.style.color = '#ff5722';
    }
};

window.forceCompleteRestart = forceCompleteRestart;
window.forcePause = forcePause;
window.forceResume = forceResume;

// ==================== DEBUG FUNCTIONS ====================
// Debug functions have been moved to debug-tools.js for better organization
// and to keep production code clean.
//
// To use debug tools in development:
// 1. Load debug-tools.js in your HTML (see index_custom.html)
// 2. Use TetrisDebug.* namespace in console
// 3. All legacy window.* functions still available for backward compatibility
//
// Examples:
//   TetrisDebug.checkGameState()     - Full state inspection
//   TetrisDebug.testGameOver(1234)   - Test game over screen
//   TetrisDebug.resetHighScore()     - Reset high score
//
// For complete list of debug functions, load debug-tools.js and check console
// See: web/js/debug-tools.js

logger.loaded('ui');

