// ==================== INITIALIZATION COORDINATOR ====================
//
// Questo file coordina l'inizializzazione dei vari moduli del gioco.
// Il codice specifico è stato spostato in moduli dedicati:
// - audio-controls.js: Gestione audio (volume, mute, background audio)
// - pause-system.js: Menu di pausa (mobile/desktop) e game over monitoring
// - emscripten-setup.js: Setup del modulo Emscripten e avvio del gioco
// - game-start.js: Avvio del gioco e aggiornamento statistiche
// - touch-controls.js: Controlli touch per mobile
// - visibility-manager.js: Gestione auto-pause su cambio visibilità

logger.log('init', 'Initialization coordinator loaded - all modules initialized via their own files');
logger.loaded('init');
