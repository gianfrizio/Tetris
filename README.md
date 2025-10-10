# Tetris Game Collection

Un clone del classico gioco Tetris implementato sia in **C** che in **C++** usando SDL2.

## 🎮 Versioni Disponibili

### Tetris C (Originale)
- **File:** `tetris_web.cpp`
- **Eseguibile:** `tetris`
- **Compilazione:** `make`
- **Esecuzione:** `make run` o `./tetris`

### Compilazione C++

Per compilare la versione C++:
# 🎮 Tetris WebAssembly

Un'implementazione moderna del classico gioco Tetris in C++ compilata per il web usando Emscripten e WebAssembly.

![Tetris Demo](https://img.shields.io/badge/Status-Ready%20to%20Play-brightgreen)
![WebAssembly](https://img.shields.io/badge/WebAssembly-Enabled-blue)
![Mobile](https://img.shields.io/badge/Mobile-Optimized-orange)
![C++](https://img.shields.io/badge/C%2B%2B-SDL2-red)

## ✨ Caratteristiche

### 🎯 Gameplay Classico
- **Tetromini autentici** con fisica realistica
- **Sistema di punteggio** progressivo con livelli
- **Audio coinvolgente** con musica di sottofondo ed effetti sonori
- **Animazioni fluide** a 60 FPS

### 🌐 Tecnologie Web Moderne
- **WebAssembly (WASM)** per performance native nel browser
- **SDL2** per grafica, audio e input cross-platform
- **Emscripten** per la compilazione da C++ a WebAssembly
- **Design responsive** ottimizzato per tutti i dispositivi

### 📱 Supporto Mobile Completo
- **Controlli touch nativi**: tap per ruotare, swipe per muovere
- **Interface adaptive** per schermi piccoli
- **Istruzioni visive** specifiche per mobile
- **Performance ottimizzate** per dispositivi touch

### 🎨 Interface Personalizzata
- **Schermata di avvio** professionale con pulsante GIOCA
- **Loading animato** con indicatori di progresso
- **Design moderno** con gradiente e effetti di luce
- **Controlli visibili** con istruzioni chiare

## 🚀 Demo Live

**Gioca subito:** [Tetris Web Demo]t(https://tetris-pi-mocha.vercel.app/)

## 📋 Controlli

### 🖥️ Desktop
| Tasto | Azione |
|-------|--------|
| `←` `→` | Movimento laterale |
| `↑` | Rotazione pezzo |
| `↓` | Caduta veloce |
| `ESC` | Menù Pausa |
| `INVIO` | Ricomincia |

### 📱 Mobile/Touch
| Gesto | Azione |
|-------|--------|
| **Tap** | Rotazione pezzo |
| **Swipe ←/→** | Movimento laterale |
| **Swipe ↓** | Caduta veloce |
| **Tieni premuto** | Menù Pausa |

## 🛠️ Installazione e Sviluppo

### Prerequisiti
- **Emscripten SDK** (versione 3.0+)
- **Python 3** per server di sviluppo
- **Git** per version control

### Setup Rapido

```bash
# 1. Clona il repository
git clone https://github.com/gianfrizio/Tetris.git
cd Tetris

# 2. Installa Emscripten (se non già installato)
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ..

# 3. Compila il gioco
chmod +x build_wasm.sh
./build_wasm.sh

# 4. Avvia server locale
cd web
python3 -m http.server 8000

# 5. Apri nel browser
# http://localhost:8000
```

## 📁 Struttura del Progetto

```
Tetris/
├── 🎮 CODICE SORGENTE
│  └── tetris_web.cpp        # Versione WebAssembly
│
├── 🔧 BUILD & DEPLOY
│   ├── build_wasm.sh         # Script compilazione Emscripten
│   ├── Makefile              # Build nativo C++
│   └── vercel.json           # Configurazione Vercel
│
├── 🌐 WEB ASSETS
    ├── index.html                # Pagina principale 
    |
    ├── css/                      # Moduli CSS 
    │       ├── reset.css                 # Reset e stili base
    │       ├── animations.css            # Animazioni e keyframes
    │       ├── header.css                # Header e titolo
    │       ├── layout.css                # Layout principale
    │       ├── panels.css                # Pannelli stats e info
    │       ├── canvas.css                # Stili canvas
    │       ├── controls.css              # Controlli e pulsanti
    │       ├── menus.css                 # Menu (start, pause, game over)
    │       ├── mobile.css                # Stili mobile-specific
    │       └── responsive.css            # Media queries
    │
    ├── js/                       # Moduli JavaScript 
    │       ├── dom-elements.js           # Riferimenti DOM
    │       ├── emscripten-setup.js       # Setup WebAssembly Module
    │       ├── game-start.js             # Logica avvio gioco
    │       ├── stats-updater.js          # Aggiornamento statistiche
    │       ├── ui-manager.js             # Gestione UI e layout
    │       ├── keyboard-controls.js      # Controlli tastiera
    │       ├── game-over.js              # Gestione game over
    │       ├── touch-controls.js         # Controlli touch mobile
    │       ├── audio-controls.js         # Controlli audio
    │       ├── pause-system.js           # Sistema pausa
    │       └── init.js                   # Inizializzazione
    │
    ├── audio/                        # Effetti sonori e musica
    ├── tetris.html                   # Crea Canvas e Loader WebAssembly di tetris.js
    ├── tetris.js                     # Loader WebAssembly di tetris.wasm e tetris.data 
    ├── tetris.wasm                   # Engine di gioco compilato
    ├── tetris.data                   # Asset di gioco 
    ├── favicon.svg                   # Icona del sito
    ├──.gitignore                     # File esclusi dal caricamento su github
    └── README.md                     # Questo file
```

## 🏗️ Architettura Tecnica

### Core Engine (C++)
- **Classe TetrisGame**: Gestione stato principale
- **Sistema Tetromini**: 7 forme classiche con rotazioni
- **Game Loop**: Aggiornamento logica e rendering
- **Input Manager**: Keyboard e touch unificati

### WebAssembly Layer
- **Emscripten Bridge**: Comunicazione JavaScript ↔ C++
- **Asset Loading**: Precaricamento audio/font
- **Main Loop**: Integrazione con requestAnimationFrame del browser
- **Memory Management**: Ottimizzazione garbage collection

### Frontend Interface
- **Progressive Loading**: Caricamento asincrono assets
- **Touch Detection**: Auto-switch controlli desktop/mobile  
- **Responsive Design**: CSS Grid e Flexbox
- **Visual Feedback**: Animazioni CSS3 e transizioni

## 🎯 Moduli CSS

Ogni file CSS è dedicato a uno specifico aspetto dell'interfaccia:

- **reset.css** - Reset CSS e stili base del body
- **animations.css** - Tutte le animazioni (@keyframes) e particelle
- **header.css** - Stili per header, titolo e sottotitolo
- **layout.css** - Layout principale del gioco e wrapper
- **panels.css** - Pannelli delle statistiche e informazioni
- **canvas.css** - Stili per il canvas del gioco
- **controls.css** - Pulsanti e controlli desktop
- **menus.css** - Schermate di menu (start, pause, game over)
- **mobile.css** - Stili specifici per dispositivi mobili
- **responsive.css** - Media queries e design responsivo

## 🎯 Moduli JavaScript

Ogni file JS gestisce una funzionalità specifica:

- **dom-elements.js** - Riferimenti agli elementi DOM
- **emscripten-setup.js** - Configurazione del Module WebAssembly
- **game-start.js** - Gestione avvio e caricamento del gioco
- **stats-updater.js** - Aggiornamento delle statistiche in tempo reale
- **ui-manager.js** - Gestione UI, layout e dimensioni canvas
- **keyboard-controls.js** - Gestione input da tastiera
- **game-over.js** - Logica schermata game over e record
- **touch-controls.js** - Controlli touch e swipe per mobile
- **audio-controls.js** - Gestione volume, mute e audio in background
- **pause-system.js** - Sistema di pausa e visibility API
- **init.js** - Inizializzazione dell'applicazione

## 🚀 Deploy su Vercel

### Deploy Automatico
```bash
# 1. Installa Vercel CLI
npm i -g vercel

# 2. Login (una sola volta)
vercel login

# 3. Deploy
vercel --prod
```

### Deploy Manuale
1. Comprimi la cartella `web/` in un file ZIP
2. Vai su [vercel.com](https://vercel.com) 
3. Drag & drop il file ZIP
4. Il gioco sarà online in pochi secondi!

## 🎨 Personalizzazione

### Colori Tetromini
Modifica i colori in `tetris_web.cpp`:
```cpp
const std::array<Color, 7> tetromino_colors {{
    Color(0, 255, 255),   // I - Ciano
    Color(0, 0, 255),     // J - Blu  
    Color(255, 165, 0),   // L - Arancione
    // ... altri colori
}};
```

### Audio
Sostituisci i file in `audio/`:
- `music/music.ogg` - Musica di sottofondo
- `sounds/*.wav` - Effetti sonori

### Interfaccia
Modifica `web/tetris_custom.html` per personalizzare:
- Colori e gradienti CSS
- Layout responsive
- Testi e localizzazione

## 🤝 Contribuire

1. **Fork** il repository
2. **Crea** un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. **Apri** una Pull Request

## 📊 Performance

- **Dimensione WASM**: ~500KB (compressa)
- **Tempo caricamento**: < 2 secondi
- **Frame rate**: 60 FPS costanti
- **Memoria**: ~16MB utilizzati
- **Compatibilità**: Tutti i browser moderni

## 🐛 Troubleshooting

### Il gioco non si carica
```bash
# Verifica che Emscripten sia attivo
emcc --version

# Ricompila da zero
rm -rf web/tetris.*
./build_wasm.sh
```

### Errori audio su mobile
- Alcuni browser richiedono interazione utente prima di riprodurre audio
- Il pulsante GIOCA risolve automaticamente questo problema

### Performance su dispositivi lenti
- Il gioco si adatta automaticamente riducendo gli effetti grafici
- Considera di disabilitare la musica nelle impostazioni del browser

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 🙏 Riconoscimenti

- **SDL2** - Simple DirectMedia Layer per il multimedia cross-platform
- **Emscripten** - Toolchain per compilare C/C++ in WebAssembly  
- **Tetris** - Il gioco puzzle iconico creato da Alexey Pajitnov
- **Community** - Tutti i contribuenti open source che hanno reso possibile questo progetto

---

**Creato con ❤️ da [Gianfrizio](https://github.com/gianfrizio)**

*Se ti piace questo progetto, lascia una ⭐ su GitHub!*

O manualmente:
```bash
g++ -std=c++14 tetris.cpp -o tetris++ -lSDL2 -lSDL2_mixer -lSDL2_ttf
```

## 🔧 Dipendenze

- SDL2
- SDL2_ttf
- SDL2_mixer
- Font DejaVu Sans Bold

### Installazione Ubuntu/Debian:
```bash
sudo apt-get install libsdl2-dev libsdl2-ttf-dev libsdl2-mixer-dev fonts-dejavu
```

## 🎯 Controlli

| Tasto | Azione |
|-------|--------|
| ← → | Muovi pezzo a sinistra/destra |
| ↑ | Ruota pezzo |
| ↓ | Accelera caduta |
| ESC | Pausa/Riprendi |
| INVIO | Ricomincia (dopo game over) |

## 🎵 Caratteristiche

- ✅ 7 tipi di tetromini classici
- ✅ Sistema di punteggio e livelli
- ✅ Effetti sonori e musica di sottofondo
- ✅ Pausa e restart
- ✅ Accelerazione progressiva
- ✅ Interfaccia grafica SDL2

## 📁 Struttura

```
Tetris/
├── tetris_web.cpp    # Versione C++ moderna
├── Makefile.cpp      # Build system per C++
├── README.md         # Questo file
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

### Versione C:
```bash
make clean && make
./tetris
```

### Versione C++:
```bash
make -f Makefile.cpp clean && make -f Makefile.cpp
./tetris++
```

## 🎨 Differenze tra le Versioni

| Caratteristica | C | C++ |
|---------------|---|-----|
| Paradigma | Procedurale | Orientato agli oggetti |
| Gestione memoria | Manuale | Smart pointers |
| Sicurezza tipo | Básica | Migliorata con template |
| Codice | Classico | Moderno C++14 |
| Performance | Ottima | Ottima |
| Compatibilità | Universale | Richiede C++14+ |

Entrambe le versioni offrono la stessa esperienza di gioco!

## 🛠️ Compilazione Avanzata

### Opzioni di Build
```bash
# Versione C con debug
make CFLAGS="-g -O0 -DDEBUG"

# Versione C++ con ottimizzazioni aggressive
make -f Makefile.cpp CXXFLAGS="-O3 -march=native"

# Pulizia completa
make clean && make -f Makefile.cpp clean
```

### Troubleshooting
**Problema:** Font non trovato
```bash
# Soluzione: installa i font necessari
sudo apt-get install fonts-dejavu-core
```

**Problema:** SDL2 non trovato
```bash
# Soluzione: installa le librerie di sviluppo
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

## 🔍 Dettagli Tecnici

### Architettura C
- **Pattern:** Programmazione procedurale
- **Gestione stato:** Variabili globali
- **Rendering:** SDL2 immediato
- **Audio:** Mix_Chunk e Mix_Music

### Architettura C++
- **Pattern:** Orientato agli oggetti
- **Gestione stato:** Classe TetrisGame
- **Rendering:** Metodi incapsulati
- **Audio:** Smart pointers per RAII

### Performance
- **FPS:** 60 FPS con VSync
- **Latenza input:** < 16ms
- **Memoria:** ~2MB RAM
- **CPU:** Minimal usage

## 🧪 Testing

### Test Manuali
```bash
# Test versione C
./tetris
# Verifica: movimento, rotazione, audio, pausa

# Test versione C++  
./tetris++
# Verifica: stessa funzionalità con OOP
```

### Profiling
```bash
# Performance profiling con valgrind
valgrind --tool=callgrind ./tetris
valgrind --tool=callgrind ./tetris++
```

## 📜 Licenza

Questo progetto è rilasciato sotto licenza MIT. Sentiti libero di usarlo, modificarlo e distribuirlo.

## 🤝 Contributi

Contributi benvenuti! Sentiti libero di:
- 🐛 Segnalare bug
- 💡 Proporre nuove funzionalità  
- 🔧 Inviare pull request
- 📖 Migliorare la documentazione

## 📞 Contatti

**Autore:** Gianfrizio  
**Repository:** https://github.com/gianfrizio/Tetris

---

*"Il Tetris perfetto esiste, ma come un sogno che svanisce non appena credi di averlo raggiunto"* 🎮