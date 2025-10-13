// ==================== AUDIO CONTROLS ====================

console.log('📦 Loading: audio-controls.js');
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
                console.log('Game container visible, re-adding touch controls...');
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

// Primary method: Page Visibility API (works on all modern browsers)
document.addEventListener('visibilitychange', function() {
    if (!gameStartRequested || isGameOver) return;
    
    if (document.hidden && !isPaused) {
        // Page is hidden (tab switch, app background, etc.)
        console.log('🔄 Auto-pausing: page went to background');
        wasAutoPaused = true;
        autoPauseReason = 'background';
        forcePause('background');
        
        // Also pause the C++ game engine
        try {
            if (typeof Module !== 'undefined' && Module._isGameRunning && Module._isGameRunning() && !Module._isGamePaused()) {
                simulateKeyPress('Escape');
                console.log('🎮 C++ game also paused for background');
            }
        } catch(e) {
            console.log('Error pausing C++ game:', e);
        }
    } else if (!document.hidden && wasAutoPaused && autoPauseReason === 'background') {
        // Page is visible again
        console.log('👀 Page back to foreground - showing resume options');
        showResumeDialog();
    }
});

// Secondary method: Window focus/blur (backup for older browsers)
window.addEventListener('blur', function() {
    if (!gameStartRequested || isGameOver || document.hidden) return; // visibilitychange already handled it
    
    if (!isPaused) {
        console.log('🔄 Auto-pausing: window lost focus');
        wasAutoPaused = true;
        autoPauseReason = 'blur';
        forcePause('auto');
        
        try {
            if (typeof Module !== 'undefined' && Module._isGameRunning && Module._isGameRunning() && !Module._isGamePaused()) {
                simulateKeyPress('Escape');
                console.log('🎮 C++ game also paused for focus loss');
            }
        } catch(e) {
            console.log('Error pausing C++ game:', e);
        }
    }
});

window.addEventListener('focus', function() {
    if (!gameStartRequested || isGameOver) return;
    
    if (wasAutoPaused && autoPauseReason === 'blur' && !document.hidden) {
        console.log('👀 Window regained focus - showing resume options');
        showResumeDialog();
    }
});

// Function to show resume dialog/notification
// Override the placeholder function
showResumeDialog = function() {
    // Reset auto-pause state
    wasAutoPaused = false;
    autoPauseReason = '';
    
    // On mobile, show the pause menu
    if (window.innerWidth <= 768) {
        console.log('📱 Mobile: showing pause menu for resume');
        const mobilePauseMenu = document.getElementById('mobilePauseMenu');
        if (mobilePauseMenu) {
            mobilePauseMenu.classList.add('active');
            mobilePauseActive = true;
        }
    } else {
        // On desktop, show the pause menu
        console.log('🖥️ Desktop: showing pause menu for resume');
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
        console.log('🖥️ Desktop pause menu shown');

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
        console.log('🖥️ Desktop pause menu hidden');
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
        console.log('Error updating pause menu stats:', e);
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
    console.log('🎮 [REAL FUNCTION] Showing new unified game over screen', { score, level, lines, gameTime, newGameOverActive });
    
    // Se è già attiva, non mostrare di nuovo
    if (newGameOverActive) {
        console.log('⚠️ Game over screen already active, skipping');
        return;
    }
    
    newGameOverActive = true;
    const overlay = document.getElementById('gameOverOverlay');
    const canvas = document.getElementById('canvas');
    
    if (!overlay) {
        console.error('Game over overlay not found');
        newGameOverActive = false; // Reset se non trovato
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
    
    console.log('✅ New game over screen displayed');
}

/**
 * Nasconde la schermata di game over
 */
// Override the placeholder function
hideNewGameOver = function() {
    console.log('🎮 Hiding new game over screen');
    
    newGameOverActive = false;
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
    mobileGameOverActive = false;
    
    console.log('✅ New game over screen hidden - all states reset');
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
        console.log('� New high score achieved:', score);
    }
    
    // Calcola il tempo totale di gioco
    let totalGameTimeMs = 0;
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
    
    console.log('📊 Game over data calculated:', gameOverData);
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

