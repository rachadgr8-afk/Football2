# 🚀 Déploiement — FOOTBALL CINEMATIC AI (backend Render)

Ce backend regroupe **toutes** les routes API utilisées par le frontend, y compris
les 6 routes de rendu FFmpeg qui manquaient sur le service actuel :

| Route | Méthode | Rôle |
|---|---|---|
| `/api/health` | GET | Health check (utilisé par Render) |
| `/api/presets` | GET | Clips football + styles prédéfinis |
| `/api/upload-video` | POST | Upload d'une vidéo (multipart `video`) |
| `/api/test-render-1` | POST | Test FFmpeg : crop 5 s en 9:16 (1080×1920) |
| `/api/test-render-2` | POST | Test FFmpeg : ralenti 0.7× + zoom 10 % |
| `/api/test-render-3` | POST | Test FFmpeg : incrustation de texte |
| `/api/render-full-cinematic` | POST | Rendu complet 64 s (crop, zoom, texte, concat) |
| `/api/render-progress` | GET | Progression du rendu en temps réel |
| `/api/analyze-video` | POST | Plan de montage 64 s via Gemini |
| `/api/qc-review` | POST | Contrôle qualité Gemini |
| `/api/analyze-reference` | POST | Extraction d'un profil de style |
| `/api/generate-veo-shot` | POST | Génération de plans Veo 3.1 |
| `/api/video-status` | POST | Statut d'une opération Veo |
| `/api/video-download` | POST | Téléchargement d'un plan Veo |

> **CORS** : un middleware global renvoie `Access-Control-Allow-Origin: *` sur
> toutes les routes (avec réponse automatique aux requêtes `OPTIONS` de préflight).

> **Sources distantes** : le moteur accepte soit un `localPath` (fichier local),
> soit un `sourceUrl` / `videoUrl` (http/https). Dans ce dernier cas, la vidéo est
> téléchargée automatiquement puis mise en cache avant le rendu.

---

## Option A — Déploiement via Docker (recommandé)

Le runtime Node « natif » de Render **ne contient pas FFmpeg**. Le `Dockerfile`
fourni installe FFmpeg, construit le client et bundle le serveur.

### 1. Pousser le code sur GitHub

```bash
git add .
git commit -m "Add full FFmpeg rendering backend + CORS"
git push origin main
```

### 2. Créer le service sur Render

1. Tableau de bord Render → **New** → **Blueprint**.
2. Connecter le dépôt GitHub : Render lit `render.yaml` et provisionne le service.
3. (Alternative manuelle) **New** → **Web Service** → Runtime **Docker**,
   `Dockerfile Path = ./Dockerfile`, `Health Check Path = /api/health`.

### 3. Variables d'environnement

| Clé | Valeur | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Déjà défini dans `render.yaml` |
| `PORT` | `10000` | Render injecte automatiquement le port |
| `GEMINI_API_KEY` | *(votre clé)* | **Secret** — obligatoire pour les routes IA |
| `APP_URL` | `https://fotbal-1.onrender.com` | URL publique du service |

⚠️ **Ne committez jamais** `GEMINI_API_KEY`. Saisissez-la dans
**Dashboard → Environment → Add Environment Variable (Secret)**.

### 4. Vérifier

```bash
curl https://fotbal-1.onrender.com/api/health
# => {"status":"ok","service":"FOOTBALL CINEMATIC AI","ffmpeg":true, ...}
```

---

## Option B — Déploiement sans Docker (limité)

Si vous déployez en runtime Node natif, FFmpeg doit être disponible. Vous pouvez
tenter une installation au build via un script `postinstall`, mais cela dépend du
support des paquets système par la plateforme. **Docker est fortement conseillé.**

---

## Bonnes pratiques

- **Cold start** : sur le plan gratuit, le premier appel après inactivité peut
  prendre ~30 s (réveil du service).
- **Persistance** : `public/videos` est écrit sur le disque du conteneur
  (éphémère). Pour un stockage durable, montez un disque Render ou utilisez un
  bucket (S3/GCS).
- **Quotas FFmpeg** : le rendu 64 s est gourmand en CPU ; le plan gratuit peut
  être lent. Prévoyez un plan supérieur pour un usage intensif.
- **Taille d'upload** : limitée à 500 Mo par vidéo (`multer`).

## Build local (test rapide)

```bash
npm install --legacy-peer-deps
npm run build          # génère dist/ + server.js
NODE_ENV=production node server.js
# http://localhost:10000
```
