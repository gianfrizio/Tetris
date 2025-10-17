// ==================== GAME STATE MANAGEMENT ====================
// Sistema centralizzato per gestire lo stato del gioco
// Sostituisce le variabili globali sparse con un singleton gestito

logger.log('game-state', 'loading...');

/**
 * Event Emitter per notificare i cambiamenti di stato
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return () => this.off(event, listener);
    }

    off(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    emit(event, ...args) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => {
            try {
                listener(...args);
            } catch (error) {
                logger.error('game-state', `Error in event listener for '${event}'`, error);
            }
        });
    }

    once(event, listener) {
        const onceWrapper = (...args) => {
            listener(...args);
            this.off(event, onceWrapper);
        };
        return this.on(event, onceWrapper);
    }
}

/**
 * GameState - Singleton per gestire tutto lo stato del gioco
 */
class GameState extends EventEmitter {
    constructor() {
        super();

        // Stato del gioco
        this._state = {
            // Stato di caricamento e inizializzazione
            gameReady: false,
            gameStartRequested: false,

            // Stato del gioco corrente
            isPaused: false,
            isGameOver: false,
            isTimerRunning: true,

            // Timing del gioco
            gameStartTimeReal: null,
            gameEndTime: null,
            totalPausedTime: 0,
            pauseStartTime: null,
            lastScoreChangeTime: Date.now(),

            // Sistema Game Over
            gameOverCheckInterval: null,
            lastKnownScore: 0,
            newGameOverActive: false,
            mobileGameOverActive: false,
            gameOverMonitoringInitialized: false,

            // Sistema Pausa Mobile
            mobilePauseActive: false,
            wasAutoPaused: false,
            autoPauseReason: '',

            // Statistiche del gioco
            lastScore: 0,
            lastLevel: 1,
            lastLines: 0,
            highScore: parseInt(localStorage.getItem('tetris-high-score') || 0),

            // Intervalli e timer
            statsUpdateInterval: null,
            lastRunningState: true,
            gameStoppedTime: null,
            lastScoreCheck: 0,
            scoreStuckCount: 0,
            lastGameRunningState: true,
            isManuallyPaused: false
        };

        logger.success('game-state', 'initialized');
    }

    // Getter generico per lo stato
    get(key) {
        return this._state[key];
    }

    // Setter generico con emissione di eventi
    set(key, value) {
        const oldValue = this._state[key];
        if (oldValue === value) return; // Nessun cambiamento

        this._state[key] = value;
        this.emit('stateChange', { key, value, oldValue });
        this.emit(`${key}Changed`, value, oldValue);

        // Eventi speciali per cambiamenti critici
        if (key === 'isGameOver' && value === true) {
            this.emit('gameOver');
        }
        if (key === 'isPaused' && value !== oldValue) {
            this.emit(value ? 'gamePaused' : 'gameResumed');
        }
        if (key === 'lastScore' && value > oldValue) {
            this.emit('scoreChanged', value, oldValue);
        }
    }

    // Metodi di utilità per aggiornamenti multipli
    update(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /**
     * Complete game restart - resets ALL state (JS + UI + C++)
     * This is the SINGLE source of truth for game restart logic
     */
    resetForNewGame() {
        logger.log('game-state', 'Complete game restart initiated');

        const currentHighScore = this._state.highScore;

        // 1. Reset all JavaScript state
        this.update({
            isGameOver: false,
            isPaused: false,
            isTimerRunning: true,
            gameStartTimeReal: Date.now(),
            gameEndTime: null,
            totalPausedTime: 0,
            pauseStartTime: null,
            lastScoreChangeTime: Date.now(),
            newGameOverActive: false,
            mobileGameOverActive: false,
            mobilePauseActive: false,
            wasAutoPaused: false,
            autoPauseReason: '',
            lastScore: 0,
            lastLevel: 1,
            lastLines: 0,
            lastRunningState: true,
            gameStoppedTime: null,
            lastScoreCheck: 0,
            scoreStuckCount: 0,
            lastGameRunningState: true,
            isManuallyPaused: false,
            highScore: currentHighScore
        });

        // 2. Update UI elements
        this._updateUIForRestart();

        // 3. Restart C++ game engine
        this._restartCppGame();

        // 4. Emit event for observers
        this.emit('gameReset');

        logger.success('game-state', 'Complete game restart finished');
    }

    /**
     * Private: Updates UI elements for restart
     */
    _updateUIForRestart() {
        const gameTimeElement = document.getElementById('gameTime');
        const gameStateElement = document.getElementById('gameState');

        if (gameTimeElement) {
            gameTimeElement.textContent = '00:00';
            gameTimeElement.style.color = '';
        }

        if (gameStateElement) {
            gameStateElement.textContent = 'In corso';
            gameStateElement.style.color = '';
            gameStateElement.style.textShadow = '';
        }

        logger.success('game-state', 'UI updated for restart');
    }

    /**
     * Private: Restarts the C++ game engine
     */
    _restartCppGame() {
        try {
            if (typeof Module === 'undefined') {
                logger.warn('cpp', 'Module not available for C++ restart');
                return;
            }

            if (Module._restartTetrisGame) {
                Module._restartTetrisGame();
                logger.success('cpp', 'Game restarted via _restartTetrisGame');
            } else if (Module._startTetrisGame) {
                Module._startTetrisGame();
                logger.success('cpp', 'Game restarted via _startTetrisGame');
            } else {
                logger.warn('cpp', 'No C++ restart function available');
                logger.debug('cpp', 'Available functions', Object.keys(Module).filter(k => k.startsWith('_')));
            }
        } catch(e) {
            logger.error('cpp', 'Error restarting C++ game', e);
        }
    }

    // Gestione della pausa
    pause() {
        if (this._state.isPaused || this._state.isGameOver) return;

        this.set('isPaused', true);
        this.set('isTimerRunning', false);
        this.set('pauseStartTime', Date.now());

        logger.log('pause', 'Game paused');
    }

    resume() {
        if (!this._state.isPaused || this._state.isGameOver) return;

        if (this._state.pauseStartTime) {
            const pauseDuration = Date.now() - this._state.pauseStartTime;
            this.set('totalPausedTime', this._state.totalPausedTime + pauseDuration);
        }

        this.set('isPaused', false);
        this.set('pauseStartTime', null);
        this.set('isTimerRunning', true);

        logger.log('pause', 'Game resumed');
    }

    // Gestione del game over
    triggerGameOver() {
        if (this._state.isGameOver) return;

        logger.log('gameover', 'Game Over triggered');

        this.set('isGameOver', true);
        this.set('isTimerRunning', false);
        this.set('gameEndTime', Date.now());

        // Calcola il tempo di pausa finale se necessario
        if (this._state.pauseStartTime) {
            const finalPauseDuration = this._state.gameEndTime - this._state.pauseStartTime;
            this.set('totalPausedTime', this._state.totalPausedTime + finalPauseDuration);
            this.set('pauseStartTime', null);
        }
    }

    // Aggiorna il punteggio e gestisce il record
    updateScore(score) {
        if (score === this._state.lastScore) return;

        this.set('lastScore', score);
        this.set('lastScoreChangeTime', Date.now());

        // Aggiorna il record se necessario
        if (score > this._state.highScore) {
            this.set('highScore', score);
            localStorage.setItem('tetris-high-score', score);
            this.emit('newHighScore', score);
            logger.success('game-state', 'New high score: ' + score);
        }
    }

    // Aggiorna le statistiche dal modulo C++
    updateStats(score, level, lines) {
        const statsChanged =
            score !== this._state.lastScore ||
            level !== this._state.lastLevel ||
            lines !== this._state.lastLines;

        if (statsChanged) {
            this.update({
                lastScore: score,
                lastLevel: level,
                lastLines: lines
            });

            this.updateScore(score);
        }
    }

    // Calcola il tempo di gioco effettivo
    getGameTime() {
        if (!this._state.gameStartTimeReal) return 0;

        const endTime = this._state.gameEndTime ||
                       (this._state.isPaused ? this._state.pauseStartTime : Date.now());

        return Math.floor((endTime - this._state.gameStartTimeReal - this._state.totalPausedTime) / 1000);
    }

    // Formatta il tempo di gioco come stringa MM:SS
    getGameTimeFormatted() {
        const seconds = this.getGameTime();
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Esporta lo stato corrente (per debug e salvataggio)
    exportState() {
        return { ...this._state };
    }

    // Debug: stampa lo stato corrente
    debug() {
        console.table(this._state);
    }
}

// Crea l'istanza singleton
const gameState = new GameState();

// Esponi globalmente per compatibilità con il codice esistente
window.gameState = gameState;

logger.loaded('game-state');
