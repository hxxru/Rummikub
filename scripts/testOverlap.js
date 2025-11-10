import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';

// Test with overlapping run
const tiles = [];
tiles.push(Tile.fromId('1-03')); // black 3
tiles.push(Tile.fromId('1-04')); // black 4
tiles.push(Tile.fromId('1-05')); // black 5
tiles.push(Tile.fromId('1-06')); // black 6

console.log('Hand: black 3, 4, 5, 6');
console.log('\nAll possible sets:');
const sets = RummikubRules.findPossibleSets(tiles);
sets.forEach((set, i) => {
    console.log(`  ${i + 1}. [${set.map(t => t.number).join(',')}] (${RummikubRules.calculateValue(set)} pts)`);
});

console.log('\n--- RandomAI behavior (picks first) ---');
let remainingRack = [...tiles];
const setsToPlay = [];

while (true) {
    const possibleSets = RummikubRules.findPossibleSets(remainingRack);
    if (possibleSets.length === 0) break;

    const setToPlay = possibleSets[0];  // FIRST set
    console.log(`Playing: [${setToPlay.map(t => t.number).join(',')}]`);
    setsToPlay.push(setToPlay);

    setToPlay.forEach(tile => {
        const index = remainingRack.findIndex(t => t.instanceId === tile.instanceId);
        if (index !== -1) {
            remainingRack.splice(index, 1);
        }
    });

    console.log(`Remaining: [${remainingRack.map(t => t.number).join(',')}]`);
}

console.log(`\nResult: Played ${setsToPlay.length} sets, ${setsToPlay.reduce((sum, s) => sum + s.length, 0)} tiles total`);

console.log('\n--- GreedyAI behavior (picks longest) ---');
remainingRack = [...tiles];
const setsToPlay2 = [];

while (true) {
    const possibleSets = RummikubRules.findPossibleSets(remainingRack);
    if (possibleSets.length === 0) break;

    // Sort by length descending
    possibleSets.sort((a, b) => b.length - a.length);

    const setToPlay = possibleSets[0];
    console.log(`Playing: [${setToPlay.map(t => t.number).join(',')}]`);
    setsToPlay2.push(setToPlay);

    setToPlay.forEach(tile => {
        const index = remainingRack.findIndex(t => t.instanceId === tile.instanceId);
        if (index !== -1) {
            remainingRack.splice(index, 1);
        }
    });

    console.log(`Remaining: [${remainingRack.map(t => t.number).join(',')}]`);
}

console.log(`\nResult: Played ${setsToPlay2.length} sets, ${setsToPlay2.reduce((sum, s) => sum + s.length, 0)} tiles total`);
