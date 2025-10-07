/*
 * TETRIS GAME - C++ Implementation
 * GIOCO TETRIS - Implementazione C++
 * 
 * A modern C++ implementation of the classic Tetris game using SDL2
 * Una moderna implementazione C++ del classico gioco Tetris usando SDL2
 * 
 * Features / Caratteristiche:
 * - Object-oriented design / Design orientato agli oggetti
 * - Smart pointers for memory management / Smart pointer per gestione memoria
 * - SDL2 graphics, audio and input / Grafica, audio e input SDL2
 * - Classic tetromino gameplay / Gameplay classico con tetromini
 * 
 * Author: Gianfrizio
 * Date: August 2025
 */

#include <SDL2/SDL.h>
#include <SDL2/SDL_ttf.h>
#include <SDL2/SDL_mixer.h>
#include <iostream>
#include <vector>
#include <array>
#include <string>
#include <cstdlib>
#include <ctime>
#include <memory>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/bind.h>
#endif

// Global game control variables / Variabili globali di controllo gioco
static bool gameStartRequested = false;
static bool gameInitialized = false;

// Pause toggle cooldown to prevent rapid repeated toggles (in ms)
static Uint32 last_pause_toggle_ms = 0;
static const Uint32 PAUSE_TOGGLE_COOLDOWN_MS = 250;

// Game constants / Costanti di gioco
constexpr int WINDOW_WIDTH = 400;          // Window width in pixels / Larghezza finestra in pixel
constexpr int GRID_WIDTH = 10;             // Number of blocks horizontally / Numero blocchi orizzontali
constexpr int BLOCK_SIZE = WINDOW_WIDTH / GRID_WIDTH; // Size of each block / Dimensione di ogni blocco
constexpr int GRID_OFFSET_X = 0;           // Grid horizontal offset / Offset orizzontale griglia
constexpr int GRID_OFFSET_Y = 0;           // Grid vertical offset / Offset verticale griglia
constexpr int GRID_HEIGHT = 20;            // Number of blocks vertically / Numero blocchi verticali
constexpr int WINDOW_HEIGHT = GRID_HEIGHT * BLOCK_SIZE; // Window height / Altezza finestra

// SDL Color wrapper class / Classe wrapper per colori SDL
class Color {
public:
    Uint8 r, g, b, a;  // Red, Green, Blue, Alpha / Rosso, Verde, Blu, Alpha
    
    constexpr Color(Uint8 red = 0, Uint8 green = 0, Uint8 blue = 0, Uint8 alpha = 255)
        : r(red), g(green), b(blue), a(alpha) {}
    
    // Convert to SDL_Color format / Converte in formato SDL_Color
    SDL_Color toSDL() const {
        return {r, g, b, a};
    }
};

// Tetris piece representation / Rappresentazione pezzo Tetris
class Piece {
public:
    int x, y;        // Position on grid / Posizione sulla griglia
    int type;        // Tetromino type (0-6) / Tipo tetromino (0-6)
    int rotation;    // Rotation state (0-3) / Stato rotazione (0-3)
    
    Piece(int type = 0, int x = 0, int y = 0, int rotation = 0)
        : x(x), y(y), type(type), rotation(rotation) {}
};

// Main Tetris game class / Classe principale del gioco Tetris
class TetrisGame {
private:
    // Tetromino shapes: 7 types, 4 rotations, 4x4 grid each
    // Forme tetromini: 7 tipi, 4 rotazioni, griglia 4x4 ciascuna
    static const std::array<std::array<std::array<int, 16>, 4>, 7> tetromino_shapes;
    
    // Colors for each tetromino type / Colori per ogni tipo di tetromino
    static const std::array<Color, 7> tetromino_colors;
    
    // Game state variables / Variabili stato di gioco
    std::array<std::array<int, GRID_WIDTH>, GRID_HEIGHT> grid;  // Game grid / Griglia di gioco
    Piece current_piece;                                         // Currently falling piece / Pezzo attualmente in caduta
    
    // Mobile detection / Rilevazione mobile
    bool isMobile() const {
        #ifdef __EMSCRIPTEN__
        // In Emscripten, check screen width for mobile detection
        return EM_ASM_INT({
            return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        });
        #else
        return false;
        #endif
    }
    
    // SDL components / Componenti SDL
    SDL_Window* window;      // Game window / Finestra di gioco
    SDL_Renderer* renderer;  // Graphics renderer / Renderer grafico
    TTF_Font* font;         // Font for text / Font per il testo
    
    // Audio components with RAII / Componenti audio con RAII
    std::unique_ptr<Mix_Chunk, decltype(&Mix_FreeChunk)> sound_rotate;    // Rotation sound / Suono rotazione
    std::unique_ptr<Mix_Chunk, decltype(&Mix_FreeChunk)> sound_clear;     // Line clear sound / Suono eliminazione linea
    std::unique_ptr<Mix_Chunk, decltype(&Mix_FreeChunk)> sound_gameover;  // Game over sound / Suono game over
    std::unique_ptr<Mix_Chunk, decltype(&Mix_FreeChunk)> sound_move;      // Movement sound / Suono movimento
    std::unique_ptr<Mix_Music, decltype(&Mix_FreeMusic)> music;           // Background music / Musica di sottofondo
    
public:
    // Audio control variables / Variabili controllo audio
    int master_volume;       // Master volume (0-128) / Volume principale (0-128)
    bool audio_muted;        // Is audio muted? / È l'audio mutato?
    
    // Public game statistics and state / Statistiche e stato di gioco pubblici
    bool game_over;          // Is game over? / È finito il gioco?
    bool pause_game;         // Is game paused? / È in pausa il gioco?
    int score;              // Current score / Punteggio attuale
    int level;              // Current level / Livello attuale
    int lines_cleared_total; // Total lines cleared / Totale linee eliminate
    // Constructor - initializes game state / Costruttore - inizializza stato di gioco
    TetrisGame() 
        : window(nullptr), renderer(nullptr), font(nullptr),
          sound_rotate(nullptr, Mix_FreeChunk),
          sound_clear(nullptr, Mix_FreeChunk),
          sound_gameover(nullptr, Mix_FreeChunk),
          sound_move(nullptr, Mix_FreeChunk),
          music(nullptr, Mix_FreeMusic),
          master_volume(38), audio_muted(false),  // Volume 30% di default (38/128 ≈ 30%)
          pause_game(false), game_over(false),
          score(0), level(1), lines_cleared_total(0) {
        
        // Initialize grid to empty / Inizializza griglia vuota
        for (auto& row : grid) {
            row.fill(0);
        }
        
        // Seed random number generator / Inizializza generatore numeri casuali
        std::srand(static_cast<unsigned int>(std::time(nullptr)));
    }
    
    // Destructor - cleanup resources / Distruttore - pulisce risorse
    ~TetrisGame() {
        cleanup();
    }
    
    // Initialize SDL systems / Inizializza sistemi SDL
    bool initialize() {
        // Initialize SDL video and audio / Inizializza video e audio SDL
        if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO) < 0) {
            std::cerr << "SDL Init Error: " << SDL_GetError() << std::endl;
            return false;
        }
        
        // Initialize SDL_ttf for text rendering / Inizializza SDL_ttf per rendering testo
        if (TTF_Init() == -1) {
            std::cerr << "TTF Init Error: " << TTF_GetError() << std::endl;
            return false;
        }
        
        // Create game window / Crea finestra di gioco
        window = SDL_CreateWindow("Tetris C++", 
                                SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
                                WINDOW_WIDTH, WINDOW_HEIGHT, SDL_WINDOW_SHOWN);
        if (!window) {
            std::cerr << "Window creation failed: " << SDL_GetError() << std::endl;
            return false;
        }
        
        // Create renderer for graphics / Crea renderer per grafica
        renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_SOFTWARE);
        if (!renderer) {
            std::cerr << "Renderer creation failed: " << SDL_GetError() << std::endl;
            return false;
        }
        
        // Initialize SDL_mixer for audio / Inizializza SDL_mixer per audio
        if (Mix_OpenAudio(44100, AUDIO_S16SYS, 2, 2048) < 0) {
            std::cerr << "SDL_mixer could not initialize! SDL_mixer Error: " << Mix_GetError() << std::endl;
            return false;
        }
        
        return true;
    }
    
    // Load game assets (fonts, sounds, music) / Carica risorse di gioco (font, suoni, musica)
    bool loadAssets() {
        // Load font for UI text / Carica font per testo UI
        font = TTF_OpenFont("audio/font.ttf", 20);
        if (!font) {
            std::cerr << "Failed to load font: " << TTF_GetError() << std::endl;
            return false;
        }
        
        // Load sound effects / Carica effetti sonori
        sound_rotate.reset(Mix_LoadWAV("audio/sounds/rotate.wav"));
        sound_clear.reset(Mix_LoadWAV("audio/sounds/clear.wav"));
        sound_gameover.reset(Mix_LoadWAV("audio/sounds/gameover.wav"));
        sound_move.reset(Mix_LoadWAV("audio/sounds/move.wav"));
        
        // Load background music / Carica musica di sottofondo
        music.reset(Mix_LoadMUS("audio/music/music.ogg"));
        
        // Check if all assets loaded successfully / Verifica che tutte le risorse siano caricate
        if (!sound_rotate || !sound_clear || !sound_gameover || !sound_move || !music) {
            std::cerr << "Failed to load sound effects or music! SDL_mixer Error: " << Mix_GetError() << std::endl;
            return false;
        }
        
        // Set initial volume / Imposta volume iniziale
        setMasterVolume(master_volume);
        
        return true;
    }
    
    // Audio control functions / Funzioni controllo audio
    void setMasterVolume(int volume) {
        master_volume = std::max(0, std::min(128, volume));  // Clamp to 0-128
        
        if (audio_muted) return;  // Don't change volume if muted / Non cambiare volume se mutato
        
        // Set volume for music and sound effects / Imposta volume per musica ed effetti
        Mix_VolumeMusic(master_volume);
        Mix_Volume(-1, master_volume);  // All channels / Tutti i canali
    }
    
    void setAudioMuted(bool muted) {
        audio_muted = muted;
        
        if (audio_muted) {
            // Mute all audio / Muta tutto l'audio
            Mix_VolumeMusic(0);
            Mix_Volume(-1, 0);
        } else {
            // Restore volume / Ripristina volume
            Mix_VolumeMusic(master_volume);
            Mix_Volume(-1, master_volume);
        }
    }
    
    void toggleAudioMute() {
        setAudioMuted(!audio_muted);
    }
    
    int getMasterVolume() const {
        return master_volume;
    }
    
    bool isAudioMuted() const {
        return audio_muted;
    }
    
    void cleanup() {
        sound_rotate.reset();
        sound_clear.reset();
        sound_gameover.reset();
        sound_move.reset();
        music.reset();
        
        if (font) {
            TTF_CloseFont(font);
            font = nullptr;
        }
        
        if (renderer) {
            SDL_DestroyRenderer(renderer);
            renderer = nullptr;
        }
        
        if (window) {
            SDL_DestroyWindow(window);
            window = nullptr;
        }
        
        TTF_Quit();
        Mix_Quit();
        SDL_Quit();
    }
    
    // Draw a colored block at specified position / Disegna un blocco colorato nella posizione specificata
    void drawBlock(int x, int y, const Color& color) {
        SDL_Rect block = {x, y, BLOCK_SIZE, BLOCK_SIZE};
        SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, color.a);
        SDL_RenderFillRect(renderer, &block);
        SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);  // Black border / Bordo nero
        SDL_RenderDrawRect(renderer, &block);
    }
    
    // Check for collisions when moving/rotating piece / Controlla collisioni durante movimento/rotazione pezzo
    bool checkCollision(const Piece& piece, int new_x, int new_y, int new_rot) {
        // Validate input parameters / Valida parametri di input
        if (piece.type < 0 || piece.type >= 7 || new_rot < 0 || new_rot >= 4) return true;
        
        const auto& shape = tetromino_shapes[piece.type][new_rot];
        
        // Check each block of the tetromino / Controlla ogni blocco del tetromino
        for (int i = 0; i < 16; ++i) {
            int px = i % 4;  // X position in 4x4 grid / Posizione X nella griglia 4x4
            int py = i / 4;  // Y position in 4x4 grid / Posizione Y nella griglia 4x4
            
            if (shape[i]) {  // If this block exists / Se questo blocco esiste
                int gx = new_x + px;  // Global X position / Posizione X globale
                int gy = new_y + py;  // Global Y position / Posizione Y globale
                
                if (gy < 0) continue;  // Allow pieces above grid / Permetti pezzi sopra la griglia
                
                // Check boundaries and existing blocks / Controlla confini e blocchi esistenti
                if (gx < 0 || gx >= GRID_WIDTH || gy >= GRID_HEIGHT) return true;
                if (grid[gy][gx]) return true;
            }
        }
        return false;
    }
    
    // Place current piece permanently on the grid / Posiziona pezzo corrente permanentemente sulla griglia
    void placePiece(const Piece& piece) {
        const auto& shape = tetromino_shapes[piece.type][piece.rotation];
        
        // Add each block to the grid / Aggiungi ogni blocco alla griglia
        for (int i = 0; i < 16; ++i) {
            int px = i % 4;
            int py = i / 4;
            
            if (shape[i]) {
                int gx = piece.x + px;
                int gy = piece.y + py;
                
                // Only place blocks within grid bounds / Posiziona solo blocchi entro i confini della griglia
                if (gy >= 0 && gy < GRID_HEIGHT && gx >= 0 && gx < GRID_WIDTH) {
                    grid[gy][gx] = piece.type + 1;  // Store piece type (1-7) / Memorizza tipo pezzo (1-7)
                }
            }
        }
    }
    
    // Clear completed lines and update score / Elimina linee complete e aggiorna punteggio
    void clearLines() {
        int lines_cleared = 0;
        
        // Check each row from bottom to top / Controlla ogni riga dal basso verso l'alto
        for (int y = GRID_HEIGHT - 1; y >= 0; y--) {
            bool full = true;
            
            // Check if row is completely filled / Controlla se la riga è completamente piena
            for (int x = 0; x < GRID_WIDTH; x++) {
                if (grid[y][x] == 0) {
                    full = false;
                    break;
                }
            }
            
            if (full) {
                lines_cleared++;
                
                // Move all rows above down by one / Sposta tutte le righe sopra giù di una
                for (int row = y; row > 0; row--) {
                    for (int col = 0; col < GRID_WIDTH; col++) {
                        grid[row][col] = grid[row-1][col];
                    }
                }
                
                // Clear the top row / Pulisci la riga superiore
                for (int col = 0; col < GRID_WIDTH; col++) {
                    grid[0][col] = 0;
                }
                
                y++; // Check this row again / Controlla di nuovo questa riga
            }
        }
        
        // Update score and level if lines were cleared / Aggiorna punteggio e livello se sono state eliminate linee
        if (lines_cleared > 0) {
            if (!audio_muted) Mix_PlayChannel(-1, sound_clear.get(), 0);
            score += lines_cleared * 100 * level;  // Score calculation / Calcolo punteggio
            lines_cleared_total += lines_cleared;
            
            // Increase level every 10 lines / Aumenta livello ogni 10 linee
            if ((lines_cleared_total / 10) + 1 > level) {
                level = (lines_cleared_total / 10) + 1;
            }
        }
    }
    
    // Spawn a new random tetromino / Genera un nuovo tetromino casuale
    void spawnPiece() {
        current_piece.type = std::rand() % 7;  // Random piece type (0-6) / Tipo pezzo casuale (0-6)
        current_piece.rotation = 0;            // Start with no rotation / Inizia senza rotazione
        current_piece.x = GRID_WIDTH / 2 - 2;  // Center horizontally / Centra orizzontalmente
        current_piece.y = -2;                  // Start above visible area / Inizia sopra l'area visibile
    }
    
    // Draw the game grid with placed blocks / Disegna la griglia di gioco con blocchi posizionati
    void drawGrid() {
        for (int y = 0; y < GRID_HEIGHT; y++) {
            for (int x = 0; x < GRID_WIDTH; x++) {
                int cell = grid[y][x];
                if (cell) {  // If cell contains a block / Se la cella contiene un blocco
                    // Draw block with appropriate color (cell-1 because 0 = empty) 
                    // Disegna blocco con colore appropriato (cell-1 perché 0 = vuoto)
                    drawBlock(GRID_OFFSET_X + x * BLOCK_SIZE, GRID_OFFSET_Y + y * BLOCK_SIZE, tetromino_colors[cell - 1]);
                }
            }
        }
    }
    
    // Draw the currently falling piece / Disegna il pezzo attualmente in caduta
    void drawPiece(const Piece& piece) {
        if (piece.type < 0 || piece.type >= 7) return; // Validity check / Controllo validità
        
        const auto& shape = tetromino_shapes[piece.type][piece.rotation];
        const Color& color = tetromino_colors[piece.type];
        
        // Draw each block of the piece / Disegna ogni blocco del pezzo
        for (int i = 0; i < 16; ++i) {
            int px = i % 4;  // X in 4x4 matrix / X nella matrice 4x4
            int py = i / 4;  // Y in 4x4 matrix / Y nella matrice 4x4
            
            if (shape[i]) {  // If block exists at this position / Se esiste un blocco in questa posizione
                int gx = piece.x + px;  // Global X coordinate / Coordinata X globale
                int gy = piece.y + py;  // Global Y coordinate / Coordinata Y globale
                
                // Only draw if within bounds and visible / Disegna solo se entro i confini e visibile
                if (gy >= 0 && gx >= 0 && gx < GRID_WIDTH) {
                    drawBlock(GRID_OFFSET_X + gx * BLOCK_SIZE, GRID_OFFSET_Y + gy * BLOCK_SIZE, color);
                }
            }
        }
    }
    
    // Check if game is over (top row has blocks) / Controlla se il gioco è finito (riga superiore ha blocchi)
    bool isGameOver() {
        for (int x = 0; x < GRID_WIDTH; x++) {
            if (grid[0][x] != 0) {  // If any block in top row / Se c'è un blocco nella riga superiore
                return true;
            }
        }
        return false;
    }
    
    // Render text on screen / Renderizza testo sullo schermo
    void renderText(const std::string& text, int x, int y, const Color& color) {
        SDL_Color sdl_color = color.toSDL();
        SDL_Surface* surface = TTF_RenderText_Blended(font, text.c_str(), sdl_color);
        if (!surface) {
            std::cerr << "TTF Render Error: " << TTF_GetError() << std::endl;
            return;
        }
        
        // Create texture from surface and render it / Crea texture da superficie e renderizzala
        SDL_Texture* texture = SDL_CreateTextureFromSurface(renderer, surface);
        SDL_Rect dst = {x, y, surface->w, surface->h};
        SDL_FreeSurface(surface);
        SDL_RenderCopy(renderer, texture, nullptr, &dst);
        SDL_DestroyTexture(texture);
    }
    
    // Reset game to initial state / Resetta gioco allo stato iniziale
    void resetGame() {
        std::cout << "Resetting game completely..." << std::endl;
        
        // Clear the game grid / Pulisci la griglia di gioco
        for (auto& row : grid) {
            row.fill(0);
        }
        
        // Reset game variables / Resetta variabili di gioco
        score = 0;
        level = 1;
        lines_cleared_total = 0;
        game_over = false;
        pause_game = false;
        
        // Spawn first piece / Genera primo pezzo
        spawnPiece();
        
        // Restart music if needed / Riavvia musica se necessario
        if (!Mix_PlayingMusic() && !audio_muted) {
            Mix_PlayMusic(music.get(), -1);
        }
        
        std::cout << "Game reset complete!" << std::endl;
    }
    
    // Handle keyboard and touch input / Gestisce input da tastiera e touch
    void handleInput(const SDL_Event& event) {
        // Handle touch/mouse click for game restart / Gestisce touch/click per riavvio
        if (event.type == SDL_MOUSEBUTTONDOWN && game_over) {
            std::cout << "Touch/Click detected during game over - Restarting game" << std::endl;
            resetGame();
            gameStartRequested = true;
            return;
        }
        
        if (event.type == SDL_KEYDOWN) {
            // INVIO - SEMPRE riavvia il gioco (indipendentemente dallo stato)
            if (event.key.keysym.sym == SDLK_RETURN) {
                std::cout << "ENTER pressed - Restarting game completely" << std::endl;
                resetGame();
                gameStartRequested = true;  // Assicurati che il gioco riprenda
                return;  // Esci subito dopo il reset
            }
            
            if (!game_over) {  // If game is still running / Se il gioco è ancora in corso
                if (event.key.keysym.sym == SDLK_ESCAPE && event.key.repeat == 0) {
                    // Toggle pause only on initial keydown (ignore auto-repeat)
                    Uint32 now = SDL_GetTicks();
                    if (now - last_pause_toggle_ms >= PAUSE_TOGGLE_COOLDOWN_MS) {
                        pause_game = !pause_game;  // Toggle pause / Commuta pausa
                        last_pause_toggle_ms = now;
                        std::cout << "ESC pressed - Pause state: " << (pause_game ? "PAUSED" : "PLAYING") << std::endl;
                    } else {
                        // Ignoring rapid toggle
                    }
                }
                
                if (!pause_game) {  // Only process input if not paused / Processa input solo se non in pausa
                    switch (event.key.keysym.sym) {
                        case SDLK_LEFT:  // Move left / Muovi a sinistra
                            if (!checkCollision(current_piece, current_piece.x - 1, current_piece.y, current_piece.rotation)) {
                                current_piece.x--;
                                if (!audio_muted) Mix_PlayChannel(-1, sound_move.get(), 0);
                            }
                            break;
                            
                        case SDLK_RIGHT:  // Move right / Muovi a destra
                            if (!checkCollision(current_piece, current_piece.x + 1, current_piece.y, current_piece.rotation)) {
                                current_piece.x++;
                                if (!audio_muted) Mix_PlayChannel(-1, sound_move.get(), 0);
                            }
                            break;
                            
                        case SDLK_UP: {  // Rotate piece / Ruota pezzo
                            int new_rot = (current_piece.rotation + 1) % 4;
                            if (!checkCollision(current_piece, current_piece.x, current_piece.y, new_rot)) {
                                current_piece.rotation = new_rot;
                                if (!audio_muted) Mix_PlayChannel(-1, sound_rotate.get(), 0);
                            }
                            break;
                        }
                        
                        case SDLK_DOWN:  // Soft drop / Caduta accelerata
                            if (!checkCollision(current_piece, current_piece.x, current_piece.y + 1, current_piece.rotation)) {
                                current_piece.y++;
                                if (!audio_muted) Mix_PlayChannel(-1, sound_move.get(), 0);
                            }
                            break;
                    }
                }
            }
        }
    }
    
    // Update game state (piece falling, etc.) / Aggiorna stato di gioco (caduta pezzi, ecc.)
    void update(Uint32 delta_time) {
        static Uint32 last_drop = 0;
        if (last_drop == 0) last_drop = delta_time; // Initialize on first frame / Inizializza al primo frame
        
        // Calculate drop delay based on level / Calcola ritardo caduta basato sul livello
        Uint32 drop_delay = 500 - (level - 1) * 40;  // Faster at higher levels / Più veloce ai livelli alti
        if (drop_delay < 100) drop_delay = 100;     // Minimum delay / Ritardo minimo
        
        // Only update if game is running / Aggiorna solo se il gioco è in corso
        if (!pause_game && !game_over && (delta_time - last_drop > drop_delay)) {
            last_drop = delta_time;
            
            // Try to move piece down / Prova a muovere il pezzo in basso
            if (!checkCollision(current_piece, current_piece.x, current_piece.y + 1, current_piece.rotation)) {
                current_piece.y++;  // Piece continues falling / Il pezzo continua a cadere
            } else {
                // Piece has landed / Il pezzo è atterrato
                placePiece(current_piece);  // Place it permanently / Posizionalo permanentemente
                clearLines();               // Check for completed lines / Controlla linee completate
                
                if (isGameOver()) {         // Check if game is over / Controlla se il gioco è finito
                    if (!audio_muted) Mix_PlayChannel(-1, sound_gameover.get(), 0);
                    game_over = true;
                    pause_game = false;  // Assicurati che non sia in pausa quando è game over
                    std::cout << "GAME OVER detected!" << std::endl;
                } else {
                    spawnPiece();           // Spawn next piece / Genera prossimo pezzo
                }
            }
        }
    }
    
    // Render the entire game / Renderizza l'intero gioco
    void render() {
        // Clear screen with dark background / Pulisci schermo con sfondo scuro
        SDL_SetRenderDrawColor(renderer, 30, 30, 30, 255);
        SDL_RenderClear(renderer);
        
        // Draw game elements / Disegna elementi di gioco
        drawGrid();                    // Fixed blocks / Blocchi fissi
        drawPiece(current_piece);      // Falling piece / Pezzo in caduta
        
        // Draw game state messages / Disegna messaggi stato di gioco
        Color white(255, 255, 255);
        if (pause_game) {
            if (isMobile()) {
                renderText("PAUSA", WINDOW_WIDTH/2 - 30, WINDOW_HEIGHT/2 - 10, white);
            } else {
                renderText("PAUSA (ESC)", WINDOW_WIDTH/2 - 60, WINDOW_HEIGHT/2 - 10, white);
            }
        }
        
        if (game_over) {
            renderText("GAME OVER", WINDOW_WIDTH/2 - 70, WINDOW_HEIGHT/2 - 40, white);
            if (isMobile()) {
                renderText("Tap per ricominciare", WINDOW_WIDTH/2 - 90, WINDOW_HEIGHT/2, white);
            } else {
                renderText("Premi INVIO per ricominciare", WINDOW_WIDTH/2 - 140, WINDOW_HEIGHT/2, white);
            }
        }
        
        // Present the rendered frame / Presenta il frame renderizzato
        SDL_RenderPresent(renderer);
    }
    
    static TetrisGame* instance;  // Static instance for main loop callback / Istanza statica per callback main loop
    
    static void mainLoop() {
        if (instance) {
            // Only run game loop if start was requested / Esegui il loop solo se l'avvio è stato richiesto
            if (gameStartRequested) {
                instance->gameLoop();
            } else {
                // Just handle events but don't update game / Gestisci solo eventi senza aggiornare il gioco
                instance->handleEventsOnly();
            }
        }
    }
    
    void gameLoop() {
        Uint32 current_time = SDL_GetTicks();
        SDL_Event event;
        
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) {
#ifdef __EMSCRIPTEN__
                emscripten_cancel_main_loop();
#endif
            } else {
                handleInput(event);
            }
        }
        
        update(current_time);
        render();
    }
    
    void handleEventsOnly() {
        SDL_Event event;
        
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) {
#ifdef __EMSCRIPTEN__
                emscripten_cancel_main_loop();
#endif
            }
            // Don't handle game input, just clear events / Non gestire input di gioco, solo pulire eventi
        }
        
        // Render a static screen / Renderizza schermata statica
        SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
        SDL_RenderClear(renderer);
        SDL_RenderPresent(renderer);
    }
    
    void startGame() {
        if (gameInitialized && !gameStartRequested) {
            gameStartRequested = true;
            if (!audio_muted) {
                Mix_PlayMusic(music.get(), -1);
            }
            spawnPiece();
            std::cout << "Game started!" << std::endl;
        }
    }
    
    void run() {
        if (!initialize()) {
            std::cerr << "Failed to initialize SDL" << std::endl;
            return;
        }
        
        if (!loadAssets()) {
            std::cerr << "Failed to load assets" << std::endl;
            return;
        }
        
        // Don't start music and spawn piece automatically / Non avviare musica e spawn automaticamente
        gameInitialized = true;
        
        instance = this;  // Set static instance / Imposta istanza statica
        
#ifdef __EMSCRIPTEN__
        emscripten_set_main_loop(mainLoop, 60, 1);  // 60 FPS, simulate infinite loop
#else
        // Desktop version with traditional loop / Versione desktop con loop tradizionale
        bool running = true;
        SDL_Event event;
        
        while (running) {
            Uint32 current_time = SDL_GetTicks();
            
            while (SDL_PollEvent(&event)) {
                if (event.type == SDL_QUIT) {
                    running = false;
                } else {
                    handleInput(event);
                }
            }
            
            update(current_time);
            render();
            
            SDL_Delay(16); // ~60 FPS
        }
#endif
    }
};

// Tetromino shape definitions: 7 types, 4 rotations each, 4x4 grid
// Definizioni forme tetromini: 7 tipi, 4 rotazioni ciascuno, griglia 4x4
// Layout: I, J, L, O, S, T, Z pieces / Disposizione: pezzi I, J, L, O, S, T, Z
const std::array<std::array<std::array<int, 16>, 4>, 7> TetrisGame::tetromino_shapes {{
    // I-piece (line) / Pezzo I (linea)
    {{
        {{0,0,0,0, 1,1,1,1, 0,0,0,0, 0,0,0,0}},  // Horizontal / Orizzontale
        {{0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0}},  // Vertical / Verticale
        {{0,0,0,0, 1,1,1,1, 0,0,0,0, 0,0,0,0}},  // Horizontal / Orizzontale
        {{0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0}}   // Vertical / Verticale
    }},
    // J-piece (reverse L) / Pezzo J (L rovesciata)
    {{
        {{1,0,0,0, 1,1,1,0, 0,0,0,0, 0,0,0,0}},
        {{0,1,1,0, 0,1,0,0, 0,1,0,0, 0,0,0,0}},
        {{0,0,0,0, 1,1,1,0, 0,0,1,0, 0,0,0,0}},
        {{0,1,0,0, 0,1,0,0, 1,1,0,0, 0,0,0,0}}
    }},
    // L-piece / Pezzo L
    {{
        {{0,0,1,0, 1,1,1,0, 0,0,0,0, 0,0,0,0}},
        {{0,1,0,0, 0,1,0,0, 0,1,1,0, 0,0,0,0}},
        {{0,0,0,0, 1,1,1,0, 1,0,0,0, 0,0,0,0}},
        {{1,1,0,0, 0,1,0,0, 0,1,0,0, 0,0,0,0}}
    }},
    // O-piece (square) / Pezzo O (quadrato)
    {{
        {{0,1,1,0, 0,1,1,0, 0,0,0,0, 0,0,0,0}},  // Same for all rotations / Uguale per tutte le rotazioni
        {{0,1,1,0, 0,1,1,0, 0,0,0,0, 0,0,0,0}},
        {{0,1,1,0, 0,1,1,0, 0,0,0,0, 0,0,0,0}},
        {{0,1,1,0, 0,1,1,0, 0,0,0,0, 0,0,0,0}}
    }},
    // S-piece (zigzag) / Pezzo S (zigzag)
    {{
        {{0,1,1,0, 1,1,0,0, 0,0,0,0, 0,0,0,0}},
        {{0,1,0,0, 0,1,1,0, 0,0,1,0, 0,0,0,0}},
        {{0,0,0,0, 0,1,1,0, 1,1,0,0, 0,0,0,0}},
        {{1,0,0,0, 1,1,0,0, 0,1,0,0, 0,0,0,0}}
    }},
    // T-piece / Pezzo T
    {{
        {{0,1,0,0, 1,1,1,0, 0,0,0,0, 0,0,0,0}},
        {{0,1,0,0, 0,1,1,0, 0,1,0,0, 0,0,0,0}},
        {{0,0,0,0, 1,1,1,0, 0,1,0,0, 0,0,0,0}},
        {{0,1,0,0, 1,1,0,0, 0,1,0,0, 0,0,0,0}}
    }},
    // Z-piece (reverse zigzag) / Pezzo Z (zigzag rovesciato)
    {{
        {{1,1,0,0, 0,1,1,0, 0,0,0,0, 0,0,0,0}},
        {{0,0,1,0, 0,1,1,0, 0,1,0,0, 0,0,0,0}},
        {{0,0,0,0, 1,1,0,0, 0,1,1,0, 0,0,0,0}},
        {{0,1,0,0, 1,1,0,0, 1,0,0,0, 0,0,0,0}}
    }}
}};

// Static instance definition / Definizione istanza statica
TetrisGame* TetrisGame::instance = nullptr;

// Color definitions for each tetromino type / Definizioni colori per ogni tipo di tetromino
const std::array<Color, 7> TetrisGame::tetromino_colors {{
    Color(0, 255, 255),   // I - Cyan / Ciano
    Color(0, 0, 255),     // J - Blue / Blu
    Color(255, 165, 0),   // L - Orange / Arancione
    Color(255, 255, 0),   // O - Yellow / Giallo
    Color(0, 255, 0),     // S - Green / Verde
    Color(128, 0, 128),   // T - Purple / Viola
    Color(255, 0, 0)      // Z - Red / Rosso
}};

#ifdef __EMSCRIPTEN__
// Functions to interact with the game from JavaScript / Funzioni per interagire con il gioco da JavaScript
extern "C" {
    void startTetrisGame() {
        if (TetrisGame::instance) {
            TetrisGame::instance->startGame();
        }
    }
    
    // Restart the game at any time / Riavvia il gioco in qualsiasi momento
    void restartTetrisGame() {
        if (TetrisGame::instance) {
            TetrisGame::instance->resetGame();
            gameStartRequested = true;  // Assicurati che il gioco riprenda
        }
    }
    
    // Get current score / Ottieni punteggio attuale
    int getScore() {
        if (TetrisGame::instance) {
            return TetrisGame::instance->score;
        }
        return 0;
    }
    
    // Get current level / Ottieni livello attuale
    int getLevel() {
        if (TetrisGame::instance) {
            return TetrisGame::instance->level;
        }
        return 1;
    }
    
    // Get total lines cleared / Ottieni totale linee eliminate
    int getLines() {
        if (TetrisGame::instance) {
            return TetrisGame::instance->lines_cleared_total;
        }
        return 0;
    }
    
    // Check if game is running / Controlla se il gioco è in esecuzione
    bool isGameRunning() {
        if (TetrisGame::instance) {
            // Il gioco è in esecuzione se è stato avviato, non è finito e non è in pausa
            return gameStartRequested && !TetrisGame::instance->game_over && !TetrisGame::instance->pause_game;
        }
        return false;
    }
    
    // Check if game is paused / Controlla se il gioco è in pausa
    bool isGamePaused() {
        if (TetrisGame::instance) {
            return TetrisGame::instance->pause_game;
        }
        return false;
    }
    
    // Audio control functions / Funzioni controllo audio
    void setVolume(int volume) {
        if (TetrisGame::instance) {
            TetrisGame::instance->setMasterVolume(volume);
        }
    }
    
    int getVolume() {
        if (TetrisGame::instance) {
            // Converti da SDL (0-128) a UI (0-100)
            int sdlVolume = TetrisGame::instance->getMasterVolume();
            return (sdlVolume * 100 + 64) / 128; // +64 per arrotondamento
        }
        return 30;  // Default volume 30% / Volume di default 30%
    }
    
    void muteAudio(bool muted) {
        if (TetrisGame::instance) {
            TetrisGame::instance->setAudioMuted(muted);
        }
    }
    
    void toggleMute() {
        if (TetrisGame::instance) {
            TetrisGame::instance->toggleAudioMute();
        }
    }
    
    bool isAudioMuted() {
        if (TetrisGame::instance) {
            return TetrisGame::instance->isAudioMuted();
        }
        return false;
    }
}
#endif

// Main function - entry point of the program / Funzione main - punto di ingresso del programma
int main(int argc, char* argv[]) {
    (void)argc; // Avoid unused parameter warning / Evita warning parametro non usato
    (void)argv;
    
    // Create and run the Tetris game / Crea ed esegui il gioco Tetris
    TetrisGame game;
    game.run();
    
    return 0;  // Exit successfully / Esci con successo
}
