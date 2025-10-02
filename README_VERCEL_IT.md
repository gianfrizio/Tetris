# Come pubblicare il gioco su Vercel (istruzioni in italiano)

Questo repository contiene un gioco Tetris implementato in C/C++ usando SDL2 per grafica, audio e input. Vercel è una piattaforma pensata per siti web statici o applicazioni Node/Edge; non esegue binari nativi. Per pubblicare su Vercel puoi seguire due strade realizzabili:

Opzione A — Compilare il gioco in WebAssembly (WASM) con Emscripten (consigliata) ✅ SCRIPT PRONTO

Ho già preparato tutto per te! Nel repository trovi:
- `tetris_web.cpp` — versione modificata con percorsi relativi per gli asset
- `build_wasm.sh` — script automatico per la compilazione
- `vercel.json` — configurazione per il deploy

**Passi da seguire:**

1. **Installa Emscripten** (una volta sola):
```bash
# Clona emsdk
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Installa l'ultima versione
./emsdk install latest
./emsdk activate latest

# Attiva nell'ambiente corrente
source ./emsdk_env.sh
```

2. **Compila il gioco** (dal tuo repository):
```bash
cd /path/to/Tetris
./build_wasm.sh
```

Lo script:
- Copia automaticamente gli asset audio nella cartella `web/`
- Copia il font di sistema necessario per il testo
- Compila `tetris_web.cpp` a WebAssembly con tutti i flag ottimizzati
- Genera `web/tetris.html`, `web/tetris.js`, `web/tetris.wasm`

3. **Testa localmente**:
```bash
cd web
python3 -m http.server 8000
# Apri http://localhost:8000/tetris.html
```

4. **Pubblica su Vercel**:
```bash
npm i -g vercel   # installa CLI (opzionale)
vercel --prod
```

Oppure collega il repository su vercel.com e fai deploy automatico.

**🎯 Il gioco sarà disponibile direttamente alla homepage del tuo sito Vercel!**
- Visita `https://tuo-sito.vercel.app` → gioco inizia immediatamente
- La configurazione reindirizza automaticamente alla pagina del gioco

**Note tecniche:**
- Ho già modificato tutti i percorsi assoluti (`/home/user/...`) in percorsi relativi (`audio/...`)
- Il flag `--preload-file web/audio@audio` include automaticamente tutti gli asset nel WASM
- Emscripten supporta SDL2, SDL_mixer, SDL_ttf nativamente per il web

Opzione B — Portare la logica a JavaScript/HTML5 (canvas)

1. Estrarre la logica di gioco (gestione tetromini, griglia, collisioni) e riscriverla in JS usando un canvas. Questa è la strada più lunga ma offre la massima compatibilità.

2. Crea una semplice pagina `web/index.html` (esempio già incluso) che carica `main.js` e gli asset nella cartella `audio/`.

3. Deploy su Vercel (stesso `vercel.json`) con `vercel --prod`.

Suggerimenti e passaggi di verifica locale

- Per testare i file statici localmente puoi usare `python3 -m http.server 8000` dentro la cartella `web` e aprire http://localhost:8000
- Controlla che tutti gli asset siano referenziati con percorsi relativi (es. `audio/sounds/move.wav`) e inclusi nella cartella `web` o in una sottocartella servita.

Se vuoi, posso provare a:

- Preparare uno script di esempio `emcc` per compilare il progetto (analizzo `tetris.c` e segnalo quali parti richiedono modifiche).
- Scrivere una versione JS minima del motore di gioco e una pagina di esempio pronta per il deploy.

Dimmi quale opzione preferisci (A: Emscripten -> WASM o B: porting JS/HTML5) e procedo con i passi successivi in italiano.
