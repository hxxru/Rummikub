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

function canMeldNaive(tiles) {
    // Original algorithm: pick first set
    const setsToPlay = [];
    let remainingTiles = [...tiles];

    while (true) {
        const possibleSets = RummikubRules.findPossibleSets(remainingTiles);
        if (possibleSets.length === 0) break;

        const setToPlay = possibleSets[0];  // FIRST set
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

function canMeldSmart(tiles) {
    // Fixed algorithm: pick highest value set first
    const setsToPlay = [];
    let remainingTiles = [...tiles];

    while (true) {
        const possibleSets = RummikubRules.findPossibleSets(remainingTiles);
        if (possibleSets.length === 0) break;

        // Sort by value descending, then by length descending
        possibleSets.sort((a, b) => {
            const valueA = RummikubRules.calculateValue(a);
            const valueB = RummikubRules.calculateValue(b);
            if (valueB !== valueA) return valueB - valueA;
            return b.length - a.length;
        });

        const setToPlay = possibleSets[0];  // BEST set
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

// Test on many random hands
const numTests = 1000;
let naiveCanMeld = 0;
let smartCanMeld = 0;
let smartBetter = 0;

for (let i = 0; i < numTests; i++) {
    const pouch = createAllTiles();
    shuffle(pouch);

    const hand = [];
    for (let j = 0; j < 14; j++) {
        hand.push(pouch.pop());
    }

    const naive = canMeldNaive(hand);
    const smart = canMeldSmart(hand);

    if (naive) naiveCanMeld++;
    if (smart) smartCanMeld++;
    if (smart && !naive) smartBetter++;
}

console.log(`Tested ${numTests} random 14-tile starting hands:\n`);
console.log(`Naive algorithm (pick first): ${naiveCanMeld} can meld (${(naiveCanMeld/numTests*100).toFixed(1)}%)`);
console.log(`Smart algorithm (pick best):  ${smartCanMeld} can meld (${(smartCanMeld/numTests*100).toFixed(1)}%)`);
console.log(`\nImprovement: ${smartBetter} additional hands can now meld (+${(smartBetter/numTests*100).toFixed(1)}%)`);
console.log(`Relative improvement: ${((smartCanMeld - naiveCanMeld) / naiveCanMeld * 100).toFixed(1)}% more successful`);
