const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'credits.json'); // Ez a fájl tartalmazza a kredit adatokat

// Funkció a kredit adatbázis betöltéséhez
function loadCredits() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Funkció a kredit adatbázis mentéséhez
function saveCredits(credits) {
    fs.writeFileSync(filePath, JSON.stringify(credits, null, 2));
}

module.exports = { loadCredits, saveCredits };
