# 📚 Monde d'Histoires - Application Mobile

Application mobile React Native / Expo permettant aux enfants de créer des histoires illustrées (bandes dessinées) de manière interactive et ludique.

## 🎯 Vue d'ensemble

Application destinée aux enfants permettant de :
- Créer des histoires personnalisées avec leur héros
- Choisir parmi différents univers (Fantasy, Space, Ocean)
- Générer des pages de bande dessinée avec images et textes
- Consulter leur bibliothèque d'histoires créées

## 🛠️ Technologies

- **Framework** : React Native 0.81.5
- **Plateforme** : Expo SDK 54
- **Navigation** : Expo Router 6.0 (file-based routing)
- **State Management** : Zustand 5.0
- **Language** : TypeScript 5.9
- **Architecture** : Feature-based architecture

## 📁 Structure du projet

```
mobile-app/
├── app/                          # Routes Expo Router (file-based routing)
│   ├── _layout.tsx               # Layout racine (Stack Navigator)
│   ├── (tabs)/                   # Navigation par onglets
│   │   ├── _layout.tsx           # Layout des onglets (Tabs Navigator)
│   │   ├── index.tsx              # Bibliothèque (LibraryScreen)
│   │   └── create.tsx             # Redirection vers création
│   ├── onboarding/               # Flow onboarding (première utilisation)
│   │   ├── _layout.tsx           # Stack Navigator onboarding
│   │   ├── index.tsx              # Écran de bienvenue
│   │   ├── hero-info.tsx         # Saisie infos héros
│   │   └── avatar-select.tsx     # Sélection avatar
│   ├── story/                    # Flow création d'histoire
│   │   ├── _layout.tsx           # Stack Navigator story
│   │   ├── universe-select.tsx   # Choix univers
│   │   ├── start-select.tsx      # Choix début histoire
│   │   ├── paragraph.tsx        # Affichage paragraphe
│   │   ├── generating.tsx       # Écran génération (mock)
│   │   └── page.tsx             # Page BD finale
│   └── paywall.tsx               # Modal paywall
│
├── src/
│   ├── features/                 # Logique métier par feature
│   │   ├── onboarding/           # Feature onboarding
│   │   │   └── screens/
│   │   │       ├── WelcomeScreen.tsx
│   │   │       ├── HeroInfoScreen.tsx
│   │   │       └── AvatarSelectScreen.tsx
│   │   ├── story/                # Feature création histoire
│   │   │   └── screens/
│   │   │       ├── UniverseSelectScreen.tsx
│   │   │       ├── StartSelectScreen.tsx
│   │   │       ├── ParagraphScreen.tsx
│   │   │       ├── GeneratingScreen.tsx
│   │   │       └── PageScreen.tsx
│   │   ├── library/              # Feature bibliothèque
│   │   │   └── screens/
│   │   │       └── LibraryScreen.tsx
│   │   └── paywall/              # Feature paywall
│   │       └── screens/
│   │           └── PaywallScreen.tsx
│   │
│   ├── shared/                   # Composants UI réutilisables
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Loader.tsx
│   │   ├── Card.tsx
│   │   └── ScreenContainer.tsx
│   │
│   ├── store/                    # State management (Zustand)
│   │   └── index.ts              # Store global
│   │
│   ├── data/                     # Données mock
│   │   ├── avatars.ts            # 4 avatars disponibles
│   │   ├── universes.ts          # 3 univers + 6 débuts d'histoires
│   │   └── mockStories.ts        # Stories exemple
│   │
│   ├── types/                    # Types TypeScript
│   │   └── index.ts
│   │
│   └── assets/                   # Ressources statiques
│       ├── images/
│       └── fonts/
│
├── package.json
├── tsconfig.json                 # Configuration TypeScript + alias
└── app.json                      # Configuration Expo
```

## 🏗️ Architecture

### Feature-Based Architecture

L'application suit une architecture orientée feature où chaque fonctionnalité est isolée dans son propre dossier :

- **onboarding** : Gestion du premier lancement (Welcome → Hero Info → Avatar)
- **story** : Création d'histoires (Universe → Start → Paragraph → Generating → Page)
- **library** : Bibliothèque des histoires créées
- **paywall** : Gestion de la monétisation (mock)

### State Management (Zustand)

Store global dans `src/store/index.ts` gérant :

```typescript
- heroProfile: HeroProfile | null      // Profil héros (nom, âge, genre, avatar)
- currentStory: Partial<Story> | null  // Histoire en cours de création
- stories: Story[]                      // Bibliothèque d'histoires
- isPremium: boolean                    // Statut premium
- hasCompletedOnboarding: boolean       // Flag onboarding complété
```

### Navigation (Expo Router)

Système de routing basé sur les fichiers :

1. **Layout racine** (`app/_layout.tsx`) : Stack Navigator principal
2. **Onglets** (`app/(tabs)/_layout.tsx`) : Tabs Navigator (Bibliothèque / Nouvelle)
3. **Onboarding** (`app/onboarding/_layout.tsx`) : Stack séquentiel
4. **Story** (`app/story/_layout.tsx`) : Stack séquentiel avec headers

## 🔄 Flow utilisateur

### Première utilisation (Onboarding)

```
1. WelcomeScreen
   ↓
2. HeroInfoScreen
   - Saisie prénom
   - Saisie âge (1-12)
   - Sélection genre (👦/👧)
   ↓
3. AvatarSelectScreen
   - Choix parmi 4 avatars
   ↓
4. UniverseSelectScreen (début création première histoire)
```

### Création d'histoire

```
1. UniverseSelectScreen
   - Choix parmi 3 univers (🏰 Fantasy, 🚀 Space, 🌊 Ocean)
   ↓
2. StartSelectScreen
   - Choix parmi 2 débuts d'histoires par univers
   ↓
3. ParagraphScreen
   - Affichage du paragraphe avec texte personnalisé
   ↓
4. GeneratingScreen
   - Animation de génération (mock, 4 secondes)
   ↓
5. PageScreen
   - Affichage page BD finale (image + texte)
   - Options : Sauvegarder / Continuer l'histoire
```

### Bibliothèque

- Affichage des histoires créées sous forme de cartes
- Limite gratuite : 1 histoire (paywall après)
- Modal d'options : Voir / Supprimer

## 🚀 Installation et démarrage

### Prérequis

- Node.js 20.19.4+ (recommandé)
- npm ou yarn
- Expo CLI (installé globalement ou via npx)

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start
# ou
npx expo start

# Démarrer avec cache vidé (si problèmes)
npx expo start --clear
```

### Commandes disponibles

```bash
npm start          # Démarrer Expo dev server
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS
npm run web        # Lancer sur Web
```

## 📝 Principes de développement

### KISS (Keep It Simple, Stupid)
- Code simple et lisible
- Pas de sur-ingénierie
- MVP first

### DRY (Don't Repeat Yourself)
- Composants réutilisables dans `src/shared/`
- Logique métier isolée par feature
- Pas de duplication de code

### YAGNI (You Aren't Gonna Need It)
- Pas de fonctionnalités non nécessaires
- Code minimal et fonctionnel
- Focus sur le MVP

## 🎨 Composants UI partagés

Tous les composants réutilisables sont dans `src/shared/` :

- **Button** : Bouton avec variants (primary, secondary, outline)
- **Modal** : Modal avec overlay et fermeture
- **Loader** : Indicateur de chargement
- **Card** : Carte pour afficher du contenu
- **ScreenContainer** : Container de base pour tous les écrans

## 📊 Données mock

### Avatars
- 4 avatars disponibles (Luna, Max, Stella, Leo)
- Identifiés par couleur et initiale

### Univers
- **Royaume Magique** (Fantasy) : 🏰
- **Aventure Spatiale** (Space) : 🚀
- **Monde Sous-Marin** (Ocean) : 🌊

### Débuts d'histoires
- 2 débuts par univers (6 au total)
- Textes pré-écrits personnalisables avec le nom du héros

## 🔐 Monétisation (Mock)

- **Limite gratuite** : 1 histoire
- **Paywall** : Affiché après limite atteinte
- **Premium** : Flag `isPremium` dans le store (local uniquement)
- **Fonctionnalités premium** : Histoires illimitées (à implémenter)

## 🧭 Navigation programmatique

```typescript
import { router } from 'expo-router';

// Navigation simple
router.push('/story/universe-select');

// Remplacement (pas de retour)
router.replace('/onboarding');

// Retour
router.back();
```

## 📱 Routes disponibles

| Route | Écran | Description |
|-------|-------|-------------|
| `/` ou `/(tabs)` | LibraryScreen | Bibliothèque des histoires |
| `/(tabs)/create` | Redirection | Redirige vers création |
| `/onboarding` | WelcomeScreen | Écran de bienvenue |
| `/onboarding/hero-info` | HeroInfoScreen | Saisie infos héros |
| `/onboarding/avatar-select` | AvatarSelectScreen | Choix avatar |
| `/story/universe-select` | UniverseSelectScreen | Choix univers |
| `/story/start-select` | StartSelectScreen | Choix début histoire |
| `/story/paragraph` | ParagraphScreen | Affichage paragraphe |
| `/story/generating` | GeneratingScreen | Génération (mock) |
| `/story/page` | PageScreen | Page BD finale |
| `/paywall` | PaywallScreen | Modal paywall |

## 🎯 Prochaines étapes (TODO)

- [ ] Intégration API pour génération d'images IA
- [ ] Persistance des données (AsyncStorage)
- [ ] Système de paiement réel
- [ ] Partage d'histoires
- [ ] Édition d'histoires existantes
- [ ] Multi-pages par histoire
- [ ] Export PDF des histoires

## 📄 Licence

Private project

---

**Note** : Cette application est en phase MVP. Les fonctionnalités de génération d'images et de paiement sont actuellement mockées.
