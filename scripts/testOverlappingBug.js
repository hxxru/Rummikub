import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';

// Create a hand where greedy picking fails to reach 30
const tiles = [];
// Black run: 5,6,7 (18 pts)
tiles.push(Tile.fromId('1-05')); // black 5
tiles.push(Tile.fromId('1-06')); // black 6
tiles.push(Tile.fromId('1-07')); // black 7
// Blue run: 5,6,7 (18 pts)
tiles.push(Tile.fromId('2-05')); // blue 5
tiles.push(Tile.fromId('2-06')); // blue 6
tiles.push(Tile.fromId('2-07')); // blue 7

console.log('Hand: black 5,6,7 + blue 5,6,7');
console.log('Optimal: play both runs = 36 points (can meld!)');

// What does findPossibleSets return?
const allSets = RummikubRules.findPossibleSets(tiles);
console.log(`\nfindPossibleSets found ${allSets.length} sets:`);
allSets.forEach((set, i) => {
    const value = RummikubRules.calculateValue(set);
    console.log(`  ${i + 1}. [${set.map(t => `${t.color[0]}${t.number}`).join(',')}] = ${value} pts`);
});

// What does greedy algorithm do?
console.log('\n--- Greedy algorithm (pick first, remove tiles, repeat) ---');
let remainingTiles = [...tiles];
const setsToPlay = [];

while (true) {
    const possibleSets = RummikubRules.findPossibleSets(remainingTiles);
    if (possibleSets.length === 0) break;

    const setToPlay = possibleSets[0];
    console.log(`Pick: [${setToPlay.map(t => `${t.color[0]}${t.number}`).join(',')}] = ${RummikubRules.calculateValue(setToPlay)} pts`);
    setsToPlay.push(setToPlay);

    setToPlay.forEach(tile => {
        const index = remainingTiles.findIndex(t => t.instanceId === tile.instanceId);
        if (index !== -1) {
            remainingTiles.splice(index, 1);
        }
    });
}

const totalValue = setsToPlay.reduce((sum, set) => sum + RummikubRules.calculateValue(set), 0);
console.log(`\nTotal value: ${totalValue} points`);
console.log(`Can meld: ${totalValue >= 30 ? 'YES' : 'NO'}`);

// Now test with a hand that has overlapping possibilities
console.log('\n\n=== TEST 2: Overlapping groups ===');
const tiles2 = [];
// Three 10s (30 pts exactly)
tiles2.push(Tile.fromId('1-0a')); // black 10
tiles2.push(Tile.fromId('2-0a')); // blue 10
tiles2.push(Tile.fromId('3-0a')); // orange 10
// Two 5s (not enough for a group)
tiles2.push(Tile.fromId('1-05')); // black 5
tiles2.push(Tile.fromId('2-05')); // blue 5

console.log('Hand: three 10s + two 5s');
console.log('Expected: play group of 10s = 30 points (can meld!)');

const allSets2 = RummikubRules.findPossibleSets(tiles2);
console.log(`\nfindPossibleSets found ${allSets2.length} sets:`);
allSets2.forEach((set, i) => {
    const value = RummikubRules.calculateValue(set);
    console.log(`  ${i + 1}. [${set.map(t => `${t.color[0]}${t.number}`).join(',')}] = ${value} pts`);
});

remainingTiles = [...tiles2];
const setsToPlay2 = [];

while (true) {
    const possibleSets = RummikubRules.findPossibleSets(remainingTiles);
    if (possibleSets.length === 0) break;

    const setToPlay = possibleSets[0];
    console.log(`Pick: [${setToPlay.map(t => `${t.color[0]}${t.number}`).join(',')}] = ${RummikubRules.calculateValue(setToPlay)} pts`);
    setsToPlay2.push(setToPlay);

    setToPlay.forEach(tile => {
        const index = remainingTiles.findIndex(t => t.instanceId === tile.instanceId);
        if (index !== -1) {
            remainingTiles.splice(index, 1);
        }
    });
}

const totalValue2 = setsToPlay2.reduce((sum, set) => sum + RummikubRules.calculateValue(set), 0);
console.log(`\nTotal value: ${totalValue2} points`);
console.log(`Can meld: ${totalValue2 >= 30 ? 'YES' : 'NO'}`);
