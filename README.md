# Monde d'Histoires (MangaKids)

Application mobile permettant aux enfants de créer des histoires illustrées (bandes dessinées) de manière interactive. Backend Supabase, workflows n8n pour la génération de contenu.

## Vue d'ensemble

- **Création d'histoires** : choix d'univers, début d'histoire, paragraphes et choix narratifs (données Supabase).
- **Lecteur** : viewer type livre illustré (PagerView), export PDF.
- **Onboarding** : prénom, âge, genre, avatar (stockage local puis sync au compte).
- **Authentification** : email / mot de passe (Supabase Auth), profil et données synchronisées.
- **Économie d'étoiles** : déblocage d'univers, export PDF, récompenses (histoire terminée, magie, etc.).

## Structure du dépôt

```
AppBD/
├── mobile-app/          # Application React Native (Expo)
│   ├── app/             # Routes Expo Router
│   ├── src/             # features, services, store, shared, hooks, utils
│   ├── lib/             # Client Supabase
│   └── supabase/        # Migrations SQL (profiles, universes, stories, etc.)
├── n8n/                 # Workflows d'automatisation
│   └── workflows/       # generate-manga-story.json, etc.
└── README.md
```

- **mobile-app** : app principale (Expo SDK 54, React Native, TypeScript, Zustand, Expo Router).
- **n8n** : génération d'histoires (LLM), images (Gemini), insertion Supabase.
- **Supabase** : PostgreSQL, Auth, Storage, RLS ; migrations dans `mobile-app/supabase/migrations/`.

## Démarrage rapide

### Prérequis

- Node.js 20+
- Compte Supabase (projet + URL + anon key)

### Installation

```bash
cd mobile-app
npm install
```

### Variables d'environnement

Créer `mobile-app/.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

### Lancer l'app

```bash
cd mobile-app
npx expo start
```

Puis ouvrir sur simulateur/device (i / a dans le terminal, ou scan QR avec Expo Go).

### Base de données

Appliquer les migrations Supabase depuis `mobile-app/supabase/migrations/` (ordre numérique : 001, 002, …). Tables principales : `profiles`, `universes`, `story_starts`, `story_paragraphs`, `narrative_choices`, `avatars`, `user_created_stories`, `user_story_progress`.

Désactiver « Confirm email » dans Supabase (Authentication > Email) si la création de compte sans vérification email est souhaitée.

## Mode développement

En `__DEV__`, au chargement de l'app :

- AsyncStorage est vidé.
- Le store Zustand est réinitialisé (`resetStoreForSignOut`).
- La session Supabase est déconnectée.

Chaque rechargement repart comme un nouvel utilisateur (onboarding).

## Documentation détaillée

- **Application mobile** : [mobile-app/README.md](mobile-app/README.md) (architecture, flows, composants, routes).
- **Authentification** : [mobile-app/docs/AUTH.md](mobile-app/docs/AUTH.md) (Supabase Auth, profil, persistance).

## Technologies principales

| Domaine        | Stack |
|----------------|--------|
| Mobile         | React Native, Expo SDK 54, TypeScript, Expo Router, Zustand |
| Backend / Data | Supabase (PostgreSQL, Auth, Storage, PostgREST) |
| PDF            | expo-print, expo-file-system, expo-sharing |
| UI / Animations| react-native-reanimated, Lottie, expo-linear-gradient |
| Automatisation | n8n (workflows dans `n8n/workflows/`) |

## Licence

Projet privé.
