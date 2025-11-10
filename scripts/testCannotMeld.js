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

    return { canMeld: totalValue >= 30, totalValue, sets: setsToPlay };
}

// Find examples of hands that cannot meld
console.log('Searching for hands that CANNOT meld...\n');

let attempts = 0;
let examples = 0;
const maxExamples = 5;

while (examples < maxExamples && attempts < 1000) {
    attempts++;

    const pouch = createAllTiles();
    shuffle(pouch);

    const hand = [];
    for (let i = 0; i < 14; i++) {
        hand.push(pouch.pop());
    }

    const result = canMeld(hand);

    if (!result.canMeld) {
        examples++;
        console.log(`=== Example ${examples} (attempt ${attempts}) ===`);
        console.log('Hand:', hand.map(t => `${t.color[0]}${t.number}`).join(', '));

        const allSets = RummikubRules.findPossibleSets(hand);
        console.log(`Possible sets: ${allSets.length}`);

        if (allSets.length > 0) {
            console.log('Sets found:');
            allSets.forEach((set, i) => {
                const value = RummikubRules.calculateValue(set);
                console.log(`  ${i + 1}. [${set.map(t => `${t.color[0]}${t.number}`).join(',')}] = ${value} pts`);
            });
            console.log(`Total value if playing all: ${result.totalValue} points`);
            console.log(`Still ${30 - result.totalValue} points short!`);
        } else {
            console.log('Cannot form ANY sets at all');
        }
        console.log();
    }
}

console.log(`\nFound ${examples} hands that cannot meld in ${attempts} attempts`);
console.log(`That's ${(examples/attempts*100).toFixed(1)}% cannot meld`);
