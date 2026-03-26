*Test 1 — Character matching + setting detection (forêt)*

Hana découvre une forêt magique où les arbres parlent et cachent un trésor ancien

Expected: detects "Hana" from avatars, setting = forêt (color #228B22, emoji 🌲), inputType = theme

---

*Test 2 — No character name (fallback to first avatar)*

Un dragon de glace menace le village et seul un enfant courageux peut le vaincre

Expected: no avatar name matched → falls back to first avatar in DB, setting = dragon (color #B22222, emoji 🐉), inputType = theme

---

*Test 3 — Full story mode (>500 chars)*

Il était une fois dans un château perché sur une montagne, une petite fille nommée Hana qui rêvait de voler. Un jour, elle trouva une plume dorée dans le jardin du château. En la touchant, ses pieds quittèrent le sol. Elle s'envola par-dessus les tours, survola la forêt enchantée, croisa un aigle géant qui lui proposa de l'accompagner. Ensemble ils découvrirent une île flottante cachée dans les nuages. Sur cette île vivaient des créatures lumineuses qui gardaient le secret de la gravité. Hana dut résoudre trois énigmes pour obtenir le pouvoir de voler quand elle le souhaitait. Elle réussit et rentra chez elle avant le coucher du soleil.