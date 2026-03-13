# Prompt test — workflow Generate Manga Story

Trois options : **prompt court linéaire**, **prompt branché (2 choix par étape, convergence)**, ou **JSON prédéfini** pour un test reproductible.

---

## Option 1 — Prompt court linéaire (le LLM génère tout, une seule suite)

Colle dans le chat n8n :

```
Tu es un auteur d'histoires interactives pour enfants (6-10 ans). Génère une histoire de 3 pages au format JSON uniquement, sans texte avant ou après.

Structure obligatoire :
- "universe" : objet avec id, name, description, image_url, color, emoji, gender, display_order
- "story_starts" : tableau d'objets avec id, title, text (au moins 1)
- "pages" : tableau de 3 objets. Chaque page a : universe_id (même id que universe.id), page_number (1, 2, 3), paragraph_text (2-3 phrases), scene_summary (résumé pour l'image), panels (tableau de 1-2 objets avec "description"), choices (tableau d'objets avec id et text ; vide pour la page 3)

Thème : une petite aventure en forêt magique. Personnage : une petite fille de 8 ans. Réponds uniquement par le JSON, pas de markdown.
```

---

## Option 2 — Prompt branché : 2 choix à chaque étape, divergence puis convergence

Chaque étape a **2 choix**. Selon le choix, une **image différente** est générée (chaque paragraphe = une image). Les branches **convergent** vers le même paragraphe final.

Colle dans le chat n8n :

```
Tu es un auteur d'histoires interactives pour enfants (6-10 ans). Génère une histoire **branchée** au format JSON uniquement, sans texte avant ou après.

Règles :
- Utilise "paragraphs" (pas "pages"). Chaque paragraphe a une clé unique "key" et génère une image.
- À chaque étape il y a 2 choix. Chaque choix a "next_key" = la clé du paragraphe suivant.
- Les deux branches du milieu doivent converger vers le même paragraphe final (même "key" pour la fin).

Structure obligatoire :
- "universe" : objet avec id, name, description, image_url, color, emoji, gender, display_order
- "story_starts" : tableau d'objets avec id, title, text (au moins 1)
- "paragraphs" : tableau de paragraphes, chacun avec :
  - "key" : identifiant unique (ex. "start", "branch_a", "branch_b", "end")
  - "universe_id" : même id que universe.id
  - "paragraph_text" : 2-3 phrases
  - "scene_summary" : résumé pour générer l'image
  - "panels" : tableau de 1-2 objets avec "description"
  - "choices" : tableau d'objets avec "id", "text", "next_key" (clé du paragraphe suivant). Vide pour le dernier paragraphe.

Exemple de structure (à adapter en histoire) :
- Paragraphe "start" : 2 choix → next_key "branch_a" et "branch_b"
- Paragraphe "branch_a" : 2 choix → next_key "end" et "end"
- Paragraphe "branch_b" : 2 choix → next_key "end" et "end"
- Paragraphe "end" : pas de choices, fin de l'histoire

Thème : forêt magique, petite fille de 8 ans. Réponds uniquement par le JSON, pas de markdown.
```

---

## Option 3 — JSON prédéfini branché (test reproductible avec convergence)

Envoie au chat la consigne suivante ; le modèle doit renvoyer **exactement** le JSON ci-dessous (tu peux ajouter : « Réponds uniquement par ce JSON, sans modification. »).

Réponds uniquement par ce JSON, sans commentaire ni markdown :

```json
{
  "universe": {
    "id": "test-branch-001",
    "name": "Foret magique",
    "description": "Une foret ou les animaux parlent",
    "image_url": "https://picsum.photos/seed/forest/400/300",
    "color": "#2d5a27",
    "emoji": "🌲",
    "gender": "girl",
    "display_order": 1
  },
  "story_starts": [
    {
      "id": "start-branch-001",
      "title": "Le carrefour enchante",
      "text": "Tu arrives a un carrefour. Deux sentiers s'offrent a toi."
    }
  ],
  "paragraphs": [
    {
      "key": "start",
      "universe_id": "test-branch-001",
      "paragraph_text": "Au carrefour, une petite fille hesite. Un sentier monte vers une colline ensoleillee, l'autre descend vers un ruisseau bruissant.",
      "scene_summary": "Carrefour en foret, deux sentiers, petite fille qui regarde les deux chemins.",
      "panels": [
        { "description": "Vue du carrefour et des deux sentiers" },
        { "description": "La fille au centre, indecise" }
      ],
      "choices": [
        { "id": "choice-start-a", "text": "Prendre le sentier de la colline", "next_key": "branch_a" },
        { "id": "choice-start-b", "text": "Descendre vers le ruisseau", "next_key": "branch_b" }
      ]
    },
    {
      "key": "branch_a",
      "universe_id": "test-branch-001",
      "paragraph_text": "Sur la colline, elle decouvre un vieux moulin a vent. Les ailes tournent doucement. Un ecureuil lui fait signe vers une petite porte.",
      "scene_summary": "Moulin a vent sur la colline, ciel bleu, ecureuil pres de la porte.",
      "panels": [
        { "description": "Moulin a vent et colline" },
        { "description": "Ecureuil devant la porte du moulin" }
      ],
      "choices": [
        { "id": "choice-branch-a-1", "text": "Entrer dans le moulin", "next_key": "end" },
        { "id": "choice-branch-a-2", "text": "Suivre l'ecureuil dehors", "next_key": "end" }
      ]
    },
    {
      "key": "branch_b",
      "universe_id": "test-branch-001",
      "paragraph_text": "Au bord du ruisseau, un vieux pont de pierre enjambe l'eau. Sous le pont, une lueur dorée attire son regard.",
      "scene_summary": "Ruisseau, pont de pierre, reflets dans l'eau, lueur sous le pont.",
      "panels": [
        { "description": "Pont de pierre sur le ruisseau" },
        { "description": "Lueur mysterieuse sous le pont" }
      ],
      "choices": [
        { "id": "choice-branch-b-1", "text": "Traverser le pont", "next_key": "end" },
        { "id": "choice-branch-b-2", "text": "Regarder sous le pont", "next_key": "end" }
      ]
    },
    {
      "key": "end",
      "universe_id": "test-branch-001",
      "paragraph_text": "Quel que soit le chemin, elle arrive devant la meme cabane magique. La porte s'ouvre : un grimoire brille sur la table. Des etincelles s'echappent. Fin de l'aventure.",
      "scene_summary": "Cabane magique, grimoire ouvert sur la table, etincelles dorées.",
      "panels": [
        { "description": "Cabane avec porte ouverte" },
        { "description": "Grimoire et etincelles magiques" }
      ],
      "choices": []
    }
  ]
}
```

Contraintes : utilise exactement les champs ci-dessus. Chaque paragraphe a **key**, **universe_id**, **paragraph_text**, **scene_summary**, **panels**, **choices**. Chaque choix a **id**, **text**, **next_key**. Les branches "branch_a" et "branch_b" convergent vers "end". Renvoie uniquement le JSON, sans markdown ni commentaire.

---

## Comportement du workflow

- **Format `paragraphs`** (branché) : le workflow génère **une image par paragraphe** (fichier `universe_id-key.png`), insère les paragraphes avec `step` et les choix avec `next_paragraph_id` résolu via les clés. Les deux chemins (colline / ruisseau) mènent au même paragraphe "end".
- **Format `pages`** (linéaire) : comportement inchangé, une image par page, `next_paragraph_id` = page suivante pour tous les choix.
