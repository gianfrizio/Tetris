// ==================== TOUCH CONTROLS ==================== 

        
        // Marca l'inizio del gioco per le statistiche
        window.gameStartTime = Date.now();
        
        // Responsive layout function
        function fitCanvasToViewport() {
            console.log('Fitting canvas to viewport...');
            
            const gameWrapper = document.querySelector('.game-wrapper');
            const gameLayout = document.querySelector('.game-layout');
            const canvas = document.getElementById('canvas');
            
            if (!gameWrapper || !gameLayout || !canvas) return;
            
            // Calculate available space
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const isMobile = viewportWidth <= 768;
            
            if (isMobile) {
                // Mobile: smaller canvas to fit stats and info panels
                const reservedHeight = 280; // header + stats + info + footer + padding
                const maxCanvasHeight = Math.min(viewportHeight - reservedHeight, 420);
                const maxCanvasWidth = Math.min(viewportWidth * 0.7, 360); // smaller width
                
                canvas.style.maxWidth = maxCanvasWidth + 'px';
                canvas.style.maxHeight = maxCanvasHeight + 'px';
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                
                // Ensure canvas is perfectly centered and aligned with stats/info
                canvas.style.display = 'block';
                canvas.style.margin = '0 auto';
                canvas.style.position = 'static';
                canvas.style.left = 'auto';
                canvas.style.transform = 'none';
                
                // Center the game wrapper and ensure consistent alignment
                gameWrapper.style.margin = '0 auto';
                gameWrapper.style.maxWidth = '95vw';
                gameWrapper.style.textAlign = 'center';
                
                // Ensure game canvas container aligns with stats panels
                const gameCanvasContainer = document.querySelector('.game-canvas');
                if (gameCanvasContainer) {
                    gameCanvasContainer.style.justifyContent = 'center';
                    gameCanvasContainer.style.alignItems = 'center';
                    gameCanvasContainer.style.width = '100%';
                    gameCanvasContainer.style.textAlign = 'center';
                }
            } else {
                // Desktop: center layout with stats panels
                canvas.style.maxWidth = '';
                canvas.style.maxHeight = '';
                canvas.style.width = 'auto';
                canvas.style.height = 'auto';
                
                // Center the game wrapper
                gameWrapper.style.margin = '0 auto';
                gameWrapper.style.maxWidth = '1200px';
            }
            
            console.log('Canvas fitted:', { isMobile, viewportWidth, viewportHeight });
        }
        
    /*
     Mobile touch controls and long-press handling

     Changes added: prevent the pause menu from opening on rapid consecutive taps.
     - Implements a true long-press detection (LONG_PRESS_TIME)
     - Suppresses long-press if user performed a burst of quick taps (recentTapCount)
     - Adds a short cooldown after a successful long-press to avoid immediate re-triggering
     These guards prevent accidental pause menu openings on mobile when users tap
     quickly multiple times. Adjust LONG_PRESS_TIME, TAP_BURST_THRESHOLD and
     LONG_PRESS_COOLDOWN to tune behavior.
    */
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let lastTapTime = 0;
        const TAP_DEBOUNCE = 250; // ms
        const TAP_HOLD_TIME = 300; // ms max for a tap
        const LONG_PRESS_TIME = 2000; // ms for long press (2 seconds)
        let longPressTimer = null;
        let longPressTriggered = false;
        let touchMoved = false;
        let mobilePauseActive = false; // Track mobile pause state
        // Anti-accidental-open guards
        let recentTapCount = 0;           // number of quick taps in a short burst
        let tapBurstResetTimer = null;   // timer to reset recentTapCount
        const TAP_BURST_WINDOW = 700;    // ms window to consider taps part of a burst
        const TAP_BURST_THRESHOLD = 3;   // if >=this in window, suppress long-press briefly
        let lastLongPressTime = 0;       // timestamp of last successful long-press
        const LONG_PRESS_COOLDOWN = 1200; // ms cooldown after a long-press
    // Track whether a touch started on the canvas so body fallback ignores it
    let canvasTouchActive = false;
        // Throttle for lateral moves to prevent multiple rapid moves from a single swipe
        let lastLateralMoveTime = 0;
        const MOVE_THROTTLE_MS = 120; // ms between lateral moves

        function attemptLateralMove(direction) {
            const now = Date.now();
            if (now - lastLateralMoveTime < MOVE_THROTTLE_MS) {
                // too soon, ignore
                //console.log('Lateral move throttled');
                return false;
            }
            lastLateralMoveTime = now;
            if (direction === 'left') simulateKeyPress('ArrowLeft');
            else simulateKeyPress('ArrowRight');
            return true;
        }

        function addTouchControls() {
            const canvas = document.getElementById('canvas');
            if (!canvas) return;

            // dynamically compute swipe threshold based on canvas size
            function getMinSwipeDistance() {
                const w = Math.max(200, canvas.clientWidth || window.innerWidth);
                return Math.max(18, Math.min(60, Math.round(w * 0.12))); // 12% of canvas width, clamped
            }

            // Prevent default touch behaviors
            canvas.addEventListener('touchstart', function(e) {
                if (e.touches.length > 1) return; // ignore multi-touch
                e.preventDefault();
                e.stopPropagation();
                canvasTouchActive = true;
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                touchStartTime = Date.now();
                longPressTriggered = false;
                touchMoved = false;
                
                // Start long press timer only if touch stays still
                // Reset any previous long press timer for safety
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                longPressTimer = setTimeout(() => {
                    // Double check: only trigger if no movement occurred, timer wasn't cancelled,
                    // the touch actually lasted LONG_PRESS_TIME, and we're not in a recent tap burst.
                    const now = Date.now();
                    const actualTouchDuration = now - touchStartTime;

                    // Suppress if a long-press was triggered very recently
                    if (now - lastLongPressTime < LONG_PRESS_COOLDOWN) {
                        console.log('🚫 Ignoring long press due to cooldown');
                        return;
                    }

                    // If quick tap burst detected, don't allow accidental long-presses
                    if (recentTapCount >= TAP_BURST_THRESHOLD) {
                        console.log('🚫 Suppressing long press due to recent tap burst:', recentTapCount);
                        return;
                    }

                    // Finally ensure movement didn't occur and duration is sufficient
                    if (!touchMoved && longPressTimer !== null && canvasTouchActive && actualTouchDuration >= LONG_PRESS_TIME) {
                        longPressTriggered = true;
                        lastLongPressTime = now;
                        console.log('✅ Long press activated - conditions met (duration:', actualTouchDuration + 'ms)');
                        showMobilePauseMenu();
                    } else {
                        console.log('❌ Long press cancelled - movement detected, too short, or timer cleared', { touchMoved, actualTouchDuration });
                    }
                }, LONG_PRESS_TIME);
            }, { passive: false });

            canvas.addEventListener('touchmove', function(e) {
                if (e.touches.length > 1) return; // ignore multi-touch
                e.preventDefault();
                
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchStartX);
                const deltaY = Math.abs(touch.clientY - touchStartY);
                
                // If significant movement, cancel long press (but only if not already triggered)
                if (deltaX > 20 || deltaY > 20) { // Increased threshold to be even less sensitive
                    if (!longPressTriggered && !touchMoved) {
                        touchMoved = true;
                        if (longPressTimer) {
                            clearTimeout(longPressTimer);
                            longPressTimer = null;
                            console.log('🚫 Long press cancelled due to movement:', { deltaX, deltaY });
                        }
                    }
                }
            }, { passive: false });

            canvas.addEventListener('touchend', function(e) {
                if (e.changedTouches.length > 1) return; // ignore multi-touch
                e.preventDefault();
                e.stopPropagation();

                // If long press was already triggered, don't cancel it
                if (longPressTriggered) {
                    console.log('✅ Long press was triggered, keeping it active');
                    canvasTouchActive = false;
                    touchMoved = false; // Reset for next touch
                    longPressTriggered = false; // Reset for next touch
                    return;
                }

                // Only clear timer if long press wasn't triggered
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                    const touchDuration = Date.now() - touchStartTime;
                    console.log('🚫 Long press timer cancelled - touch too short:', touchDuration + 'ms');
                }

                // Compute touch end coordinates first (fix TDZ ReferenceError)
                const touch = e.changedTouches[0];
                const touchEndX = touch.clientX;
                const touchEndY = touch.clientY;
                const touchEndTime = Date.now();

                // If this was a short tap (not a swipe), account it in recentTapCount so
                // a burst of quick taps doesn't accidentally allow a long-press immediately after.
                if (Math.abs(touchEndX - touchStartX) < 20 && Math.abs(touchEndY - touchStartY) < 20 && (touchEndTime - touchStartTime) < TAP_HOLD_TIME) {
                    recentTapCount++;
                    if (tapBurstResetTimer) clearTimeout(tapBurstResetTimer);
                    tapBurstResetTimer = setTimeout(() => {
                        recentTapCount = 0;
                        tapBurstResetTimer = null;
                    }, TAP_BURST_WINDOW);
                    console.log('🔔 Registered quick tap, burst count:', recentTapCount);
                }

                if (!gameStartRequested) {
                    canvasTouchActive = false;
                    touchMoved = false; // Reset for next touch
                    return;
                }

                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                const deltaTime = touchEndTime - touchStartTime;

                const minSwipeDistance = getMinSwipeDistance();

                // Short tap -> rotate (debounced)
                if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance && deltaTime < TAP_HOLD_TIME) {
                    const now = Date.now();
                    if (now - lastTapTime > TAP_DEBOUNCE) {
                        lastTapTime = now;
                        simulateKeyPress('ArrowUp');
                        console.log('🔄 Tap rotate executed');
                    } else {
                        console.log('Tap ignored due to debounce');
                    }
                    canvasTouchActive = false;
                    touchMoved = false; // Reset for next touch
                    return;
                }

                // Horizontal swipe (move left/right)
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) attemptLateralMove('right'); else attemptLateralMove('left');
                    canvasTouchActive = false;
                    return;
                }

                // Vertical swipe down (fast drop)
                if (deltaY > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
                    simulateKeyPress('ArrowDown');
                    canvasTouchActive = false;
                    return;
                }

                canvasTouchActive = false;
            }, { passive: false });

            // Prevent scrolling and zooming when touching the canvas
            canvas.addEventListener('touchmove', function(e) {
                if (e.touches.length > 1) return;
                e.preventDefault();
            }, { passive: false });
        }

        function simulateKeyPress(key, options = {}) {
            console.log('Simulating key press:', key, options);

            // Prefer dispatching to the canvas element used by Module
            const targetCanvas = (typeof Module !== 'undefined' && Module.canvas) ? Module.canvas : document.getElementById('canvas');
            if (!targetCanvas) return;

            const keyCode = getKeyCode(key) || 0;

            // Prevent dispatching the same simulated key too frequently
            if (!simulateKeyPress._lastDispatch) simulateKeyPress._lastDispatch = {};
            const last = simulateKeyPress._lastDispatch[key] || 0;
            const now = Date.now();
            const SIMULATE_KEY_COOLDOWN_MS = 120; // small cooldown for simulated keys
            if (now - last < SIMULATE_KEY_COOLDOWN_MS) {
                console.log('Skipping simulated key (cooldown):', key);
                return;
            }
            simulateKeyPress._lastDispatch[key] = now;

            // Store current focus to restore later if needed
            const currentFocus = document.activeElement;
            const shouldRestoreFocus = options.restoreFocus !== false && currentFocus !== targetCanvas;

            try {
                // Ensure the canvas has focus so SDL receives keyboard events
                // But only if not explicitly disabled
                if (options.skipFocus !== true && typeof targetCanvas.focus === 'function') {
                    try { targetCanvas.focus({ preventScroll: true }); } catch(e) { targetCanvas.focus(); }
                }

                // Dispatch keydown
                const keyDownEvent = new KeyboardEvent('keydown', {
                    key: key,
                    code: key,
                    keyCode: keyCode,
                    which: keyCode,
                    bubbles: true,
                    cancelable: true
                });
                targetCanvas.dispatchEvent(keyDownEvent);

                // Also dispatch a keypress event which some engines expect
                const keyPressEvent = new KeyboardEvent('keypress', {
                    key: key,
                    code: key,
                    keyCode: keyCode,
                    which: keyCode,
                    bubbles: true,
                    cancelable: true
                });
                targetCanvas.dispatchEvent(keyPressEvent);

                // Hold key a bit longer to help native SDL handlers capture it
                const KEY_HOLD_MS = 180;
                setTimeout(() => {
                    const keyUpEvent = new KeyboardEvent('keyup', {
                        key: key,
                        code: key,
                        keyCode: keyCode,
                        which: keyCode,
                        bubbles: true,
                        cancelable: true
                    });
                    targetCanvas.dispatchEvent(keyUpEvent);
                    
                    // Restore focus if requested and safe to do so
                    if (shouldRestoreFocus && currentFocus && typeof currentFocus.focus === 'function') {
                        try {
                            // Wait a bit more to ensure C++ has processed the key
                            setTimeout(() => {
                                if (document.body.contains(currentFocus)) {
                                    currentFocus.focus({ preventScroll: true });
                                    console.log('Focus restored to:', currentFocus.tagName, currentFocus.id);
                                }
                            }, 50);
                        } catch(e) {
                            console.log('Could not restore focus:', e);
                        }
                    }
                }, KEY_HOLD_MS);
            } catch (e) {
                console.error('simulateKeyPress error:', e);
            }
        }
        
        function getKeyCode(key) {
            const codes = {
                'ArrowUp': 38,
                'ArrowDown': 40,
                'ArrowLeft': 37,
                'ArrowRight': 39,
                'Up': 38,
                'Down': 40,
                'Left': 37,
                'Right': 39
            };
            return codes[key] || 0;
        }

        // Initialize touch controls immediatamente e quando il container diventa visibile
        setTimeout(() => {
            console.log('Adding touch controls immediately...');
            addTouchControls();
        }, 1000);
        
        // Fallback: aggiungi controlli touch anche al body per essere sicuri
        function addBodyTouchControls() {
            console.log('Adding fallback touch controls to body');

            // Reuse same helpers as canvas handlers
            function getMinSwipeDistanceForBody() {
                const canvas = document.getElementById('canvas');
                if (canvas) {
                    const w = Math.max(200, canvas.clientWidth || window.innerWidth);
                    return Math.max(18, Math.min(60, Math.round(w * 0.12)));
                }
                return Math.max(18, Math.round(window.innerWidth * 0.12));
            }

            document.body.addEventListener('touchstart', function(e) {
                if (e.touches.length > 1) return;
                // If the touch originated on the canvas we should ignore here
                if (canvasTouchActive) return;
                if (gameStartRequested) {
                    const touch = e.touches[0];
                    touchStartX = touch.clientX;
                    touchStartY = touch.clientY;
                    touchStartTime = Date.now();
                }
            }, { passive: false });

            document.body.addEventListener('touchend', function(e) {
                if (e.changedTouches.length > 1) return;
                // Ignore if canvas handled it
                if (canvasTouchActive) return;
                if (!gameStartRequested) return;

                // TUTTI I CONTROLLI TOUCH RIMOSSI DAL BODY
                // Tap, swipe laterali e swipe verticali funzionano SOLO sul canvas
                // Questo evita input accidentali quando si tocca fuori dal board
            }, { passive: false });
        }
        
        // Attiva anche i controlli body
        setTimeout(addBodyTouchControls, 500);
