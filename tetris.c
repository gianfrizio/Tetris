/*
 * TETRIS GAME - C Implementation
 * GIOCO TETRIS - Implementazione C
 * 
 * A classic implementation of Tetris in procedural C using SDL2
 * Un'implementazione classica di Tetris in C procedurale usando SDL2
 * 
 * Features / Caratteristiche:
 * - Procedural programming style / Stile di programmazione procedurale
 * - SDL2 graphics, audio and input / Grafica, audio e input SDL2
 * - Classic tetromino gameplay / Gameplay classico con tetromini
 * - Score and level system / Sistema punteggio e livelli
 * 
 * Author: Gianfrizio
 * Date: August 2025
 */

#include <SDL2/SDL.h>
#include <SDL2/SDL_ttf.h>      // For text rendering / Per rendering testo
#include <SDL2/SDL_mixer.h>    // For audio / Per audio
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// Game constants / Costanti di gioco
#define WINDOW_WIDTH 400            // Window width in pixels / Larghezza finestra in pixel
#define GRID_WIDTH 10               // Number of blocks horizontally / Numero blocchi orizzontali
#define BLOCK_SIZE (WINDOW_WIDTH / GRID_WIDTH) // Size of each block (40px) / Dimensione di ogni blocco (40px)
#define GRID_OFFSET_X 0             // Grid horizontal offset / Offset orizzontale griglia
#define GRID_HEIGHT 20              // Number of blocks vertically / Numero blocchi verticali
#define WINDOW_HEIGHT (GRID_HEIGHT * BLOCK_SIZE)  // Window height (800px) / Altezza finestra (800px)

// Tetromino shapes: 7 types, 4 rotations each, 4x4 grid
// Forme tetromini: 7 tipi, 4 rotazioni ciascuno, griglia 4x4
// Array layout: [piece_type][rotation][position] / Disposizione array: [tipo_pezzo][rotazione][posizione]
static const int tetromino_shapes[7][4][16] = {
    // I-piece (line) / Pezzo I (linea)
    {
        {0,0,0,0,
         1,1,1,1,  // Horizontal line / Linea orizzontale
         0,0,0,0,
         0,0,0,0},
        {0,0,1,0,
         0,0,1,0,  // Vertical line / Linea verticale
         0,0,1,0,
         0,0,1,0},
        {0,0,0,0,
         1,1,1,1,  // Horizontal line / Linea orizzontale
         0,0,0,0,
         0,0,0,0},
        {0,0,1,0,
         0,0,1,0,  // Vertical line / Linea verticale
         0,0,1,0,
         0,0,1,0}
    },
    {
        {1,0,0,0,
         1,1,1,0,
         0,0,0,0,
         0,0,0,0},
        {0,1,1,0,
         0,1,0,0,
         0,1,0,0,
         0,0,0,0},
        {0,0,0,0,
         1,1,1,0,
         0,0,1,0,
         0,0,0,0},
        {0,1,0,0,
         0,1,0,0,
         1,1,0,0,
         0,0,0,0}
    },
    {
        {0,0,1,0,
         1,1,1,0,
         0,0,0,0,
         0,0,0,0},
        {0,1,0,0,
         0,1,0,0,
         0,1,1,0,
         0,0,0,0},
        {0,0,0,0,
         1,1,1,0,
         1,0,0,0,
         0,0,0,0},
        {1,1,0,0,
         0,1,0,0,
         0,1,0,0,
         0,0,0,0}
    },
    {
        {0,1,1,0,
         0,1,1,0,
         0,0,0,0,
         0,0,0,0},
        {0,1,1,0,
         0,1,1,0,
         0,0,0,0,
         0,0,0,0},
        {0,1,1,0,
         0,1,1,0,
         0,0,0,0,
         0,0,0,0},
        {0,1,1,0,
         0,1,1,0,
         0,0,0,0,
         0,0,0,0}
    },
    {
        {0,1,1,0,
         1,1,0,0,
         0,0,0,0,
         0,0,0,0},
        {0,1,0,0,
         0,1,1,0,
         0,0,1,0,
         0,0,0,0},
        {0,0,0,0,
         0,1,1,0,
         1,1,0,0,
         0,0,0,0},
        {1,0,0,0,
         1,1,0,0,
         0,1,0,0,
         0,0,0,0}
    },
    {
        {0,1,0,0,
         1,1,1,0,
         0,0,0,0,
         0,0,0,0},
        {0,1,0,0,
         0,1,1,0,
         0,1,0,0,
         0,0,0,0},
        {0,0,0,0,
         1,1,1,0,
         0,1,0,0,
         0,0,0,0},
        {0,1,0,0,
         1,1,0,0,
         0,1,0,0,
         0,0,0,0}
    },
    {
        {1,1,0,0,
         0,1,1,0,
         0,0,0,0,
         0,0,0,0},
        {0,0,1,0,
         0,1,1,0,
         0,1,0,0,
         0,0,0,0},
        {0,0,0,0,
         1,1,0,0,
         0,1,1,0,
         0,0,0,0},
        {0,1,0,0,
         1,1,0,0,
         1,0,0,0,
         0,0,0,0}
    }
};

// Color definitions for each tetromino type / Definizioni colori per ogni tipo di tetromino
static const SDL_Color tetromino_colors[7] = {
    {0,255,255,255},    // I - Cyan / Ciano
    {0,0,255,255},      // J - Blue / Blu  
    {255,165,0,255},    // L - Orange / Arancione
    {255,255,0,255},    // O - Yellow / Giallo
    {0,255,0,255},      // S - Green / Verde
    {128,0,128,255},    // T - Purple / Viola
    {255,0,0,255}       // Z - Red / Rosso
};

// Game grid - stores placed blocks / Griglia di gioco - memorizza blocchi posizionati
// 0 = empty, 1-7 = tetromino type / 0 = vuoto, 1-7 = tipo tetromino
int grid[GRID_HEIGHT][GRID_WIDTH] = {0};

// Tetris piece structure / Struttura pezzo Tetris
typedef struct {
    int x, y;        // Position on grid / Posizione sulla griglia
    int type;        // Tetromino type (0-6) / Tipo tetromino (0-6)
    int rotation;    // Rotation state (0-3) / Stato rotazione (0-3)
} Piece;

// Current falling piece / Pezzo attualmente in caduta
Piece current_piece;

// SDL components / Componenti SDL
SDL_Window *window = NULL;      // Game window / Finestra di gioco
SDL_Renderer *renderer = NULL;  // Graphics renderer / Renderer grafico
TTF_Font *font = NULL;         // Font for UI text / Font per testo UI

// Audio components / Componenti audio
Mix_Chunk *sound_rotate = NULL;    // Rotation sound effect / Effetto sonoro rotazione
Mix_Chunk *sound_clear = NULL;     // Line clear sound effect / Effetto sonoro eliminazione linea
Mix_Chunk *sound_gameover = NULL;  // Game over sound effect / Effetto sonoro game over
Mix_Chunk *sound_move = NULL;      // Movement sound effect / Effetto sonoro movimento
Mix_Music *music = NULL;           // Background music / Musica di sottofondo

// Game state variables / Variabili stato di gioco
bool pause_game = false;        // Is game paused? / È in pausa il gioco?
bool game_over = false;         // Is game over? / È finito il gioco?
int score = 0;                  // Current score / Punteggio attuale
int level = 1;                  // Current level / Livello attuale
int lines_cleared_total = 0;    // Total lines cleared / Totale linee eliminate

// Initialize SDL systems (video, audio, fonts) / Inizializza sistemi SDL (video, audio, font)
bool init_SDL() {
    // Initialize SDL video and audio subsystems / Inizializza sottosistemi video e audio SDL
    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO) < 0) {
        printf("SDL Init Error: %s\n", SDL_GetError());
        return false;
    }
    
    // Initialize SDL_ttf for text rendering / Inizializza SDL_ttf per rendering testo
    if (TTF_Init() == -1) {
        printf("TTF Init Error: %s\n", TTF_GetError());
        return false;
    }
    
    // Create game window / Crea finestra di gioco
    window = SDL_CreateWindow("Tetris", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
                              WINDOW_WIDTH, WINDOW_HEIGHT, SDL_WINDOW_SHOWN);
    if (!window) {
        printf("Window creation failed: %s\n", SDL_GetError());
        return false;
    }
    
    // Create renderer for graphics / Crea renderer per grafica
    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_SOFTWARE);
    if (!renderer) {
        printf("Renderer creation failed: %s\n", SDL_GetError());
        return false;
    }
    
    // Initialize SDL_mixer for audio / Inizializza SDL_mixer per audio
    if (Mix_OpenAudio(44100, AUDIO_S16SYS, 2, 2048) < 0) {
        printf("SDL_mixer could not initialize! SDL_mixer Error: %s\n", Mix_GetError());
        return false;
    }
    return true;
}

// Load game assets (sounds and music) / Carica risorse di gioco (suoni e musica)
bool load_audio() {
    // Load sound effects / Carica effetti sonori
    sound_rotate = Mix_LoadWAV("/home/gianfrizio/Tetris/audio/sounds/rotate.wav");
    sound_clear = Mix_LoadWAV("/home/gianfrizio/Tetris/audio/sounds/clear.wav");
    sound_gameover = Mix_LoadWAV("/home/gianfrizio/Tetris/audio/sounds/gameover.wav");
    sound_move = Mix_LoadWAV("/home/gianfrizio/Tetris/audio/sounds/move.wav");
    
    // Load background music / Carica musica di sottofondo
    music = Mix_LoadMUS("/home/gianfrizio/Tetris/audio/music/music.ogg");
    
    // Check if all assets loaded successfully / Controlla se tutte le risorse sono state caricate
    if (!sound_rotate || !sound_clear || !sound_gameover || !sound_move || !music) {
        printf("Failed to load sound effects or music! SDL_mixer Error: %s\n", Mix_GetError());
        return false;
    }
    return true;
}

// Cleanup and free all SDL resources / Pulizia e liberazione di tutte le risorse SDL
void close_SDL() {
    // Free audio resources / Libera risorse audio
    Mix_FreeChunk(sound_rotate);
    Mix_FreeChunk(sound_clear);
    Mix_FreeChunk(sound_gameover);
    Mix_FreeChunk(sound_move);
    Mix_FreeMusic(music);
    
    // Free font / Libera font
    if(font) TTF_CloseFont(font);
    
    // Free graphics resources / Libera risorse grafiche
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    
    // Quit SDL subsystems / Chiudi sottosistemi SDL
    TTF_Quit();
    Mix_Quit();
    SDL_Quit();
}

// Draw a colored block at specified position / Disegna un blocco colorato nella posizione specificata
void draw_block(int x, int y, SDL_Color color) {
    SDL_Rect block = {GRID_OFFSET_X + x, y, BLOCK_SIZE, BLOCK_SIZE};
    SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, color.a);
    SDL_RenderFillRect(renderer, &block);
    SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);  // Black border / Bordo nero
    SDL_RenderDrawRect(renderer, &block);
}

// Check for collisions when moving/rotating piece / Controlla collisioni durante movimento/rotazione pezzo
bool check_collision(Piece *p, int new_x, int new_y, int new_rot) {
    const int *shape = tetromino_shapes[p->type][new_rot];
    
    // Check each block of the tetromino / Controlla ogni blocco del tetromino
    for (int i = 0; i < 16; i++) {
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
void place_piece(Piece *p) {
    const int *shape = tetromino_shapes[p->type][p->rotation];
    
    // Add each block to the grid / Aggiungi ogni blocco alla griglia
    for (int i = 0; i < 16; i++) {
        int px = i % 4;
        int py = i / 4;
        if (shape[i]) {
            int gx = p->x + px;
            int gy = p->y + py;
            
            // Only place blocks within grid bounds / Posiziona solo blocchi entro i confini della griglia
            if (gy >= 0 && gy < GRID_HEIGHT && gx >= 0 && gx < GRID_WIDTH) {
                grid[gy][gx] = p->type + 1;  // Store piece type (1-7) / Memorizza tipo pezzo (1-7)
            }
        }
    }
}

// Clear completed lines and update score / Elimina linee complete e aggiorna punteggio
void clear_lines() {
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
        Mix_PlayChannel(-1, sound_clear, 0);
        score += lines_cleared * 100 * level;  // Score calculation / Calcolo punteggio
        lines_cleared_total += lines_cleared;
        
        // Increase level every 10 lines / Aumenta livello ogni 10 linee
        if ((lines_cleared_total / 10) + 1 > level) {
            level = (lines_cleared_total / 10) + 1;
        }
    }
}

// Spawn a new random tetromino / Genera un nuovo tetromino casuale
void spawn_piece(Piece *p) {
    p->type = rand() % 7;           // Random piece type (0-6) / Tipo pezzo casuale (0-6)
    p->rotation = 0;                // Start with no rotation / Inizia senza rotazione
    p->x = GRID_WIDTH / 2 - 2;      // Center horizontally / Centra orizzontalmente
    p->y = -2;                      // Start above visible area / Inizia sopra l'area visibile
}

// Draw the game grid with placed blocks / Disegna la griglia di gioco con blocchi posizionati
void draw_grid() {
    for (int y = 0; y < GRID_HEIGHT; y++) {
        for (int x = 0; x < GRID_WIDTH; x++) {
            int cell = grid[y][x];
            if (cell) {  // If cell contains a block / Se la cella contiene un blocco
                // Draw block with appropriate color (cell-1 because 0 = empty)
                // Disegna blocco con colore appropriato (cell-1 perché 0 = vuoto)
                draw_block(x * BLOCK_SIZE, y * BLOCK_SIZE, tetromino_colors[cell - 1]);
            }
        }
    }
}

// Draw the currently falling piece / Disegna il pezzo attualmente in caduta
void draw_piece(Piece *p) {
    const int *shape = tetromino_shapes[p->type][p->rotation];
    SDL_Color color = tetromino_colors[p->type];
    
    // Draw each block of the piece / Disegna ogni blocco del pezzo
    for (int i = 0; i < 16; i++) {
        int px = i % 4;  // X in 4x4 matrix / X nella matrice 4x4
        int py = i / 4;  // Y in 4x4 matrix / Y nella matrice 4x4
        
        if (shape[i]) {  // If block exists at this position / Se esiste un blocco in questa posizione
            int gx = p->x + px;  // Global X coordinate / Coordinata X globale
            int gy = p->y + py;  // Global Y coordinate / Coordinata Y globale
            
            // Only draw if visible / Disegna solo se visibile
            if (gy >= 0) {
                draw_block(gx * BLOCK_SIZE, gy * BLOCK_SIZE, color);
            }
        }
    }
}

// Check if game is over (top row has blocks) / Controlla se il gioco è finito (riga superiore ha blocchi)
bool is_game_over() {
    for (int x = 0; x < GRID_WIDTH; x++) {
        if (grid[0][x] != 0) {  // If any block in top row / Se c'è un blocco nella riga superiore
            return true;
        }
    }
    return false;
}

// Render text on screen / Renderizza testo sullo schermo
void render_text(const char* text, int x, int y, SDL_Color color) {
    SDL_Surface* surface = TTF_RenderText_Blended(font, text, color);
    if (!surface) {
        printf("TTF Render Error: %s\n", TTF_GetError());
        return;
    }
    
    // Create texture from surface and render it / Crea texture da superficie e renderizzala
    SDL_Texture* texture = SDL_CreateTextureFromSurface(renderer, surface);
    SDL_Rect dst = {x, y, surface->w, surface->h};
    SDL_FreeSurface(surface);
    SDL_RenderCopy(renderer, texture, NULL, &dst);
    SDL_DestroyTexture(texture);
}

// Main function - entry point of the program / Funzione main - punto di ingresso del programma
int main(int argc __attribute__((unused)), char *argv[] __attribute__((unused))) {

    // Initialize random number generator / Inizializza generatore numeri casuali
    srand((unsigned int)time(NULL));
    
    // Initialize SDL systems / Inizializza sistemi SDL
    if (!init_SDL()) {
        printf("Init SDL failed\n");
        return 1;
    }

    // Load font for UI text / Carica font per testo UI
    font = TTF_OpenFont("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20);
    if (!font) {
        printf("Failed to load font: %s\n", TTF_GetError());
        close_SDL();
        return 1;
    }

    // Load audio assets / Carica risorse audio
    if (!load_audio()) {
        printf("Load audio failed\n");
        close_SDL();
        return 1;
    }

    // Start background music / Avvia musica di sottofondo
    Mix_PlayMusic(music, -1);

    // Spawn first piece / Genera primo pezzo
    spawn_piece(&current_piece);

    // Main game loop variables / Variabili ciclo principale di gioco
    bool running = true;
    SDL_Event e;
    Uint32 last_tick = SDL_GetTicks();

    // Main game loop / Ciclo principale di gioco
    while (running) {
        // Handle events / Gestisci eventi
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT) {
                running = false;
            } else if (e.type == SDL_KEYDOWN) {
                if (!game_over) {  // If game is still running / Se il gioco è ancora in corso
                    if (e.key.keysym.sym == SDLK_ESCAPE) {
                        pause_game = !pause_game;  // Toggle pause / Commuta pausa
                    }
                    if (!pause_game) {  // Only process input if not paused / Processa input solo se non in pausa
                        if (e.key.keysym.sym == SDLK_LEFT) {  // Move left / Muovi a sinistra
                            if (!check_collision(&current_piece, current_piece.x - 1, current_piece.y, current_piece.rotation)) {
                                current_piece.x--;
                                Mix_PlayChannel(-1, sound_move, 0);
                            }
                        } else if (e.key.keysym.sym == SDLK_RIGHT) {  // Move right / Muovi a destra
                            if (!check_collision(&current_piece, current_piece.x + 1, current_piece.y, current_piece.rotation)) {
                                current_piece.x++;
                                Mix_PlayChannel(-1, sound_move, 0);
                            }
                        } else if (e.key.keysym.sym == SDLK_UP) {  // Rotate piece / Ruota pezzo
                            int new_rot = (current_piece.rotation + 1) % 4;
                            if (!check_collision(&current_piece, current_piece.x, current_piece.y, new_rot)) {
                                current_piece.rotation = new_rot;
                                Mix_PlayChannel(-1, sound_rotate, 0);
                            }
                        } else if (e.key.keysym.sym == SDLK_DOWN) {  // Soft drop / Caduta accelerata
                            if (!check_collision(&current_piece, current_piece.x, current_piece.y + 1, current_piece.rotation)) {
                                current_piece.y++;
                                Mix_PlayChannel(-1, sound_move, 0);
                            }
                        }
                    }
                } else {
                    // Game over - press ENTER to restart / Game over - premi INVIO per ricominciare
                    if (e.key.keysym.sym == SDLK_RETURN) {
                        // Reset game state / Resetta stato di gioco
                        for (int y = 0; y < GRID_HEIGHT; y++) {
                            for (int x = 0; x < GRID_WIDTH; x++) {
                                grid[y][x] = 0;
                            }
                        }
                        score = 0;
                        level = 1;
                        lines_cleared_total = 0;
                        game_over = false;
                        pause_game = false;
                        spawn_piece(&current_piece);
                    }
                }
            }
        }

        // Game logic - piece falling / Logica di gioco - caduta pezzi
        Uint32 now = SDL_GetTicks();
        Uint32 drop_delay = 500 - (level - 1) * 40; // Speed increases with level / Velocità aumenta col livello
        if (drop_delay < 100) drop_delay = 100;     // Minimum delay / Ritardo minimo

        // Only update if game is running / Aggiorna solo se il gioco è in corso
        if (!pause_game && !game_over && (now - last_tick > drop_delay)) {
            last_tick = now;
            
            // Try to move piece down / Prova a muovere il pezzo in basso
            if (!check_collision(&current_piece, current_piece.x, current_piece.y + 1, current_piece.rotation)) {
                current_piece.y++;  // Piece continues falling / Il pezzo continua a cadere
            } else {
                // Piece has landed / Il pezzo è atterrato
                place_piece(&current_piece);  // Place it permanently / Posizionalo permanentemente
                clear_lines();                // Check for completed lines / Controlla linee completate

                if (is_game_over()) {         // Check if game is over / Controlla se il gioco è finito
                    Mix_PlayChannel(-1, sound_gameover, 0);
                    game_over = true;
                } else {
                    spawn_piece(&current_piece);  // Spawn next piece / Genera prossimo pezzo
                }
            }
        }

        // Render everything / Renderizza tutto
        SDL_SetRenderDrawColor(renderer, 30, 30, 30, 255);  // Dark background / Sfondo scuro
        SDL_RenderClear(renderer);

        // Draw game elements / Disegna elementi di gioco
        draw_grid();                    // Fixed blocks / Blocchi fissi
        draw_piece(&current_piece);     // Falling piece / Pezzo in caduta

        // Draw UI text / Disegna testo UI
        char buf[128];
        SDL_Color white = {255,255,255,255};
        snprintf(buf, sizeof(buf), "Score: %d", score);
        render_text(buf, 5, 5, white);
        snprintf(buf, sizeof(buf), "Level: %d", level);
        render_text(buf, 5, 30, white);

        // Draw game state messages / Disegna messaggi stato di gioco
        if (pause_game) {
            render_text("PAUSA (ESC)", WINDOW_WIDTH/2 - 60, WINDOW_HEIGHT/2 - 10, white);
        }
        if (game_over) {
            render_text("GAME OVER", WINDOW_WIDTH/2 - 70, WINDOW_HEIGHT/2 - 40, white);
            render_text("Premi INVIO per ricominciare", WINDOW_WIDTH/2 - 140, WINDOW_HEIGHT/2, white);
        }

        // Present the rendered frame / Presenta il frame renderizzato
        SDL_RenderPresent(renderer);
        SDL_Delay(16);  // ~60 FPS
    }

    // Cleanup and exit / Pulizia ed uscita
    close_SDL();
    return 0;  // Exit successfully / Esci con successo
}
