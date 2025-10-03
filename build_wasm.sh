#!/bin/bash
# Script per compilare Tetris a WebAssembly usando Emscripten
# Build script to compile Tetris to WebAssembly using Emscripten

set -e  # Exit on error / Esci in caso di errore

echo "🎮 Compilazione Tetris per il Web con Emscripten..."
echo "🎮 Compiling Tetris for the Web with Emscripten..."

# Attiva Emscripten dall'installazione in home / Activate Emscripten from home installation
if [ -f "/home/gianfrizio/emsdk/emsdk_env.sh" ]; then
    echo "🔧 Attivando Emscripten..."
    echo "🔧 Activating Emscripten..."
    source /home/gianfrizio/emsdk/emsdk_env.sh
elif [ -f "/home/gianfrizio/emscripten/emsdk_env.sh" ]; then
    echo "🔧 Attivando Emscripten..."
    echo "🔧 Activating Emscripten..."
    source /home/gianfrizio/emscripten/emsdk_env.sh
else
    echo "❌ Errore: Emscripten non trovato in /home/gianfrizio/"
    echo "❌ Error: Emscripten not found in /home/gianfrizio/"
    echo "   Verifica che emsdk sia installato e prova con:"
    echo "   Check that emsdk is installed and try with:"
    echo "   source /home/gianfrizio/emsdk/emsdk_env.sh"
    exit 1
fi

# Controlla se emcc è ora disponibile / Check if emcc is now available
if ! command -v emcc &> /dev/null; then
    echo "❌ Errore: emcc non disponibile dopo l'attivazione"
    echo "❌ Error: emcc not available after activation"
    exit 1
fi

# Crea cartella web se non esiste / Create web folder if it doesn't exist
mkdir -p web

# Copia asset nella cartella web / Copy assets to web folder
echo "📁 Copiando asset audio nella cartella web..."
echo "📁 Copying audio assets to web folder..."
cp -r audio web/

# Copia font di sistema per il gioco / Copy system font for the game
if [ -f "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" ]; then
    cp "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" web/audio/font.ttf
    echo "✅ Font copiato / Font copied"
else
    echo "⚠️  Font di sistema non trovato - il gioco potrebbe non mostrare testo"
    echo "⚠️  System font not found - game might not display text"
fi

# Compila tetris.cpp a WebAssembly / Compile tetris.cpp to WebAssembly
echo "🔨 Compilando tetris_web.cpp a WebAssembly..."
echo "🔨 Compiling tetris_web.cpp to WebAssembly..."

em++ tetris_web.cpp \
    -s USE_SDL=2 \
    -s USE_SDL_TTF=2 \
    -s USE_SDL_MIXER=2 \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=33554432 \
    -s EXPORTED_FUNCTIONS='["_main", "_startTetrisGame", "_restartTetrisGame", "_getScore", "_getLevel", "_getLines", "_isGameRunning", "_isGamePaused"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
    --preload-file web/audio@audio \
    --use-preload-plugins \
    -O2 \
    -o web/tetris.html

# Crea index.html che reindirizza al gioco / Create index.html that redirects to the game
echo "🔗 Creando homepage redirect..."
echo "🔗 Creating homepage redirect..."
cat > web/index.html << 'EOF'
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tetris - Gioca Ora!</title>
    <meta http-equiv="refresh" content="0; url=tetris.html">
    <style>
        body { 
            font-family: system-ui, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0; 
            background: #1a1a1a; 
            color: white; 
        }
        .loading { text-align: center; }
        .spinner { 
            border: 4px solid #333; 
            border-top: 4px solid #fff; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 20px; 
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        a { color: #4CAF50; text-decoration: none; }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <h2>🎮 Caricamento Tetris...</h2>
        <p>Se non vieni reindirizzato automaticamente, <a href="tetris.html">clicca qui</a></p>
    </div>
    
    <script>
        // Reindirizzamento immediato per JavaScript abilitato
        window.location.href = 'tetris.html';
    </script>
</body>
</html>
EOF

echo "✅ Compilazione completata!"
echo "✅ Compilation completed!"
echo ""
echo "🚀 Per testare localmente / To test locally:"
echo "   cd web && python3 -m http.server 8000"
echo "   Poi apri / Then open: http://localhost:8000/tetris.html"
echo ""
echo "🌐 Per pubblicare su Vercel / To deploy on Vercel:"
echo "   vercel --prod"