# Konfiguráció

A bot szerverenként testreszabható a `/guildconfig` paranccsal. Ez a parancs lehetővé teszi a szerver adminisztrátorainak, hogy a bot működését a saját igényeikhez igazítsák.

## A `/guildconfig` parancs használata

A parancs segítségével módosíthatók a különböző beállítások. A használata a következő:

`/guildconfig <setting> <value>`

- `setting`: A módosítani kívánt beállítás neve.
- `value`: A beállítás új értéke.

## Főbb beállítások:

- `logchannel`: A csatorna, ahova a bot a naplóüzeneteket küldi.
  - Példa: `/guildconfig logchannel #logs`
- `staffrole`: Az a rang, amellyel a moderációs parancsok használhatók. Több is beállítható.
  - Példa: `/guildconfig staffrole @Moderator`
- `requestrole`: Az a rang, amellyel a felhasználók rangokat kérhetnek.
  - Példa: `/guildconfig requestrole @Member`
- `approvalchannel`: A csatorna, ahova a rangkérelmek érkeznek.
  - Példa: `/guildconfig approvalchannel #role-requests`
- `rejectionchannel`: A csatorna, ahova az elutasított rangkérelmek kerülnek.
  - Példa: `/guildconfig rejectionchannel #rejected-requests`
- `cooldownrole`: A rang, amit a felhasználó kap, miután egy rangot elvettek tőle.
  - Példa: `/guildconfig cooldownrole @Cooldown`
- `viprole`: Egy különleges rang, ami például bónusz XP-t adhat.
  - Példa: `/guildconfig viprole @VIP`

A beállítások a `data/guilds/` mappában JSON fájlokban tárolódnak, de a közvetlen szerkesztésük nem ajánlott. Mindig a `/guildconfig` parancsot használd a módosításokhoz.
