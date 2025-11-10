import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';

// Test case: two sets that individually are < 30 but together >= 30
const tiles = [];
// Run 1: black 7,8,9 (24 pts)
tiles.push(Tile.fromId('1-07'));
tiles.push(Tile.fromId('1-08'));
tiles.push(Tile.fromId('1-09'));
// Group: three 2s (6 pts)
tiles.push(Tile.fromId('1-02'));
tiles.push(Tile.fromId('2-02'));
tiles.push(Tile.fromId('3-02'));

console.log('Hand: black 7,8,9 (24 pts) + three 2s (6 pts)');
console.log('Total if playing both: 30 points (CAN MELD!)');
console.log('But neither set individually is >= 30 points\n');

// Simulate current AI logic
console.log('=== Current AI Logic ===');
const computerHasMelded = false;
const requirement = 30;
let setsToPlay = [];
let remainingRack = [...tiles];

console.log('Iteration 1:');
let possibleSets = RummikubRules.findPossibleSets(remainingRack);
console.log(`  Found ${possibleSets.length} sets:`);
possibleSets.forEach(s => {
    console.log(`    [${s.map(t => `${t.color[0]}${t.number}`).join(',')}] = ${RummikubRules.calculateValue(s)} pts`);
});

let validSets = possibleSets;
if (!computerHasMelded && setsToPlay.length === 0) {
    console.log(`  Filtering for sets >= ${requirement} points...`);
    validSets = possibleSets.filter(set =>
        RummikubRules.calculateValue(set) >= requirement
    );
    console.log(`  After filter: ${validSets.length} sets`);
}

if (validSets.length === 0) {
    console.log('  No valid sets, breaking loop');
    console.log('\nResult: DRAW (cannot meld)\n');
} else {
    console.log('This should not happen in this test');
}

// Correct logic
console.log('=== Correct Logic ===');
setsToPlay = [];
remainingRack = [...tiles];

while (true) {
    const possibleSets = RummikubRules.findPossibleSets(remainingRack);
    if (possibleSets.length === 0) break;

    // Pick best set (sort by value)
    possibleSets.sort((a, b) => {
        const valueA = RummikubRules.calculateValue(a);
        const valueB = RummikubRules.calculateValue(b);
        return valueB - valueA;
    });

    const setToPlay = possibleSets[0];
    console.log(`Pick set: [${setToPlay.map(t => `${t.color[0]}${t.number}`).join(',')}] = ${RummikubRules.calculateValue(setToPlay)} pts`);
    setsToPlay.push(setToPlay);

    setToPlay.forEach(tile => {
        const index = remainingRack.findIndex(t => t.instanceId === tile.instanceId);
        if (index !== -1) {
            remainingRack.splice(index, 1);
        }
    });
}

const totalValue = setsToPlay.reduce((sum, set) =>
    sum + RummikubRules.calculateValue(set), 0);

console.log(`\nTotal value: ${totalValue} points`);

if (!computerHasMelded) {
    if (totalValue >= requirement) {
        console.log(`Result: PLAY ALL SETS (total >= ${requirement})`);
    } else {
        console.log(`Result: DRAW (total < ${requirement})`);
    }
}
