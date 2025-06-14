# Fejlesztői konzol parancsok

A bot futása közben a konzolban az alábbi parancsok érhetők el:

- `restart` – Bot újraindítása
- `stop` – Bot leállítása
- `say <üzenet>` – Üzenet küldése a log csatornába
- `broadcast <stop|dev|restart>` – Üzenet minden szerver log csatornájába
- `guilds` – Szerverek listázása (név és ID)
- `users <guildId>` – Felhasználók listázása egy szerveren (név és ID)
- `eval <js>` – JavaScript kód futtatása (veszélyes!)
- `db list <type>` – Adatfájlok listázása (pl. profiles, guilds, logs)
- `db get <type> <guildId> <userId>` – Adat lekérdezése (objektum)
- `db set <type> <guildId> <userId> <json>` – Adat beállítása (JSON string)
- `db delete <type> <guildId> <userId>` – Adatfájl törlése
- `db raw <type> <guildId> <userId>` – Adatfájl nyers tartalma (JSON)
- `db help` – DB parancsok listája
- `help` – Konzol parancsok listája

A parancsokat egyszerűen be kell írni a futó bot konzoljába.
