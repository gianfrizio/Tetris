// ==================== STATISTICS UPDATER ====================


        /**
         * Checks if synchronization should be skipped due to active UI states
         */
        function shouldSkipSync() {
            const mobilePauseMenu = document.getElementById('mobilePauseMenu');
            if ((mobilePauseMenu && mobilePauseMenu.classList.contains('active')) ||
                (typeof longPressTriggered !== 'undefined' && longPressTriggered) ||
                gameState.get('mobilePauseActive')) {
                logger.log('sync', 'Sync disabilitata - sistema mobile pause attivo');
                return true;
            }
            return false;
        }

        /**
         * Checks if C++ module is ready for state queries
         */
        function isCppModuleReady() {
            return typeof Module !== 'undefined' && Module._isGameRunning && Module._isGamePaused;
        }

        /**
         * Detects game over state from C++
         * Game over = not running AND not paused, with grace period check
         */
        function detectGameOver(cppRunning, cppPaused) {
            if (cppRunning || cppPaused || gameState.get('isGameOver') || !gameState.get('gameStartTimeReal')) {
                return false;
            }

            // Grace period check for iPhone compatibility
            const timeSinceGameStart = Date.now() - gameState.get('gameStartTimeReal');
            if (timeSinceGameStart <= GameConfig.GAME_START_GRACE_PERIOD) {
                logger.log('sync', 'C++ not ready yet, waiting for initialization... (' +
                            timeSinceGameStart + 'ms since start)');
                return false;
            }

            return true;
        }

        /**
         * Handles game over state transition
         */
        function handleGameOverDetection() {
            logger.log('gameover', 'GAME OVER detected - syncing state');

            // Update JavaScript state
            gameState.set('isGameOver', true);
            gameState.set('isTimerRunning', false);
            gameState.set('isPaused', false);

            if (!gameState.get('gameEndTime')) {
                const gameEndTime = Date.now();
                gameState.set('gameEndTime', gameEndTime);

                // Calculate final pause time if needed
                const pauseStartTime = gameState.get('pauseStartTime');
                if (pauseStartTime) {
                    gameState.set('totalPausedTime', gameState.get('totalPausedTime') + (gameEndTime - pauseStartTime));
                    gameState.set('pauseStartTime', null);
                }

                logger.log('gameover', 'Timer stopped at game over: ' + new Date(gameEndTime).toLocaleTimeString());

                // Show game over screen if not already active
                if (!gameState.get('newGameOverActive')) {
                    showGameOverScreen();
                }
            }
        }

        /**
         * Retrieves final game statistics and shows game over screen
         */
        function showGameOverScreen() {
            // Get final statistics
            let finalScore = gameState.get('lastScore');
            let finalLevel = gameState.get('lastLevel') || 1;
            let finalLines = gameState.get('lastLines') || 0;

            try {
                if (typeof Module !== 'undefined') {
                    if (Module._getScore) finalScore = Module._getScore();
                    if (Module._getLevel) finalLevel = Module._getLevel();
                    if (Module._getLines) finalLines = Module._getLines();
                }
            } catch(e) {
                logger.error('sync', 'Error getting stats for game over sync', e);
            }

            const gameTime = document.getElementById('gameTime')?.textContent
                ?.replace(' (FINAL)', '')
                .replace(' (PAUSA)', '') || '00:00';

            logger.log('gameover', 'Triggering game over from state sync');
            setTimeout(() => {
                showNewGameOver(finalScore, finalLevel, finalLines, gameTime);
            }, GameConfig.GAME_OVER_SHOW_DELAY);
        }

        /**
         * Detects pause state from C++
         */
        function detectPause(cppPaused) {
            return cppPaused && !gameState.get('isPaused') && !gameState.get('isGameOver');
        }

        /**
         * Handles pause state transition
         */
        function handlePauseDetection() {
            logger.log('pause', 'PAUSE detected - syncing state');
            gameState.set('isPaused', true);
            gameState.set('isTimerRunning', false);
            if (!gameState.get('pauseStartTime')) {
                gameState.set('pauseStartTime', Date.now());
            }
        }

        /**
         * Detects resume state from C++
         */
        function detectResume(cppPaused, cppRunning) {
            return !cppPaused && gameState.get('isPaused') && cppRunning;
        }

        /**
         * Handles resume state transition
         */
        function handleResumeDetection() {
            logger.log('pause', 'RESUME detected - syncing state');
            const pauseStartTime = gameState.get('pauseStartTime');
            if (pauseStartTime) {
                gameState.set('totalPausedTime', gameState.get('totalPausedTime') + (Date.now() - pauseStartTime));
                gameState.set('pauseStartTime', null);
            }
            gameState.set('isPaused', false);
            gameState.set('isTimerRunning', true);
        }

        /**
         * Detects restart after game over
         */
        function detectRestartAfterGameOver(cppRunning, cppPaused) {
            return cppRunning && !cppPaused && gameState.get('isGameOver');
        }

        /**
         * Handles restart after game over
         */
        function handleRestartDetection() {
            logger.log('gameover', 'RESTART after game over detected - resetting all info');
            resetGameInfo();
        }

        /**
         * Main synchronization function
         * Coordinates detection and handling of all state transitions
         */
        function syncGameStateWithCpp() {
            try {
                // Skip if UI is blocking sync
                if (shouldSkipSync()) return;

                // Skip if C++ module not ready
                if (!isCppModuleReady()) return;

                // Get current C++ state
                const cppRunning = Module._isGameRunning();
                const cppPaused = Module._isGamePaused();

                // Check for state transitions in priority order
                if (detectGameOver(cppRunning, cppPaused)) {
                    handleGameOverDetection();
                } else if (detectPause(cppPaused)) {
                    handlePauseDetection();
                } else if (detectResume(cppPaused, cppRunning)) {
                    handleResumeDetection();
                } else if (detectRestartAfterGameOver(cppRunning, cppPaused)) {
                    handleRestartDetection();
                }
            } catch(e) {
                // Silently ignore synchronization errors
                logger.debug('sync', 'Sync error (ignored)', e);
            }
        }
        
        // Funzione semplice per aggiornare solo il display dello stato
        function updateGameState() {
            const gameStateElement = document.getElementById('gameState');
            if (!gameStateElement) return;

            // Aggiorna solo il display dello stato
            if (gameState.get('isGameOver')) {
                gameStateElement.textContent = 'Game Over';
                gameStateElement.style.color = '#ff5722';
                gameStateElement.style.textShadow = '0 0 10px #ff5722';
            } else if (gameState.get('isPaused') || !gameState.get('isTimerRunning')) {
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
            logger.log('gameover', 'GAME OVER DETECTED! Stopping timer');

            // Ferma il timer
            if (!gameState.get('gameEndTime')) {
                gameState.set('isTimerRunning', false);
                const gameEndTime = Date.now();
                gameState.set('gameEndTime', gameEndTime);

                // Se eravamo in pausa quando il gioco è finito, aggiungi l'ultima pausa
                const pauseStartTime = gameState.get('pauseStartTime');
                if (pauseStartTime) {
                    const finalPauseDuration = gameEndTime - pauseStartTime;
                    gameState.set('totalPausedTime', gameState.get('totalPausedTime') + finalPauseDuration);
                    gameState.set('pauseStartTime', null);
                }

                logger.log('gameover', 'Timer stopped at: ' + new Date(gameEndTime).toLocaleTimeString());
                logger.log('gameover', 'Total paused time: ' + Math.floor(gameState.get('totalPausedTime') / 1000) + ' seconds');
            }

            // Ottieni le statistiche finali e mostra la nuova schermata game over
            let finalScore = gameState.get('lastScore');
            let finalLevel = gameState.get('lastLevel') || 1;
            let finalLines = gameState.get('lastLines') || 0;
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
                logger.error('gameover', 'Error getting final game stats', e);
            }

            // Mostra la nuova schermata game over unificata
            logger.log('gameover', 'Showing unified game over screen', { finalScore, finalLevel, finalLines, finalTime });
            showNewGameOver(finalScore, finalLevel, finalLines, finalTime);
            
            // Aggiorna il record se necessario (questo è ora gestito in showNewGameOver)
            const highScore = gameState.get('highScore');
            if (finalScore > highScore) {
                gameState.set('highScore', finalScore);
                localStorage.setItem('tetris-high-score', finalScore);
                logger.success('gameover', 'New high score: ' + finalScore);
                
                // Mostra notifica nuovo record nel pannello laterale
                const highScoreElement = document.getElementById('highScore');
                if (highScoreElement) {
                    highScoreElement.style.color = '#ff9800';
                    highScoreElement.style.textShadow = '0 0 15px #ff9800';
                    highScoreElement.textContent = parseInt(finalScore).toLocaleString();
                }
            }
        }

        // Funzione per testare manualmente il game over
        window.triggerGameOver = function() {
            logger.log('debug', 'Manual game over trigger');
            gameState.set('isGameOver', true);
            handleGameOver();
        };
        
        // Le funzioni audio sono gestite dal codice C++ del gioco
        
        // Funzioni per controllare manualmente il timer
        function pauseTimer() {
            if (gameState.get('isTimerRunning') && !gameState.get('isGameOver')) {
                gameState.set('isPaused', true);
                gameState.set('pauseStartTime', Date.now());
                logger.log('pause', 'Timer paused');
                
                // Aggiorna il display
                const gameStateElement = document.getElementById('gameState');
                if (gameStateElement) {
                    gameStateElement.textContent = 'In pausa';
                    gameStateElement.style.color = '#ffa726';
                }
            }
        }

        function resumeTimer() {
            if (gameState.get('isPaused') && !gameState.get('isGameOver')) {
                const pauseStartTime = gameState.get('pauseStartTime');
                if (pauseStartTime) {
                    const pauseDuration = Date.now() - pauseStartTime;
                    gameState.set('totalPausedTime', gameState.get('totalPausedTime') + pauseDuration);
                    logger.log('pause', 'Timer resumed, pause duration: ' + Math.floor(pauseDuration / 1000) + ' seconds');
                }
                gameState.set('isPaused', false);
                gameState.set('pauseStartTime', null);
                
                // Aggiorna il display
                const gameStateElement = document.getElementById('gameState');
                if (gameStateElement) {
                    gameStateElement.textContent = 'In corso';
                    gameStateElement.style.color = '';
                }
            }
        }

        function stopTimer() {
            logger.log('gameover', 'Stopping timer (game over)');

            gameState.set('isGameOver', true);
            gameState.set('isTimerRunning', false);
            gameState.set('gameEndTime', Date.now());

            if (gameState.get('pauseStartTime')) {
                gameState.set('pauseStartTime', null);
            }
            
            handleGameOver();
        }
        
