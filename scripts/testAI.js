#!/usr/bin/env node

/**
 * Quick test to debug AI behavior
 */

import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { RandomAI } from '../src/js/ai/RandomAI.js';

// Create a test hand with tiles that should make a valid set
const tiles = [];

// Add a run: black 5,6,7
tiles.push(Tile.fromId('1-05')); // black 5
tiles.push(Tile.fromId('1-06')); // black 6
tiles.push(Tile.fromId('1-07')); // black 7
tiles.push(Tile.fromId('1-08')); // black 8

// Add a group: 9s in different colors
tiles.push(Tile.fromId('1-09')); // black 9
tiles.push(Tile.fromId('2-09')); // blue 9
tiles.push(Tile.fromId('3-09')); // orange 9

// Add some random tiles
tiles.push(Tile.fromId('4-0d')); // red 13
tiles.push(Tile.fromId('2-01')); // blue 1
tiles.push(Tile.fromId('3-02')); // orange 2

console.log('Test hand:');
tiles.forEach(t => console.log(`  ${t.color} ${t.number}`));
console.log();

// Test finding possible sets
const sets = RummikubRules.findPossibleSets(tiles);
console.log(`Found ${sets.length} possible sets:`);
sets.forEach((set, i) => {
    const value = RummikubRules.calculateValue(set);
    const type = RummikubRules.isValidRun(set) ? 'run' : 'group';
    console.log(`  ${i + 1}. ${type} (value: ${value}): ${set.map(t => `${t.color} ${t.number}`).join(', ')}`);
});

console.log();
console.log(`Sets with 30+ points: ${sets.filter(s => RummikubRules.calculateValue(s) >= 30).length}`);
