// ==================== KEYBOARD CONTROLS ==================== 

        // Event listener per la tastiera
    // Small cooldown to avoid rapid pause toggles (ms)
    const PAUSE_TOGGLE_COOLDOWN_MS = 250;
    let lastPauseToggleMs = 0;

        document.addEventListener('keydown', function(event) {
            console.log('Key pressed:', event.key, event.code, 'isTrusted=', event.isTrusted, 'target=', event.target.tagName, event.target.id);

            // Ignore synthetic (programmatically-dispatched) keyboard events so
            // simulateKeyPress() (which dispatches events to the canvas) doesn't
            // bubble up and trigger the JS handlers again, causing double toggles.
            // EXCEPTION: Allow synthetic ESC events for pause menu resume functionality
            const isEscKey = event.key === 'Escape' || event.code === 'Escape';
            if (!event.isTrusted && !isEscKey) {
                console.log('Ignoring synthetic key event:', event.key);
                return;
            }

            // If it's a synthetic ESC, it's for the C++ game only - don't handle in JS
            if (!event.isTrusted && isEscKey) {
                console.log('✅ Allowing synthetic ESC event for C++ game control (skipping JS menu logic)');
                // Return here - let C++ handle it, but don't process menu logic in JS
                return;
            }

            // For ESC key, we want to handle it even if canvas has focus
            // to ensure menu system works properly
            
            // Also ignore events whose target is the canvas element, EXCEPT for ESC
            // key events are dispatched directly to the canvas and should be
            // handled by the C++ engine (via Emscripten). If they bubble up to
            // document we must not handle them again in JS.
            if (!isEscKey) {
                try {
                    const canvasEl = (typeof Module !== 'undefined' && Module.canvas) ? Module.canvas : document.getElementById('canvas');
                    if (canvasEl && event.target === canvasEl) {
                        console.log('Ignoring non-ESC key event targeted at canvas:', event.key);
                        return;
                    }
                } catch (e) {
                    // ignore lookup errors
                }
            }
            
            // INVIO - riavvia tutto FORZATAMENTE
            if (event.key === 'Enter' || event.code === 'Enter') {
                console.log('🔄 ENTER pressed - FORCING complete restart');
                event.preventDefault();
                
                // FORZA il restart completo
                forceCompleteRestart();
                return;
            }
            
            if (event.key === 'Escape' || event.code === 'Escape') {
                console.log('ESC pressed - checking conditions');
                event.preventDefault();
                
                // Check if any pause menu is already visible
                const mobilePauseMenu = document.getElementById('mobilePauseMenu');
                const desktopPauseMenu = document.getElementById('desktopPauseMenu');
                
                if (mobilePauseMenu && mobilePauseMenu.classList.contains('active')) {
                    console.log('📱 Mobile menu visibile - chiudendo menu');
                    hideMobilePauseMenu();
                    return;
                }
                
                if (desktopPauseMenu && desktopPauseMenu.classList.contains('active')) {
                    console.log('🖥️ Desktop menu visibile - chiudendo menu');
                    hideDesktopPauseMenu();
                    return;
                }
                
                // Se è in corso un long press, ignora ESC
                if (longPressTriggered) {
                    console.log('📱 Long press in corso - ignorando ESC');
                    return;
                }
                
                // ESC da tastiera fisica - gestisci normalmente
                if (!gameState.get('isGameOver')) {
                    const now = Date.now();
                    if (now - lastPauseToggleMs < PAUSE_TOGGLE_COOLDOWN_MS) {
                        console.log('Ignorato ESC rapido (cooldown)');
                        return;
                    }
                    lastPauseToggleMs = now;

                    if (gameState.get('isPaused')) {
                        console.log('FORCING resume da tastiera');
                        forceResume('keyboard');
                        
                        // Also resume C++ game
                        setTimeout(() => {
                            try {
                                if (typeof Module !== 'undefined' && Module._isGamePaused && Module._isGamePaused()) {
                                    simulateKeyPress('Escape');
                                }
                            } catch(e) {
                                console.log('Error resuming C++ game:', e);
                            }
                        }, 50);
                        
                    } else {
                        console.log('FORCING pause da tastiera');
                        forcePause('keyboard');
                        
                        // Pause C++ game first, but be smarter about focus
                        setTimeout(() => {
                            try {
                                if (typeof Module !== 'undefined' && Module._isGameRunning && Module._isGameRunning() && !Module._isGamePaused()) {
                                    // Don't steal focus when pausing - we want to keep control for menu
                                    simulateKeyPress('Escape', { skipFocus: true });
                                    console.log('🎮 C++ game paused via keyboard');
                                }
                            } catch(e) {
                                console.log('Error pausing C++ game:', e);
                            }
                        }, 50);
                        
                        // Show appropriate pause menu
                        setTimeout(() => {
                            if (window.innerWidth <= 768) {
                                console.log('📱 Showing mobile pause menu');
                                showMobilePauseMenu();
                            } else {
                                console.log('🖥️ Showing desktop pause menu');
                                showDesktopPauseMenu();
                            }
                        }, 100);
                    }
                }
                }
                
                // INVIO per ricominciare
                if (event.key === 'Enter' || event.code === 'Enter') {
                    console.log('ENTER key detected');
                    
                    if (gameState.get('isGameOver')) {
                        // Se siamo in game over, riavvia immediatamente
                        console.log('� Restarting game from game over state');
                        restartTimer();
                    } else if (gameState.get('lastScore') > 0) {
                        // Se abbiamo un punteggio e premiamo INVIO, potrebbe essere per ricominciare
                        console.log('ENTER pressed with lastScore > 0 - restarting game');
                        restartTimer();
                    }
                }
            });
