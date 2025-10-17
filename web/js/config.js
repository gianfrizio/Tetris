// ==================== GAME CONFIGURATION ====================
// Centralized configuration for all magic numbers and timing constants
// All values in milliseconds unless otherwise specified

console.log('📦 Loading: config.js');

const GameConfig = {
    // ==================== GRACE PERIODS ====================
    // Grace periods prevent false positives during game state transitions

    GAME_START_GRACE_PERIOD: 3000, // Wait before detecting game over (iPhone compatibility)
    MONITORING_GRACE_PERIOD: 3000,  // Initial monitoring delay to avoid false positives

    // ==================== TOUCH CONTROLS ====================
    // Touch gesture detection and debouncing

    TAP_DEBOUNCE: 250,              // Minimum time between tap events
    TAP_HOLD_TIME: 300,             // Maximum duration for a tap (vs hold)
    LONG_PRESS_TIME: 2000,          // Duration to trigger long-press menu
    LONG_PRESS_COOLDOWN: 1200,      // Cooldown after long-press
    TAP_BURST_WINDOW: 700,          // Time window to detect rapid taps
    TAP_BURST_THRESHOLD: 3,         // Number of taps to suppress long-press
    MOVE_THROTTLE_MS: 120,          // Minimum time between lateral moves
    SWIPE_MOVEMENT_THRESHOLD: 20,   // Pixels of movement to cancel long-press

    // ==================== KEYBOARD CONTROLS ====================
    // Keyboard input debouncing and cooldowns

    PAUSE_TOGGLE_COOLDOWN_MS: 250,  // Minimum time between ESC key presses
    SIMULATE_KEY_COOLDOWN_MS: 120,  // Cooldown for simulated key events
    KEY_HOLD_MS: 180,               // Duration to hold simulated key press

    // ==================== GAME MONITORING ====================
    // Intervals for checking game state

    GAME_OVER_CHECK_INTERVAL: 500,  // How often to check for game over
    STATS_UPDATE_INTERVAL: 100,     // How often to update statistics display

    // ==================== UI DELAYS ====================
    // Delays for UI transitions and animations

    GAME_OVER_SHOW_DELAY: 500,      // Delay before showing game over screen
    RESTART_DELAY: 300,             // Delay before restarting after game over
    MENU_ANIMATION_DELAY: 100,      // Delay for menu show/hide animations
    AUDIO_RESTORE_DELAY: 100,       // Delay before restoring audio on foreground

    // ==================== INITIALIZATION DELAYS ====================
    // Delays for proper module initialization

    TOUCH_CONTROLS_INIT_DELAY: 1000,    // Delay before adding touch controls
    BODY_TOUCH_INIT_DELAY: 500,         // Delay before adding body touch fallback
    AUDIO_CONTROLS_INIT_DELAY: 1000,    // Delay before initializing audio controls
    AUDIO_REAPPLY_DELAY: 500,           // Delay before reapplying audio settings
    GAME_OVER_MONITORING_DELAY: 2000,   // Delay before starting game over monitoring

    // ==================== CANVAS LAYOUT ====================
    // Responsive layout constants (pixels)

    MOBILE_BREAKPOINT: 768,         // Viewport width threshold for mobile layout
    MOBILE_RESERVED_HEIGHT: 280,    // Reserved space for UI elements on mobile
    MOBILE_MAX_CANVAS_HEIGHT: 420,  // Maximum canvas height on mobile
    MOBILE_CANVAS_WIDTH_FACTOR: 0.7, // Canvas width as factor of viewport
    MOBILE_MAX_CANVAS_WIDTH: 360,    // Maximum canvas width on mobile
    DESKTOP_MAX_WRAPPER_WIDTH: 1200, // Maximum game wrapper width on desktop

    // ==================== SWIPE DETECTION ====================
    // Dynamic swipe threshold calculation

    MIN_SWIPE_DISTANCE: 18,         // Minimum swipe distance (pixels)
    MAX_SWIPE_DISTANCE: 60,         // Maximum swipe distance (pixels)
    SWIPE_DISTANCE_FACTOR: 0.12,    // Swipe distance as factor of canvas width
    MIN_CANVAS_WIDTH: 200,          // Minimum canvas width for calculations
};

// Make configuration globally accessible
window.GameConfig = GameConfig;

// ==================== LOGGING UTILITIES ====================
// Standardized logging with module prefixes and severity levels

const TetrisLogger = {
    // Module name → emoji mapping for visual identification
    modules: {
        'config': '⚙️',
        'game-state': '🎮',
        'audio': '🔊',
        'ui': '🖥️',
        'pause': '⏸️',
        'gameover': '☠️',
        'touch': '👆',
        'keyboard': '⌨️',
        'stats': '📊',
        'init': '🚀',
        'debug': '🔧',
        'sync': '🔄',
        'visibility': '👁️',
        'cpp': '🎯',
        'emscripten': '🔗'
    },

    /**
     * Get emoji prefix for module
     */
    _getPrefix(module) {
        return this.modules[module] || '📦';
    },

    /**
     * Standard log message
     */
    log(module, message, ...args) {
        const prefix = this._getPrefix(module);
        console.log(`${prefix} [${module}] ${message}`, ...args);
    },

    /**
     * Warning message
     */
    warn(module, message, ...args) {
        const prefix = this._getPrefix(module);
        console.warn(`${prefix} [${module}] ${message}`, ...args);
    },

    /**
     * Error message
     */
    error(module, message, error = null) {
        const prefix = this._getPrefix(module);
        if (error) {
            console.error(`${prefix} [${module}] ${message}`, error);
        } else {
            console.error(`${prefix} [${module}] ${message}`);
        }
    },

    /**
     * Success message (uses log with ✅)
     */
    success(module, message, ...args) {
        console.log(`✅ [${module}] ${message}`, ...args);
    },

    /**
     * Debug message (only in development)
     */
    debug(module, message, ...args) {
        if (this.isDevelopment()) {
            const prefix = this._getPrefix(module);
            console.log(`${prefix} [${module}] [DEBUG] ${message}`, ...args);
        }
    },

    /**
     * Module loaded message
     */
    loaded(module) {
        this.success(module, 'loaded and ready');
    },

    /**
     * Check if in development mode
     */
    isDevelopment() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('debug=true');
    }
};

// Expose globally
window.logger = TetrisLogger;

console.log('✅ Game configuration and logger loaded');
