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
        isGameOver = false;
        gameEndTime = null;
        lastRunningState = true;
        gameStoppedTime = null;
        lastScoreCheck = 0;
        scoreStuckCount = 0;
        totalPausedTime = 0;
        pauseStartTime = null;
        lastGameRunningState = true;
        isManuallyPaused = false;
        isTimerRunning = true;
        lastScoreChangeTime = Date.now();
        
        console.log('🔄 Game state reset for new game');            // Inizializza il tempo di gioco
            gameStartTimeReal = Date.now();
            
            // Imposta il record salvato
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
                        if (score !== lastScore) {
                            lastScore = score;
                            lastScoreChangeTime = Date.now();
                            
                            // Aggiorna record se necessario
                            if (score > highScore) {
                                highScore = score;
                                localStorage.setItem('tetris-high-score', highScore);
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
                        if (highScoreElement) highScoreElement.textContent = parseInt(highScore).toLocaleString();
                        
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
        
        // Nuova funzione per sincronizzare lo stato JavaScript con il C++
        function syncWithCppState() {
            if (typeof Module === 'undefined') return;
            
            try {
                const cppRunning = Module._isGameRunning ? Module._isGameRunning() : false;
                const cppPaused = Module._isGamePaused ? Module._isGamePaused() : false;
                
                // Se il C++ dice che il gioco è in pausa ma JavaScript no
                if (cppPaused && !isPaused && !isGameOver) {
                    console.log('🎮 C++ is paused, syncing JavaScript');
                    isPaused = true;
                    isTimerRunning = false;
                    if (!pauseStartTime) {
                        pauseStartTime = Date.now();
                    }
                    
                    const gameStateElement = document.getElementById('gameState');
                    if (gameStateElement) {
                        gameStateElement.textContent = 'In pausa';
                        gameStateElement.style.color = '#ffa726';
                    }
                }
                // Se il C++ dice che il gioco non è in pausa ma JavaScript sì
                else if (!cppPaused && isPaused && cppRunning) {
                    console.log('🎮 C++ resumed, syncing JavaScript');
                    if (pauseStartTime) {
                        totalPausedTime += Date.now() - pauseStartTime;
                        pauseStartTime = null;
                    }
                    isPaused = false;
                    isTimerRunning = true;
                    
                    const gameStateElement = document.getElementById('gameState');
                    if (gameStateElement) {
                        gameStateElement.textContent = 'In corso';
                        gameStateElement.style.color = '';
                    }
                }
                // Se il C++ non è running e non è paused, probabilmente è game over
                // MA aspetta almeno 3 secondi dall'inizio del gioco prima di rilevare game over (grace period per inizializzazione iPhone)
                else if (!cppRunning && !cppPaused && gameStartTimeReal && !isGameOver) {
                    const timeSinceGameStart = Date.now() - gameStartTimeReal;
                    if (timeSinceGameStart > 3000) {
                        console.log('🎮 C++ game over detected, syncing JavaScript');
                        isGameOver = true;
                        isTimerRunning = false;
                        isPaused = false;
                        gameEndTime = Date.now();

                        const gameStateElement = document.getElementById('gameState');
                        if (gameStateElement) {
                            gameStateElement.textContent = 'Game Over';
                            gameStateElement.style.color = '#ff5722';
                        }
                    } else {
                        console.log('⏳ C++ not ready yet, waiting... (', timeSinceGameStart, 'ms since start)');
                    }
                }
                
            } catch(e) {
                // Ignora errori di sincronizzazione
            }
        }
        
        function checkForGameOver() {
            // COMPLETAMENTE DISABILITATO per evitare falsi positivi
            // Il game over viene rilevato ESCLUSIVAMENTE dal motore C++ tramite syncGameStateWithCpp()
            // Questo garantisce che il game over appaia SOLO quando si perde realmente
            return;
        }
        
        function updateGameTime() {
            const gameTimeElement = document.getElementById('gameTime');
            
            if (!gameTimeElement || !gameStartTimeReal) return;
            
            let elapsed, minutes, seconds, timeString;
            
            if (isGameOver) {
                // Game over - usa tempo fisso
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
            
            if (isTimerRunning) {
                // Timer attivo - calcola tempo corrente
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
