// ==================== GAME START AND LOADING ==================== 

        // Gestione errori personalizzata
        window.onerror = function(event) {
            if (gameStarted) {
                loadingProgress.textContent = 'Errore nel caricamento del gioco';
                console.error('Game loading error:', event);
            }
        };
        
        // Ferma l'aggiornamento statistiche quando la pagina viene chiusa
        window.addEventListener('beforeunload', function() {
            stopStatsUpdater();
        });
        
        // Effetto di transizione per il loading
        customLoading.style.transition = 'opacity 0.5s ease-in-out';
        
        // Sistema di aggiornamento statistiche del gioco
        // NOTA: Le variabili globali sono dichiarate in dom-elements.js
        let statsUpdateInterval;
        let lastRunningState = true;
        let gameStoppedTime = null;
        let lastScoreCheck = 0;
        let scoreStuckCount = 0;
        let lastGameRunningState = true;
        let isManuallyPaused = false;
        
        function startStatsUpdater() {
            console.log('Starting stats updater...');

        // Reset dello stato del gioco
        gameState.set('isGameOver', false);
        gameState.set('gameEndTime', null);
        lastRunningState = true;
        gameStoppedTime = null;
        lastScoreCheck = 0;
        scoreStuckCount = 0;
        gameState.set('totalPausedTime', 0);
        gameState.set('pauseStartTime', null);
        lastGameRunningState = true;
        isManuallyPaused = false;
        gameState.set('isTimerRunning', true);
        gameState.set('lastScoreChangeTime', Date.now());

        console.log('🔄 Game state reset for new game');            // Inizializza il tempo di gioco
            gameState.set('gameStartTimeReal', Date.now());

            // Imposta il record salvato
            const highScore = gameState.get('highScore');
            document.getElementById('highScore').textContent = parseInt(highScore).toLocaleString();

            // La musica è gestita dal codice C++ del gioco

            // Aggiorna le statistiche ogni 100ms
            statsUpdateInterval = setInterval(updateGameStats, 100);
        }
        
        function updateGameStats() {
            try {
                // PRIMA: Aggiorna il tempo di gioco (SENZA SINCRONIZZAZIONE C++ CHE ROMPE)
                updateGameTime();
                
                // TERZA: Aggiorna le statistiche del C++
                if (typeof Module !== 'undefined') {
                    try {
                        const score = Module._getScore();
                        const level = Module._getLevel();
                        const lines = Module._getLines();

                        // Aggiorna il punteggio solo se cambiato
                        const lastScore = gameState.get('lastScore');
                        if (score !== lastScore) {
                            gameState.set('lastScore', score);
                            gameState.set('lastScoreChangeTime', Date.now());

                            // Aggiorna record se necessario
                            const highScore = gameState.get('highScore');
                            if (score > highScore) {
                                gameState.set('highScore', score);
                                localStorage.setItem('tetris-high-score', score);
                            }
                        }

                        // Aggiorna tutti i display
                        const scoreElement = document.getElementById('scoreDisplay');
                        const levelElement = document.getElementById('levelDisplay');
                        const linesElement = document.getElementById('linesDisplay');
                        const highScoreElement = document.getElementById('highScore');

                        if (scoreElement) scoreElement.textContent = score.toLocaleString();
                        if (levelElement) levelElement.textContent = level;
                        if (linesElement) linesElement.textContent = lines;
                        if (highScoreElement) {
                            const currentHighScore = gameState.get('highScore');
                            highScoreElement.textContent = parseInt(currentHighScore).toLocaleString();
                        }

                    } catch (error) {
                        // Ignora errori di accesso al Module
                    }
                }
                
                // QUARTA: Sincronizza con lo stato del C++ (questa chiama showNewGameOver quando necessario)
                syncGameStateWithCpp();

                // QUINTA: Aggiorna il display dello stato
                updateGameState();
                
            } catch(e) {
                console.error('Error updating stats:', e);
            }
        }

        // NOTE: JS/C++ state synchronization is handled by syncGameStateWithCpp()
        // in stats-updater.js (called on line 99 above)
        // Old syncWithCppState() function was removed to eliminate duplication

        function checkForGameOver() {
            // COMPLETAMENTE DISABILITATO per evitare falsi positivi
            // Il game over viene rilevato ESCLUSIVAMENTE dal motore C++ tramite syncGameStateWithCpp()
            // Questo garantisce che il game over appaia SOLO quando si perde realmente
            return;
        }
        
        function updateGameTime() {
            const gameTimeElement = document.getElementById('gameTime');
            const gameStartTimeReal = gameState.get('gameStartTimeReal');

            if (!gameTimeElement || !gameStartTimeReal) return;

            let elapsed, minutes, seconds, timeString;

            if (gameState.get('isGameOver')) {
                // Game over - usa tempo fisso
                const gameEndTime = gameState.get('gameEndTime');
                const totalPausedTime = gameState.get('totalPausedTime');
                if (gameEndTime) {
                    elapsed = Math.floor((gameEndTime - gameStartTimeReal - totalPausedTime) / 1000);
                } else {
                    elapsed = Math.floor((Date.now() - gameStartTimeReal - totalPausedTime) / 1000);
                }
                minutes = Math.floor(elapsed / 60);
                seconds = elapsed % 60;
                timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                gameTimeElement.textContent = timeString + ' (FINAL)';
                gameTimeElement.style.color = '#ff5722';
                return;
            }

            if (gameState.get('isTimerRunning')) {
                // Timer attivo - calcola tempo corrente
                const isPaused = gameState.get('isPaused');
                const pauseStartTime = gameState.get('pauseStartTime');
                const totalPausedTime = gameState.get('totalPausedTime');
                const currentTime = isPaused ? pauseStartTime : Date.now();
                elapsed = Math.floor((currentTime - gameStartTimeReal - totalPausedTime) / 1000);
                minutes = Math.floor(elapsed / 60);
                seconds = elapsed % 60;
                timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                if (isPaused) {
                    gameTimeElement.textContent = timeString + ' (PAUSA)';
                    gameTimeElement.style.color = '#ffa726';
                } else {
                    gameTimeElement.textContent = timeString;
                    gameTimeElement.style.color = '';
                }
            }
        }
