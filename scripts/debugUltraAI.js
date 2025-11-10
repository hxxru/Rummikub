import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { UltraAI } from '../src/js/ai/UltraAI.js';

const INITIAL_MELD_REQUIREMENT = 30;

// Reproduce the exact stalemate scenario
const gameState = {
    computerRack: [],
    playerRack: [],
    runs: [[], [], [], [], [], [], [], [], [], []],
    groups: [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
    computerHasMelded: true,  // Important: already melded
    playerHasMelded: true,
    pouch: [],
    initialMeldRequirement: INITIAL_MELD_REQUIREMENT
};

// P1's rack from the stalemate
gameState.computerRack = [
    Tile.fromId('3-02'), // o2
    Tile.fromId('3-0a'), // o10
    Tile.fromId('1-06'), // b6
    Tile.fromId('1-02'), // b2
    Tile.fromId('3-0c'), // o12
    Tile.fromId('1-05'), // b5
    Tile.fromId('1-0b'), // b11
    Tile.fromId('3-0b'), // o11
    Tile.fromId('1-07'), // b7
    Tile.fromId('1-09'), // b9
    Tile.fromId('1-03'), // b3
    Tile.fromId('4-0d'), // r13
    Tile.fromId('1-03'), // b3 (duplicate)
    Tile.fromId('4-0c')  // r12
];

console.log('='.repeat(70));
console.log('DEBUGGING ULTRAAI - STALEMATE SCENARIO');
console.log('='.repeat(70));
console.log(`\nRack (${gameState.computerRack.length} tiles):`, gameState.computerRack.map(t => `${t.color[0]}${t.number}`).join(', '));
console.log('Table: empty');
console.log('Melded: true');
console.log('\nExpected: Should play [o10, o11, o12]\n');

// Test findPossibleSets directly
console.log('-'.repeat(70));
console.log('Testing RummikubRules.findPossibleSets:');
console.log('-'.repeat(70));

const possibleSets = RummikubRules.findPossibleSets(gameState.computerRack);
console.log(`Found ${possibleSets.length} possible sets:`);
possibleSets.forEach((set, i) => {
    const value = RummikubRules.calculateValue(set);
    const type = RummikubRules.isValidRun(set) ? 'run' : 'group';
    console.log(`  ${i + 1}. ${type}: [${set.map(t => `${t.color[0]}${t.number}`).join(',')}] (${value} pts)`);
});

// Test UltraAI decision
console.log('\n' + '-'.repeat(70));
console.log('Testing UltraAI.makeMove:');
console.log('-'.repeat(70));

const ai = new UltraAI();
ai.delay = async () => {};

const move = await ai.makeMove(gameState);

console.log(`\nDecision: ${move.action}`);

if (move.action === 'draw') {
    console.log('⚠️  BUG DETECTED: AI chose to draw instead of playing!');
    console.log('\nDebugging why AI didn\'t play...');

    // Test tryCompleteRebuild
    console.log('\n1. Testing tryCompleteRebuild (should be called first):');
    const allTableTiles = [];
    const result = ai.tryCompleteRebuild(gameState, gameState.computerRack, allTableTiles);
    if (result) {
        console.log('   ✓ Rebuild found solution:', result);
    } else {
        console.log('   ✗ Rebuild returned null');
    }

    // Test trySingleSetManipulations
    console.log('\n2. Testing trySingleSetManipulations (fallback):');
    const fallback = ai.trySingleSetManipulations(gameState, gameState.computerRack);
    if (fallback) {
        console.log('   ✓ Fallback found solution:', fallback.action);
    } else {
        console.log('   ✗ Fallback returned null');
    }

    // Check if the issue is with findBestMultiSetManipulation
    console.log('\n3. Testing findBestMultiSetManipulation:');
    const manipulation = ai.findBestMultiSetManipulation(gameState, gameState.computerRack);
    if (manipulation) {
        console.log('   ✓ Manipulation found:', manipulation.action);
    } else {
        console.log('   ✗ Manipulation returned null');
        console.log('   This means all strategies failed!');
    }

} else if (move.action === 'playMultiple') {
    console.log('✓ AI chose to play sets');
    if (move.sets) {
        console.log(`Sets to play: ${move.sets.length}`);
        move.sets.forEach(set => {
            console.log(`  [${set.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
        });
    }
} else if (move.action === 'totalRebuild') {
    console.log('✓ AI chose total rebuild');
    console.log(`New sets: ${move.newSets.length}`);
    move.newSets.forEach(set => {
        console.log(`  [${set.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
    });
} else {
    console.log(`Other action: ${move.action}`);
}

console.log('\n' + '='.repeat(70));
