// ==================== STATISTICS UPDATER ==================== 

        
        // Funzione separata per sincronizzare lo stato JavaScript con il C++
        function syncGameStateWithCpp() {
            try {
                // Se c'è un menu mobile attivo o long press in corso, NON sincronizzare
                const mobilePauseMenu = document.getElementById('mobilePauseMenu');
                if ((mobilePauseMenu && mobilePauseMenu.classList.contains('active')) || longPressTriggered || mobilePauseActive) {
                    console.log('🚫 Sync disabilitata - sistema mobile pause attivo');
                    return;
                }
                
                if (typeof Module !== 'undefined' && Module._isGameRunning && Module._isGamePaused) {
                    const cppRunning = Module._isGameRunning();
                    const cppPaused = Module._isGamePaused();
                    
                    // Rileva game over: non running e non paused
                    if (!cppRunning && !cppPaused && !isGameOver && gameStartTimeReal) {
                        console.log('🎮 GAME OVER detected - syncing state');
                        isGameOver = true;
                        isTimerRunning = false;
                        isPaused = false;
                        if (!gameEndTime) {
                            gameEndTime = Date.now();
                            
                            // Se eravamo in pausa, calcola il tempo di pausa finale
                            if (pauseStartTime) {
                                totalPausedTime += gameEndTime - pauseStartTime;
                                pauseStartTime = null;
                            }
                            
                            console.log('⏰ Timer stopped at game over:', new Date(gameEndTime).toLocaleTimeString());
                            
                            // Mostra la nuova schermata game over se non è già attiva
                            if (!newGameOverActive) {
                                // Ottieni le statistiche finali
                                let finalScore = lastScore;
                                let finalLevel = lastLevel || 1;
                                let finalLines = lastLines || 0;
                                
                                try {
                                    if (typeof Module !== 'undefined') {
                                        if (Module._getScore) finalScore = Module._getScore();
                                        if (Module._getLevel) finalLevel = Module._getLevel();
                                        if (Module._getLines) finalLines = Module._getLines();
                                    }
                                } catch(e) {
                                    console.log('Error getting stats for game over sync:', e);
                                }
                                
                                const gameTime = document.getElementById('gameTime')?.textContent?.replace(' (FINAL)', '').replace(' (PAUSA)', '') || '00:00';
                                
                                console.log('🎮 Triggering game over from state sync');
                                setTimeout(() => {
                                    showNewGameOver(finalScore, finalLevel, finalLines, gameTime);
                                }, 500); // Small delay to ensure all state is settled
                            }
                        }
                    }
                    // Rileva pausa
                    else if (cppPaused && !isPaused && !isGameOver) {
                        console.log('🎮 PAUSE detected - syncing state');
                        isPaused = true;
                        isTimerRunning = false;
                        if (!pauseStartTime) {
                            pauseStartTime = Date.now();
                        }
                    }
                    // Rileva resume
                    else if (!cppPaused && isPaused && cppRunning) {
                        console.log('🎮 RESUME detected - syncing state');
                        if (pauseStartTime) {
                            totalPausedTime += Date.now() - pauseStartTime;
                            pauseStartTime = null;
                        }
                        isPaused = false;
                        isTimerRunning = true;
                    }
                    // Rileva RESTART dopo game over: game running ma era game over
                    else if (cppRunning && !cppPaused && isGameOver) {
                        console.log('🎮 RESTART after game over detected - resetting all info');
                        resetGameInfo(); // Reset completo delle informazioni
                    }
                }
            } catch(e) {
                // Ignora errori di sincronizzazione
            }
        }
        
        // Funzione semplice per aggiornare solo il display dello stato
        function updateGameState() {
            const gameStateElement = document.getElementById('gameState');
            if (!gameStateElement) return;
            
            // Aggiorna solo il display dello stato
            if (isGameOver) {
                gameStateElement.textContent = 'Game Over';
                gameStateElement.style.color = '#ff5722';
                gameStateElement.style.textShadow = '0 0 10px #ff5722';
            } else if (isPaused || !isTimerRunning) {
                gameStateElement.textContent = 'Pausa';
                gameStateElement.style.color = '#ffb74d';
                gameStateElement.style.textShadow = '0 0 8px #ffb74d';
            } else {
                gameStateElement.textContent = 'In corso';
                gameStateElement.style.color = '';
                gameStateElement.style.textShadow = '';
            }
        }
        
        function handleGameOver() {
            console.log('🎮 GAME OVER DETECTED! Stopping timer.');
            
            // Ferma il timer
            if (!gameEndTime) {
                isTimerRunning = false;
                gameEndTime = Date.now();
                
                // Se eravamo in pausa quando il gioco è finito, aggiungi l'ultima pausa
                if (pauseStartTime) {
                    const finalPauseDuration = gameEndTime - pauseStartTime;
                    totalPausedTime += finalPauseDuration;
                    pauseStartTime = null;
                }
                
                console.log('⏰ Timer stopped at:', new Date(gameEndTime).toLocaleTimeString());
                console.log('📊 Total paused time:', Math.floor(totalPausedTime / 1000), 'seconds');
            }
            
            // Ottieni le statistiche finali e mostra la nuova schermata game over
            let finalScore = lastScore;
            let finalLevel = lastLevel || 1;
            let finalLines = lastLines || 0;
            let finalTime = '00:00';
            
            try {
                if (typeof Module !== 'undefined') {
                    if (Module._getScore) finalScore = Module._getScore();
                    if (Module._getLevel) finalLevel = Module._getLevel();
                    if (Module._getLines) finalLines = Module._getLines();
                }
                
                // Ottieni il tempo finale dal display
                const gameTimeElement = document.getElementById('gameTime');
                if (gameTimeElement) {
                    finalTime = gameTimeElement.textContent.replace(' (FINAL)', '').replace(' (PAUSA)', '');
                }
            } catch(e) {
                console.log('Error getting final game stats:', e);
            }
            
            // Mostra la nuova schermata game over unificata
            console.log('🎮 Showing unified game over screen with stats:', { finalScore, finalLevel, finalLines, finalTime });
            showNewGameOver(finalScore, finalLevel, finalLines, finalTime);
            
            // Aggiorna il record se necessario (questo è ora gestito in showNewGameOver)
            if (finalScore > highScore) {
                highScore = finalScore;
                localStorage.setItem('tetris-high-score', highScore);
                console.log('🏆 New high score:', highScore);
                
                // Mostra notifica nuovo record nel pannello laterale
                const highScoreElement = document.getElementById('highScore');
                if (highScoreElement) {
                    highScoreElement.style.color = '#ff9800';
                    highScoreElement.style.textShadow = '0 0 15px #ff9800';
                    highScoreElement.textContent = parseInt(highScore).toLocaleString();
                }
            }
        }
        
        // Funzione per testare manualmente il game over
        window.triggerGameOver = function() {
            console.log('🧪 Manual game over trigger');
            isGameOver = true;
            handleGameOver();
        };
        
        // Le funzioni audio sono gestite dal codice C++ del gioco
        
        // Funzioni per controllare manualmente il timer
        function pauseTimer() {
            if (isTimerRunning && !isGameOver) {
                isPaused = true;
                pauseStartTime = Date.now();
                console.log('⏸️ Timer paused');
                
                // Aggiorna il display
                const gameStateElement = document.getElementById('gameState');
                if (gameStateElement) {
                    gameStateElement.textContent = 'In pausa';
                    gameStateElement.style.color = '#ffa726';
                }
            }
        }
        
        function resumeTimer() {
            if (isPaused && !isGameOver) {
                if (pauseStartTime) {
                    const pauseDuration = Date.now() - pauseStartTime;
                    totalPausedTime += pauseDuration;
                    console.log('▶️ Timer resumed, pause duration:', Math.floor(pauseDuration / 1000), 'seconds');
                }
                isPaused = false;
                pauseStartTime = null;
                
                // Aggiorna il display
                const gameStateElement = document.getElementById('gameState');
                if (gameStateElement) {
                    gameStateElement.textContent = 'In corso';
                    gameStateElement.style.color = '';
                }
            }
        }
        
        function stopTimer() {
            console.log('🛑 Stopping timer (game over)');
            
            isGameOver = true;
            isTimerRunning = false;
            gameEndTime = Date.now();
            
            if (pauseStartTime) {
                pauseStartTime = null;
            }
            
            handleGameOver();
        }
        
