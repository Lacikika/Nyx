# Parancsok

A bot minden parancsa slash commandként érhető el. A főbb kategóriák:

## Moderáció
- `/ban <user> [reason]` – Tag kitiltása a szerverről.
  - `user`: A kitiltandó felhasználó.
  - `reason` (opcionális): A kitiltás indoka, ami a logban megjelenik.
- `/kick <user> [reason]` – Tag kirúgása a szerverről.
  - `user`: A kirúgandó felhasználó.
  - `reason` (opcionális): A kirúgás indoka.
- `/mute <user> [time] [reason]` – Tag némítása. (Ha a funkció be van kapcsolva)
  - `user`: A némítandó felhasználó.
  - `time` (opcionális): A némítás időtartama (pl. 1h, 1d).
  - `reason` (opcionális): A némítás indoka.
- `/warn <user> [reason]` – Figyelmeztetés küldése egy tagnak.
  - `user`: A figyelmeztetendő felhasználó.
  - `reason` (opcionális): A figyelmeztetés indoka.
- `/purge <amount>` – Üzenetek tömeges törlése egy csatornában.
  - `amount`: A törlendő üzenetek száma.
- `/giverole <user> <role>` – Rang jóváhagyása egy tagnak.
  - `user`: A felhasználó, akinek a rangot adod.
  - `role`: A rang, amit adsz.
- `/deleterole <user> <role>` – Rang eltávolítása egy tagtól.
  - `user`: A felhasználó, akitől a rangot elveszed.
  - `role`: A rang, amit elveszel.
- `/kickrole <role>` – Adott ranggal rendelkező összes tag kirúgása.
  - `role`: A rang, amellyel rendelkező tagokat kirúgod.

## Utility
- `/help` – Súgó a parancsokról.
- `/serverstats` – Információk a szerverről.
- `/rank [user]` – Megmutatja a saját vagy egy másik felhasználó rangját és XP-jét.
  - `user` (opcionális): A felhasználó, akinek a rangját szeretnéd látni.
- `/leaderboard` – Megjeleníti a szerver ranglistáját.
- `/lookupuser <user>` – Részletes információk és logok egy felhasználóról.
  - `user`: A felhasználó, akiről információt szeretnél.
- `/lookupguild` – Részletes információk és logok a szerverről.

## Szórakozás
- `/meme` – Véletlenszerű mém küldése.
- `/joke` – Véletlenszerű vicc küldése.
- `/8ball <question>` – Válaszol a kérdésedre.
  - `question`: A kérdés, amire választ vársz.

## Konfiguráció
- `/guildconfig <setting> <value>` – A szerver beállításainak módosítása.
  - `setting`: A beállítás, amit módosítani szeretnél (pl. `logchannel`, `staffrole`).
  - `value`: A beállítás új értéke.

Minden parancs részletes leírását és használatát a `/help` parancs is tartalmazza.
