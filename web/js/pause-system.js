// ==================== PAUSE SYSTEM ====================
// Gestione del menu di pausa per desktop e mobile

console.log('📦 Loading: pause-system.js');

/**
 * Genera messaggi motivazionali basati sulle prestazioni
 */
function getMotivationalMessage() {
    const { finalScore, finalLevel, isNewRecord } = gameOverData;

    if (isNewRecord) {
        return {
            message: "🎉 Fantastico! Hai battuto il tuo record personale!",
            type: "record"
        };
    }
    
    if (finalScore === 0) {
        return {
            message: "Non preoccuparti, tutti iniziano da qualche parte. Riprova!",
            type: "beginner"
        };
    }
    
    if (finalScore < 1000) {
        return {
            message: "Buon inizio! Continua a giocare per migliorare.",
            type: "starter"
        };
    }
    
    if (finalScore < 5000) {
        return {
            message: "Ottimo lavoro! Stai migliorando rapidamente.",
            type: "improving"
        };
    }
    
    if (finalScore < 10000) {
        return {
            message: "Fantastico! Sei sulla buona strada per diventare un maestro!",
            type: "advanced"
        };
    }
    
    if (finalLevel >= 10) {
        return {
            message: "Incredibile! Hai raggiunto un livello molto alto!",
            type: "expert"
        };
    }
    
    return {
        message: "Ottimo punteggio! Riprova per battere il tuo record!",
        type: "good"
    };
}

/**
 * Aggiunge i listener per i controlli da tastiera nella schermata game over
 */
// Override the placeholder function
addGameOverKeyboardListeners = function() {
    document.addEventListener('keydown', handleGameOverKeyboard);
}
console.log('✅ Defined: addGameOverKeyboardListeners in pause-system.js');

/**
 * Rimuove i listener per i controlli da tastiera
 */
// Override the placeholder function
removeGameOverKeyboardListeners = function() {
    document.removeEventListener('keydown', handleGameOverKeyboard);
}
console.log('✅ Defined: removeGameOverKeyboardListeners');

/**
 * Gestisce gli input da tastiera nella schermata game over
 */
function handleGameOverKeyboard(event) {
    if (!gameState.get('newGameOverActive')) return;
    
    switch (event.key) {
        case 'Enter':
            event.preventDefault();
            console.log('🎮 Enter pressed in game over - restarting');
            restartFromGameOver();
            break;
            
        case 'r':
        case 'R':
            event.preventDefault();
            console.log('🔄 R pressed in game over - restarting');
            restartFromGameOver();
            break;
    }
}

/**
 * Riavvia il gioco dalla schermata game over
 */
// Override the placeholder function
restartFromGameOver = function() {
    console.log('🔄 Restarting game from game over screen');

    hideNewGameOver();

    // Aspetta che l'animazione finisca, poi riavvia
    setTimeout(() => {
        // Use centralized restart logic
        gameState.resetForNewGame();

        // Reset game over monitoring state
        gameState.set('lastKnownScore', 0);
    }, 300);
}
console.log('✅ Defined: restartFromGameOver');

// Mobile game over detection and overlay (legacy - mantieni per compatibilità)
// NOTA: mobileGameOverActive è già dichiarato in dom-elements.js

function showMobileGameOver(score) {
    // Usa la nuova schermata unificata invece di quella legacy
    if (typeof Module !== 'undefined') {
        try {
            const level = Module._getLevel ? Module._getLevel() : 1;
            const lines = Module._getLines ? Module._getLines() : 0;
            const gameTime = document.getElementById('gameTime')?.textContent?.replace(' (FINAL)', '') || '00:00';
            
            showNewGameOver(score, level, lines, gameTime);
            return;
        } catch(e) {
            console.log('Error getting game stats, using basic game over:', e);
        }
    }
    
    // Fallback alla schermata di base
    showNewGameOver(score);
}

function hideMobileGameOver() {
    hideNewGameOver();
}

// ==================== NUOVA GESTIONE GAME OVER UNIFICATA ====================

// Variabili globali per la gestione del game over
// NOTA: gameOverCheckInterval, lastKnownScore, newGameOverActive, mobileGameOverActive
// e gameOverMonitoringInitialized sono dichiarati in dom-elements.js
let gameOverData = {
    finalScore: 0,
    finalLevel: 1,
    finalLines: 0,
    finalTime: '00:00',
    previousRecord: 0,
    isNewRecord: false,
    gameStartTime: null,
    totalGameTime: 0
};

    // Override the placeholder function
    startGameOverMonitoring = function() {
    // Permetti re-inizializzazione se necessario
    const existingInterval = gameState.get('gameOverCheckInterval');
    if (existingInterval) {
        console.log('� Clearing existing game over monitoring');
        clearInterval(existingInterval);
        gameState.set('gameOverCheckInterval', null);
    }

    gameState.set('gameOverMonitoringInitialized', true); 
    console.log('✅ Starting game over monitoring');
    
    // Add a short grace period after init to avoid false positives from preloaded state
    const monitoringStartTime = Date.now();

    const intervalId = setInterval(() => {
        // ignore checks during the first 3 seconds
        if (Date.now() - monitoringStartTime < 3000) return;

        if (typeof Module !== 'undefined' && Module._getScore && Module._isGameRunning) {
            try {
                const currentScore = Module._getScore();
                const gameRunning = Module._isGameRunning();

                // Skip game-over detection while the game is paused in JS or C++
                const jsPaused = gameState.get('isPaused') || gameState.get('mobilePauseActive');
                const cppPaused = Module._isGamePaused ? Module._isGamePaused() : false;
                if (jsPaused || cppPaused) {
                    // Avoid treating a pause (which may set C++ running=false) as game over
                    return;
                }

                // Game over detected: not running and we had a score
                // Only trigger if we previously observed the game running with a score
                const newGameOverActive = gameState.get('newGameOverActive');
                const mobileGameOverActive = gameState.get('mobileGameOverActive');
                const lastKnownScore = gameState.get('lastKnownScore');
                if (!gameRunning && currentScore > 0 && !newGameOverActive && !mobileGameOverActive && lastKnownScore > 0) {
                    console.log('🎮 Game over detected by monitoring:', {
                        score: currentScore,
                        gameRunning,
                        newGameOverActive,
                        mobileGameOverActive,
                        lastKnownScore
                    });
                    
                    // Usa la nuova schermata unificata
                    const currentLevel = Module._getLevel ? Module._getLevel() : 1;
                    const currentLines = Module._getLines ? Module._getLines() : 0;
                    const gameTime = document.getElementById('gameTime')?.textContent?.replace(' (FINAL)', '').replace(' (PAUSA)', '') || '00:00';

                    showNewGameOver(currentScore, currentLevel, currentLines, gameTime);
                    gameState.set('lastKnownScore', currentScore);
                }

                // Game restarted
                if (gameRunning && currentScore === 0 && lastKnownScore > 0) {
                    console.log('🔄 Game restart detected - updating stats');

                    // Nascondi qualsiasi schermata game over attiva
                    if (gameState.get('newGameOverActive')) {
                        hideNewGameOver();
                    }
                    if (gameState.get('mobileGameOverActive')) {
                        hideMobileGameOver();
                    }

                    // Reset completo dello stato per il prossimo game over
                    gameState.set('lastKnownScore', 0);
                    gameState.set('newGameOverActive', false);
                    gameState.set('mobileGameOverActive', false);
                    
                    console.log('🔄 Game over states reset for new game');
                    
                    // Force immediate stats update
                    updateStatsFromCpp();
                    
                    // More frequent updates for first few seconds after restart
                    let restartUpdateCount = 0;
                    const restartUpdateInterval = setInterval(() => {
                        updateStatsFromCpp();
                        restartUpdateCount++;
                        if (restartUpdateCount >= 10) { // 10 updates = 1 second
                            clearInterval(restartUpdateInterval);
                        }
                    }, 100); // Update every 100ms for 1 second
                }
                
                // Update lastKnownScore only when the game is running to avoid false positives
                if (gameRunning) {
                    const currentKnownScore = gameState.get('lastKnownScore');
                    gameState.set('lastKnownScore', currentScore > 0 ? currentScore : currentKnownScore);
                }
            } catch(e) {
                // Ignore errors accessing Module functions
            }
        }
    }, 500); // Check every 500ms

    gameState.set('gameOverCheckInterval', intervalId);
}
console.log('✅ Defined: startGameOverMonitoring');

// UNICO handler DOMContentLoaded consolidato per evitare inizializzazioni multiple
document.addEventListener('DOMContentLoaded', () => {
    // ==================== MENU INITIALIZATION ====================

    // Game over restart button
    const gameOverRestartBtn = document.getElementById('gameOverRestartBtn');

    if (gameOverRestartBtn) {
        gameOverRestartBtn.addEventListener('click', () => {
            logger.log('gameover', 'Game over restart button clicked');
            restartFromGameOver();
        });
    }

    // ==================== ELEMENTI LEGACY ====================

    const pauseBtn = document.getElementById('mobilePauseBtn');
    const restartBtn = document.getElementById('mobileRestartBtn');
    const resumeBtn = document.getElementById('resumeGameBtn');
    const restartBtnMenu = document.getElementById('restartGameBtn');

    // Mobile game control buttons
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            logger.log('mobile', 'Mobile pause clicked');
            simulateKeyPress('Escape');

            // Toggle button text
            if (pauseBtn.textContent.includes('Pausa')) {
                pauseBtn.textContent = '▶️ Riprendi';
            } else {
                pauseBtn.textContent = '⏸️ Pausa';
            }
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            logger.log('mobile', 'Mobile restart clicked');
            simulateKeyPress('Enter');

            // Reset pause button text
            if (pauseBtn) {
                pauseBtn.textContent = '⏸️ Pausa';
            }
        });
    }

    // Mobile pause menu event listeners
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            logger.log('mobile', 'Resume clicked');
            hideMobilePauseMenu();

            // Resume both JavaScript AND C++ game
            setTimeout(() => {
                logger.log('mobile', 'Resuming JavaScript state');
                forceResume('mobile');

                // Now resume C++ game engine
                setTimeout(() => {
                    try {
                        if (typeof Module !== 'undefined') {
                            // Check if game is actually paused in C++
                            const cppPaused = Module._isGamePaused ? Module._isGamePaused() : false;
                            logger.log('mobile', 'C++ pause state: ' + cppPaused);

                            if (cppPaused) {
                                logger.log('mobile', 'Sending ESC to unpause C++ game');
                                simulateKeyPress('Escape');
                            } else {
                                logger.log('mobile', 'C++ game already running');
                            }
                        }
                    } catch(e) {
                        logger.error('mobile', 'Error resuming C++ game', e);
                    }

                    // Ensure body has focus
                    setTimeout(() => {
                        document.body.focus();
                        logger.log('focus', 'Focus restored to body for mobile');
                    }, 100);
                }, 50);
            }, 100);
        });
    }

    // Desktop pause menu event listeners
    const desktopResumeBtn = document.getElementById('desktopResumeBtn');
    const desktopRestartBtn = document.getElementById('desktopRestartBtn');

    if (desktopResumeBtn) {
        desktopResumeBtn.addEventListener('click', () => {
            logger.log('desktop', 'Desktop resume clicked');
            hideDesktopPauseMenu();

            setTimeout(() => {
                logger.log('desktop', 'Resuming JavaScript state');
                forceResume('desktop');

                setTimeout(() => {
                    try {
                        if (typeof Module !== 'undefined') {
                            // Check if game is actually paused in C++
                            const cppPaused = Module._isGamePaused ? Module._isGamePaused() : false;
                            const cppRunning = Module._isGameRunning ? Module._isGameRunning() : false;
                            logger.log('desktop', 'C++ state - Paused: ' + cppPaused + ', Running: ' + cppRunning);

                            if (cppPaused && cppRunning) {
                                // Normal case: game is paused but running
                                logger.log('desktop', 'Sending ESC to unpause C++ game');
                                simulateKeyPress('Escape');
                                logger.log('cpp', 'C++ game resumed from desktop menu');
                            } else if (cppPaused && !cppRunning) {
                                // Special case: game is paused but not running (ESC stopped it completely)
                                logger.log('desktop', 'C++ game paused but not running - trying to resume with ESC');
                                simulateKeyPress('Escape');

                                // Verify if it worked after 200ms
                                setTimeout(() => {
                                    const stillNotRunning = Module._isGameRunning ? !Module._isGameRunning() : true;
                                    if (stillNotRunning) {
                                        logger.warn('desktop', 'ESC did not resume - game might need full restart');
                                    } else {
                                        logger.success('desktop', 'C++ game successfully resumed');
                                    }
                                }, 200);
                            } else if (!cppPaused && cppRunning) {
                                logger.log('desktop', 'C++ game already running');
                            } else {
                                logger.warn('desktop', 'C++ game in unknown state - paused: ' + cppPaused + ', running: ' + cppRunning);
                            }
                        }
                    } catch(e) {
                        logger.error('desktop', 'Error resuming C++ game', e);
                    }

                    // Ensure document.body has focus for future ESC events
                    setTimeout(() => {
                        document.body.focus();
                        logger.log('focus', 'Focus restored to body for future menu access');
                    }, 100);
                }, 50);
            }, 100);
        });
    }

    if (desktopRestartBtn) {
        desktopRestartBtn.addEventListener('click', () => {
            logger.log('desktop', 'Desktop restart clicked');
            hideDesktopPauseMenu();

            setTimeout(() => {
                resetGameInfo();
                simulateKeyPress('Enter');
                logger.log('cpp', 'Game restarted from desktop menu');
            }, 100);
        });
    }

    if (restartBtnMenu) {
        restartBtnMenu.addEventListener('click', () => {
            logger.log('mobile', 'Restart clicked');
            hideMobilePauseMenu();

            // Wait a moment then restart
            setTimeout(() => {
                resetGameInfo();
                simulateKeyPress('Enter');
                logger.log('mobile', 'Game restarted');
            }, 100);
        });
    }

    // Close menus when clicking outside
    const mobileMenu = document.getElementById('mobilePauseMenu');
    const desktopMenu = document.getElementById('desktopPauseMenu');

    if (mobileMenu || desktopMenu) {
        document.addEventListener('click', (e) => {
            // Mobile menu
            if (mobileMenu && !mobileMenu.contains(e.target) && mobileMenu.classList.contains('active')) {
                logger.log('mobile', 'Mobile menu closed by clicking outside');
                hideMobilePauseMenu();

                // Resume game when closing menu
                setTimeout(() => {
                    if (typeof Module !== 'undefined' && Module._isGamePaused) {
                        const isPaused = Module._isGamePaused();
                        if (isPaused) {
                            simulateKeyPress('Escape');
                            logger.log('mobile', 'Game auto-resumed');
                        }
                    }
                }, 100);
            }

            // Desktop menu
            if (desktopMenu && !desktopMenu.querySelector('.desktop-pause-content').contains(e.target) && desktopMenu.classList.contains('active')) {
                logger.log('desktop', 'Desktop menu closed by clicking outside');
                hideDesktopPauseMenu();

                // Resume game when closing menu
                setTimeout(() => {
                    if (gameState.get('isPaused')) {
                        forceResume('desktop');

                        setTimeout(() => {
                            try {
                                if (typeof Module !== 'undefined' && Module._isGamePaused && Module._isGamePaused()) {
                                    simulateKeyPress('Escape');
                                    logger.log('desktop', 'Game auto-resumed from outside click');
                                }
                            } catch(e) {
                                logger.error('desktop', 'Error resuming C++ game', e);
                            }
                        }, 50);
                    }
                }, 100);
            }
        });
    }

    // Inizializza il monitoring del game over per tutti i dispositivi
    logger.log('init', 'Initializing game over monitoring system...');
    setTimeout(() => {
        logger.log('init', 'Starting game over monitoring for all devices');
        startGameOverMonitoring();
    }, 2000);
});

// Mobile pause menu functions
// Override the placeholder function
showMobilePauseMenu = function() {
    logger.log('mobile', 'Long press detected - checking if menu already active');

    // Check if menu is already active
    const menu = document.getElementById('mobilePauseMenu');
    if (menu && menu.classList.contains('active')) {
        logger.log('mobile', 'Menu already active - ignoring long press');
        return;
    }

    // Show menu first
    if (menu) {
        gameState.set('mobilePauseActive', true); // Set flag to disable sync
        menu.classList.add('active');
        logger.log('mobile', 'Pause menu shown with overlay');
    }

    // Then pause both JavaScript AND C++ game
    setTimeout(() => {
        if (!gameState.get('isGameOver') && !gameState.get('isPaused')) {
            logger.log('mobile', 'Pausing JavaScript state first');
            forcePause('mobile');

            // Now pause C++ game engine (only once!)
            setTimeout(() => {
                logger.log('mobile', 'Pausing C++ game engine');
                simulateKeyPress('Escape');
            }, 50);
        } else {
            logger.log('mobile', 'Game already paused or over, just showing menu');
        }
    }, 100);
}
console.log('✅ Defined: showMobilePauseMenu');

// Override the placeholder function
hideMobilePauseMenu = function() {
    const menu = document.getElementById('mobilePauseMenu');
    if (menu) {
        menu.classList.remove('active');
        logger.log('mobile', 'Pause menu hidden');

        // Re-enable sync after a short delay
        setTimeout(() => {
            gameState.set('mobilePauseActive', false);
            logger.log('mobile', 'Mobile pause system deactivated - sync re-enabled');
        }, 500);
    }
}
console.log('✅ Defined: hideMobilePauseMenu');

logger.loaded('pause-system');
