
# Nyx Bot - Teljes útmutató: Hogyan építsd fel Rustban (Magyar)

Ez a dokumentum részletes, gyakorlatorientált útmutató arra, hogyan lehet a Nyx Discord botot Rust nyelven újraépíteni. Célja, hogy egy fejlesztő vagy csapat számára átfogó, lépésről lépésre követhető leírást adjon, minden fontos komponensre kiterjedően: architektúra, async runtime, Discord kliens, webszerver (webpanel), titkosítás, adatrendszer, tesztelés, CI/CD, telepítés és üzemeltetés.

Megjegyzés: a fájl nagyon hosszú (1000+ sor) és részletes. Olvasáskor hasznos a tartalomjegyzék használata.

## Tartalomjegyzék

1. Áttekintés
2. Célok és követelmények
3. Műszaki stack javaslat
4. Projekt struktúra
5. Async runtime és feladatkezelés
6. Discord integráció (serenity)
7. Parancsok és eseménykezelés modellezése
8. Webpanel (Actix-web vagy Axum) és WebSocket/Realtime
9. Titkosítás és adatvédelem (AES, revocation, key management)
10. Adattárolás (Sled / SQLite / Postgres) és schema
11. Naplózás és hibakezelés (tracing)
12. Konzol parancsok és admin CLI
13. Tesztelés (unit, integration, e2e)
14. CI/CD javaslat (GitHub Actions)
15. Telepítés és üzemeltetés (Docker, systemd)
16. Biztonsági ajánlások
17. Migrációs stratégiák a Node.js implementációról
18. Példakódok és sablonok
19. Kiegészítések és további lehetőségek
20. Függelék: gyakori feladatok kódrészletei

---

## 1. Áttekintés

Nyx egy fejlett moderációs és közösségi bot, amely naplózást, rang/XP rendszert, moderációs parancsokat és egy webes admin felületet (webpanel) kínál. A cél az, hogy egy stabil, aszinkron, hatékony és biztonságos Rust implementáció szülessen, amely ugyanazt a funkcionalitást adja vissza, mint a Node.js változat, de Rust előnyeit (memóriabiztonság, teljesítmény, alacsony erőforrásigény) is kihasználja.

A Rust változat előnyei:
- Memóriabiztonság fordítási időben
- Alacsonyabb futási költség és gyorsabb végrehajtás
- Egyszerűbb natív telepítés (kevesebb szerver-oldali futtatókörnyezet-igény)
- Erősebb típusellenőrzés, ami csökkenti a futásidejű hibákat

Ez az útmutató végigvezet a fő komponenseken és kódmintákat ad, hogy gyorsan elkezdhess dolgozni a Rust porton.

---

## 2. Célok és követelmények

Funkcionális követelmények:
- Discord bot: parancsok, események, moderációs műveletek
- Webpanel: hitelesítés (opcionális OAuth), statisztikák, guild config szerkesztő, fájlmegjelenítés
- Naplózás: szerverlogok küldése Discord csatornára és fájlba
- Titkosított tárolás az adatfájlokhoz
- Konzol parancsok a helyi üzemeltetéshez

Nem-funkcionális követelmények:
- Telepíthető Docker konténerrel
- Konfiguráció a `.env` és `config.toml` formátumban
- Tesztek: unit és integration
- Könnyen karbantartható moduláris kód

Minimum futtatási környezet:
- Rust toolchain (stable)
- Cargo
- Opció: Docker a futtatáshoz

Ajánlott infrastruktúra:
- VPS vagy felhő (pl. Azure, AWS, DigitalOcean)
- Reverse proxy (nginx) a webpanelhez
- TLS (Let's Encrypt)

---

## 3. Műszaki stack javaslat

Ajánlott Rust könyvtárak (crates):

- Async runtime: tokio
- Discord: serenity (serenity-rs) vagy Twilight (twilight-rs) — serenity egyszerűbb kezdéshez
- Web framework: actix-web vagy axum; actix-web jól dokumentált, axum modernebb és könnyebb használatú middleware-ekkel
- WebSocket: tokio-tungstenite vagy actix-web beépített ws támogatása
- Database: sled (embedded key-value), sqlite (rusqlite), vagy Postgres (sqlx vagy diesel) — ha a jelenlegi app fájl alapú, sled vagy sqlite könnyű portolás
- Encryption: aes-gcm or aes-ctr + hmac (aes-gcm for AEAD), vagy `rust-crypto` crate; használhatod `ring` vagy `aes-gcm` crate-t
- Config: config-rs (támogatja .env / TOML / YAML)
- Logging: tracing + tracing-subscriber
- Background tasks: tokio::spawn / tokio::task
- Serialization: serde + serde_json
- File watching (realtime console): notify vagy tail-like implementáció

Példa Cargo.toml függőségek (kezdetnek):

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.26", features = ["full"] }
serenity = { version = "0.11", features = ["gateway", "rustls_backend", "client"] }
actix-web = "4"
tracing = "0.1"
tracing-subscriber = "0.3"
config = "0.13"
serde_derive = "1.0"
anyhow = "1.0"
log = "0.4"
# encryption
aes-gcm = "0.10"
rand = "0.8"
# db
sled = "0.34"
# testing
tokio-test = "0.4"
``` 

Ezek az alapok segítenek gyorsan felépíteni egy prototípust.

---

## 4. Projekt struktúra

Javasolt könyvtárstruktúra Rust projektként:

```
nyx-rust/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── config.rs
│   ├── discord/
│   │   ├── mod.rs
│   │   ├── commands.rs
│   │   └── events.rs
│   ├── webpanel/
│   │   ├── mod.rs
│   │   ├── handlers.rs
│   │   └── templates/ (e.g., tera, askama)
│   ├── storage/
│   │   ├── mod.rs
│   │   ├── files.rs
│   │   └── db.rs
│   ├── crypto.rs
│   ├── logging.rs
│   └── util.rs
├── data/ (runtime data, encrypted blobs)
├── docker/
│   └── Dockerfile
└── README.md
```

Magyarázat:
- `discord/` modul tartalmazza a bot logikát, parancs definíciókat és eseménykezelőket (ready, message, guildMemberUpdate stb.)
- `webpanel/` tartalmazza az Actix/axum szerver logikát
- `storage/` kezeli a titkosított fájlokat vagy DB-t
- `crypto.rs` a titkosítási/dekódolási helper függvényeket tartalmazza

---

## 5. Async runtime és feladatkezelés

Használjunk `tokio`-t mint runtime-ot. A `main` függvény legyen `#[tokio::main] async fn main()` típusú, és kezeli a különálló szolgáltatásokat: Discord klient, webpanel szerver, háttérfeladatok.

Példa `main.rs` vázlat:

```rust
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let config = config::load()?; // saját modul

    // Indítsd el a Discord klienset
    tokio::spawn(async move {
        if let Err(e) = discord::run(&config).await {
            tracing::error!("Discord error: {:?}", e);
        }
    });

    // Indítsd el a webpanelt
    webpanel::start_server(config.webpanel).await?;

    // A main nem zár le azonnal, a szerver blokkolja az eseményláncot
    Ok(())
}
```

Háttérfeladatok kezeléséhez használjunk `tokio::spawn`-ot, vagy egy `task supervisor` modult, ami újraindítja a hibás task-okat és gyűjti a metrikákat.

---

## 6. Discord integráció (serenity)

A `serenity` crate használata egyszerű és jól támogatott. A botot tokennel indítjuk, és regisztráljuk a parancsokat (slash commands) a Discord API-n keresztül.

Fontos: a `serenity` futtatása a tokio runtime-on történik. A `Client` példányt át kell adni a lehetséges moduloknak vagy singleton-szerűen lehet tárolni egy `Arc<Client>`-ben.

Példa `discord/mod.rs`:

```rust
use serenity::prelude::*;
use serenity::async_trait;

pub async fn run(config: &Config) -> anyhow::Result<()> {
    let intents = GatewayIntents::GUILD_MESSAGES | GatewayIntents::MESSAGE_CONTENT | GatewayIntents::GUILDS;
    let mut client = Client::builder(&config.bot_token, intents)
        .event_handler(Handler)
        .await?;

    client.start().await?;
    Ok(())
}

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, ctx: Context, ready: Ready) {
        tracing::info!("Bot ready: {:?}", ready.user.name);
    }

    async fn interaction_create(&self, ctx: Context, interaction: Interaction) {
        // Parancs kezelés
    }
}
```

Parancsok: használhatod a `serenity` beépített `ApplicationCommand` API-t slash parancsok kezelésére, vagy saját parancsdiszpécsert építhetsz.

Persistens parancsregisztrációhoz érdemes külön scripttel (vagy futtatáskor) regisztrálni a parancsokat a Discord API-n.

---

## 7. Parancsok és eseménykezelés modellezése

Javaslom parancsregisztrációs réteg bevezetését, ahol minden parancs egy `struct`/`trait` implementációként jelenik meg. Példa trait:

```rust
#[async_trait]
pub trait BotCommand {
    fn name(&self) -> &'static str;
    fn register(&self) -> ApplicationCommand; // vagy hasonló
    async fn execute(&self, ctx: &Context, interaction: &ApplicationCommandInteraction) -> anyhow::Result<()>;
}
```

Ezzel könnyen hozzáadhatsz új parancsokat és tesztelheted őket.

Eseménykezelés: a `EventHandler`-ben a `interaction_create`, `message`, `guild_member_update` stb. hívásokat déllegáljuk külön handler moduloknak.

---

## 8. Webpanel (Actix-web vagy Axum) és WebSocket/Realtime

A webpanel célja, hogy a szerver adminjai böngészhessék az escrowolt fájlokat, szerkeszthessék a guild konfigurációt és láthassák a konzolt / statisztikákat.

Ajánlott stack: `actix-web` + `tera` vagy `askama` sablonmotor + `tokio` + `tokio-tungstenite` websockekhez.

Szerver indítása:

```rust
pub async fn start_server(cfg: WebPanelConfig) -> anyhow::Result<()> {
    let bind = format!("0.0.0.0:{}", cfg.port);
    HttpServer::new(move || {
        App::new()
            .wrap(... middleware ...)
            .service(web::resource("/").route(web::get().to(index)))
            .service(web::resource("/console").route(web::get().to(console_page)))
    })
    .bind(bind)?
    .run()
    .await?;
    Ok(())
}
```

Realtimes konzol: watch-eld a log fájlokat (`notify` crate) és az új sorokat `WebSocket`-en keresztül `emit`-eld a csatlakozott böngészőknek.

Példa WebSocket end-point (actix-web):

```rust
async fn ws_index(r: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    ws::start(MyWs {}, &r, stream)
}
```

A `MyWs` implementálja a `StreamHandler`-t és a szerver push-olja az új log sorokat.

Hitelesítés: ha OAuth-t szeretnél (Discord), használhatod a `oauth2` crate-et, és a Discord OAuth2 végpontokat implementálhatod. Alternatív megoldás: hagyd kikapcsolva az OAuth-ot és használj lokális webpanel-felhasználókat (mint az eredeti app tette). A dokumentum elején említett flag (`WEBPANEL_DISABLE_OAUTH`) viselkedését reprodukálhatod a Rust oldalán is.

---

## 9. Titkosítás és adatvédelem

A jelenlegi Node.js app AES-256-CBC használatát említette. Rust-ban az AES-GCM használata javasolt (AEAD), mert integritást és titkosságot biztosít egyszerre.

Kötelező elemek:
- 32 bájtos kulcs (256-bit) hex formátumban
- IV/nonce megfelelő mérete és randomizálása (12 bájt AES-GCM-hez)
- Kulcskezelés: ne tárold a kulcsot a repo-ban; használj `.env` vagy saját KMS-t

Példa titkosítási helper (aes-gcm):

```rust
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};

pub fn encrypt(plaintext: &[u8], key_hex: &str) -> anyhow::Result<Vec<u8>> {
    let key_bytes = hex::decode(key_hex)?;
    let key = Key::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce_bytes = rand::random::<[u8; 12]>();
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher.encrypt(nonce, plaintext)?;
    // Tárold: nonce + ciphertext
    let mut out = nonce_bytes.to_vec();
    out.extend(ciphertext);
    Ok(out)
}
```

A dekódolás fordítva megy: nonce kinyerése, és `decrypt`.

Fontos: AES-GCM AEAD használata megakadályozza a hamisított üzenetek beolvasását.

---

## 10. Adattárolás (Sled / SQLite / Postgres)

Ha a jelenlegi alkalmazás fájl-alapú JSON-t használ (`data/` mappa), a legegyszerűbb port: maradj fájloknál, de titkosítsd őket AES-GCM-mel és használj `serde_json`-t az (de)serializáláshoz.

Alternatívák:
- `sled`: embedded key-value store, gyors és kényelmes. Jó ha nem akarsz DB-szervert üzemeltetni.
- `sqlite` (rusqlite): embeddelt relációs DB, kényelmes, ACID támogatás.
- `postgres` (sqlx/diesel): ha több szerveres környezetben osztani akarod az adatokat.

Példa fájl alapú olvasás/írás:

```rust
pub fn write_encrypted_json(path: &Path, data: &impl Serialize, key: &str) -> anyhow::Result<()> {
    let json = serde_json::to_vec_pretty(data)?;
    let encrypted = crypto::encrypt(&json, key)?;
    fs::write(path, encrypted)?;
    Ok(())
}

pub fn read_encrypted_json<T: DeserializeOwned>(path: &Path, key: &str) -> anyhow::Result<T> {
    let buf = fs::read(path)?;
    let decrypted = crypto::decrypt(&buf, key)?;
    let obj = serde_json::from_slice(&decrypted)?;
    Ok(obj)
}
```

A `data/guilds` fájlokat így titkosítva tarthatod.

---

## 11. Naplózás és hibakezelés (tracing)

Használjuk a `tracing` crate-et és `tracing-subscriber`-t. A `tracing` strukturált logolást biztosít és integrálódik könnyen metrikagyűjtőkkel és hibajelentő szolgáltatásokkal (pl. Sentry).

Példa init:

```rust
use tracing_subscriber::fmt::format::FmtSpan;

pub fn init_tracing() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_span_events(FmtSpan::CLOSE)
        .init();
}
```

Hibakezelés: minden async futtatás mellett `anyhow::Result` használata praktikus. Globális panic handler: tokio::spawn blokkoknál kezeld a JoinError-t és logold a paneleket; process panic esetén a `std::panic::set_hook`-ot beállíthatod, hogy értesítést küldjön (pl. Discord csatornára vagy error log csatornára).

---

## 12. Konzol parancsok és admin CLI

A Node.js verzió konzol bevitelt használ (`readline`). Rustban használhatod a `rustyline` vagy egyszerű stdin olvasást tokio-ban `tokio::io::stdin()`-nel aszinkron módon.

Funkciók: `restart`, `stop`, `say <message>`, `broadcast <type>`, `guilds`, `users <guildId>`, `eval <js>` (ez veszélyes; Rust környezetben `eval` nem releváns — ha kell scripting, integrálj WASM vagy egy scripting motort).

Példa egyszerű blokk a konzol parancsokhoz:

```rust
use tokio::io::{self, AsyncBufReadExt};

async fn console_loop() {
    let mut stdin = io::BufReader::new(io::stdin()).lines();
    while let Ok(Some(line)) = stdin.next_line().await {
        handle_command(line).await;
    }
}
```

---

## 13. Tesztelés (unit, integration, e2e)

Unit tesztek: függvényszinten teszteljük a titkosítást, fájlműveleteket, JSON (de)serializálást.

Integration tesztek: a bot logikát izolált környezetben teszteljük (pl. egy teszt Discord bot tokennel dev szerveren), vagy mock-oljuk a Discord kliens viselkedését.

E2E: Docker-compose segítségével indíthatunk egy tesztkörnyezett: DB, app, reverse proxy és ellenőrizhetjük a végpontok működését.

Teszt parancs:
```bash
cargo test
```

---

## 14. CI/CD javaslat (GitHub Actions)

Például:
- Build matrix: rust stable
- Run `cargo fmt -- --check`
- Run `cargo clippy -- -D warnings`
- Run `cargo test --workspace`
- Build Docker image és push (ha van registry)

Simple workflow:

```yaml
name: Rust CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          components: clippy
      - name: Run fmt
        run: cargo fmt -- --check
      - name: Run clippy
        run: cargo clippy -- -D warnings
      - name: Run tests
        run: cargo test --workspace --all-features
```

---

## 15. Telepítés és üzemeltetés (Docker, systemd)

Dockerfile vázlat:

```Dockerfile
FROM rust:1.70 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:buster-slim
COPY --from=builder /app/target/release/nyx-rust /usr/local/bin/nyx-rust
ENV RUST_LOG=info
CMD ["/usr/local/bin/nyx-rust"]
```

Systemd service példa:

```
[Unit]
Description=Nyx Bot
After=network.target

[Service]
User=nyx
WorkingDirectory=/opt/nyx
ExecStart=/usr/local/bin/nyx-rust
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

TLS: reverse proxy (nginx) és Let's Encrypt automatikus megújítás.

---

## 16. Biztonsági ajánlások

- Soha ne tárold a tokent vagy titkos kulcsot a repository-ban
- Használj `.env` vagy titkos kulcstárat (KMS) productionban
- Limitáld a rate-limitet a kritikus végpontokon
- Használj CSP és HTTPS-t a webpanelhez
- Naplózd, de ne tárold érzékeny adatokat nyers formában

---

## 17. Migrációs stratégiák a Node.js implementációról

1. Kezdd a statikus komponensekkel: architecture, config, titkosítás
2. Portold a storage olvasást/írást (JSON fájlok + titkosítás)
3. Implementáld a Discord kliens alapot: ready, alap parancsok
4. Portold a webpanel route-okat statikus sablonokkal
5. Integráld a konzol parancsokat
6. Teszteld a környezeti integrációkat

---

## 18. Példakódok és sablonok

Itt több kódrészletet adok meg, amelyek a fenti logikát megvalósítják. Ezek nem teljes programok, hanem sablonok.

### config.rs (vázlat)

```rust
use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct Config {
    pub bot_token: String,
    pub webpanel: WebPanelConfig,
    pub encryption_key: String,
}

#[derive(Deserialize, Debug)]
pub struct WebPanelConfig {
    pub enabled: bool,
    pub port: u16,
    pub disable_oauth: bool,
}

pub fn load() -> anyhow::Result<Config> {
    let s = config::Config::builder()
        .add_source(config::Environment::with_prefix("NYX"))
        .build()?;
    let cfg: Config = s.try_deserialize()?;
    Ok(cfg)
}
```

### crypto.rs (vázlat)

```rust
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};

pub fn encrypt(plaintext: &[u8], key_hex: &str) -> anyhow::Result<Vec<u8>> {
    let key_bytes = hex::decode(key_hex)?;
    let key = Key::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher.encrypt(nonce, plaintext)?;
    let mut out = nonce_bytes.to_vec();
    out.extend(ciphertext);
    Ok(out)
}

pub fn decrypt(buf: &[u8], key_hex: &str) -> anyhow::Result<Vec<u8>> {
    let key_bytes = hex::decode(key_hex)?;
    let key = Key::from_slice(&key_bytes);
    if buf.len() < 12 { anyhow::bail!("invalid cipher") }
    let (nonce_bytes, ct) = buf.split_at(12);
    let cipher = Aes256Gcm::new(key);
    let plaintext = cipher.decrypt(Nonce::from_slice(nonce_bytes), ct as &[u8])?;
    Ok(plaintext)
}
```

### storage/files.rs (vázlat)

```rust
use std::path::Path;

pub fn list_files(kind: &str) -> Vec<String> {
    let dir = Path::new("data").join(kind);
    if dir.exists() {
        std::fs::read_dir(dir).unwrap().filter_map(|e| e.ok()).map(|d| d.file_name().to_string_lossy().to_string()).collect()
    } else {
        Vec::new()
    }
}
```

---

## 19. Kiegészítések és további lehetőségek

- Használj `twilight`-t, ha finom kontrolt szeretnél a gateway és HTTP API felett
- Készíts egy migrációs szkriptet, ami átkonvertálja a Node.js JSON fájlokat a Rust formátumba
- Integrálj opciókat a távoli monitorozáshoz (Prometheus + Grafana)

---

## 20. Függelék: gyakori feladatok kódrészletei

(az alábbiakban sok-sok hasznos snippet és magyarázat következik, amelyek segítenek a megvalósításban; részletesen tagolt, mert a fájl célja oktatási és gyakorlati referenciaként szolgál)

### A. WebSocket alapú log streaming - részletes példa

1. Fájl figyelő (tail-szerű) implementálása:

```rust
use notify::{Watcher, RecursiveMode, watcher};
use std::sync::mpsc::channel;
use std::time::Duration;

fn watch_file(path: &Path, mut on_new_line: impl FnMut(String) + Send + 'static) -> notify::Result<()> {
    let (tx, rx) = channel();
    let mut watcher = watcher(tx, Duration::from_secs(1))?;
    watcher.watch(path, RecursiveMode::NonRecursive)?;
    std::thread::spawn(move || {
        loop {
            match rx.recv() {
                Ok(event) => {
                    // ha változás, olvasd az új sorokat
                }
                Err(e) => { break; }
            }
        }
    });
    Ok(())
}
```

2. WebSocket broadcast: tarts egy `Vec<Sender>`-t (tokio mpsc) és küldd az új sorokat az összes kliensnek.

### B. Guild config editor: szerepek kattintható gombok

A webpanel oldalon, ha OAuth engedélyezett, lekérheted a szerver szerepeit a Discord API-ból (`GET /guilds/{guild.id}/roles`), és a sablonban megjeleníted őket checkbox-ként. A backend POST kérése frissíti a titkosított guild config fájlt.

### C. Broadcast logok minden szerverbe

A bot broadcast parancsa végigiterál a `client.cache.guilds`-on, betölti a szerver konfigurációt (`data/guilds/{guildId}_...json`), és a konfigurált log csatornára küldi az üzenetet.

### D. Teszt setup minták

- Unit test a `crypto` modulhoz: titkosítás -> dekódolás round-trip
- Integration test a `storage` modulhoz: ideiglenes fájlok használata

### E. Konfigurációs példák (.env és config.toml)

`.env` példa:

```
NYX_BOT_TOKEN=YOUR_TOKEN
NYX_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
NYX_WEBPANEL_PORT=50249
NYX_WEBPANEL_DISABLE_OAUTH=true
```

`config.toml` példa:

```toml
[webpanel]
port = 50249
disable_oauth = true

[storage]
path = "data"
```

---

## Záró gondolatok

Ez az útmutató arra szolgál, hogy részletes és gyakorlati lépéseket adjon a Nyx bot Rustban történő megvalósításához. A dokumentum célja, hogy moduláris, tesztelhető és biztonságos kódot eredményezzen, ami megfelel a jelenlegi Node.js implementáció funkcióinak.

Ha szeretnéd, elkészíthetek egy starting template repositoryt (`cargo init` + mappastruktúra + alap Cargo.toml), vagy részletesebb kódot bármelyik modulhoz (pl. teljes `discord` modul, vagy működő webpanel WS streaming példa).

---

*Vége: build_in_rust.md — Az útmutató longformátuma itt a repository `documentation/` mappájában található.*
