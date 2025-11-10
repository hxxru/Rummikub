#!/usr/bin/env node

/**
 * Debug a single game to see what's happening
 */

import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { RandomAI } from '../src/js/ai/RandomAI.js';
import { GreedyAI } from '../src/js/ai/GreedyAI.js';

// Simplified game  logic
class DebugGame {
    constructor() {
        this.pouch = this.createAllTiles();
        this.shuffle(this.pouch);

        this.rack1 = [];
        this.rack2 = [];

        for (let i = 0; i < 14; i++) {
            this.rack1.push(this.pouch.pop());
            this.rack2.push(this.pouch.pop());
        }

        this.runs = Array(10).fill(null).map(() => []);
        this.groups = Array(16).fill(null).map(() => []);
        this.melded1 = false;
        this.melded2 = false;
    }

    createAllTiles() {
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

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

const game = new DebugGame();
const ai1 = new RandomAI();

console.log('Player 1 starting hand:');
game.rack1.forEach(t => console.log(`  ${t.color} ${t.number}`));

const sets = RummikubRules.findPossibleSets(game.rack1);
console.log(`\nFound ${sets.length} possible sets`);

const validSets = sets.filter(s => RummikubRules.calculateValue(s) >= 30);
console.log(`Sets with 30+ points: ${validSets.length}`);

if (validSets.length > 0) {
    console.log('\nValid initial melds:');
    validSets.forEach((set, i) => {
        const value = RummikubRules.calculateValue(set);
        const type = RummikubRules.isValidRun(set) ? 'run' : 'group';
        console.log(`  ${i + 1}. ${type} (value: ${value}): ${set.map(t => `${t.color} ${t.number}`).join(', ')}`);
    });
} else {
    console.log('\nNo valid initial meld possible!');
    console.log('Player would need to keep drawing...');
}

// Try AI decision
ai1.delay = async () => {};
const stateView = {
    computerRack: game.rack1,
    runs: game.runs,
    groups: game.groups,
    computerHasMelded: false,
    pouch: game.pouch
};

const move = await ai1.makeMove(stateView);
console.log(`\nAI decision: ${move.action}`);
if (move.action === 'play') {
    console.log(`  Tiles: ${move.tiles.map(t => `${t.color} ${t.number}`).join(', ')}`);
}
