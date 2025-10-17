// ==================== VISIBILITY CHANGE MANAGER ====================
// Centralized handler for page visibility changes
// Manages both game pause logic and audio handling

logger.log('visibility', 'loading...');

/**
 * Handles game pause/resume when page visibility changes
 */
function handleVisibilityGamePause() {
    if (!gameState.get('gameStartRequested') || gameState.get('isGameOver')) return;

    if (document.hidden && !gameState.get('isPaused')) {
        // Page is hidden (tab switch, app background, etc.)
        logger.log('visibility', 'Auto-pausing: page went to background');
        gameState.set('wasAutoPaused', true);
        gameState.set('autoPauseReason', 'background');
        forcePause('background');

        // Also pause the C++ game engine
        try {
            if (typeof Module !== 'undefined' && Module._isGameRunning && Module._isGameRunning() && !Module._isGamePaused()) {
                simulateKeyPress('Escape');
                logger.log('cpp', 'C++ game also paused for background');
            }
        } catch(e) {
            logger.error('cpp', 'Error pausing C++ game', e);
        }
    } else if (!document.hidden && gameState.get('wasAutoPaused') && gameState.get('autoPauseReason') === 'background') {
        // Page is visible again
        logger.log('visibility', 'Page back to foreground - showing resume options');
        showResumeDialog();
    }
}

/**
 * Handles audio muting/unmuting when page visibility changes
 */
function handleVisibilityAudio() {
    if (document.hidden) {
        // Page not visible - reduce/mute audio
        handleBackgroundAudio();
    } else {
        // Page visible again - restore audio
        setTimeout(() => {
            handleForegroundAudio();
        }, GameConfig.AUDIO_RESTORE_DELAY);
    }
}

/**
 * Master visibility change handler
 * Coordinates all visibility-related actions
 */
document.addEventListener('visibilitychange', function() {
    logger.log('visibility', 'Visibility changed: ' + (document.hidden ? 'hidden' : 'visible'));

    // Handle game pause logic
    handleVisibilityGamePause();

    // Handle audio management
    handleVisibilityAudio();
});

/**
 * Webkit-specific visibility handler for iOS devices
 */
document.addEventListener('webkitvisibilitychange', function() {
    if (document.webkitHidden) {
        logger.log('visibility', 'Webkit visibility: hidden (iOS)');
        handleBackgroundAudio();
    } else {
        logger.log('visibility', 'Webkit visibility: visible (iOS)');
        setTimeout(() => {
            handleForegroundAudio();
        }, GameConfig.AUDIO_RESTORE_DELAY);
    }
});

logger.loaded('visibility');
