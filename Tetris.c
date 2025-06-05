// tetris.c
#include <SDL.h>
#include <SDL_mixer.h>
#include <stdbool.h>
#include <stdio.h>

#define WINDOW_WIDTH 400
#define WINDOW_HEIGHT 600
#define BLOCK_SIZE 30

SDL_Window *window = NULL;
SDL_Renderer *renderer = NULL;
Mix_Chunk sound_rotate = NULL;
Mix_Chunk *sound_clear = NULL;
Mix_Chunk *sound_gameover = NULL;
Mix_Chunk *sound_move = NULL;
Mix_Music *music = NULL;

bool init_SDL() {
    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO) < 0) {
        printf("SDL Init Error: %s\n", SDL_GetError());
        return false;
    }

    window = SDL_CreateWindow("Tetris", WINDOW_WIDTH, WINDOW_HEIGHT, SDL_WINDOW_RESIZABLE);
    if (!window) {
        printf("Window creation failed: %s\n", SDL_GetError());
        return false;
    }

    renderer = SDL_CreateRenderer(window, NULL);
    if (!renderer) {
        printf("Renderer creation failed: %s\n", SDL_GetError());
        return false;
    }

    if (Mix_OpenAudio(44100, SDL_AUDIO_S16, 2, 2048) < 0) {
        printf("SDL_mixer could not initialize! SDL_mixer Error: %s\n", Mix_GetError());
        return false;
    }

    return true;
}

bool load_audio() {
    sound_rotate = Mix_LoadWAV("audio/rotate.wav");
    sound_clear = Mix_LoadWAV("audio/clear.wav");
    sound_gameover = Mix_LoadWAV("audio/gameover.wav");
    sound_move = Mix_LoadWAV("audio/move.wav");
    music = Mix_LoadMUS("audio/music.ogg");

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
    sound_rotate = sound_clear = sound_gameover = sound_move = NULL;
    music = NULL;

    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    renderer = NULL;
    window = NULL;

    Mix_Quit();
    SDL_Quit();
}

void draw_block(int x, int y, SDL_Color color) {
    SDL_Rect block = {x, y, BLOCK_SIZE, BLOCK_SIZE};
    SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, 255);
    SDL_RenderFillRect(renderer, &block);
    SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
    SDL_RenderDrawRect(renderer, &block);
}

int main(int argc, char *argv[]) {
    if (!init_SDL() || !load_audio()) {
        close_SDL();
        return 1;
    }

    Mix_PlayMusic(music, -1);  // play background music on loop

    bool running = true;
    SDL_Event e;

    while (running) {
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_EVENT_QUIT) {
                running = false;
            } else if (e.type == SDL_EVENT_KEY_DOWN) {
                switch (e.key.keysym.sym) {
                    case SDLK_SPACE:
                        Mix_PlayChannel(-1, sound_clear, 0);
                        break;
                    case SDLK_LEFT:
                        Mix_PlayChannel(-1, sound_move, 0);
                        break;
                    case SDLK_RIGHT:
                        Mix_PlayChannel(-1, sound_move, 0);
                        break;
                    case SDLK_DOWN:
                        Mix_PlayChannel(-1, sound_move, 0);
                        break;
                    case SDLK_UP:
                        Mix_PlayChannel(-1, sound_rotate, 0);
                        break;
                    case SDLK_ESCAPE:
                        running = false;
                        break;
                }
            }
        }

        SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
        SDL_RenderClear(renderer);

        draw_block(100, 100, (SDL_Color){255, 0, 0});

        SDL_RenderPresent(renderer);
        SDL_Delay(16);
    }

    Mix_PlayChannel(-1, sound_gameover, 0);
    SDL_Delay(2000);

    close_SDL();
    return 0;
}