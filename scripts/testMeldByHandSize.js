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

function canMeldAny(tiles) {
    const sets = RummikubRules.findPossibleSets(tiles);
    return sets.length > 0;
}

function canMeld30Plus(tiles) {
    // Find ALL playable sets
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

// Test different hand sizes
const handSizes = [14, 20, 25, 30, 35, 40];
const numTests = 500;

console.log('Probability of forming sets by hand size:\n');
console.log('Size | Can form ANY set | Can form 30+ initial meld');
console.log('-----|------------------|---------------------------');

handSizes.forEach(size => {
    let canFormAny = 0;
    let canMeld30 = 0;

    for (let i = 0; i < numTests; i++) {
        const pouch = createAllTiles();
        shuffle(pouch);

        const hand = [];
        for (let j = 0; j < size; j++) {
            hand.push(pouch.pop());
        }

        if (canMeldAny(hand)) canFormAny++;
        if (canMeld30Plus(hand)) canMeld30++;
    }

    const anyPct = (canFormAny / numTests * 100).toFixed(1);
    const meldPct = (canMeld30 / numTests * 100).toFixed(1);

    console.log(`${size.toString().padStart(4)} | ${anyPct.padStart(15)}% | ${meldPct.padStart(24)}%`);
});
