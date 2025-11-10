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

// Test with various hand sizes
const handSizes = [10, 15, 20, 25, 30];
const numTests = 100;

console.log('Testing if findPossibleSets misses valid sets:\n');
console.log('Hand Size | Avg Sets Found | Avg Tiles Playable | % Hands with 0 sets');
console.log('----------|----------------|--------------------|-----------------------');

handSizes.forEach(size => {
    let totalSets = 0;
    let totalTilesPlayable = 0;
    let handsWithNoSets = 0;

    for (let i = 0; i < numTests; i++) {
        const pouch = createAllTiles();
        shuffle(pouch);

        const hand = [];
        for (let j = 0; j < size; j++) {
            hand.push(pouch.pop());
        }

        // Find all sets and play them all
        const setsToPlay = [];
        let remainingRack = [...hand];

        while (true) {
            const possibleSets = RummikubRules.findPossibleSets(remainingRack);
            if (possibleSets.length === 0) break;

            const setToPlay = possibleSets[0];
            setsToPlay.push(setToPlay);

            setToPlay.forEach(tile => {
                const index = remainingRack.findIndex(t => t.instanceId === tile.instanceId);
                if (index !== -1) {
                    remainingRack.splice(index, 1);
                }
            });
        }

        totalSets += setsToPlay.length;
        const tilesPlayable = setsToPlay.reduce((sum, set) => sum + set.length, 0);
        totalTilesPlayable += tilesPlayable;

        if (setsToPlay.length === 0) {
            handsWithNoSets++;
        }
    }

    const avgSets = (totalSets / numTests).toFixed(2);
    const avgTiles = (totalTilesPlayable / numTests).toFixed(2);
    const pctNoSets = (handsWithNoSets / numTests * 100).toFixed(1);

    console.log(`${size.toString().padStart(9)} | ${avgSets.padStart(14)} | ${avgTiles.padStart(18)} | ${pctNoSets.padStart(20)}%`);
});

console.log('\n\nTest specific scenario: After playing initial meld with 7 tiles remaining');
console.log('Drawing 5 more tiles (total 12) - can we form any sets?\n');

let canFormSetsCount = 0;
const scenarioTests = 200;

for (let i = 0; i < scenarioTests; i++) {
    const pouch = createAllTiles();
    shuffle(pouch);

    // Simulate having 7 random tiles (leftovers after initial meld)
    const hand = [];
    for (let j = 0; j < 7; j++) {
        hand.push(pouch.pop());
    }

    // Draw 5 more
    for (let j = 0; j < 5; j++) {
        hand.push(pouch.pop());
    }

    // Can we form any sets now?
    const sets = RummikubRules.findPossibleSets(hand);
    if (sets.length > 0) {
        canFormSetsCount++;
    }
}

console.log(`Out of ${scenarioTests} tests with 12 random tiles:`);
console.log(`Can form at least one set: ${canFormSetsCount} (${(canFormSetsCount/scenarioTests*100).toFixed(1)}%)`);
console.log(`Cannot form any sets: ${scenarioTests - canFormSetsCount} (${((scenarioTests-canFormSetsCount)/scenarioTests*100).toFixed(1)}%)`);
