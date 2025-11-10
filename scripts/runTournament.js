#!/usr/bin/env node

/**
 * Tournament Runner - Runs AI vs AI matches and reports results
 * Run with: node scripts/runTournament.js [gamesPerMatchup]
 */

const INITIAL_MELD_REQUIREMENT = 30; // Standard Rummikub rule

import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { RandomAI } from '../src/js/ai/RandomAI.js';
import { GreedyAI } from '../src/js/ai/GreedyAI.js';
import { ValueAI } from '../src/js/ai/ValueAI.js';
import { SmartAI } from '../src/js/ai/SmartAI.js';
import { AdvancedAI } from '../src/js/ai/AdvancedAI.js';

class TournamentGame {
    constructor(ai1, ai2) {
        this.ai1 = ai1;
        this.ai2 = ai2;
        this.pouch = [];
        this.rack1 = [];
        this.rack2 = [];
        this.runs = Array(10).fill(null).map(() => []);
        this.groups = Array(16).fill(null).map(() => []);
        this.melded1 = false;
        this.melded2 = false;
        this.gameOver = false;
        this.winner = null;

        this.initializeGame();
    }

    createAllTiles() {
        const tiles = [];
        const rows = ['1', '2', '3', '4'];

        for (let set = 0; set < 2; set++) {
            rows.forEach(row => {
                for (let num = 1; num <= 13; num++) {
                    const hex = num.toString(16).padStart(2, '0');
                    const id = `${row}-${hex}`;
                    tiles.push(Tile.fromId(id));
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

    initializeGame() {
        this.pouch = this.createAllTiles();
        this.shuffle(this.pouch);

        for (let i = 0; i < 14; i++) {
            this.rack1.push(this.pouch.pop());
            this.rack2.push(this.pouch.pop());
        }
    }

    drawTile(player) {
        if (this.pouch.length === 0) return null;
        const tile = this.pouch.pop();
        if (player === 1) {
            this.rack1.push(tile);
        } else {
            this.rack2.push(tile);
        }
        return tile;
    }

    // Create a game state view for an AI
    createStateView(player) {
        return {
            computerRack: player === 1 ? this.rack1 : this.rack2,
            playerRack: player === 1 ? this.rack2 : this.rack1,
            runs: this.runs,
            groups: this.groups,
            computerHasMelded: player === 1 ? this.melded1 : this.melded2,
            playerHasMelded: player === 1 ? this.melded2 : this.melded1,
            pouch: this.pouch,
            initialMeldRequirement: INITIAL_MELD_REQUIREMENT  // Pass to AIs
        };
    }

    async playTurn(player, ai) {
        const stateView = this.createStateView(player);
        const move = await ai.makeMove(stateView);

        let tilesPlayed = 0;
        const rack = player === 1 ? this.rack1 : this.rack2;

        if (move.action === 'complexManipulation') {
            // Handle advanced table manipulation
            for (const op of move.operations) {
                if (op.type === 'modifyRun') {
                    this.runs[op.runIndex] = op.newTiles;
                } else if (op.type === 'modifyGroup') {
                    this.groups[op.groupIndex] = op.newTiles;
                } else if (op.type === 'splitRun') {
                    // Replace original run with left part
                    this.runs[op.runIndex] = op.left;
                    // Add right part to first empty slot
                    const emptyIndex = this.runs.findIndex(r => r.length === 0);
                    if (emptyIndex !== -1) {
                        this.runs[emptyIndex] = op.right;
                    }
                } else if (op.type === 'playSet') {
                    tilesPlayed += op.set.length;

                    // Remove from rack
                    op.set.forEach(tile => {
                        const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                        if (index !== -1) {
                            rack.splice(index, 1);
                        }
                    });

                    // Add to table
                    const isRun = RummikubRules.isValidRun(op.set);
                    if (isRun) {
                        const emptyIndex = this.runs.findIndex(r => r.length === 0);
                        if (emptyIndex !== -1) {
                            this.runs[emptyIndex] = op.set;
                        }
                    } else {
                        const emptyIndex = this.groups.findIndex(g => g.length === 0);
                        if (emptyIndex !== -1) {
                            this.groups[emptyIndex] = op.set;
                        }
                    }
                }
            }

            if (player === 1) {
                this.melded1 = true;
            } else {
                this.melded2 = true;
            }

            if (rack.length === 0) {
                this.gameOver = true;
                this.winner = player;
            }
        } else if (move.action === 'playMultiple') {
            // Apply manipulations first (SmartAI)
            if (move.manipulations) {
                for (const manip of move.manipulations) {
                    tilesPlayed += manip.tiles.length;

                    // Remove tiles from rack
                    manip.tiles.forEach(tile => {
                        const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                        if (index !== -1) {
                            rack.splice(index, 1);
                        }
                    });

                    // Apply manipulation
                    if (manip.type === 'extendRun') {
                        this.runs[manip.targetIndex].push(...manip.tiles);
                        this.runs[manip.targetIndex].sort((a, b) => a.number - b.number);
                    } else if (manip.type === 'addToGroup') {
                        this.groups[manip.targetIndex].push(...manip.tiles);
                    }
                }
            }

            // Play all new sets
            for (const set of move.sets) {
                tilesPlayed += set.length;

                // Remove tiles from rack
                set.forEach(tile => {
                    const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                    if (index !== -1) {
                        rack.splice(index, 1);
                    }
                });

                // Add to table
                const isRun = RummikubRules.isValidRun(set);
                if (isRun) {
                    const emptyIndex = this.runs.findIndex(r => r.length === 0);
                    if (emptyIndex !== -1) {
                        this.runs[emptyIndex] = set;
                        this.runs[emptyIndex].sort((a, b) => a.number - b.number);
                    }
                } else {
                    const emptyIndex = this.groups.findIndex(g => g.length === 0);
                    if (emptyIndex !== -1) {
                        this.groups[emptyIndex] = set;
                    }
                }
            }

            if (player === 1) {
                this.melded1 = true;
            } else {
                this.melded2 = true;
            }

            // Check win
            if (rack.length === 0) {
                this.gameOver = true;
                this.winner = player;
            }
        } else if (move.action === 'draw') {
            // Draw
            this.drawTile(player);
        }

        ai.recordMove(tilesPlayed);
        return tilesPlayed > 0;
    }

    async play() {
        let turnCount = 0;
        const maxTurns = 500; // Safety limit

        // Disable delays for fast play
        const origDelay1 = this.ai1.delay;
        const origDelay2 = this.ai2.delay;
        this.ai1.delay = async () => {};
        this.ai2.delay = async () => {};

        while (!this.gameOver && turnCount < maxTurns) {
            turnCount++;

            // Player 1 turn
            await this.playTurn(1, this.ai1);
            if (this.gameOver) break;

            // Player 2 turn
            await this.playTurn(2, this.ai2);
        }

        // Restore delays
        this.ai1.delay = origDelay1;
        this.ai2.delay = origDelay2;

        // Record results
        if (this.winner === 1) {
            this.ai1.recordGame(true);
            this.ai2.recordGame(false);
        } else if (this.winner === 2) {
            this.ai1.recordGame(false);
            this.ai2.recordGame(true);
        } else {
            // No winner - both lose (should be rare with proper AI)
            this.ai1.recordGame(false);
            this.ai2.recordGame(false);
        }

        return {
            winner: this.winner,
            turns: turnCount
        };
    }
}

class TournamentRunner {
    constructor(aiPlayers, gamesPerMatchup = 50) {
        this.aiPlayers = aiPlayers;
        this.gamesPerMatchup = gamesPerMatchup;
    }

    async runTournament() {
        console.log('='.repeat(60));
        console.log('RUMMIKUB AI TOURNAMENT');
        console.log('='.repeat(60));
        console.log(`Games per matchup: ${this.gamesPerMatchup}`);
        console.log(`Total AIs: ${this.aiPlayers.length}`);
        const totalGames = this.aiPlayers.length * (this.aiPlayers.length - 1) * this.gamesPerMatchup;
        console.log(`Total games: ${totalGames}`);
        console.log('='.repeat(60));
        console.log();

        // Reset all stats
        this.aiPlayers.forEach(ai => ai.resetStats());

        // Run each AI against every other AI
        for (let i = 0; i < this.aiPlayers.length; i++) {
            for (let j = 0; j < this.aiPlayers.length; j++) {
                if (i === j) continue;

                const ai1 = this.aiPlayers[i];
                const ai2 = this.aiPlayers[j];

                console.log(`Running ${this.gamesPerMatchup} games: ${ai1.name} vs ${ai2.name}...`);

                for (let game = 0; game < this.gamesPerMatchup; game++) {
                    const tournamentGame = new TournamentGame(ai1, ai2);
                    await tournamentGame.play();

                    if ((game + 1) % 10 === 0) {
                        process.stdout.write('.');
                    }
                }
                console.log(' Done!');
            }
        }

        console.log();
        this.printResults();
    }

    printResults() {
        console.log('='.repeat(60));
        console.log('TOURNAMENT RESULTS');
        console.log('='.repeat(60));
        console.log();

        // Sort by win rate
        const sortedAIs = [...this.aiPlayers].sort((a, b) => {
            return parseFloat(b.getWinRate()) - parseFloat(a.getWinRate());
        });

        console.log('Rank | AI Name      | Wins | Losses | Win Rate | Avg Tiles/Move');
        console.log('-'.repeat(60));

        sortedAIs.forEach((ai, index) => {
            const stats = ai.getStatsSummary();
            const rank = (index + 1).toString().padStart(4);
            const name = stats.name.padEnd(12);
            const wins = stats.wins.toString().padStart(4);
            const losses = stats.losses.toString().padStart(6);
            const winRate = (stats.winRate + '%').padStart(9);
            const avgTiles = stats.avgTilesPerMove.toString().padStart(16);

            console.log(`${rank} | ${name} | ${wins} | ${losses} | ${winRate} | ${avgTiles}`);
        });

        console.log('='.repeat(60));
        console.log();

        // Print detailed stats
        console.log('DETAILED STATISTICS:');
        console.log('-'.repeat(60));
        sortedAIs.forEach(ai => {
            const stats = ai.getStatsSummary();
            console.log(`\n${ai.name}:`);
            console.log(`  Description: ${ai.description}`);
            console.log(`  Total Games: ${stats.wins + stats.losses}`);
            console.log(`  Wins: ${stats.wins}`);
            console.log(`  Losses: ${stats.losses}`);
            console.log(`  Win Rate: ${stats.winRate}%`);
            console.log(`  Total Moves: ${stats.totalMoves}`);
            console.log(`  Total Draws: ${stats.totalDraws}`);
            console.log(`  Avg Tiles per Move: ${stats.avgTilesPerMove}`);
        });

        console.log();
        console.log('='.repeat(60));
    }
}

// Run the tournament
async function main() {
    const ais = [
        new RandomAI(),
        new GreedyAI(),
        new ValueAI(),
        new SmartAI(),
        new AdvancedAI()
    ];

    const gamesPerMatchup = parseInt(process.argv[2]) || 50;

    const tournament = new TournamentRunner(ais, gamesPerMatchup);
    await tournament.runTournament();
}

main().catch(console.error);
