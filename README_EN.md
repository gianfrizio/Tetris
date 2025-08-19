# Tetris Game Collection

A classic Tetris game clone implemented in both **C** and **C++** using SDL2.

## 🎮 Available Versions

### Tetris C (Original)
- **File:** `tetris.c`
- **Executable:** `tetris`
- **Compilation:** `make`
- **Execution:** `make run` or `./tetris`

### C++ Compilation

To compile the C++ version:
```bash
make -f Makefile.cpp-build
```

Or manually:
```bash
g++ -std=c++14 tetris.cpp -o tetris++ -lSDL2 -lSDL2_mixer -lSDL2_ttf
```

## 🔧 Dependencies

- SDL2
- SDL2_ttf
- SDL2_mixer
- DejaVu Sans Bold Font

### Ubuntu/Debian Installation:
```bash
sudo apt-get install libsdl2-dev libsdl2-ttf-dev libsdl2-mixer-dev fonts-dejavu
```

## 🎯 Controls

| Key | Action |
|-----|--------|
| ← → | Move piece left/right |
| ↑ | Rotate piece |
| ↓ | Accelerate fall |
| ESC | Pause/Resume |
| ENTER | Restart (after game over) |

## 🎵 Features

- ✅ 7 classic tetromino types
- ✅ Score and level system
- ✅ Sound effects and background music
- ✅ Pause and restart functionality
- ✅ Progressive acceleration
- ✅ SDL2 graphical interface

## 📁 Project Structure

```
Tetris/
├── tetris.c          # Original C version
├── tetris.cpp        # Modern C++ version
├── Makefile          # Build system for C
├── Makefile.cpp      # Build system for C++
├── README.md         # This file (Italian)
├── README_EN.md      # This file (English)
└── audio/
    ├── music/
    │   └── music.ogg
    └── sounds/
        ├── clear.wav
        ├── gameover.wav
        ├── move.wav
        └── rotate.wav
```

## 🚀 Quick Start

### C Version:
```bash
make clean && make
./tetris
```

### C++ Version:
```bash
make -f Makefile.cpp clean && make -f Makefile.cpp
./tetris++
```

## 🎨 Version Differences

| Feature | C | C++ |
|---------|---|-----|
| Paradigm | Procedural | Object-oriented |
| Memory Management | Manual | Smart pointers |
| Type Safety | Basic | Enhanced with templates |
| Code Style | Classic | Modern C++14 |
| Performance | Excellent | Excellent |
| Compatibility | Universal | Requires C++14+ |

Both versions offer the same gaming experience!

## 🛠️ Advanced Compilation

### Build Options
```bash
# C version with debug
make CFLAGS="-g -O0 -DDEBUG"

# C++ version with aggressive optimizations
make -f Makefile.cpp CXXFLAGS="-O3 -march=native"

# Complete cleanup
make clean && make -f Makefile.cpp clean
```

### Troubleshooting
**Problem:** Font not found
```bash
# Solution: install required fonts
sudo apt-get install fonts-dejavu-core
```

**Problem:** SDL2 not found
```bash
# Solution: install development libraries
sudo apt-get install libsdl2-dev libsdl2-ttf-dev libsdl2-mixer-dev
```

## 🎪 Screenshots

```
┌─────────────────────────────────────┐
│ Tetris C++ - Score: 1500 Level: 3  │
├─────────────────────────────────────┤
│ ████                                │
│ ██  ██                              │
│ ██████                              │
│ ██████████                          │
│ ██████████████                      │
└─────────────────────────────────────┘
```

## 🔍 Technical Details

### C Architecture
- **Pattern:** Procedural programming
- **State management:** Global variables
- **Rendering:** Immediate SDL2
- **Audio:** Mix_Chunk and Mix_Music

### C++ Architecture
- **Pattern:** Object-oriented
- **State management:** TetrisGame class
- **Rendering:** Encapsulated methods
- **Audio:** Smart pointers for RAII

### Performance
- **FPS:** 60 FPS with VSync
- **Input latency:** < 16ms
- **Memory:** ~2MB RAM
- **CPU:** Minimal usage

## 🧪 Testing

### Manual Tests
```bash
# Test C version
./tetris
# Verify: movement, rotation, audio, pause

# Test C++ version  
./tetris++
# Verify: same functionality with OOP
```

### Profiling
```bash
# Performance profiling with valgrind
valgrind --tool=callgrind ./tetris
valgrind --tool=callgrind ./tetris++
```

## 📜 License

This project is released under the MIT license. Feel free to use, modify and distribute it.

## 🤝 Contributing

Contributions welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest new features  
- 🔧 Submit pull requests
- 📖 Improve documentation

## 📞 Contact

**Author:** Gianfrizio  
**Repository:** https://github.com/gianfrizio/Tetris

---

*"The perfect Tetris exists, but like a dream that vanishes as soon as you think you've achieved it"* 🎮
