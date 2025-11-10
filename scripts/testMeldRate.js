import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';

function createAllTiles() {
    const tiles = [];
    const rows = ['1', '2', '3', '4'];
    for (let set = 0; set < 2; set++) {
        rows.forEach(row => {
            for (let num = 1; num <= 13; num++) {
                const hex = num.toString(16).padStart(2, '0');
                tiles.push(Tile.fromId(`${row}-${hex}`));
            }
        });
    }
    return tiles;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function canMeld(tiles) {
    const sets = RummikubRules.findPossibleSets(tiles);

    // Can we find at least one set worth 30+?
    const sets30Plus = sets.filter(s => RummikubRules.calculateValue(s) >= 30);
    if (sets30Plus.length > 0) return true;

    // Can we combine multiple sets to reach 30+?
    // Simple approach: find ALL sets and calculate total
    const setsToPlay = [];
    let remainingTiles = [...tiles];

    while (true) {
        const possibleSets = RummikubRules.findPossibleSets(remainingTiles);
        if (possibleSets.length === 0) break;

        const setToPlay = possibleSets[0];
        setsToPlay.push(setToPlay);

        setToPlay.forEach(tile => {
            const index = remainingTiles.findIndex(t => t.instanceId === tile.instanceId);
            if (index !== -1) {
                remainingTiles.splice(index, 1);
            }
        });
    }

    const totalValue = setsToPlay.reduce((sum, set) =>
        sum + RummikubRules.calculateValue(set), 0);

    return totalValue >= 30;
}

// Test 1000 random starting hands
const numTests = 1000;
let canMeldCount = 0;
let canMeldSingle = 0;
let canMeldMultiple = 0;

for (let i = 0; i < numTests; i++) {
    const pouch = createAllTiles();
    shuffle(pouch);

    const hand = [];
    for (let j = 0; j < 14; j++) {
        hand.push(pouch.pop());
    }

    const sets = RummikubRules.findPossibleSets(hand);
    const sets30 = sets.filter(s => RummikubRules.calculateValue(s) >= 30);

    if (sets30.length > 0) {
        canMeldSingle++;
        canMeldCount++;
    } else if (canMeld(hand)) {
        canMeldMultiple++;
        canMeldCount++;
    }
}

console.log(`Tested ${numTests} random 14-tile starting hands:`);
console.log(`Can meld with single 30+ set: ${canMeldSingle} (${(canMeldSingle/numTests*100).toFixed(1)}%)`);
console.log(`Can meld with multiple sets: ${canMeldMultiple} (${(canMeldMultiple/numTests*100).toFixed(1)}%)`);
console.log(`Total can meld: ${canMeldCount} (${(canMeldCount/numTests*100).toFixed(1)}%)`);
console.log(`Cannot meld at all: ${numTests - canMeldCount} (${((numTests-canMeldCount)/numTests*100).toFixed(1)}%)`);
