// ==================== PAUSE SYSTEM ==================== 
// Gestione del menu di pausa per desktop e mobile

            // Aggiorna il messaggio motivazionale
            const messageEl = document.getElementById('gameOverMessage');
            if (messageEl) {
                const messages = getMotivationalMessage();
                messageEl.textContent = messages.message;
            }
            
            // Aggiorna il sottotitolo
            const subtitleEl = document.getElementById('gameOverSubtitle');
            if (subtitleEl) {
                if (gameOverData.isNewRecord) {
                    subtitleEl.innerHTML = '🏆 Nuovo Record Personale!';
                } else if (gameOverData.finalScore === 0) {
                    subtitleEl.innerHTML = '🎯 Riprova per fare meglio!';
                } else {
                    subtitleEl.innerHTML = '🎮 Partita terminata';
                }
            }
            
            console.log('✅ Game over elements updated');
        
        
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
        function addGameOverKeyboardListeners() {
            document.addEventListener('keydown', handleGameOverKeyboard);
        }
        
        /**
         * Rimuove i listener per i controlli da tastiera
         */
        function removeGameOverKeyboardListeners() {
            document.removeEventListener('keydown', handleGameOverKeyboard);
        }
        
        /**
         * Gestisce gli input da tastiera nella schermata game over
         */
        function handleGameOverKeyboard(event) {
            if (!newGameOverActive) return;
            
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
        function restartFromGameOver() {
            console.log('🔄 Restarting game from game over screen');
            
            hideNewGameOver();
            
            // Aspetta che l'animazione finisca, poi riavvia
            setTimeout(() => {
                // Reset completo dello stato in un'unica funzione
                console.log('🔄 Executing complete game restart...');
                
                // Reset tutti gli stati JavaScript
                isGameOver = false;
                isTimerRunning = true; 
                isPaused = false;
                newGameOverActive = false;
                mobileGameOverActive = false;
                lastKnownScore = 0;
                gameStartTimeReal = Date.now();
                gameEndTime = null;
                totalPausedTime = 0;
                pauseStartTime = null;
                lastScoreChangeTime = Date.now();
                
                // Aggiorna display
                const gameTimeElement = document.getElementById('gameTime');
                const gameStateElement = document.getElementById('gameState');
                if (gameTimeElement) {
                    gameTimeElement.textContent = '00:00';
                    gameTimeElement.style.color = '';
                }
                if (gameStateElement) {
                    gameStateElement.textContent = 'In corso';
                    gameStateElement.style.color = '';
                }
                
                // Riavvia il gioco C++
                try {
                    if (typeof Module !== 'undefined') {
                        if (Module._restartTetrisGame) {
                            Module._restartTetrisGame();
                            console.log('✅ C++ game restarted via _restartTetrisGame');
                        } else if (Module._startTetrisGame) {
                            Module._startTetrisGame();
                            console.log('✅ C++ game restarted via _startTetrisGame');
                        }
                    }
                } catch(e) {
                    console.error('Error restarting C++ game:', e);
                }
                
                console.log('✅ Complete game restart finished');
            }, 300);
        }
        
        // Mobile game over detection and overlay (legacy - mantieni per compatibilità)
        let mobileGameOverActive = false;
        
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
        
        // Enhanced game over detection for mobile
        let lastKnownScore = 0;
        let gameOverCheckInterval;
        
        // Flag per evitare inizializzazioni multiple
        let gameOverMonitoringInitialized = false;
        
    function startGameOverMonitoring() {
            // Permetti re-inizializzazione se necessario
            if (gameOverCheckInterval) {
                console.log('� Clearing existing game over monitoring');
                clearInterval(gameOverCheckInterval);
                gameOverCheckInterval = null;
            }
            
            gameOverMonitoringInitialized = true; 
            console.log('✅ Starting game over monitoring');
            
            // Add a short grace period after init to avoid false positives from preloaded state
            const monitoringStartTime = Date.now();

            gameOverCheckInterval = setInterval(() => {
                // ignore checks during the first 3 seconds
                if (Date.now() - monitoringStartTime < 3000) return;

                if (typeof Module !== 'undefined' && Module._getScore && Module._isGameRunning) {
                    try {
                        const currentScore = Module._getScore();
                        const gameRunning = Module._isGameRunning();
                        
                        // Game over detected: not running and we had a score
                        // Only trigger if we previously observed the game running with a score
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
                            lastKnownScore = currentScore;
                        }
                        
                        // Game restarted
                        if (gameRunning && currentScore === 0 && lastKnownScore > 0) {
                            console.log('🔄 Game restart detected - updating stats');
                            
                            // Nascondi qualsiasi schermata game over attiva
                            if (newGameOverActive) {
                                hideNewGameOver();
                            }
                            if (mobileGameOverActive) {
                                hideMobileGameOver();
                            }
                            
                            // Reset completo dello stato per il prossimo game over
                            lastKnownScore = 0;
                            newGameOverActive = false;
                            mobileGameOverActive = false;
                            
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
                            lastKnownScore = currentScore > 0 ? currentScore : lastKnownScore;
                        }
                    } catch(e) {
                        // Ignore errors accessing Module functions
                    }
                }
            }, 500); // Check every 500ms
        }
        
        // UNICO handler DOMContentLoaded consolidato per evitare inizializzazioni multiple
        document.addEventListener('DOMContentLoaded', () => {
            // ==================== NUOVA SCHERMATA GAME OVER ====================
            
            // Pulsanti della nuova schermata game over

            // Placeholder: the original initialization code for the new game over UI
            // should be placed here; this close fixes the missing '}' error.
        });
