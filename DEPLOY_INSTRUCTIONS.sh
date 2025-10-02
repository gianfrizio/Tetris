#!/bin/bash
# ISTRUZIONI RAPIDE - DEPLOY TETRIS SU VERCEL
# QUICK INSTRUCTIONS - DEPLOY TETRIS ON VERCEL

echo "🎯 ISTRUZIONI RAPIDE PER IL DEPLOY"
echo "🎯 QUICK DEPLOYMENT INSTRUCTIONS"
echo ""

echo "1️⃣ INSTALLA EMSCRIPTEN (solo la prima volta):"
echo "   git clone https://github.com/emscripten-core/emsdk.git"
echo "   cd emsdk"
echo "   ./emsdk install latest && ./emsdk activate latest"
echo "   source ./emsdk_env.sh"
echo ""

echo "2️⃣ COMPILA IL GIOCO:"
echo "   cd /home/gianfrizio/Tetris"
echo "   ./build_wasm.sh"
echo ""

echo "3️⃣ TESTA LOCALMENTE:"
echo "   cd web && python3 -m http.server 8000"
echo "   Apri: http://localhost:8000/tetris.html"
echo ""

echo "4️⃣ PUBBLICA SU VERCEL:"
echo "   vercel --prod"
echo "   (oppure collega il repository su vercel.com)"
echo ""
echo "🌐 IL GIOCO SARÀ DISPONIBILE DIRETTAMENTE ALLA HOMEPAGE!"
echo "   https://tuo-sito.vercel.app → gioco inizia subito"
echo ""

echo "📋 FILE IMPORTANTI CREATI:"
echo "   ✅ tetris_web.cpp    (codice modificato per web)"
echo "   ✅ build_wasm.sh     (script di compilazione)"
echo "   ✅ vercel.json       (config deployment)"
echo "   ✅ README_VERCEL_IT.md (guida completa)"
echo ""

echo "🎮 Controlli di gioco:"
echo "   ⭐ Frecce = movimento"
echo "   ⭐ ESC = pausa"
echo "   ⭐ INVIO = ricomincia (dopo game over)"