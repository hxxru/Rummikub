import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { RandomAI } from '../src/js/ai/RandomAI.js';

// Create the same test hand
const rack = [];
rack.push(Tile.fromId('1-0a')); // black 10
rack.push(Tile.fromId('2-0a')); // blue 10
rack.push(Tile.fromId('3-0a')); // orange 10
rack.push(Tile.fromId('1-03')); // black 3
rack.push(Tile.fromId('1-04')); // black 4
rack.push(Tile.fromId('1-05')); // black 5

console.log('Starting rack:', rack.map(t => `${t.color} ${t.number}`).join(', '));

// Simulate AI logic manually
const setsToPlay = [];
let remainingRack = [...rack];
const requirement = 30;
const computerHasMelded = false;

console.log('\n=== Iteration 1 ===');
let possibleSets = RummikubRules.findPossibleSets(remainingRack);
console.log(`Found ${possibleSets.length} possible sets`);

let validSets = possibleSets;
console.log(`computerHasMelded: ${computerHasMelded}, setsToPlay.length: ${setsToPlay.length}`);
if (!computerHasMelded && setsToPlay.length === 0) {
    console.log('Filtering for 30+ points...');
    validSets = possibleSets.filter(set =>
        RummikubRules.calculateValue(set) >= requirement
    );
}
console.log(`Valid sets after filter: ${validSets.length}`);

if (validSets.length > 0) {
    const setToPlay = validSets[0];
    console.log(`Playing set: ${setToPlay.map(t => `${t.color} ${t.number}`).join(', ')} (${RummikubRules.calculateValue(setToPlay)} pts)`);
    setsToPlay.push(setToPlay);

    setToPlay.forEach(tile => {
        const index = remainingRack.findIndex(t => t.instanceId === tile.instanceId);
        if (index !== -1) {
            remainingRack.splice(index, 1);
        }
    });
}

console.log(`\nRemaining rack: ${remainingRack.map(t => `${t.color} ${t.number}`).join(', ')}`);

console.log('\n=== Iteration 2 ===');
possibleSets = RummikubRules.findPossibleSets(remainingRack);
console.log(`Found ${possibleSets.length} possible sets from remaining tiles`);

validSets = possibleSets;
console.log(`computerHasMelded: ${computerHasMelded}, setsToPlay.length: ${setsToPlay.length}`);
if (!computerHasMelded && setsToPlay.length === 0) {
    console.log('Filtering for 30+ points...');
    validSets = possibleSets.filter(set =>
        RummikubRules.calculateValue(set) >= requirement
    );
} else {
    console.log('NOT filtering - can play any set now!');
}
console.log(`Valid sets after filter: ${validSets.length}`);

if (validSets.length > 0) {
    const setToPlay = validSets[0];
    console.log(`Playing set: ${setToPlay.map(t => `${t.color} ${t.number}`).join(', ')} (${RummikubRules.calculateValue(setToPlay)} pts)`);
    setsToPlay.push(setToPlay);
}

console.log(`\n=== RESULT ===`);
console.log(`Total sets to play: ${setsToPlay.length}`);
let totalValue = 0;
setsToPlay.forEach((set, i) => {
    const val = RummikubRules.calculateValue(set);
    totalValue += val;
    console.log(`  Set ${i+1}: ${set.map(t => `${t.color} ${t.number}`).join(', ')} (${val} pts)`);
});
console.log(`Total value: ${totalValue} points`);
console.log(`Can meld: ${totalValue >= 30 ? 'YES' : 'NO'}`);
