# Prompts — Personnage Leo Sportif (workflow generate-manga-story)

Le workflow récupère tous les avatars en BDD puis fait la **correspondance par nom** : si le message contient le `character_name` (ex. "Leo" ou "Leo Sportif"), ce personnage est utilisé. Sinon, le premier avatar de la BDD est pris en fallback. Assure-toi qu’un avatar avec `character_name` = **"Leo Sportif"** ou **"Leo"** existe dans la table `avatars` avec un `character_prompt` décrivant Leo (garçon 8 ans, métis, cheveux bouclés, hoodie bleu, short gris, baskets vert fluo, bracelet orange, style chibi manga).

---

*Test 1 — Character matching Leo + setting (jardin)*

Leo Sportif découvre un jardin secret derrière le stade où une vieille médaille brille sous un arbre

Expected: detects "Leo Sportif" (or "Leo") from avatars, setting = jardin (color #90EE90, emoji 🌸), inputType = theme

---

*Test 2 — No character name (fallback to first avatar)*

Un tournoi de foot oppose les quartiers ; le gagnant remporte un trophée en forme d’éclair

Expected: no avatar name in message → fallback to first avatar in DB. If first avatar is Leo, story will use him. setting = aventure (or add keyword), inputType = theme

---

*Test 3 — Full story mode (>500 chars) avec Leo Sportif*

Leo Sportif s’entraînait tous les jours au stade du quartier. Un matin, il trouva une balle usée près des vestiaires, avec un message gravé : « Celui qui marque trois buts sous l’arc-en-ciel trouvera le trésor. » Leo partit avec sa meilleure amie Sam. Ils jouèrent sous la pluie jusqu’à ce qu’un arc-en-ciel apparaisse. Leo marqua un premier but, puis un second. Pour le troisième, Sam lui fit une passe parfaite et Leo envoya le ballon dans le filet. Une trappe s’ouvrit sous le point de chute : c’était une cabane remplie de médailles et de photos d’anciens champions. Leo et Sam décidèrent d’y organiser un petit musée du foot pour tout le quartier. À la fin de l’été, le club leur offrit une vraie coupe pour récompenser leur esprit d’équipe.

Expected: inputType = full_story, story split into 5 pages. Character = Leo Sportif if name appears in text; visuals follow character_prompt (hoodie bleu, baskets vert fluo, etc.).
