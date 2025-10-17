// ==================== EMSCRIPTEN MODULE SETUP ====================

    // NOTA: gameStartRequested è dichiarato in dom-elements.js
    let gameStarted = false;
        
        // Nascondi il loading inizialmente
        customLoading.style.display = 'none';
        
        // Ensure Module is available on the global object for Emscripten compatibility
        globalThis.Module = globalThis.Module || {};
        Object.assign(globalThis.Module, {
            canvas: document.getElementById('canvas'),

            print: function(...args) {
                console.log(...args);
            },

            setStatus: function(text) {
                // Carica il gioco silenziosamente in background
                if (text) {
                    console.log('Game status:', text);
                    if (text.includes('complete') || !text) {
                        gameState.set('gameReady', true);
                        console.log('Game is ready!');
                    }
                } else {
                    gameState.set('gameReady', true);
                    console.log('Game ready (no status)');
                }
                
                // Se il gioco è stato avviato dall'utente, mostra i progressi
                if (gameStarted) {
                    if (text && text.includes('Downloading')) {
                        loadingProgress.textContent = 'Download del gioco...';
                    } else if (text && text.includes('Preparing')) {
                        loadingProgress.textContent = 'Preparazione...';
                    } else {
                        loadingProgress.textContent = 'Avvio del gioco...';
                    }
                }
            },
            
            totalDependencies: 0,
            monitorRunDependencies: function(left) {
                this.totalDependencies = Math.max(this.totalDependencies, left);
                console.log('Dependencies left:', left);
                if (left === 0) {
                    gameState.set('gameReady', true);
                }
            }
        });

        // Gestione pulsante PLAY
        playButton.addEventListener('click', function() {
            gameStarted = true;
            gameState.set('gameStartRequested', true);
            
            // Nascondi schermata iniziale
            startScreen.classList.add('hidden');
            
            // Mostra loading
            customLoading.style.display = 'flex';
            customLoading.style.opacity = '1';
            loadingProgress.textContent = 'Avvio del gioco...';
            
            setTimeout(() => {
                startScreen.style.display = 'none';
                
                // Aspetta che il gioco sia caricato, poi avvialo
                setTimeout(() => {
                    customLoading.style.opacity = '0';
                    setTimeout(() => {
                        customLoading.style.display = 'none';
                        gameContainer.classList.add('visible');

                        // Fit canvas to viewport
                        fitCanvasToViewport();

                        // Scrolla automaticamente alla board di gioco IMMEDIATAMENTE (mobile e desktop)
                        setTimeout(() => {
                            const canvas = document.getElementById('canvas');
                            if (canvas) {
                                // Scroll istantaneo per mostrare subito la board centrata
                                canvas.scrollIntoView({
                                    behavior: 'auto',
                                    block: 'center',
                                    inline: 'center'
                                });
                                console.log('🎮 Auto-scrolled to canvas');
                            }
                        }, 50);

                        // Avvia il gioco chiamando la funzione C++
                        let gameStarted = false;
                        
                        function tryStartGame() {
                            if (gameStarted) return; // Evita di avviare il gioco più volte
                            
                            try {
                                if (typeof Module !== 'undefined' && Module._startTetrisGame) {
                                    Module._startTetrisGame();
                                    gameStarted = true;
                                    console.log('Game started via C++ function!');

                                    // Avvia il timer JavaScript
                                    if (typeof window.startGameTimer === 'function') {
                                        window.startGameTimer();
                                    } else {
                                        console.warn('startGameTimer not available yet');
                                    }

                                    // Avvia l'aggiornamento delle statistiche
                                    startStatsUpdater();
                                } else {
                                    console.log('Module not ready yet, retrying...');
                                    // Riprova una sola volta dopo un po'
                                    setTimeout(() => {
                                        if (!gameStarted && typeof Module !== 'undefined' && Module._startTetrisGame) {
                                            Module._startTetrisGame();
                                            gameStarted = true;
                                            console.log('Game started via C++ function (retry)!');

                                            // Avvia il timer JavaScript
                                            if (typeof window.startGameTimer === 'function') {
                                                window.startGameTimer();
                                            } else {
                                                console.warn('startGameTimer not available yet');
                                            }

                                            // Avvia l'aggiornamento delle statistiche
                                            startStatsUpdater();
                                        }
                                    }, 500);
                                }
                            } catch(e) {
                                console.error('Error starting game:', e);
                            }
                        }
                        
                        tryStartGame();
                    }, 500);
                }, 1000);
            }, 800);
        });

