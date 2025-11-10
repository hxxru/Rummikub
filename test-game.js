// Simple test to verify game logic
import { Tile } from './src/js/Tile.js';
import { RummikubRules } from './src/js/RummikubRules.js';
import { GameState } from './src/js/GameState.js';

console.log('🧪 Running Rummikub Game Tests...\n');

// Test 1: Tile creation
console.log('Test 1: Tile Creation');
const tile1 = Tile.fromId('1-01');
const tile2 = Tile.fromId('3-05');
console.log(`✓ Created tile: ${tile1.toString()}`);
console.log(`✓ Created tile: ${tile2.toString()}`);

// Test 2: Valid Run
console.log('\nTest 2: Valid Run');
const runTiles = [
    Tile.fromId('1-01'), // black 1
    Tile.fromId('1-02'), // black 2
    Tile.fromId('1-03')  // black 3
];
const isValidRun = RummikubRules.isValidRun(runTiles);
console.log(`Run [black 1, 2, 3]: ${isValidRun ? '✓ VALID' : '✗ INVALID'}`);

// Test 3: Valid Group
console.log('\nTest 3: Valid Group');
const groupTiles = [
    Tile.fromId('1-05'), // black 5
    Tile.fromId('3-05'), // blue 5
    Tile.fromId('5-05')  // orange 5
];
const isValidGroup = RummikubRules.isValidGroup(groupTiles);
console.log(`Group [black 5, blue 5, orange 5]: ${isValidGroup ? '✓ VALID' : '✗ INVALID'}`);

// Test 4: Invalid Run (not consecutive)
console.log('\nTest 4: Invalid Run (not consecutive)');
const invalidRun = [
    Tile.fromId('1-01'),
    Tile.fromId('1-03'),
    Tile.fromId('1-05')
];
const isInvalidRun = RummikubRules.isValidRun(invalidRun);
console.log(`Run [black 1, 3, 5]: ${isInvalidRun ? '✗ SHOULD BE INVALID' : '✓ CORRECTLY INVALID'}`);

// Test 5: Initial meld validation
console.log('\nTest 5: Initial Meld (30+ points)');
const meldSets = [
    [
        Tile.fromId('1-0a'), // black 10
        Tile.fromId('1-0b'), // black 11
        Tile.fromId('1-0c')  // black 12
    ]
];
const value = RummikubRules.calculateValue(meldSets[0]);
const isValidMeld = RummikubRules.isValidInitialMeld(meldSets);
console.log(`Meld value: ${value}, Valid (30+): ${isValidMeld ? '✓ YES' : '✗ NO'}`);

// Test 6: Game State Initialization
console.log('\nTest 6: Game State Initialization');
const game = new GameState();
const stats = game.getStats();
console.log(`✓ Player tiles: ${stats.playerTileCount}`);
console.log(`✓ Computer tiles: ${stats.computerTileCount}`);
console.log(`✓ Pouch tiles: ${stats.pouchCount}`);
console.log(`✓ Total tiles: ${stats.playerTileCount + stats.computerTileCount + stats.pouchCount}`);

// Test 7: Drawing tiles
console.log('\nTest 7: Drawing Tiles');
const initialPouchCount = game.pouch.length;
game.drawTile('player');
const newPouchCount = game.pouch.length;
console.log(`✓ Drew tile, pouch count: ${initialPouchCount} → ${newPouchCount}`);
console.log(`✓ Player tile count: ${game.playerRack.length}`);

console.log('\n✅ All tests completed!\n');
