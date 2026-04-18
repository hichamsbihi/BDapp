# Monde d'Histoires - Application Mobile

Application mobile React Native / Expo permettant de creer des histoires illustrees (bandes dessinees) de maniere interactive et ludique.

## Vue d'ensemble

Application permettant de :
- Creer des histoires personnalisees avec leur heros
- Choisir parmi differents univers (Fantasy, Space, Ocean)
- Generer des pages de bande dessinee avec images et textes
- Lire les histoires dans un viewer premium style "livre illustre"
- Exporter les histoires au format PDF (coute 2 etoiles)
- Consulter leur bibliotheque d'histoires creees

## Technologies

- **Framework** : React Native 0.81.5
- **Plateforme** : Expo SDK 54
- **Navigation** : Expo Router 6.0 (file-based routing)
- **State Management** : Zustand 5.0
- **Language** : TypeScript 5.9
- **Architecture** : Feature-based architecture + Clean Architecture
- **Database** : Supabase (PostgreSQL + PostgREST)
- **PDF Generation** : expo-print + expo-sharing
- **Image Storage** : Supabase Storage
- **Data Fetching** : React hooks + Supabase client

## Structure du projet

```
mobile-app/
├── app/                          # Routes Expo Router (file-based routing)
│   ├── _layout.tsx               # Layout racine (Stack Navigator)
│   ├── (tabs)/                   # Navigation par onglets
│   │   ├── _layout.tsx           # Layout des onglets (Tabs Navigator)
│   │   ├── index.tsx              # Bibliotheque (LibraryScreen)
│   │   └── create.tsx             # Redirection vers creation
│   ├── onboarding/               # Flow onboarding (premiere utilisation)
│   │   ├── _layout.tsx           # Stack Navigator onboarding
│   │   ├── index.tsx              # Ecran de bienvenue
│   │   ├── hero-info.tsx         # Saisie infos heros
│   │   └── avatar-select.tsx     # Selection avatar
│   ├── story/                    # Flow creation d'histoire
│   │   ├── _layout.tsx           # Stack Navigator story
│   │   ├── universe-select.tsx   # Choix univers (depuis Supabase)
│   │   ├── start-select.tsx      # Choix debut histoire (depuis Supabase)
│   │   ├── paragraph.tsx        # Affichage paragraphe
│   │   ├── reader.tsx           # Lecteur d'histoire (Comic Viewer V1)
│   │   └── page.tsx             # Page BD finale
│   └── paywall.tsx               # Modal paywall
│
├── src/
│   ├── features/                 # Logique metier par feature
│   │   ├── onboarding/
│   │   ├── story/
│   │   │   ├── components/
│   │   │   │   ├── ComicPage.tsx          # Page unique (image + texte)
│   │   │   │   ├── ViewerControls.tsx     # Navigation (prev/next)
│   │   │   │   └── ViewerHeader.tsx       # Header overlay transparent
│   │   │   └── screens/
│   │   │       ├── StoryReaderScreen.tsx  # Lecteur premium PagerView
│   │   │       └── ...
│   │   └── library/
│   │       └── screens/
│   │           └── LibraryScreen.tsx      # Bibliotheque avec export PDF
│   │
│   ├── services/                 # Couche acces donnees (Supabase)
│   │   └── storyService.ts       # Fetch universes, starts, paragraphs
│   │
│   ├── hooks/                    # React hooks custom
│   │   ├── useUniverses.ts       # Fetch universes par genre
│   │   └── useStoryStarts.ts     # Fetch debuts d'histoires
│   │
│   ├── shared/                   # Composants UI reutilisables
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Loader.tsx
│   │   ├── NotEnoughStarsModal.tsx
│   │   └── ScreenContainer.tsx
│   │
│   ├── store/                    # State management (Zustand)
│   │   └── index.ts              # Store global
│   │
│   ├── utils/                    # Utilitaires
│   │   ├── pdfGenerator.ts       # Generation PDF (expo-print)
│   │   └── ids.ts                # Generateurs d'ID
│   │
│   ├── constants/                # Constantes applicatives
│   │   └── stars.ts              # Cout en etoiles (PDF_EXPORT_COST = 2)
│   │
│   ├── types/                    # Types TypeScript
│   │   └── index.ts              # HeroProfile, Story, Universe, etc.
│   │
│   ├── lib/                      # Configuration clients
│   │   └── supabase.ts           # Client Supabase
│   │
│   └── assets/                   # Ressources statiques
│       ├── images/
│       └── fonts/
│
├── .env                          # Variables d'environnement
├── package.json
├── tsconfig.json
└── app.json
```

## Architecture

### Feature-Based Architecture

Chaque fonctionnalite est isolee dans son propre dossier avec clean separation :

```
features/story/
├── components/     # UI specifique a la feature
├── screens/        # Ecrans complets
└── index.ts        # Public API de la feature
```

### Couche Service (Data Layer)

Le fichier `src/services/storyService.ts` est le seul endroit qui parle a Supabase.

```typescript
fetchUniversesByAvatar(avatarCharacterName, gender)  // GET /universes?avatar_character_names=cs.{name}
fetchStoryStarts(universeId)        // GET /story_starts?universe_id=eq.x
fetchParagraphForPage(universeId, pageNumber)  // GET /story_paragraphs
fetchChoicesForPage(universeId, pageNumber)    // GET /narrative_choices
```

Pattern : Les lignes Supabase (snake_case) sont converties en types app (camelCase) via des mappers.

### State Management (Zustand)

Store global gerant :

```typescript
- heroProfile: HeroProfile | null
- currentStory: Partial<Story> | null
- stories: Story[]                      // Histoires sauvegardees
- stars: number                         // Economie d'etoiles
- canAfford(amount): boolean
- spendStars(amount): boolean
```

### Navigation (Expo Router)

Routing base sur les fichiers avec layouts imbriques :

1. **Layout racine** (`app/_layout.tsx`) : Stack Navigator
2. **Onglets** (`app/(tabs)/_layout.tsx`) : Tabs Navigator
3. **Onboarding** (`app/onboarding/_layout.tsx`) : Stack sequentiel
4. **Story** (`app/story/_layout.tsx`) : Stack avec Comic Viewer

## Comic Viewer V1

Le lecteur d'histoires a ete completement refondu pour une experience premium.

### Composants

- **ComicPage** : Page unique avec image (55% hauteur) + paragraphe en italique
- **ViewerControls** : Navigation prev/next + indicateur "Page X / Y"
- **ViewerHeader** : Header overlay semi-transparent (75% opacity)

### Technologies

- **react-native-pager-view** : Swipe horizontal fluide
- **react-native-reanimated** : Animations (deja installe)
- **ScrollView** : Defilement du texte long dans chaque page
- **React.memo** : Optimisation memoization pour eviter les re-renders

### Design

- Fond chaud `#FFFCF5` (parchment)
- Typographie Georgia-like, 17px, italique, centre
- Images avec coins arrondis et ombre legere
- Toggle header au tap sur la page

## Export PDF

### Fonctionnement

L'export PDF coute **2 etoiles** et utilise :

1. **expo-print** : Genere le PDF a partir de HTML/CSS
2. **expo-file-system** : Renomme le fichier avec le titre de l'histoire
3. **expo-sharing** : Ouvre le dialogue de partage natif

### Message de partage

Sur iOS : Le message "Decouvre cette histoire magique creee avec MangaKids..." accompagne le PDF.

Sur Android : Le message apparait dans le titre du dialogue de partage.

### Integration LibraryScreen

```typescript
if (!canAfford(PDF_EXPORT_COST)) {
  showNotEnoughStarsModal();
} else {
  spendStars(2);
  await exportAndSharePdf(story);
}
```

## Economie d'Etoiles (Stars)

Systeme de monnaie narrative :

| Action | Cout/Gain |
|--------|-----------|
| Export PDF | -2 etoiles |
| Generer image | -1 etoile |
| Debloquer univers | -3 etoiles |
| Regarder magie | +? etoiles |
| Completer histoire | +? etoiles |

## Flow utilisateur

### Premiere utilisation (Onboarding)

```
1. WelcomeScreen
   ↓
2. HeroInfoScreen (prenom, age, genre)
   ↓
3. AvatarSelectScreen (4 avatars)
   ↓
4. UniverseSelectScreen
```

### Creation d'histoire (Data dynamique Supabase)

```
1. UniverseSelectScreen
   - Fetch /universes depuis Supabase
   ↓
2. StartSelectScreen
   - Fetch /story_starts?universe_id=...
   ↓
3. ParagraphScreen
   - Affichage du texte personnalise
   ↓
4. GeneratingScreen
   - Animation de generation
   ↓
5. PageScreen
   - Affichage page BD (image + texte)
```

### Lecture d'histoire

```
LibraryScreen → StoryReaderScreen (/story/reader)
                 ↓
                 PagerView avec ComicPage
                 Swipe horizontal entre pages
                 Header toggleable (transparent)
                 Controls bottom (prev/next)
```

### Export PDF

```
LibraryScreen → Modal actions → "Creer le livre PDF (2 etoiles)"
                 ↓
                 Check canAfford(2)
                 ↓
                 Generer PDF (expo-print)
                 ↓
                 Renommer fichier (expo-file-system)
                 ↓
                 Partager (expo-sharing)
```

## Installation et demarrage

### Prerequis

- Node.js 20.19.4+
- npm ou yarn
- Expo CLI (optionnel, peut utiliser npx)

### Variables d'environnement

Creer un fichier `.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

### Installation

```bash
# Installer les dependances
npm install

# Démarrer le serveur de developpement
npx expo start

# Démarrer avec cache vide
npx expo start --clear
```

### Commandes disponibles

```bash
npm start          # Démarrer Expo dev server
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS
```

## Base de donnees (Supabase)

### Tables principales

| Table | Description |
|-------|-------------|
| `universes` | Univers disponibles (Fantasy, Space, Ocean) |
| `story_starts` | Debuts d'histoires par univers |
| `story_paragraphs` | Paragraphes avec image_url et page_number |
| `narrative_choices` | Choix narratifs par page |

### Relations

```
universes (1) ───< story_starts (N)
universes (1) ───< story_paragraphs (N)
story_paragraphs (1) ───< narrative_choices (N)
```

## Composants UI partages

Tous les composants reutilisables sont dans `src/shared/` :

- **Button** : Bouton avec variants (primary, secondary, outline)
- **Modal** : Modal avec overlay et fermeture
- **Loader** : Indicateur de chargement
- **ScreenContainer** : Container de base pour tous les ecrans
- **StarsBadge** : Affichage du nombre d'etoiles
- **NotEnoughStarsModal** : Modal "pas assez d'etoiles"

## Navigation programmatique

```typescript
import { router } from 'expo-router';

// Navigation simple
router.push('/story/universe-select');

// Remplacement (pas de retour)
router.replace('/onboarding');

// Retour
router.back();
```

## Routes disponibles

| Route | Ecran | Description |
|-------|-------|-------------|
| `/` ou `/(tabs)` | LibraryScreen | Bibliotheque avec export PDF |
| `/(tabs)/create` | Redirection | Redirige vers creation |
| `/onboarding` | WelcomeScreen | Ecran de bienvenue |
| `/onboarding/hero-info` | HeroInfoScreen | Saisie infos heros |
| `/onboarding/avatar-select` | AvatarSelectScreen | Choix avatar |
| `/story/universe-select` | UniverseSelectScreen | Choix univers (Supabase) |
| `/story/start-select` | StartSelectScreen | Choix debut histoire (Supabase) |
| `/story/paragraph` | ParagraphScreen | Affichage paragraphe |
| `/story/reader` | StoryReaderScreen | Lecteur Comic Viewer V1 |
| `/story/page` | PageScreen | Page BD finale |
| `/paywall` | PaywallScreen | Modal paywall |

## Fonctionnalites implementees

- [x] Onboarding complet (Hero, Avatar)
- [x] Selection univers dynamique (Supabase)
- [x] Selection debut histoire dynamique (Supabase)
- [x] Comic Viewer V1 (PagerView + ComicPage)
- [x] Export PDF avec nom de fichier personnalise
- [x] Systeme d'etoiles (economie narrative)
- [x] Bibliotheque d'histoires persistante
- [x] Header overlay transparent
- [x] Numerotation des pages dans le PDF
- [x] Message de partage magique

## Ameliorations futures (V2)

- [ ] Zoom pinch sur les images (react-native-gesture-handler)
- [ ] Mode paysage
- [ ] Couverture generee par IA
- [ ] Mode lecture nocturne (fond sombre)
- [ ] Audio narration
- [ ] Partage direct sur reseaux sociaux
- [ ] Edition d'histoires existantes
- [ ] Multi-pages interactives avec choix

## Principes de developpement

### KISS (Keep It Simple, Stupid)
- Code simple et lisible
- Pas de sur-ingenierie
- MVP first

### DRY (Don't Repeat Yourself)
- Composants reutilisables dans `src/shared/`
- Logique metier isolee dans `src/services/`
- Hooks custom pour la logique reutilisable

### YAGNI (You Aren't Gonna Need It)
- Pas de fonctionnalites non necessaires
- Code minimal et fonctionnel
- Focus sur le MVP

## Licence

Private project

---

**Note** : Cette application utilise Supabase pour la persistance des donnees. Les univers et debuts d'histoires sont recuperes dynamiquement depuis la base de donnees. L'export PDF utilise expo-print et expo-sharing pour une generation client-side.
