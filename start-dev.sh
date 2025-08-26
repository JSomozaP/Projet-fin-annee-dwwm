#!/bin/bash

# 🚀 Script de Démarrage Rapide - Streamyscovery
# Ce script restaure les vraies clés API et démarre l'application

echo "🔐 Streamyscovery - Démarrage avec vraies clés API"
echo "=================================================="

# Vérification de l'existence des fichiers de clés
if [ ! -f "backend/.env.local" ]; then
    echo "❌ Erreur: backend/.env.local introuvable!"
    echo "📖 Consultez SECURITY_KEYS.md pour la configuration"
    exit 1
fi

if [ ! -f "frontend/src/environments/environment.local.ts" ]; then
    echo "❌ Erreur: frontend/src/environments/environment.local.ts introuvable!"
    echo "📖 Consultez SECURITY_KEYS.md pour la configuration"
    exit 1
fi

echo "✅ Fichiers de clés trouvés"

# Restauration des clés backend
echo "🔄 Restauration des clés backend..."
cp backend/.env.local backend/.env
echo "✅ Clés backend restaurées"

# Restauration des clés frontend
echo "🔄 Restauration des clés frontend..."
cp frontend/src/environments/environment.local.ts frontend/src/environments/environment.ts
echo "✅ Clés frontend restaurées"

echo ""
echo "🎉 Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Démarrez le backend: cd backend && npm start"
echo "2. Démarrez le frontend: cd frontend && ng serve"
echo ""
echo "🌐 URLs de l'application:"
echo "- Frontend: http://localhost:4200"
echo "- Backend API: http://localhost:3000"
echo ""
echo "⚠️  Rappel: Les vraies clés sont maintenant actives en local"
echo "   Ne committez jamais les fichiers .env et environment.ts"
