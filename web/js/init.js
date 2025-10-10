// ==================== INITIALIZATION ==================== 

            const gameOverRestartBtn = document.getElementById('gameOverRestartBtn');
            
            if (gameOverRestartBtn) {
                gameOverRestartBtn.addEventListener('click', () => {
                    console.log('🔄 Game over restart button clicked');
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
                    console.log('Mobile pause clicked');
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
                    console.log('Mobile restart clicked');
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
                    console.log('📱 Resume clicked');
                    hideMobilePauseMenu();
                    
                    // Resume both JavaScript AND C++ game
                    setTimeout(() => {
                        if (isPaused) {
                            console.log('📱 Resuming JavaScript state first');
                            forceResume('mobile');
                            
                            // Now resume C++ game engine (only once!)
                            setTimeout(() => {
                                console.log('📱 Resuming C++ game engine');
                                simulateKeyPress('Escape', { restoreFocus: true });
                                
                                // Ensure body has focus for future menu interactions
                                setTimeout(() => {
                                    document.body.focus();
                                    console.log('🎯 Focus restored to body for mobile');
                                }, 100);
                            }, 50);
                        }
                    }, 100);
                });
            }
            
            // Desktop pause menu event listeners
            const desktopResumeBtn = document.getElementById('desktopResumeBtn');
            const desktopRestartBtn = document.getElementById('desktopRestartBtn');
            const desktopQuitBtn = document.getElementById('desktopQuitBtn');
            
            if (desktopResumeBtn) {
                desktopResumeBtn.addEventListener('click', () => {
                    console.log('🖥️ Desktop resume clicked');
                    hideDesktopPauseMenu();
                    
                    setTimeout(() => {
                        if (isPaused) {
                            forceResume('desktop');
                            
                            setTimeout(() => {
                                try {
                                    if (typeof Module !== 'undefined' && Module._isGamePaused && Module._isGamePaused()) {
                                        // Don't let canvas keep focus after resume
                                        simulateKeyPress('Escape', { restoreFocus: true });
                                        console.log('🎮 C++ game resumed from desktop menu');
                                        
                                        // Ensure document.body has focus for future ESC events
                                        setTimeout(() => {
                                            document.body.focus();
                                            console.log('🎯 Focus restored to body for future menu access');
                                        }, 100);
                                    }
                                } catch(e) {
                                    console.log('Error resuming C++ game:', e);
                                }
                            }, 50);
                        }
                    }, 100);
                });
            }
            
            if (desktopRestartBtn) {
                desktopRestartBtn.addEventListener('click', () => {
                    console.log('🖥️ Desktop restart clicked');
                    hideDesktopPauseMenu();
                    
                    setTimeout(() => {
                        resetGameInfo();
                        simulateKeyPress('Enter');
                        console.log('🎮 Game restarted from desktop menu');
                    }, 100);
                });
            }
            
            if (desktopQuitBtn) {
                desktopQuitBtn.addEventListener('click', () => {
                    console.log('🖥️ Desktop quit clicked');
                    hideDesktopPauseMenu();
                    
                    // Show confirmation dialog
                    if (confirm('Sei sicuro di voler uscire dal gioco? Il progresso andrà perso.')) {
                        // Stop the game and return to start screen
                        stopTimer();
                        
                        setTimeout(() => {
                            // Hide game container and show start screen
                            const gameContainer = document.querySelector('.game-container');
                            const startScreen = document.getElementById('startScreen');
                            
                            if (gameContainer) gameContainer.classList.remove('visible');
                            if (startScreen) {
                                startScreen.classList.remove('hidden');
                                startScreen.style.display = 'flex';
                            }
                            
                            // Reset game state
                            gameStartRequested = false;
                            console.log('🚪 Returned to start screen');
                        }, 500);
                    } else {
                        // User cancelled, show menu again
                        showDesktopPauseMenu();
                    }
                });
            }
            
            if (restartBtnMenu) {
                restartBtnMenu.addEventListener('click', () => {
                    console.log('📱 Restart clicked');
                    hideMobilePauseMenu();
                    
                    // Wait a moment then restart
                    setTimeout(() => {
                        resetGameInfo();
                        simulateKeyPress('Enter');
                        console.log('📱 Game restarted');
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
                        console.log('📱 Mobile menu closed by clicking outside');
                        hideMobilePauseMenu();
                        
                        // Resume game when closing menu
                        setTimeout(() => {
                            if (typeof Module !== 'undefined' && Module._isGamePaused) {
                                const isPaused = Module._isGamePaused();
                                if (isPaused) {
                                    simulateKeyPress('Escape');
                                    console.log('📱 Game auto-resumed');
                                }
                            }
                        }, 100);
                    }
                    
                    // Desktop menu
                    if (desktopMenu && !desktopMenu.querySelector('.desktop-pause-content').contains(e.target) && desktopMenu.classList.contains('active')) {
                        console.log('🖥️ Desktop menu closed by clicking outside');
                        hideDesktopPauseMenu();
                        
                        // Resume game when closing menu
                        setTimeout(() => {
                            if (isPaused) {
                                forceResume('desktop');
                                
                                setTimeout(() => {
                                    try {
                                        if (typeof Module !== 'undefined' && Module._isGamePaused && Module._isGamePaused()) {
                                            simulateKeyPress('Escape');
                                            console.log('🖥️ Game auto-resumed from outside click');
                                        }
                                    } catch(e) {
                                        console.log('Error resuming C++ game:', e);
                                    }
                                }, 50);
                            }
                        }, 100);
                    }
                });
            }
            
            // Inizializza il monitoring del game over per tutti i dispositivi
        console.log('🎮 Inizializzando sistema di monitoring game over...');
        setTimeout(() => {
            console.log('🎮 Avvio monitoring game over per tutti i dispositivi');
            startGameOverMonitoring();
        }, 2000);
        
        // Precarica il gioco in background (senza avviarlo)
        setTimeout(() => {
            // Il gioco si caricherà ma non si avvierà automaticamente
        }, 100);
        
        // Mobile pause menu functions
        function showMobilePauseMenu() {
            console.log('📱 Long press detected - checking if menu already active');
            
            // Check if menu is already active
            const menu = document.getElementById('mobilePauseMenu');
            if (menu && menu.classList.contains('active')) {
                console.log('📱 Menu già attivo - ignorando long press');
                return;
            }
            
            // Show menu first
            if (menu) {
                mobilePauseActive = true; // Set flag to disable sync
                menu.classList.add('active');
                console.log('📱 Pause menu shown with overlay');
            }
            
            // Then pause both JavaScript AND C++ game
            setTimeout(() => {
                if (!isGameOver && !isPaused) {
                    console.log('📱 Pausing JavaScript state first');
                    forcePause('mobile');
                    
                    // Now pause C++ game engine (only once!)
                    setTimeout(() => {
                        console.log('📱 Pausing C++ game engine');
                        simulateKeyPress('Escape');
                    }, 50);
                } else {
                    console.log('📱 Game already paused or over, just showing menu');
                }
            }, 100);
        }
        
        function hideMobilePauseMenu() {
            const menu = document.getElementById('mobilePauseMenu');
            if (menu) {
                menu.classList.remove('active');
                console.log('📱 Pause menu hidden');
                
                // Re-enable sync after a short delay
                setTimeout(() => {
                    mobilePauseActive = false;
                    console.log('📱 Mobile pause system deactivated - sync re-enabled');
                }, 500);
            }
        }

        // ==================== CONTROLLI AUDIO ====================
        
        // Variabili globali per controllo audio
        let audioInitialized = false;
        
        // Inizializza controlli audio
        function initAudioControls() {
            if (audioInitialized) return;
            
            const volumeSlider = document.getElementById('volume-slider');
            const volumeValue = document.getElementById('volume-value');
            const muteButton = document.getElementById('mute-button');
            const muteIcon = muteButton.querySelector('.mute-icon');
            const muteText = muteButton.querySelector('.mute-text');
            
            if (!volumeSlider || !volumeValue || !muteButton) {
                console.log('Audio controls not found, retrying...');
                setTimeout(initAudioControls, 500);
                return;
            }
            
            console.log('🔊 Initializing audio controls...');
            
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
                console.log('🔊 Default volume set to 30%');
            }
            
            if (savedMuted) {
                muteButton.classList.add('muted');
                muteIcon.textContent = '🔇';
                muteText.textContent = 'Unmute';
                
                // IMPORTANTE: Non usare muteAudio all'avvio, usa volume 0
                // Questo permette al contesto audio di inizializzarsi correttamente
                if (typeof Module !== 'undefined' && Module._setVolume) {
                    Module._setVolume(0);
                    console.log('🔇 Audio muted via volume 0 (allows audio context to initialize)');
                }
            } else {
                // Se non è mutato, applica il volume normalmente
                if (typeof Module !== 'undefined' && Module._setVolume) {
                    const sdlVolume = Math.round((volumeToUse / 100) * 128);
                    Module._setVolume(sdlVolume);
                    console.log('� Volume applied:', volumeToUse + '%');
                }
                
                // Riapplica dopo un timeout per sicurezza
                setTimeout(() => {
                    if (typeof Module !== 'undefined' && Module._setVolume) {
                        const sdlVolume = Math.round((volumeToUse / 100) * 128);
                        Module._setVolume(sdlVolume);
                        console.log('🔊 Volume reapplied after module load:', volumeToUse + '%');
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
                            console.error('Error setting volume:', e);
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
                console.log('🔊 Volume saved:', volume + '%');
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
                            console.log('🔊 Audio unmuted - volume restored to:', currentVolume + '%');
                            
                            // Riapplica dopo un breve delay per sicurezza
                            setTimeout(() => {
                                Module._setVolume(sdlVolume);
                                console.log('🔊 Volume reconfirmed:', currentVolume + '%');
                            }, 100);
                            
                        } catch (e) {
                            console.error('Error unmuting audio:', e);
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
                            console.log('🔇 Audio muted via volume 0');
                        } catch (e) {
                            console.error('Error muting audio:', e);
                        }
                    }
                }
            });
            
            audioInitialized = true;
            console.log('🔊 Audio controls initialized successfully');
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
                        console.log('🔇 Audio volume set to 0 - app in background');
                    }
                } catch (e) {
                    console.error('Error handling background audio:', e);
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
                        console.log('🔊 Audio volume restored to', savedVolume + '% - app in foreground');
                    } else if (currentMuteState) {
                        // Se l'utente ha mutato manualmente, mantieni il mute (volume 0)
                        console.log('🔇 Audio remains muted - user preference');
                    }
                } catch (e) {
                    console.error('Error handling foreground audio:', e);
                }
            }
        }
        
        // ==================== PAGE VISIBILITY API (Desktop) ====================
        
        // Gestisce il cambio di tab/finestra su desktop
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // Pagina non visibile (tab cambiato, finestra minimizzata, etc.)
                handleBackgroundAudio();
            } else {
                // Pagina di nuovo visibile
                setTimeout(() => {
                    handleForegroundAudio();
                }, 100); // Piccolo delay per assicurarsi che tutto sia pronto
            }
        });
        
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
        
        // Rileva quando l'app diventa inattiva su iOS (home button, chiamate, etc.)
        document.addEventListener('webkitvisibilitychange', function() {
            if (document.webkitHidden) {
                handleBackgroundAudio();
            } else {
                setTimeout(() => {
                    handleForegroundAudio();
                }, 200);
            }
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
        
        console.log('🎵 Background audio management initialized');

        
