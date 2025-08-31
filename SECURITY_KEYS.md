# 🔐 Guide de Sécurité - Configuration des Clés API

## ⚠️ IMPORTANT : Sécurité des Clés API

Ce projet utilise des services externes qui nécessitent des clés API sensibles. Pour des raisons de sécurité, **les vraies clés ne sont jamais committées sur GitHub**.

## 📁 Structure des Fichiers de Configuration

```
projet-fin-annee/
├── backend/
│   ├── .env                    # Placeholders (committé sur GitHub)
│   ├── .env.local             # Vraies clés (NON committé, local uniquement)
│   └── .env.example           # Template de configuration
├── frontend/src/environments/
│   ├── environment.ts         # Placeholders (committé sur GitHub)
│   ├── environment.local.ts   # Vraies clés (NON committé, local uniquement)
│   └── environment.example.ts # Template de configuration
```

## 🚀 Configuration pour le Développement Local

### ⚡ Démarrage Rapide (Méthode Recommandée)

Si vous avez déjà les fichiers `.local` configurés :

```bash
# Backend - Restaurer les vraies clés et démarrer
cd backend/
cp .env.local .env
npm start

# Frontend - Restaurer les vraies clés et démarrer (nouveau terminal)
cd frontend/src/environments/
cp environment.local.ts environment.ts
cd ../../..
ng serve
```

### 📝 Configuration Manuelle (Première Installation)

### 1. Backend (Node.js/Express)

1. **Copiez le fichier avec les vraies clés** :
   ```bash
   cd backend/
   cp .env.local .env
   ```

2. **Ou configurez manuellement** votre fichier `.env` :
   ```env
   # Configuration JWT
   JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

   # Configuration Stripe (Clés de test)
   STRIPE_SECRET_KEY=sk_test_VOTRE_VRAIE_CLE_SECRETE_STRIPE
   STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_VRAIE_CLE_PUBLIQUE_STRIPE
   STRIPE_WEBHOOK_SECRET=whsec_VOTRE_VRAIE_CLE_WEBHOOK_STRIPE

   # Configuration Twitch API
   TWITCH_CLIENT_ID=VOTRE_VRAI_CLIENT_ID_TWITCH
   TWITCH_CLIENT_SECRET=VOTRE_VRAI_CLIENT_SECRET_TWITCH
   ```

### 2. Frontend (Angular)

1. **Copiez le fichier avec les vraies clés** :
   ```bash
   cd frontend/src/environments/
   cp environment.local.ts environment.ts
   ```

2. **Ou configurez manuellement** votre fichier `environment.ts` :
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api',
     twitchClientId: 'VOTRE_VRAI_CLIENT_ID_TWITCH',
     twitchRedirectUri: 'http://localhost:4201/auth/callback',
     stripePublishableKey: 'pk_test_VOTRE_VRAIE_CLE_PUBLIQUE_STRIPE'
   };
   ```

## 🔑 Obtention des Clés API

### Stripe (Paiements)
1. Créez un compte sur [stripe.com](https://stripe.com)
2. Accédez au dashboard développeur
3. Récupérez vos clés de test :
   - Clé publique : `pk_test_...`
   - Clé secrète : `sk_test_...`
4. Configurez les webhooks et récupérez : `whsec_...`

### Twitch API (Authentification)
1. Créez une application sur [dev.twitch.tv](https://dev.twitch.tv/console)
2. Configurez l'URL de redirection : `http://localhost:4201/auth/callback`
3. Récupérez :
   - Client ID
   - Client Secret

### JWT Secret
Générez une clé forte pour signer les tokens JWT :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🛡️ Bonnes Pratiques de Sécurité

### ✅ À FAIRE
- ✅ Utilisez des clés de test en développement
- ✅ Gardez les fichiers `.env.local` et `environment.local.ts` en local uniquement
- ✅ Utilisez des clés de production différentes pour le déploiement
- ✅ Régénérez toutes les clés si elles sont compromises
- ✅ Vérifiez que `.gitignore` exclut bien les fichiers sensibles

### ❌ À NE JAMAIS FAIRE
- ❌ Committer des vraies clés sur GitHub
- ❌ Partager vos clés par email/chat
- ❌ Utiliser des clés de production en développement
- ❌ Laisser des clés dans les logs ou fichiers temporaires

## 🔍 Vérification de Sécurité

Avant chaque commit, vérifiez :

```bash
# Vérifiez qu'aucune vraie clé n'est présente
git diff --cached | grep -E "sk_test_|pk_test_|whsec_|[a-f0-9]{40,}"

# Vérifiez le statut des fichiers sensibles
git status | grep -E "\.env$|environment\.ts$"
```

## 🚨 En cas de Fuite de Clés

Si des clés sensibles ont été accidentellement committées :

1. **Révocation immédiate** :
   - Stripe : Révoquez les clés dans le dashboard
   - Twitch : Régénérez les clés de l'application

2. **Nettoyage de l'historique Git** :
   ```bash
   # Supprimez les clés de l'historique (ATTENTION : Réécrit l'historique)
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch backend/.env' --prune-empty --tag-name-filter cat -- --all
   ```

3. **Nouvelles clés** : Générez de nouvelles clés et configurez-les

## 📞 Support

En cas de problème avec la configuration des clés :
1. Vérifiez les fichiers `.env.local` et `environment.local.ts`
2. Consultez les logs d'erreur pour identifier la clé manquante
3. Assurez-vous que toutes les clés sont valides et actives

---

**⚠️ Rappel Important** : Ce fichier peut être committé car il ne contient aucune vraie clé, seulement des instructions et des exemples de placeholders.
