import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { UltraAI } from '../src/js/ai/UltraAI.js';

const INITIAL_MELD_REQUIREMENT = 30;

console.log('=== Test 1: Total Rebuild Strategy ===\n');

// Set up scenario with multiple table sets and hand tiles
const gameState1 = {
    computerRack: [],
    playerRack: [],
    runs: [[], [], []],
    groups: [[], []],
    computerHasMelded: true,
    playerHasMelded: true,
    pouch: [],
    initialMeldRequirement: INITIAL_MELD_REQUIREMENT
};

// Table has some sets
gameState1.runs[0] = [
    Tile.fromId('1-03'), // black 3
    Tile.fromId('1-04'), // black 4
    Tile.fromId('1-05')  // black 5
];

gameState1.groups[0] = [
    Tile.fromId('2-07'), // blue 7
    Tile.fromId('3-07'), // orange 7
    Tile.fromId('4-07')  // red 7
];

// Hand has tiles that could combine with table for better arrangement
gameState1.computerRack = [
    Tile.fromId('1-06'), // black 6 (extends run)
    Tile.fromId('1-07'), // black 7 (extends run further)
    Tile.fromId('1-08'), // black 8
    Tile.fromId('1-09'), // black 9
    Tile.fromId('2-05'), // blue 5
    Tile.fromId('3-05')  // orange 5
];

console.log('Table:');
console.log('  Run 1:', gameState1.runs[0].map(t => `${t.color[0]}${t.number}`).join(','));
console.log('  Group 1:', gameState1.groups[0].map(t => `${t.color[0]}${t.number}`).join(','));
console.log('\nHand:', gameState1.computerRack.map(t => `${t.color[0]}${t.number}`).join(', '));
console.log('\nUltraAI should combine all to make optimal sets\n');

const ai = new UltraAI();
ai.delay = async () => {};

const move1 = await ai.makeMove(gameState1);

console.log('Decision:', move1.action);
if (move1.action === 'totalRebuild') {
    console.log('New sets created:');
    move1.newSets.forEach((set, i) => {
        const value = RummikubRules.calculateValue(set);
        const type = RummikubRules.isValidRun(set) ? 'run' : 'group';
        console.log(`  ${i + 1}. ${type}: [${set.map(t => `${t.color[0]}${t.number}`).join(',')}] (${value} pts)`);
    });

    const handTilesInSets = move1.newSets.reduce((count, set) =>
        count + set.filter(t => gameState1.computerRack.find(r => r.instanceId === t.instanceId)).length, 0
    );
    console.log(`\nHand tiles played: ${handTilesInSets}`);
    console.log('✓ Total rebuild strategy working!');
} else {
    console.log('Used fallback strategy:', move1.action);
}

console.log('\n\n=== Test 2: Multi-Run Rearrangement ===\n');

const gameState2 = {
    computerRack: [],
    playerRack: [],
    runs: [[], [], []],
    groups: [[]],
    computerHasMelded: true,
    playerHasMelded: true,
    pouch: [],
    initialMeldRequirement: INITIAL_MELD_REQUIREMENT
};

// Two short runs of same color
gameState2.runs[0] = [
    Tile.fromId('1-03'), // black 3
    Tile.fromId('1-04'), // black 4
    Tile.fromId('1-05')  // black 5
];

gameState2.runs[1] = [
    Tile.fromId('1-08'), // black 8
    Tile.fromId('1-09'), // black 9
    Tile.fromId('1-0a')  // black 10
];

// Hand has the connecting tiles!
gameState2.computerRack = [
    Tile.fromId('1-06'), // black 6 (connects the runs!)
    Tile.fromId('1-07'), // black 7 (connects!)
    Tile.fromId('2-01'),
    Tile.fromId('3-02')
];

console.log('Table:');
console.log('  Run 1:', gameState2.runs[0].map(t => `${t.color[0]}${t.number}`).join(','));
console.log('  Run 2:', gameState2.runs[1].map(t => `${t.color[0]}${t.number}`).join(','));
console.log('\nHand:', gameState2.computerRack.map(t => `${t.color[0]}${t.number}`).join(', '));
console.log('\nUltraAI should combine into one long run [3,4,5,6,7,8,9,10]\n');

const move2 = await ai.makeMove(gameState2);

console.log('Decision:', move2.action);
if (move2.action === 'multiSetRearrange' || move2.action === 'totalRebuild') {
    if (move2.action === 'multiSetRearrange') {
        console.log('Operations:');
        move2.operations.forEach(op => {
            console.log(`  - ${op.type}`);
            if (op.type === 'addNewSets') {
                op.sets.forEach(set => {
                    console.log(`    [${set.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
                });
            }
        });
    } else {
        console.log('Rebuilt to:', move2.newSets.map(s =>
            `[${s.map(t => `${t.color[0]}${t.number}`).join(',')}]`
        ).join(', '));
    }
    console.log('✓ Multi-run rearrangement working!');
} else {
    console.log('Action:', move2.action);
}

console.log('\n\n=== Test 3: Endgame Scenario ===\n');

const gameState3 = {
    computerRack: [],
    playerRack: [],
    runs: [[], []],
    groups: [[]],
    computerHasMelded: true,
    playerHasMelded: true,
    pouch: [],
    initialMeldRequirement: INITIAL_MELD_REQUIREMENT
};

// Table has a run
gameState3.runs[0] = [
    Tile.fromId('2-05'), // blue 5
    Tile.fromId('2-06'), // blue 6
    Tile.fromId('2-07'), // blue 7
    Tile.fromId('2-08')  // blue 8
];

// Player has just 3 tiles left that don't form a set alone
gameState3.computerRack = [
    Tile.fromId('2-04'), // blue 4 (extends run!)
    Tile.fromId('3-01'), // orange 1
    Tile.fromId('4-02')  // red 2
];

console.log('ENDGAME: Player down to 3 tiles!');
console.log('Table run:', gameState3.runs[0].map(t => `${t.color[0]}${t.number}`).join(','));
console.log('Hand (3 tiles):', gameState3.computerRack.map(t => `${t.color[0]}${t.number}`).join(', '));
console.log('\nUltraAI should play the blue 4, getting down to 2 tiles\n');

const move3 = await ai.makeMove(gameState3);

console.log('Decision:', move3.action);
if (move3.action !== 'draw') {
    console.log('✓ Found a play in endgame!');
    const tilesPlayed = gameState3.computerRack.filter(t =>
        move3.action === 'playMultiple' && move3.manipulations?.some(m =>
            m.tiles?.find(mt => mt.instanceId === t.instanceId)
        )
    ).length;
    console.log(`Tiles played: ${tilesPlayed}, Remaining: ${3 - tilesPlayed}`);
} else {
    console.log('⚠️  Drew instead of playing');
}
