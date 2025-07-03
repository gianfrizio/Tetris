#include <SDL2/SDL.h>
#include <SDL2/SDL_ttf.h>      // aggiunto per testo
#include <SDL2/SDL_mixer.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define WINDOW_WIDTH 400
#define GRID_WIDTH 10
#define BLOCK_SIZE (WINDOW_WIDTH / GRID_WIDTH) // 40 px blocchi
#define GRID_OFFSET_X 0
#define GRID_HEIGHT 20
#define WINDOW_HEIGHT (GRID_HEIGHT * BLOCK_SIZE)  // 800 px

// Tetromini 7 forme, 4 rotazioni, 4x4 blocchi
static const int tetromino_shapes[7][4][16] = {
    {
        {0,0,0,0,
         1,1,1,1,
         0,0,0,0,
         0,0,0,0},
        {0,0,1,0,
         0,0,1,0,
         0,0,1,0,
         0,0,1,0},
        {0,0,0,0,
         1,1,1,1,
         0,0,0,0,
         0,0,0,0},
        {0,0,1,0,
         0,0,1,0,
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

static const SDL_Color tetromino_colors[7] = {
    {0,255,255,255},
    {0,0,255,255},
    {255,165,0,255},
    {255,255,0,255},
    {0,255,0,255},
    {128,0,128,255},
    {255,0,0,255}
};

int grid[GRID_HEIGHT][GRID_WIDTH] = {0};

typedef struct {
    int x, y;
    int type;
    int rotation;
} Piece;

Piece current_piece;

SDL_Window *window = NULL;
SDL_Renderer *renderer = NULL;
TTF_Font *font = NULL;  // per testo
Mix_Chunk *sound_rotate = NULL;
Mix_Chunk *sound_clear = NULL;
Mix_Chunk *sound_gameover = NULL;
Mix_Chunk *sound_move = NULL;
Mix_Music *music = NULL;

bool pause_game = false;
bool game_over = false;
int score = 0;
int level = 1;
int lines_cleared_total = 0;

// Funzioni inizializzazione, caricamento, chiusura SDL e audio
bool init_SDL() {
    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO) < 0) {
        printf("SDL Init Error: %s\n", SDL_GetError());
        return false;
    }
    if (TTF_Init() == -1) {
        printf("TTF Init Error: %s\n", TTF_GetError());
        return false;
    }
    window = SDL_CreateWindow("Tetris", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
                              WINDOW_WIDTH, WINDOW_HEIGHT, SDL_WINDOW_SHOWN);
    if (!window) {
        printf("Window creation failed: %s\n", SDL_GetError());
        return false;
    }
    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_SOFTWARE);
    if (!renderer) {
        printf("Renderer creation failed: %s\n", SDL_GetError());
        return false;
    }
    if (Mix_OpenAudio(44100, AUDIO_S16SYS, 2, 2048) < 0) {
        printf("SDL_mixer could not initialize! SDL_mixer Error: %s\n", Mix_GetError());
        return false;
    }
    return true;
}

bool load_audio() {
    sound_rotate = Mix_LoadWAV("/home/gianfrizio/Tetris/audio/sounds/rotate.wav");
    sound_clear = Mix_LoadWAV("/home/gianfrizio/Tetris/audio/sounds/clear.wav");
    sound_gameover = Mix_LoadWAV("/home/gianfrizio/Tetris/audio/sounds/gameover.wav");
    sound_move = Mix_LoadWAV("/home/gianfrizio/Tetris/audio/sounds/move.wav");
    music = Mix_LoadMUS("/home/gianfrizio/Tetris/audio/music/music.ogg");
    if (!sound_rotate || !sound_clear || !sound_gameover || !sound_move || !music) {
        printf("Failed to load sound effects or music! SDL_mixer Error: %s\n", Mix_GetError());
        return false;
    }
    return true;
}

void close_SDL() {
    Mix_FreeChunk(sound_rotate);
    Mix_FreeChunk(sound_clear);
    Mix_FreeChunk(sound_gameover);
    Mix_FreeChunk(sound_move);
    Mix_FreeMusic(music);
    if(font) TTF_CloseFont(font);
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    TTF_Quit();
    Mix_Quit();
    SDL_Quit();
}

// Funzione per disegnare un blocco colorato
void draw_block(int x, int y, SDL_Color color) {
    SDL_Rect block = {GRID_OFFSET_X + x, y, BLOCK_SIZE, BLOCK_SIZE};
    SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, color.a);
    SDL_RenderFillRect(renderer, &block);
    SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
    SDL_RenderDrawRect(renderer, &block);
}

// Controllo collisioni
bool check_collision(Piece *p, int new_x, int new_y, int new_rot) {
    const int *shape = tetromino_shapes[p->type][new_rot];
    for (int i = 0; i < 16; i++) {
        int px = i % 4;
        int py = i / 4;
        if (shape[i]) {
            int gx = new_x + px;
            int gy = new_y + py;
            if (gy < 0) continue;
            if (gx < 0 || gx >= GRID_WIDTH || gy >= GRID_HEIGHT) return true;
            if (grid[gy][gx]) return true;
        }
    }
    return false;
}

// Posa pezzo nel grid
void place_piece(Piece *p) {
    const int *shape = tetromino_shapes[p->type][p->rotation];
    for (int i = 0; i < 16; i++) {
        int px = i % 4;
        int py = i / 4;
        if (shape[i]) {
            int gx = p->x + px;
            int gy = p->y + py;
            if (gy >= 0 && gy < GRID_HEIGHT && gx >= 0 && gx < GRID_WIDTH) {
                grid[gy][gx] = p->type + 1;
            }
        }
    }
}

// Cancella linee piene e aggiorna punteggio e livello
void clear_lines() {
    int lines_cleared = 0;
    for (int y = GRID_HEIGHT - 1; y >= 0; y--) {
        bool full = true;
        for (int x = 0; x < GRID_WIDTH; x++) {
            if (grid[y][x] == 0) {
                full = false;
                break;
            }
        }
        if (full) {
            lines_cleared++;
            for (int row = y; row > 0; row--) {
                for (int col = 0; col < GRID_WIDTH; col++) {
                    grid[row][col] = grid[row-1][col];
                }
            }
            for (int col = 0; col < GRID_WIDTH; col++) {
                grid[0][col] = 0;
            }
            y++;
        }
    }
    if (lines_cleared > 0) {
        Mix_PlayChannel(-1, sound_clear, 0);
        score += lines_cleared * 100 * level;  // punteggio
        lines_cleared_total += lines_cleared;
        // Aumenta livello ogni 10 linee totali
        if ((lines_cleared_total / 10) + 1 > level) {
            level = (lines_cleared_total / 10) + 1;
        }
    }
}

// Spawn nuovo pezzo
void spawn_piece(Piece *p) {
    p->type = rand() % 7;
    p->rotation = 0;
    p->x = GRID_WIDTH / 2 - 2;
    p->y = -2;
}

// Disegna la griglia con blocchi già posizionati
void draw_grid() {
    for (int y = 0; y < GRID_HEIGHT; y++) {
        for (int x = 0; x < GRID_WIDTH; x++) {
            int cell = grid[y][x];
            if (cell) {
                draw_block(x * BLOCK_SIZE, y * BLOCK_SIZE, tetromino_colors[cell - 1]);
            }
        }
    }
}

// Disegna pezzo corrente
void draw_piece(Piece *p) {
    const int *shape = tetromino_shapes[p->type][p->rotation];
    SDL_Color color = tetromino_colors[p->type];
    for (int i = 0; i < 16; i++) {
        int px = i % 4;
        int py = i / 4;
        if (shape[i]) {
            int gx = p->x + px;
            int gy = p->y + py;
            if (gy >= 0) {
                draw_block(gx * BLOCK_SIZE, gy * BLOCK_SIZE, color);
            }
        }
    }
}

// Controlla game over
bool is_game_over() {
    for (int x = 0; x < GRID_WIDTH; x++) {
        if (grid[0][x] != 0) {
            return true;
        }
    }
    return false;
}

// Render testo semplice
void render_text(const char* text, int x, int y, SDL_Color color) {
    SDL_Surface* surface = TTF_RenderText_Blended(font, text, color);
    if (!surface) {
        printf("TTF Render Error: %s\n", TTF_GetError());
        return;
    }
    SDL_Texture* texture = SDL_CreateTextureFromSurface(renderer, surface);
    SDL_Rect dst = {x, y, surface->w, surface->h};
    SDL_FreeSurface(surface);
    SDL_RenderCopy(renderer, texture, NULL, &dst);
    SDL_DestroyTexture(texture);
}

int main(int argc __attribute__((unused)), char *argv[] __attribute__((unused))) {

    srand((unsigned int)time(NULL));
    if (!init_SDL()) {
        printf("Init SDL failed\n");
        return 1;
    }

    font = TTF_OpenFont("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20);
    if (!font) {
        printf("Failed to load font: %s\n", TTF_GetError());
        close_SDL();
        return 1;
    }

    if (!load_audio()) {
        printf("Load audio failed\n");
        close_SDL();
        return 1;
    }

    Mix_PlayMusic(music, -1);

    spawn_piece(&current_piece);

    bool running = true;
    SDL_Event e;
    Uint32 last_tick = SDL_GetTicks();

    while (running) {
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT) {
                running = false;
            } else if (e.type == SDL_KEYDOWN) {
                if (!game_over) {
                    if (e.key.keysym.sym == SDLK_ESCAPE) {
                        pause_game = !pause_game;  // toggle pausa
                    }
                    if (!pause_game) {
                        if (e.key.keysym.sym == SDLK_LEFT) {
                            if (!check_collision(&current_piece, current_piece.x - 1, current_piece.y, current_piece.rotation)) {
                                current_piece.x--;
                                Mix_PlayChannel(-1, sound_move, 0);
                            }
                        } else if (e.key.keysym.sym == SDLK_RIGHT) {
                            if (!check_collision(&current_piece, current_piece.x + 1, current_piece.y, current_piece.rotation)) {
                                current_piece.x++;
                                Mix_PlayChannel(-1, sound_move, 0);
                            }
                        } else if (e.key.keysym.sym == SDLK_UP) {
                            int new_rot = (current_piece.rotation + 1) % 4;
                            if (!check_collision(&current_piece, current_piece.x, current_piece.y, new_rot)) {
                                current_piece.rotation = new_rot;
                                Mix_PlayChannel(-1, sound_rotate, 0);
                            }
                        } else if (e.key.keysym.sym == SDLK_DOWN) {
                            if (!check_collision(&current_piece, current_piece.x, current_piece.y + 1, current_piece.rotation)) {
                                current_piece.y++;
                                Mix_PlayChannel(-1, sound_move, 0);
                            }
                        }
                    }
                } else {
                    // Game over, premi INVIO per restart
                    if (e.key.keysym.sym == SDLK_RETURN) {
                        // reset game
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

        Uint32 now = SDL_GetTicks();
        Uint32 drop_delay = 500 - (level - 1) * 40; // velocità aumenta col livello
        if (drop_delay < 100) drop_delay = 100;

        if (!pause_game && !game_over && (now - last_tick > drop_delay)) {
            last_tick = now;
            if (!check_collision(&current_piece, current_piece.x, current_piece.y + 1, current_piece.rotation)) {
                current_piece.y++;
            } else {
                place_piece(&current_piece);
                clear_lines();

                if (is_game_over()) {
                    Mix_PlayChannel(-1, sound_gameover, 0);
                    game_over = true;
                } else {
                    spawn_piece(&current_piece);
                }
            }
        }

        // Render
        SDL_SetRenderDrawColor(renderer, 30, 30, 30, 255);
        SDL_RenderClear(renderer);

        draw_grid();
        draw_piece(&current_piece);

        // Testo UI
        char buf[128];
        SDL_Color white = {255,255,255,255};
        snprintf(buf, sizeof(buf), "Score: %d", score);
        render_text(buf, 5, 5, white);
        snprintf(buf, sizeof(buf), "Level: %d", level);
        render_text(buf, 5, 30, white);

        if (pause_game) {
            render_text("PAUSA (ESC)", WINDOW_WIDTH/2 - 60, WINDOW_HEIGHT/2 - 10, white);
        }
        if (game_over) {
            render_text("GAME OVER", WINDOW_WIDTH/2 - 70, WINDOW_HEIGHT/2 - 40, white);
            render_text("Premi INVIO per ricominciare", WINDOW_WIDTH/2 - 140, WINDOW_HEIGHT/2, white);
        }

        SDL_RenderPresent(renderer);
        SDL_Delay(16);
    }

    close_SDL();
    return 0;
}
