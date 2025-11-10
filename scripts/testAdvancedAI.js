import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { AdvancedAI } from '../src/js/ai/AdvancedAI.js';

const INITIAL_MELD_REQUIREMENT = 30;

// Set up a scenario where AdvancedAI can steal from a run
const gameState = {
    computerRack: [],
    playerRack: [],
    runs: [
        [] // Empty slots
    ],
    groups: [[]],
    computerHasMelded: true,
    playerHasMelded: true,
    pouch: [],
    initialMeldRequirement: INITIAL_MELD_REQUIREMENT
};

// Table has a long run: black 3,4,5,6,7
gameState.runs[0] = [
    Tile.fromId('1-03'), // black 3
    Tile.fromId('1-04'), // black 4
    Tile.fromId('1-05'), // black 5
    Tile.fromId('1-06'), // black 6
    Tile.fromId('1-07')  // black 7
];

// AI hand has tiles that could use stolen tiles
gameState.computerRack = [
    Tile.fromId('2-03'), // blue 3
    Tile.fromId('3-03'), // orange 3
    // No other playable sets from hand alone
    Tile.fromId('1-01'),
    Tile.fromId('2-09'),
    Tile.fromId('4-0c')
];

console.log('=== Test Scenario ===');
console.log('Table run:', gameState.runs[0].map(t => `${t.color[0]}${t.number}`).join(','));
console.log('AI hand:', gameState.computerRack.map(t => `${t.color[0]}${t.number}`).join(', '));
console.log('\nAdvancedAI should try to:');
console.log('  - Steal black 3 from table');
console.log('  - Make group [b3, b3, o3]');
console.log('  - Leave table with [b4, b5, b6, b7]');
console.log();

const ai = new AdvancedAI();
ai.delay = async () => {}; // No delay for testing

const move = await ai.makeMove(gameState);

console.log('=== AI Decision ===');
console.log('Action:', move.action);

if (move.action === 'complexManipulation') {
    console.log('\nOperations:');
    move.operations.forEach((op, i) => {
        console.log(`  ${i + 1}. ${op.type}`);
        if (op.type === 'modifyRun') {
            console.log(`     Run ${op.runIndex} → [${op.newTiles.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
        } else if (op.type === 'playSet') {
            console.log(`     Play [${op.set.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
        } else if (op.type === 'splitRun') {
            console.log(`     Split run ${op.runIndex}:`);
            console.log(`       Left: [${op.left.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
            console.log(`       Right: [${op.right.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
        }
    });
    console.log('\n✓ Advanced manipulation working!');
} else if (move.action === 'playMultiple') {
    if (move.sets && move.sets.length > 0) {
        console.log('Playing sets:', move.sets.map(s =>
            `[${s.map(t => `${t.color[0]}${t.number}`).join(',')}]`
        ).join(', '));
    }
    if (move.manipulations && move.manipulations.length > 0) {
        console.log('Simple manipulations:', move.manipulations.length);
    }
} else if (move.action === 'draw') {
    console.log('Drawing (no plays found)');
    console.log('⚠️  Advanced manipulation not triggered - may need more complex scenario');
}

// Test 2: Scenario with 4-tile group to steal from
console.log('\n\n=== Test Scenario 2: Stealing from Group ===');

const gameState2 = {
    computerRack: [],
    playerRack: [],
    runs: [[]],
    groups: [[]],
    computerHasMelded: true,
    playerHasMelded: true,
    pouch: [],
    initialMeldRequirement: INITIAL_MELD_REQUIREMENT
};

// Table has a 4-tile group: 10s in all colors
gameState2.groups[0] = [
    Tile.fromId('1-0a'), // black 10
    Tile.fromId('2-0a'), // blue 10
    Tile.fromId('3-0a'), // orange 10
    Tile.fromId('4-0a')  // red 10
];

// AI hand has tiles that could form a run with stolen 10
gameState2.computerRack = [
    Tile.fromId('1-09'), // black 9
    Tile.fromId('1-0b'), // black 11
    Tile.fromId('2-05'),
    Tile.fromId('3-01')
];

console.log('Table group:', gameState2.groups[0].map(t => `${t.color[0]}${t.number}`).join(','));
console.log('AI hand:', gameState2.computerRack.map(t => `${t.color[0]}${t.number}`).join(', '));
console.log('\nAdvancedAI should try to:');
console.log('  - Steal black 10 from group');
console.log('  - Make run [b9, b10, b11]');
console.log('  - Leave group with [b10, o10, r10]');
console.log();

const move2 = await ai.makeMove(gameState2);

console.log('=== AI Decision ===');
console.log('Action:', move2.action);

if (move2.action === 'complexManipulation') {
    console.log('\nOperations:');
    move2.operations.forEach((op, i) => {
        console.log(`  ${i + 1}. ${op.type}`);
        if (op.type === 'modifyGroup') {
            console.log(`     Group ${op.groupIndex} → [${op.newTiles.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
        } else if (op.type === 'playSet') {
            console.log(`     Play [${op.set.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
        }
    });
    console.log('\n✓ Advanced manipulation working!');
} else {
    console.log('Action:', move2.action);
    console.log('⚠️  No complex manipulation found');
}
