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

function canMeldOldLogic(tiles) {
    // OLD BROKEN LOGIC: Filter for 30+ on first iteration
    const requirement = 30;
    const setsToPlay = [];
    let remainingRack = [...tiles];

    while (true) {
        const possibleSets = RummikubRules.findPossibleSets(remainingRack);

        let validSets = possibleSets;
        if (setsToPlay.length === 0) {
            validSets = possibleSets.filter(set =>
                RummikubRules.calculateValue(set) >= requirement
            );
        }

        if (validSets.length === 0) break;

        const setToPlay = validSets[0];
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

    return totalValue >= 30;
}

function canMeldNewLogic(tiles) {
    // NEW FIXED LOGIC: Collect all sets, then check total
    const requirement = 30;
    const setsToPlay = [];
    let remainingRack = [...tiles];

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

    if (setsToPlay.length === 0) return false;

    const totalValue = setsToPlay.reduce((sum, set) =>
        sum + RummikubRules.calculateValue(set), 0);

    return totalValue >= 30;
}

// Test on many random hands
const numTests = 1000;
let oldCanMeld = 0;
let newCanMeld = 0;
let newBetter = 0;

for (let i = 0; i < numTests; i++) {
    const pouch = createAllTiles();
    shuffle(pouch);

    const hand = [];
    for (let j = 0; j < 14; j++) {
        hand.push(pouch.pop());
    }

    const old = canMeldOldLogic(hand);
    const newLogic = canMeldNewLogic(hand);

    if (old) oldCanMeld++;
    if (newLogic) newCanMeld++;
    if (newLogic && !old) newBetter++;
}

console.log(`Tested ${numTests} random 14-tile starting hands:\n`);
console.log(`OLD LOGIC (broken): ${oldCanMeld} can meld (${(oldCanMeld/numTests*100).toFixed(1)}%)`);
console.log(`NEW LOGIC (fixed):  ${newCanMeld} can meld (${(newCanMeld/numTests*100).toFixed(1)}%)`);
console.log(`\nImprovement: ${newBetter} additional hands can now meld (+${(newBetter/numTests*100).toFixed(1)}%)`);
console.log(`Relative improvement: ${((newCanMeld - oldCanMeld) / oldCanMeld * 100).toFixed(1)}% more successful`);
