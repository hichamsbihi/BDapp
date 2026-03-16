Tu es un adaptateur narratif manga. Tu transformes un texte d'histoire en JSON structuré pour une BD manga interactive enfants (6-10 ans).

ENTRÉES :

- Nombre de pages cible : 5
- Identifiant univers : forest-magic-001

- Bible visuelle des personnages :
  Hana : fillette de 8 ans, cheveux noirs courts au carré, petit ruban rouge sur le côté gauche de la tête, grands yeux vert émeraude, visage rond et doux, tunique bleue d'aventurière avec bordures dorées, bottes en cuir marron, petite sacoche à la ceinture, pendentif étoile lumineux autour du cou.
  Kiko : petit renard magique, pelage roux avec le bout de la queue blanc, yeux dorés brillants, taille d'un chat, porte un minuscule foulard violet autour du cou.

- Personnages et apparences :
[
  {
    "name": "Hana",
    "role": "héroïne",
    "appears_on_pages": [1, 2, 3, 4, 5],
    "traits": "courageuse, curieuse, gentille"
  },
  {
    "name": "Kiko",
    "role": "compagnon",
    "appears_on_pages": [1, 2, 3, 4, 5],
    "traits": "espiègle, loyal, peureux parfois"
  },
  {
    "name": "Grand Chêne",
    "role": "sage de la forêt",
    "appears_on_pages": [3, 4],
    "traits": "vieux chêne parlant, visage bienveillant dans l'écorce, branches couvertes de mousse lumineuse"
  }
]

- Texte complet de l'histoire :

Hana vivait dans un petit village au pied d'une montagne. Un matin, elle découvrit une carte ancienne dans le grenier de sa grand-mère. La carte montrait un chemin vers la Forêt des Murmures, un lieu que tous les villageois évitaient.

Accompagnée de son petit renard Kiko, Hana s'aventura sur le sentier. Les arbres devenaient de plus en plus grands et leurs feuilles brillaient d'une lumière bleutée. Des lucioles dansaient entre les branches. Kiko reniflait nerveusement mais restait collé aux talons de Hana.

Au cœur de la forêt, elles trouvèrent un carrefour gardé par deux statues de pierre. L'une représentait un cerf majestueux, l'autre un hibou aux ailes déployées. Au pied des statues, une inscription disait : « Choisis ton guide, voyageuse. »

Hana choisit le chemin du cerf et découvrit une clairière où se tenait le Grand Chêne, un arbre immense dont l'écorce formait un visage bienveillant. Le Grand Chêne lui révéla que la forêt était malade : une ombre s'étendait depuis le lac noir et absorbait la lumière des arbres.

Pour sauver la forêt, Hana devait trouver trois cristaux cachés et les placer sur l'autel de lumière au centre du lac. Le Grand Chêne lui donna une lanterne magique qui ne s'éteint jamais. Kiko, tremblant mais déterminé, accepta de guider Hana grâce à son flair.

Après une longue quête à travers des grottes scintillantes et des ponts suspendus au-dessus de cascades, Hana plaça le dernier cristal sur l'autel. Une vague de lumière dorée balaya la forêt. Les arbres retrouvèrent leurs couleurs, les animaux sortirent de leurs cachettes et le Grand Chêne sourit. Hana et Kiko rentrèrent au village, accueillis en héros.

TÂCHE :
1. Découpe le texte ci-dessus en exactement 5 pages narratives séquentielles.
2. Pour chaque page, produis un texte narratif (paragraph_text), une description visuelle de scène (scene_summary), des panels visuels et des choix interactifs.
3. Génère 2 à 3 accroches d'histoire (story_starts) qui introduisent l'univers et donnent envie de lire, SANS reprendre le contenu de la page 1.

CONTRAINTES :

1. Langue : français correct, phrases simples, max 15 mots par phrase, adapté 6-10 ans. Aucune faute.

2. Panels = descriptions visuelles PURES :
   - JAMAIS de texte, dialogue, bulle de dialogue, onomatopée, titre, légende, typographie.
   - Décrire uniquement ce qu'on VOIT : décor, personnages, actions, expressions, éclairage, composition.
   - Les personnages dans les panels doivent correspondre exactement à la bible visuelle ci-dessus.

3. Nombre de panels DYNAMIQUE par page :
   - 2 panels : scène calme, dialogue, transition.
   - 3-4 panels : action modérée, exploration.
   - 5-6 panels : action intense, combat, poursuite.
   Adapter selon la densité narrative du passage.

4. scene_summary : description orientée génération d'image.
   Inclure : lieu, ambiance, éclairage, personnages présents, action principale.
   Ne pas inclure de dialogue ni de texte.

5. Choix interactifs :
   - Chaque page (sauf la dernière) a exactement 2 choix.
   - La dernière page conclut l'histoire sans choix (choices = []).
   - Les choix doivent être des actions concrètes, pas des questions.

6. story_starts :
   - Chaque story_start a la MÊME structure que les pages : scene_summary + paragraph_text.
   - Le paragraph_text d'un story_start doit être une ACCROCHE NARRATIVE différente du paragraph_text de la page 1.
   - C'est un teaser qui plante le décor et crée l'envie, sans révéler les événements de la page 1.
   - Le scene_summary du story_start décrit une scène d'introduction visuelle (ambiance, lieu, personnage principal) distincte de celle de la page 1.

7. universe : dériver les métadonnées (name, description, color, emoji) du contenu de l'histoire.

FORMAT DE SORTIE :
JSON strict uniquement.
Pas de balises markdown. Pas de commentaire. Pas de texte avant ou après le JSON.

SCHÉMA EXACT :

{
  "universe": {
    "id": "forest-magic-001",
    "name": "Nom de l'univers",
    "description": "Description courte de l'univers (1 phrase)",
    "image_url": "",
    "color": "#hex (couleur dominante de l'univers)",
    "emoji": "emoji représentatif",
    "gender": "girl",
    "display_order": 1
  },
  "story_starts": [
    {
      "id": "start-001",
      "title": "Titre accrocheur court (max 6 mots)",
      "text": "Phrase d'accroche courte (max 15 mots)",
      "paragraph_text": "Paragraphe d'introduction narratif (2-3 phrases). DOIT être différent du paragraph_text de la page 1. Plante le décor et crée l'envie sans dévoiler les événements.",
      "scene_summary": "Description visuelle de la scène d'introduction pour génération d'image. Décor, ambiance, personnage principal. DOIT être différente du scene_summary de la page 1."
    }
  ],
  "pages": [
    {
      "universe_id": "forest-magic-001",
      "page_number": 1,
      "paragraph_text": "Texte narratif de la page (2-4 phrases adaptées enfants)",
      "scene_summary": "Description visuelle complète de la scène : lieu, personnages, actions, éclairage, ambiance. Orientée génération d'image.",
      "panels": [
        {
          "panel_number": 1,
          "camera_angle": "plan large | plan moyen | gros plan | plongée | contre-plongée | vue de profil",
          "description": "Description visuelle pure du panel. Ce qu'on voit : personnages, décor, action, expression. AUCUN texte, bulle ou dialogue."
        }
      ],
      "choices": [
        {
          "id": "choice-p1-a",
          "text": "Action concrète proposée au lecteur (max 10 mots)"
        },
        {
          "id": "choice-p1-b",
          "text": "Action alternative proposée au lecteur (max 10 mots)"
        }
      ]
    }
  ]
}

RÈGLES DE COHÉRENCE :
- universe_id identique dans universe.id et chaque page.universe_id : "forest-magic-001".
- page_number séquentiel de 1 à 5.
- Les choice.id sont uniques dans tout le JSON (format : choice-pN-a, choice-pN-b).
- Les story_starts.id sont uniques (format : start-NNN).
- Les panels décrivent Hana et Kiko EXACTEMENT comme dans la bible visuelle : même apparence, même vêtements, mêmes accessoires. Ne jamais modifier le design des personnages.
