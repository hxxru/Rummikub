/**
 * Head-to-head AI comparison framework
 * Tests two AI strategies against each other
 */

import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';

class HeadToHeadGame {
    constructor(ai1, ai2) {
        this.ai1 = ai1;
        this.ai2 = ai2;
        this.initializeGame();
    }

    initializeGame() {
        // Create full tile set (2 copies of each tile 1-13 in 4 colors, plus 2 jokers)
        this.pouch = [];
        const colors = ['red', 'blue', 'black', 'yellow'];

        for (let copy = 0; copy < 2; copy++) {
            for (let color of colors) {
                for (let number = 1; number <= 13; number++) {
                    this.pouch.push(new Tile(color, number));
                }
            }
            this.pouch.push(new Tile('joker', 0));
        }

        // Shuffle
        for (let i = this.pouch.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.pouch[i], this.pouch[j]] = [this.pouch[j], this.pouch[i]];
        }

        // Deal 14 tiles to each player
        this.rack1 = this.pouch.splice(0, 14);
        this.rack2 = this.pouch.splice(0, 14);

        // Initialize table
        this.runs = Array(10).fill(null).map(() => []);
        this.groups = Array(16).fill(null).map(() => []);

        // Game state
        this.hasMelded1 = false;
        this.hasMelded2 = false;
        this.turnCount = 0;
        this.maxTurns = 1000;
        this.consecutiveDraws = 0;
    }

    getAllTableTiles() {
        return [...this.runs.flat(), ...this.groups.flat()];
    }

    drawTile(rack) {
        if (this.pouch.length > 0) {
            rack.push(this.pouch.pop());
            return true;
        }
        return false;
    }

    async playTurn(ai, rack, hasMelded, playerNum) {
        const gameState = {
            computerRack: rack,
            computerHasMelded: hasMelded,
            runs: this.runs,
            groups: this.groups,
            pouch: this.pouch
        };

        const move = await ai.makeMove(gameState);
        let tilesPlayed = 0;

        if (move.action === 'totalRebuild') {
            // Clear table
            this.runs = Array(10).fill(null).map(() => []);
            this.groups = Array(16).fill(null).map(() => []);

            // Rebuild
            for (const set of move.newSets) {
                const handTiles = set.filter(t => rack.find(r => r.instanceId === t.instanceId));
                tilesPlayed += handTiles.length;

                // Remove from rack
                handTiles.forEach(tile => {
                    const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                    if (index !== -1) rack.splice(index, 1);
                });

                // Add to table
                const isRun = RummikubRules.isValidRun(set);
                if (isRun) {
                    const emptyIndex = this.runs.findIndex(r => r.length === 0);
                    if (emptyIndex !== -1) this.runs[emptyIndex] = set;
                } else {
                    const emptyIndex = this.groups.findIndex(g => g.length === 0);
                    if (emptyIndex !== -1) this.groups[emptyIndex] = set;
                }
            }

            this.consecutiveDraws = 0;
            return { played: true, tilesPlayed, hasMelded: true };

        } else if (move.action === 'playMultiple') {
            // Handle manipulations
            if (move.manipulations) {
                for (const manip of move.manipulations) {
                    tilesPlayed += manip.tiles.length;
                    manip.tiles.forEach(tile => {
                        const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                        if (index !== -1) rack.splice(index, 1);
                    });

                    if (manip.type === 'extendRun') {
                        this.runs[manip.targetIndex].push(...manip.tiles);
                        this.runs[manip.targetIndex].sort((a, b) => a.number - b.number);
                    } else if (manip.type === 'addToGroup') {
                        this.groups[manip.targetIndex].push(...manip.tiles);
                    }
                }
            }

            // Handle new sets
            if (move.sets) {
                for (const set of move.sets) {
                    tilesPlayed += set.length;
                    set.forEach(tile => {
                        const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                        if (index !== -1) rack.splice(index, 1);
                    });

                    const isRun = RummikubRules.isValidRun(set);
                    if (isRun) {
                        const emptyIndex = this.runs.findIndex(r => r.length === 0);
                        if (emptyIndex !== -1) {
                            this.runs[emptyIndex] = set;
                            this.runs[emptyIndex].sort((a, b) => a.number - b.number);
                        }
                    } else {
                        const emptyIndex = this.groups.findIndex(g => g.length === 0);
                        if (emptyIndex !== -1) this.groups[emptyIndex] = set;
                    }
                }
            }

            this.consecutiveDraws = 0;
            return { played: true, tilesPlayed, hasMelded: true };

        } else if (move.action === 'draw') {
            this.drawTile(rack);
            this.consecutiveDraws++;
            return { played: false, tilesPlayed: 0, hasMelded };
        }

        return { played: false, tilesPlayed: 0, hasMelded };
    }

    async playGame() {
        while (this.turnCount < this.maxTurns) {
            this.turnCount++;

            // Player 1 turn
            const result1 = await this.playTurn(this.ai1, this.rack1, this.hasMelded1, 1);
            if (result1.hasMelded) this.hasMelded1 = true;

            if (this.rack1.length === 0) {
                return { winner: 'ai1', turns: this.turnCount, decisive: true };
            }

            // Player 2 turn
            const result2 = await this.playTurn(this.ai2, this.rack2, this.hasMelded2, 2);
            if (result2.hasMelded) this.hasMelded2 = true;

            if (this.rack2.length === 0) {
                return { winner: 'ai2', turns: this.turnCount, decisive: true };
            }

            // Check for stalemate (both drawing for 20 consecutive turns)
            if (this.consecutiveDraws >= 40 || this.pouch.length === 0) {
                return { winner: 'draw', turns: this.turnCount, decisive: false };
            }
        }

        return { winner: 'draw', turns: this.maxTurns, decisive: false };
    }
}

async function runHeadToHead(AI1Class, AI2Class, numGames, ai1Name, ai2Name) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`HEAD-TO-HEAD: ${ai1Name} vs ${ai2Name}`);
    console.log(`${'='.repeat(70)}\n`);

    let ai1Wins = 0;
    let ai2Wins = 0;
    let draws = 0;
    let decisiveGames = 0;
    let totalTurns = 0;

    for (let i = 0; i < numGames; i++) {
        const ai1 = new AI1Class();
        const ai2 = new AI2Class();

        // Disable delays for fast play
        ai1.delay = async () => {};
        ai2.delay = async () => {};

        const game = new HeadToHeadGame(ai1, ai2);
        const result = await game.playGame();

        if (result.decisive) decisiveGames++;
        totalTurns += result.turns;

        if (result.winner === 'ai1') {
            ai1Wins++;
        } else if (result.winner === 'ai2') {
            ai2Wins++;
        } else {
            draws++;
        }

        if ((i + 1) % 10 === 0) {
            process.stdout.write(`\rProgress: ${i + 1}/${numGames} games`);
        }
    }

    console.log(`\n\n${'='.repeat(70)}`);
    console.log('RESULTS');
    console.log(`${'='.repeat(70)}`);
    console.log(`${ai1Name} wins: ${ai1Wins} (${(ai1Wins/numGames*100).toFixed(1)}%)`);
    console.log(`${ai2Name} wins: ${ai2Wins} (${(ai2Wins/numGames*100).toFixed(1)}%)`);
    console.log(`Draws: ${draws} (${(draws/numGames*100).toFixed(1)}%)`);
    console.log(`Decisive games: ${decisiveGames}/${numGames} (${(decisiveGames/numGames*100).toFixed(1)}%)`);
    console.log(`Average turns: ${(totalTurns/numGames).toFixed(1)}`);
    console.log(`${'='.repeat(70)}\n`);

    return {
        ai1Wins,
        ai2Wins,
        draws,
        decisiveRate: decisiveGames / numGames,
        avgTurns: totalTurns / numGames
    };
}

export { runHeadToHead, HeadToHeadGame };
