// ==================== AUDIO CONTROLS ====================

logger.log('audio', 'loading...');
// ==================== MOBILE TOUCH SUPPORT PER GAME OVER DISABILITATO ====================

/**
 * DISABILITATO: Supporto touch gesture per la schermata game over
 * 
 * Le gesture automatiche (swipe, double tap) sono state rimosse per evitare
 * riavvii accidentali durante lo scroll della pagina game over.
 * 
 * Ora si utilizzano SOLO i pulsanti dedicati per ricominciare o tornare al menu.
 */

const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (gameContainer.classList.contains('visible')) {
                logger.log('ui', 'Game container visible, re-adding touch controls');
                setTimeout(addTouchControls, 100);
                observer.disconnect();
            }
        }
    });
});

observer.observe(gameContainer, { attributes: true });

// NOTA: resize e orientation listeners sono gestiti in touch-controls.js
// dove è definita fitCanvasToViewport

// Auto-pause system when game goes to background (mobile and desktop)
// NOTA: wasAutoPaused e autoPauseReason sono dichiarati in dom-elements.js
// NOTA: visibilitychange handler è ora in visibility-manager.js

// Secondary method: Window focus/blur (backup for older browsers)
window.addEventListener('blur', function() {
    if (!gameState.get('gameStartRequested') || gameState.get('isGameOver') || document.hidden) return; // visibilitychange already handled it

    if (!gameState.get('isPaused')) {
        logger.log('pause', 'Auto-pausing: window lost focus');
        gameState.set('wasAutoPaused', true);
        gameState.set('autoPauseReason', 'blur');
        forcePause('auto');

        try {
            if (typeof Module !== 'undefined' && Module._isGameRunning && Module._isGameRunning() && !Module._isGamePaused()) {
                simulateKeyPress('Escape');
                logger.log('cpp', 'C++ game also paused for focus loss');
            }
        } catch(e) {
            logger.error('cpp', 'Error pausing C++ game', e);
        }
    }
});

window.addEventListener('focus', function() {
    if (!gameState.get('gameStartRequested') || gameState.get('isGameOver')) return;

    if (gameState.get('wasAutoPaused') && gameState.get('autoPauseReason') === 'blur' && !document.hidden) {
        logger.log('pause', 'Window regained focus - showing resume options');
        showResumeDialog();
    }
});

// Function to show resume dialog/notification
// Override the placeholder function
showResumeDialog = function() {
    // Reset auto-pause state
    gameState.set('wasAutoPaused', false);
    gameState.set('autoPauseReason', '');

    // On mobile, show the pause menu
    if (window.innerWidth <= 768) {
        logger.log('ui', 'Mobile: showing pause menu for resume');
        const mobilePauseMenu = document.getElementById('mobilePauseMenu');
        if (mobilePauseMenu) {
            mobilePauseMenu.classList.add('active');
            gameState.set('mobilePauseActive', true);
        }
    } else {
        // On desktop, show the pause menu
        logger.log('ui', 'Desktop: showing pause menu for resume');
        showDesktopPauseMenu();
    }
}

// Desktop pause menu functions
// Override the placeholder function
showDesktopPauseMenu = function() {
    const menu = document.getElementById('desktopPauseMenu');
    if (menu && window.innerWidth > 768) {
        // Update stats in the menu
        updateDesktopPauseMenuStats();

        // Show menu
        menu.classList.add('active');
        logger.log('ui', 'Desktop pause menu shown');

        // Focus the resume button for keyboard accessibility
        setTimeout(() => {
            const resumeBtn = document.getElementById('desktopResumeBtn');
            if (resumeBtn) resumeBtn.focus();
        }, 100);
    }
};

// Override the placeholder function
hideDesktopPauseMenu = function() {
    const menu = document.getElementById('desktopPauseMenu');
    if (menu) {
        menu.classList.remove('active');
        logger.log('ui', 'Desktop pause menu hidden');
    }
}

// Override the placeholder function
updateDesktopPauseMenuStats = function() {
    try {
        // Update current game stats in the pause menu
        const scoreEl = document.getElementById('desktopPauseScore');
        const levelEl = document.getElementById('desktopPauseLevel');
        const linesEl = document.getElementById('desktopPauseLines');
        const timeEl = document.getElementById('desktopPauseTime');
        
        if (typeof Module !== 'undefined') {
            if (scoreEl && Module._getScore) {
                scoreEl.textContent = Module._getScore().toLocaleString();
            }
            if (levelEl && Module._getLevel) {
                levelEl.textContent = Module._getLevel();
            }
            if (linesEl && Module._getLines) {
                linesEl.textContent = Module._getLines();
            }
        }
        
        // Update time from the game timer
        if (timeEl) {
            const gameTimeElement = document.getElementById('gameTime');
            if (gameTimeElement) {
                timeEl.textContent = gameTimeElement.textContent.replace(' (PAUSA)', '').replace(' (FINAL)', '');
            }
        }
    } catch(e) {
        logger.error('ui', 'Error updating pause menu stats', e);
    }
}

// Replace the old notification function
function showDesktopResumeNotification() {
    showDesktopPauseMenu();
}

// ==================== NUOVA SCHERMATA GAME OVER UNIFICATA ====================

// NOTA: newGameOverActive è dichiarato in dom-elements.js

/**
 * Mostra la nuova schermata di game over unificata per desktop e mobile
 */
// Override the placeholder function
showNewGameOver = function(score = 0, level = 1, lines = 0, gameTime = '00:00') {
    logger.log('gameover', 'Showing new unified game over screen', { score, level, lines, gameTime, newGameOverActive: gameState.get('newGameOverActive') });

    // Se è già attiva, non mostrare di nuovo
    if (gameState.get('newGameOverActive')) {
        logger.warn('gameover', 'Game over screen already active, skipping');
        return;
    }

    gameState.set('newGameOverActive', true);
    const overlay = document.getElementById('gameOverOverlay');
    const canvas = document.getElementById('canvas');

    if (!overlay) {
        logger.error('gameover', 'Game over overlay not found');
        gameState.set('newGameOverActive', false); // Reset se non trovato
        return;
    }
    
    // Assicurati che l'overlay sia visibile 
    overlay.style.display = 'flex';
    
    // Nascondi il canvas per evitare sovrapposizioni
    if (canvas) {
        canvas.style.opacity = '0.3';
        canvas.style.pointerEvents = 'none';
    }
    
    // Calcola i dati finali del gioco
    calculateGameOverData(score, level, lines, gameTime);
    
    // Aggiorna tutti gli elementi della schermata
    updateGameOverElements();
    
    // Mostra la schermata con animazione
    overlay.classList.add('active');
    
    // Aggiungi i listener per i controlli da tastiera
    addGameOverKeyboardListeners();

    logger.success('gameover', 'New game over screen displayed');
}

/**
 * Nasconde la schermata di game over
 */
// Override the placeholder function
hideNewGameOver = function() {
    logger.log('gameover', 'Hiding new game over screen');

    gameState.set('newGameOverActive', false);
    const overlay = document.getElementById('gameOverOverlay');
    const canvas = document.getElementById('canvas');
    
    if (overlay) {
        overlay.classList.remove('active');
        
        // Nascondi l'overlay dopo l'animazione
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }
    
    // Ripristina la visibilità del canvas
    if (canvas) {
        canvas.style.opacity = '1';
        canvas.style.pointerEvents = 'auto';
    }
    
    // Rimuovi i listener della tastiera
    removeGameOverKeyboardListeners();

    // Reset anche dello stato legacy mobile per sicurezza
    gameState.set('mobileGameOverActive', false);

    logger.success('gameover', 'New game over screen hidden - all states reset');
}

/**
 * Calcola e prepara i dati per la schermata game over
 */
// Override the placeholder function
calculateGameOverData = function(score, level, lines, gameTime) {
    // Ottieni il record precedente
    const previousRecord = parseInt(localStorage.getItem('tetris-high-score') || '0');

    // Determina se è un nuovo record
    const isNewRecord = score > previousRecord;

    // Salva il nuovo record se necessario
    if (isNewRecord) {
        localStorage.setItem('tetris-high-score', score.toString());
        logger.success('gameover', 'New high score achieved: ' + score);
    }

    // Calcola il tempo totale di gioco
    let totalGameTimeMs = 0;
    const gameStartTimeReal = gameState.get('gameStartTimeReal');
    const gameEndTime = gameState.get('gameEndTime');
    const totalPausedTime = gameState.get('totalPausedTime');
    if (gameStartTimeReal && gameEndTime) {
        totalGameTimeMs = gameEndTime - gameStartTimeReal - totalPausedTime;
    } else if (gameStartTimeReal) {
        totalGameTimeMs = Date.now() - gameStartTimeReal - totalPausedTime;
    }
    
    const totalGameTimeSeconds = Math.floor(totalGameTimeMs / 1000);
    const minutes = Math.floor(totalGameTimeSeconds / 60);
    const seconds = totalGameTimeSeconds % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Aggiorna i dati globali
    gameOverData = {
        finalScore: score,
        finalLevel: level,
        finalLines: lines,
        finalTime: formattedTime,
        previousRecord: previousRecord,
        isNewRecord: isNewRecord,
        totalGameTime: totalGameTimeMs
    };

    logger.log('gameover', 'Game over data calculated', gameOverData);
}

/**
 * Aggiorna tutti gli elementi HTML della schermata game over
 */
// Override the placeholder function
updateGameOverElements = function() {
    // Aggiorna le statistiche finali
    const finalScoreEl = document.getElementById('gameOverFinalScore');
    const finalLevelEl = document.getElementById('gameOverFinalLevel');
    const finalLinesEl = document.getElementById('gameOverFinalLines');
    const finalTimeEl = document.getElementById('gameOverFinalTime');
    
    if (finalScoreEl) finalScoreEl.textContent = gameOverData.finalScore.toLocaleString();
    if (finalLevelEl) finalLevelEl.textContent = gameOverData.finalLevel;
    if (finalLinesEl) finalLinesEl.textContent = gameOverData.finalLines;
    if (finalTimeEl) finalTimeEl.textContent = gameOverData.finalTime;
    
    // Aggiorna la sezione record
    const recordValueEl = document.getElementById('gameOverRecordValue');
    const recordCardEl = document.getElementById('gameOverRecordCard');
    const newRecordBadgeEl = document.getElementById('gameOverNewRecordBadge');
    
    if (recordValueEl) {
        if (gameOverData.isNewRecord) {
            recordValueEl.textContent = gameOverData.finalScore.toLocaleString();
        } else {
            recordValueEl.textContent = gameOverData.previousRecord.toLocaleString();
        }
    }
    
    if (recordCardEl) {
        if (gameOverData.isNewRecord) {
            recordCardEl.classList.add('new-record');
        } else {
            recordCardEl.classList.remove('new-record');
        }
    }
}

// ==================== CONTROLLI AUDIO VOLUME/MUTE ====================

// Variabili globali per controllo audio
let audioInitialized = false;

// Inizializza controlli audio
function initAudioControls() {
    if (audioInitialized) return;

    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    const muteButton = document.getElementById('mute-button');
    const muteIcon = muteButton?.querySelector('.mute-icon');
    const muteText = muteButton?.querySelector('.mute-text');

    if (!volumeSlider || !volumeValue || !muteButton) {
        logger.log('audio', 'Audio controls not found, retrying...');
        setTimeout(initAudioControls, 500);
        return;
    }

    logger.log('audio', 'Initializing audio controls...');

    // Carica impostazioni salvate
    const savedVolume = localStorage.getItem('tetris-volume');
    const savedMuted = localStorage.getItem('tetris-muted') === 'true';

    // Determina il volume da usare (salvato o default 30%)
    const volumeToUse = savedVolume !== null ? parseInt(savedVolume) : 30;
    volumeSlider.value = volumeToUse;
    volumeValue.textContent = volumeToUse;

    // Se non c'era un volume salvato, salva il default
    if (savedVolume === null) {
        localStorage.setItem('tetris-volume', '30');
        logger.log('audio', 'Default volume set to 30%');
    }

    if (savedMuted) {
        muteButton.classList.add('muted');
        muteIcon.textContent = '🔇';
        muteText.textContent = 'Unmute';

        // IMPORTANTE: Non usare muteAudio all'avvio, usa volume 0
        // Questo permette al contesto audio di inizializzarsi correttamente
        if (typeof Module !== 'undefined' && Module._setVolume) {
            Module._setVolume(0);
            logger.log('audio', 'Audio muted via volume 0 (allows audio context to initialize)');
        }
    } else {
        // Se non è mutato, applica il volume normalmente
        if (typeof Module !== 'undefined' && Module._setVolume) {
            const sdlVolume = Math.round((volumeToUse / 100) * 128);
            Module._setVolume(sdlVolume);
            logger.log('audio', 'Volume applied: ' + volumeToUse + '%');
        }

        // Riapplica dopo un timeout per sicurezza
        setTimeout(() => {
            if (typeof Module !== 'undefined' && Module._setVolume) {
                const sdlVolume = Math.round((volumeToUse / 100) * 128);
                Module._setVolume(sdlVolume);
                logger.log('audio', 'Volume reapplied after module load: ' + volumeToUse + '%');
            }
        }, 500);
    }

    // Previeni propagazione eventi touch sui controlli audio
    const audioControlsContainer = document.querySelector('.audio-controls');
    if (audioControlsContainer) {
        audioControlsContainer.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        });
        audioControlsContainer.addEventListener('touchend', function(e) {
            e.stopPropagation();
        });
        audioControlsContainer.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        });
        audioControlsContainer.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Event listener per il slider del volume
    // Aggiorna in tempo reale ma ottimizzato con requestAnimationFrame
    let animationFrameId = null;

    volumeSlider.addEventListener('input', function(e) {
        e.stopPropagation();
        const volume = parseInt(this.value); // Valore 0-100

        // Cancella il frame precedente se esiste
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Usa requestAnimationFrame per aggiornare in modo efficiente
        animationFrameId = requestAnimationFrame(() => {
            // Aggiorna il valore visualizzato
            volumeValue.textContent = volume;

            // Converti il volume da 0-100 a 0-128 per SDL
            const sdlVolume = Math.round((volume / 100) * 128);

            // Applica il volume al gioco
            if (typeof Module !== 'undefined' && Module._setVolume) {
                try {
                    Module._setVolume(sdlVolume);
                } catch (e) {
                    logger.error('audio', 'Error setting volume', e);
                }
            }

            // Se il volume è > 0 e l'audio era mutato, togli il mute
            if (volume > 0 && muteButton.classList.contains('muted')) {
                muteButton.classList.remove('muted');
                muteIcon.textContent = '🔊';
                muteText.textContent = 'Mute';

                if (typeof Module !== 'undefined' && Module._muteAudio) {
                    Module._muteAudio(false);
                    localStorage.setItem('tetris-muted', 'false');
                }
            }

            animationFrameId = null;
        });
    });

    // Salva il valore solo quando lo slider si ferma
    volumeSlider.addEventListener('change', function(e) {
        e.stopPropagation();
        const volume = parseInt(this.value);
        localStorage.setItem('tetris-volume', volume.toString());
        logger.log('audio', 'Volume saved: ' + volume + '%');
    });

    // Previeni eventi touch specifici per il volume slider
    volumeSlider.addEventListener('touchstart', function(e) {
        e.stopPropagation();
    });
    volumeSlider.addEventListener('touchend', function(e) {
        e.stopPropagation();
    });
    volumeSlider.addEventListener('touchmove', function(e) {
        e.stopPropagation();
    });

    // Event listener per il pulsante mute
    muteButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isMuted = this.classList.contains('muted');

        if (isMuted) {
            // Unmute - ripristina il volume
            this.classList.remove('muted');
            muteIcon.textContent = '🔊';
            muteText.textContent = 'Mute';
            localStorage.setItem('tetris-muted', 'false');

            if (typeof Module !== 'undefined' && Module._setVolume) {
                try {
                    const currentVolume = parseInt(volumeSlider.value || '30');
                    const sdlVolume = Math.round((currentVolume / 100) * 128);

                    // Imposta il volume direttamente (non usare muteAudio)
                    Module._setVolume(sdlVolume);
                    logger.log('audio', 'Audio unmuted - volume restored to: ' + currentVolume + '%');

                    // Riapplica dopo un breve delay per sicurezza
                    setTimeout(() => {
                        Module._setVolume(sdlVolume);
                        logger.log('audio', 'Volume reconfirmed: ' + currentVolume + '%');
                    }, 100);

                } catch (e) {
                    logger.error('audio', 'Error unmuting audio', e);
                }
            }
        } else {
            // Mute - imposta volume a 0
            this.classList.add('muted');
            muteIcon.textContent = '🔇';
            muteText.textContent = 'Unmute';
            localStorage.setItem('tetris-muted', 'true');

            if (typeof Module !== 'undefined' && Module._setVolume) {
                try {
                    // Usa volume 0 invece di muteAudio
                    Module._setVolume(0);
                    logger.log('audio', 'Audio muted via volume 0');
                } catch (e) {
                    logger.error('audio', 'Error muting audio', e);
                }
            }
        }
    });

    audioInitialized = true;
    logger.success('audio', 'Audio controls initialized successfully');
}

// Inizializza i controlli audio quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initAudioControls, 1000);
});

// Riprova l'inizializzazione quando il modulo Emscripten è caricato
window.addEventListener('load', function() {
    setTimeout(initAudioControls, 2000);
});

// ==================== GESTIONE AUDIO IN BACKGROUND ====================

let wasAudioMutedBeforeBackground = false;
let originalVolume = 100;

/**
 * Gestisce l'audio quando l'app va in background
 */
function handleBackgroundAudio() {
    if (typeof Module !== 'undefined' && Module._setVolume) {
        try {
            // Salva lo stato attuale dell'audio prima di mutarlo
            const currentMuteState = localStorage.getItem('tetris-muted') === 'true';
            wasAudioMutedBeforeBackground = currentMuteState;

            // Salva il volume corrente
            originalVolume = parseInt(localStorage.getItem('tetris-volume') || '30');

            // Abbassa il volume quando va in background (solo se non era già mutato)
            if (!currentMuteState) {
                Module._setVolume(0);
                logger.log('audio', 'Audio volume set to 0 - app in background');
            }
        } catch (e) {
            logger.error('audio', 'Error handling background audio', e);
        }
    }
}

/**
 * Ripristina l'audio quando l'app torna in foreground
 */
function handleForegroundAudio() {
    if (typeof Module !== 'undefined' && Module._setVolume) {
        try {
            // Controlla lo stato corrente del mute dal localStorage
            const currentMuteState = localStorage.getItem('tetris-muted') === 'true';

            // Ripristina il volume solo se:
            // 1. Non era mutato prima di andare in background
            // 2. Non è attualmente mutato dall'utente
            if (!wasAudioMutedBeforeBackground && !currentMuteState) {
                // Usa il volume salvato nel localStorage, non originalVolume
                const savedVolume = parseInt(localStorage.getItem('tetris-volume') || '30');
                const sdlVolume = Math.round((savedVolume / 100) * 128);
                Module._setVolume(sdlVolume);
                logger.log('audio', 'Audio volume restored to ' + savedVolume + '% - app in foreground');
            } else if (currentMuteState) {
                // Se l'utente ha mutato manualmente, mantieni il mute (volume 0)
                logger.log('audio', 'Audio remains muted - user preference');
            }
        } catch (e) {
            logger.error('audio', 'Error handling foreground audio', e);
        }
    }
}

// ==================== MOBILE SPECIFIC EVENTS ====================

let isAppActive = true;

// Event listeners per dispositivi mobili
window.addEventListener('focus', function() {
    isAppActive = true;
    setTimeout(() => {
        handleForegroundAudio();
    }, 200); // Delay maggiore per mobile
});

window.addEventListener('blur', function() {
    isAppActive = false;
    handleBackgroundAudio();
});

// Event listeners specifici per iOS
window.addEventListener('pagehide', function() {
    isAppActive = false;
    handleBackgroundAudio();
});

window.addEventListener('pageshow', function() {
    isAppActive = true;
    setTimeout(() => {
        handleForegroundAudio();
    }, 300); // Delay ancora maggiore per iOS
});

// Event listeners per Android
document.addEventListener('pause', function() {
    isAppActive = false;
    handleBackgroundAudio();
});

document.addEventListener('resume', function() {
    isAppActive = true;
    setTimeout(() => {
        handleForegroundAudio();
    }, 250);
});

// ==================== ADDITIONAL MOBILE DETECTION ====================

// Rileva quando l'utente naviga via (principalmente per mobile)
window.addEventListener('beforeunload', function() {
    handleBackgroundAudio();
});

// Event listener per il cambio di orientamento (può indicare un cambio di contesto)
window.addEventListener('orientationchange', function() {
    // Piccolo delay dopo il cambio di orientamento
    setTimeout(() => {
        if (isAppActive && !document.hidden) {
            handleForegroundAudio();
        }
    }, 500);
});

// ==================== TOUCH AND INTERACTION RESUMPTION ====================

// Rileva quando l'utente interagisce di nuovo con la pagina
let interactionTimeout;

function handleUserInteraction() {
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => {
        if (!document.hidden && isAppActive) {
            handleForegroundAudio();
        }
    }, 100);
}

// Event listeners per interazioni utente (ripristino audio dopo interazione)
document.addEventListener('touchstart', handleUserInteraction, { passive: true });
document.addEventListener('touchend', handleUserInteraction, { passive: true });
document.addEventListener('click', handleUserInteraction);
document.addEventListener('keydown', handleUserInteraction);

logger.loaded('audio');

