// ==================== GAME OVER HANDLING ==================== 

document.addEventListener('keydown', (event) => {

                if (lastScore > 0) {
                    console.log('🔍 ENTER pressed during game, triggering game over first');
                    stopTimer();
                    
                    // Poi riavvia dopo un breve delay
                    setTimeout(() => {
                        console.log('🔄 Auto-restarting after ENTER');
                        restartTimer();
                    }, 500);
                } else {
                    // Punteggio 0, probabilmente nuovo gioco
                    console.log('🆕 ENTER pressed with score 0, ensuring timer is active');
                    if (!isTimerRunning) {
                        restartTimer();
                    }
                }
            
            // Per test: Ctrl+G per trigger game over
            if (event.ctrlKey && event.key === 'g') {
                console.log('Manual game over triggered');
                stopTimer();
            }
        });
        
        // Funzione per riavviare il timer per una nuova partita
        function restartTimer() {
            console.log('🔄 Restarting timer AND game');
            
            // Reset completo
            isGameOver = false;
            isTimerRunning = true;
            isPaused = false;  // Reset anche lo stato pausa
            gameEndTime = null;
            gameStartTimeReal = Date.now();
            totalPausedTime = 0;
            pauseStartTime = null;
            lastScoreChangeTime = Date.now();
            lastScoreCheck = 0;
            scoreStuckCount = 0;
            
            // RESET GAME OVER STATE - FONDAMENTALE!
            newGameOverActive = false;
            mobileGameOverActive = false;
            lastKnownScore = 0;
            
            // Reset display
            const gameTimeElement = document.getElementById('gameTime');
            const gameStateElement = document.getElementById('gameState');
            
            if (gameTimeElement) {
                gameTimeElement.style.color = '';
                gameTimeElement.textContent = '00:00';
            }
            
            if (gameStateElement) {
                gameStateElement.style.color = '';
                gameStateElement.style.textShadow = '';
                gameStateElement.textContent = 'In corso';
            }
            
            // Riavvia anche il gioco C++
            try {
                if (typeof Module !== 'undefined') {
                    // Usa la nuova funzione dedicata per il restart
                    if (Module._restartTetrisGame) {
                        console.log('🎮 Restarting with _restartTetrisGame...');
                        Module._restartTetrisGame();
                    } else if (Module._startTetrisGame) {
                        console.log('🎮 Restarting with _startTetrisGame...');
                        Module._startTetrisGame();
                    } else {
                        console.log('⚠️ No restart function found. Available functions:');
                        window.listModuleFunctions();
                        console.log('💡 Use window.listModuleFunctions() to see all available functions');
                    }
                } else {
                    console.log('⚠️ Module not available yet');
                }
            } catch(e) {
                console.error('Error restarting C++ game:', e);
            }
            
            console.log('✅ Timer and game restarted');
        }
        
        // Funzioni esposte per test manuali
        window.restartTimer = restartTimer;
        window.forceGameOver = function() {
            console.log('🧪 Forcing game over for testing');
            stopTimer();
        };
        
        window.gameInfo = function() {
            console.log('🎮 Game State:', {
                isGameOver: isGameOver,
                isTimerRunning: isTimerRunning,
                lastScore: lastScore,
                scoreStuckCount: scoreStuckCount,
                timeElapsed: gameStartTimeReal ? Math.floor((Date.now() - gameStartTimeReal) / 1000) + 's' : 'Not started'
            });
        };
        
        // Aggiungi pulsante di test nella console
        console.log('🎮 Tetris Timer Controls:');
        console.log('  pauseTimer() - Pausa il timer');
        console.log('  resumeTimer() - Riprende il timer');
        console.log('  forceGameOver() - Forza game over');
        console.log('  restartTimer() - Riavvia per nuovo gioco');
        console.log('  checkGameState() - Mostra stato attuale');
        console.log('\n⏸️ Auto-Pause Testing:');
        console.log('  testAutoPause() - Testa pausa automatica');
        console.log('  testAutoResume() - Testa resume automatico');
        console.log('  simulateBackground() - Simula background');
        console.log('  simulateForeground() - Simula foreground');
        console.log('\n🖥️ Desktop Menu Testing:');
        console.log('  showDesktopMenu() - Mostra menu desktop');
        console.log('  hideDesktopMenu() - Nascondi menu desktop');
        console.log('\n� Game Over Screen Testing:');
        console.log('  testGameOver(score, level, lines) - Testa schermata game over');
        console.log('  testNewRecordGameOver() - Testa nuovo record');
        console.log('  testLowScoreGameOver() - Testa punteggio basso');
        console.log('  hideGameOverTest() - Nascondi schermata game over');
        console.log('  checkGameOverState() - Verifica stato game over');
        console.log('  forceResetGameOverState() - Reset forzato stato');
        console.log('  restartGameOverMonitoring() - Riavvia monitoring');
        console.log('  testGameOverSequence() - Test sequenza completa');
        console.log('  resetHighScore() - Reset record personale');
        console.log('\n�🔄 State Synchronization:');
        console.log('  checkSyncState() - Verifica sincronizzazione JS/C++');
        console.log('  forceSyncState() - Forza sincronizzazione stati');
        console.log('\n⌨️ Keyboard Controls:');
        console.log('  ESC - Pausa/Riprendi');
        console.log('  ENTER - Riavvia gioco');
        console.log('  Ctrl+G - Forza game over');
        console.log('\n📱 Mobile Game Over Controls:');
        console.log('  👆 Tap pulsanti - Riavvia o Menu');
        console.log('  ⬆️ Swipe up - Riavvia veloce');
        console.log('  ⬇️ Swipe down - Torna al menu');
        console.log('  👆👆 Double tap - Riavvia');
        console.log('\n🔄 Auto-Pause Active: Il gioco si metterà automaticamente in pausa quando:');
        console.log('  - Cambi tab nel browser');
        console.log('  - Metti l\'app in background su mobile');
        console.log('  - La finestra perde il focus');
        console.log('\n💡 Prova subito: testGameOver(5000, 7, 42) per vedere la nuova schermata!');
        
        function updateStatsFromCanvasOrEvents() {
            // Usa le funzioni C++ esportate per ottenere le statistiche reali
            if (typeof Module !== 'undefined' && Module._getScore && Module._getLevel && Module._getLines) {
                try {
                    updateStatsFromCpp();
                } catch(e) {
                    console.error('Error calling C++ functions:', e);
                    updateStatsFallback();
                }
            } else {
                updateStatsFallback();
            }
        }
        
        function updateStatsFromCpp() {
            try {
                // Debug: verifica se le funzioni esistono
                console.log('Module functions available:', {
                    getScore: typeof Module._getScore,
                    getLevel: typeof Module._getLevel,
                    getLines: typeof Module._getLines,
                    isGameRunning: typeof Module._isGameRunning
                });
                
                // Chiama le funzioni C++ per ottenere i valori reali
                const currentScore = Module._getScore();
                const currentLevel = Module._getLevel();
                const currentLines = Module._getLines();
                const gameRunning = Module._isGameRunning();
                
                console.log('Raw C++ values:', {currentScore, currentLevel, currentLines, gameRunning});
                
                // Aggiorna sempre i valori (rimuovo il controllo gameRunning per debug)
                lastScore = currentScore;
                lastLevel = currentLevel;
                lastLines = currentLines;
                
                // Aggiorna gli elementi HTML
                const scoreDisplay = document.getElementById('scoreDisplay');
                const levelDisplay = document.getElementById('levelDisplay');
                const linesDisplay = document.getElementById('linesDisplay');
                
                console.log('HTML elements found:', {
                    scoreDisplay: !!scoreDisplay,
                    levelDisplay: !!levelDisplay,
                    linesDisplay: !!linesDisplay
                });
                
                if (scoreDisplay) scoreDisplay.textContent = lastScore.toLocaleString();
                if (levelDisplay) levelDisplay.textContent = lastLevel;
                if (linesDisplay) linesDisplay.textContent = lastLines;
                
                // Check if game restarted (score=0, level=1, gameRunning=true)
                if (gameRunning && currentScore === 0 && currentLevel === 1 && isGameOver) {
                    console.log('🔄 Game restart detected - resetting info panel');
                    resetGameInfo();
                }
                
                // Simple detection: if score goes from >0 to 0, might be game over
                if (lastScore > 0 && currentScore === 0 && !isGameOver) {
                    console.log('💀 Possible game over: score reset to 0');
                    // Don't auto-trigger, let user use ENTER to restart
                }
                
                // Aggiorna il record se necessario
                if (lastScore > highScore) {
                    highScore = lastScore;
                    localStorage.setItem('tetris-high-score', highScore);
                    const highScoreElement = document.getElementById('highScore');
                    if (highScoreElement) {
                        highScoreElement.textContent = parseInt(highScore).toLocaleString();
                        // Effetto visivo per nuovo record
                        highScoreElement.style.color = '#ff9800';
                        highScoreElement.style.textShadow = '0 0 15px #ff9800';
                        setTimeout(() => {
                            highScoreElement.style.color = '';
                            highScoreElement.style.textShadow = '';
                        }, 2000);
                    }
                }
                
                console.log('Stats updated from C++:', {score: lastScore, level: lastLevel, lines: lastLines, running: gameRunning});
                
            } catch(e) {
                console.error('Error in updateStatsFromCpp:', e);
                updateStatsFallback();
            }
        }
        
        function updateStatsSimulated() {
            // Fallback per quando Module.HEAP32 non è disponibile
            console.log('Using simulated stats (Module.HEAP32 not available)');
            
            // Prova comunque a usare le funzioni C++ esportate se disponibili
            if (typeof Module !== 'undefined' && Module._getScore && Module._getLevel && Module._getLines) {
                try {
                    updateStatsFromCpp();
                    return;
                } catch(e) {
                    console.error('Error calling C++ functions in simulation mode:', e);
                }
            }
            
            // Se proprio non funziona nulla, usa il fallback
            updateStatsFallback();
        }
        
        function updateStatsFallback() {
            // Fallback: mantieni i valori precedenti o usa valori di default
            const scoreDisplay = document.getElementById('scoreDisplay');
            const levelDisplay = document.getElementById('levelDisplay');
            const linesDisplay = document.getElementById('linesDisplay');
            
            if (scoreDisplay && !scoreDisplay.textContent) scoreDisplay.textContent = '0';
            if (levelDisplay && !levelDisplay.textContent) levelDisplay.textContent = '1';
            if (linesDisplay && !linesDisplay.textContent) linesDisplay.textContent = '0';
        }
        
        function resetGameInfo() {
            console.log('🔄 Starting resetGameInfo...');
            
            // Reset game state
            isGameOver = false;
            isPaused = false;
            isTimerRunning = true;
            
            // Reset game over state - QUESTO È FONDAMENTALE!
            newGameOverActive = false;
            mobileGameOverActive = false;
            
            // Reset time tracking
            gameStartTimeReal = Date.now();
            gameEndTime = null;
            totalPausedTime = 0;
            pauseStartTime = null;
            
            // Reset score tracking for game over detection
            lastKnownScore = 0;
            lastScoreChangeTime = Date.now();
            
            console.log('🔄 Reset timer variables:', {
                gameStartTimeReal: new Date(gameStartTimeReal).toLocaleTimeString(),
                isTimerRunning,
                isPaused,
                isGameOver,
                newGameOverActive,
                mobileGameOverActive
            });
            
            // Update game state element
            const gameStateElement = document.getElementById('gameState');
            if (gameStateElement) {
                gameStateElement.textContent = 'In corso';
                gameStateElement.style.color = '';
                console.log('🔄 Updated game state display to "In corso"');
            }
            
            // Reset time display (remove FINAL)
            const gameTimeElement = document.getElementById('gameTime');
            if (gameTimeElement) {
                gameTimeElement.textContent = '00:00';
                gameTimeElement.style.color = '';
                console.log('🔄 Reset time display to "00:00"');
            }
            
            // Assicurati che l'overlay game over sia nascosto
            const gameOverOverlay = document.getElementById('gameOverOverlay');
            if (gameOverOverlay) {
                gameOverOverlay.classList.remove('active');
                gameOverOverlay.style.display = 'none';
            }
            
            console.log('✅ Game info reset complete - game over state cleared');
        }
        
        function stopStatsUpdater() {
            if (statsUpdateInterval) {
                clearInterval(statsUpdateInterval);
                statsUpdateInterval = null;
            }
        }
