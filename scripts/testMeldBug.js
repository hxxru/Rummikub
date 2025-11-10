import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';

// Test case: hand that SHOULD be able to meld
const tiles = [];
// Add three 10s (30 points exactly)
tiles.push(Tile.fromId('1-0a')); // black 10
tiles.push(Tile.fromId('2-0a')); // blue 10
tiles.push(Tile.fromId('3-0a')); // orange 10
// Add a small run (3,4,5 = 12 points)
tiles.push(Tile.fromId('1-03')); // black 3
tiles.push(Tile.fromId('1-04')); // black 4
tiles.push(Tile.fromId('1-05')); // black 5

console.log('Hand:', tiles.map(t => `${t.color} ${t.number}`).join(', '));

const sets = RummikubRules.findPossibleSets(tiles);
console.log(`\nFound ${sets.length} sets:`);
sets.forEach((set, i) => {
    const value = RummikubRules.calculateValue(set);
    const type = RummikubRules.isValidRun(set) ? 'run' : 'group';
    console.log(`  ${i + 1}. ${type} (${value} pts): ${set.map(t => `${t.color} ${t.number}`).join(', ')}`);
});

// Check individual sets
const sets30Plus = sets.filter(s => RummikubRules.calculateValue(s) >= 30);
console.log(`\nSets with 30+ points individually: ${sets30Plus.length}`);

// Check combined value
let totalValue = 0;
sets.forEach(s => totalValue += RummikubRules.calculateValue(s));
console.log(`Total value if playing ALL sets: ${totalValue} points`);

// This is the problem!
console.log('\n** THE BUG **');
console.log('Group of 10s = 30 points (enough to meld!)');
console.log('Run of 3,4,5 = 12 points');
console.log('Combined = 42 points');
console.log('\nBut current AI logic checks if EACH set >= 30');
console.log('So it would reject the 12-point run even though combined meld is valid!');
