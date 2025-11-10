import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { UltraAI } from '../src/js/ai/UltraAI.js';

const INITIAL_MELD_REQUIREMENT = 30;

class DetailedTournamentGame {
    constructor() {
        this.pouch = [];
        this.rack1 = [];
        this.rack2 = [];
        this.runs = Array(10).fill(null).map(() => []);
        this.groups = Array(16).fill(null).map(() => []);
        this.melded1 = false;
        this.melded2 = false;
        this.gameOver = false;
        this.winner = null;
        this.turnCount = 0;
        this.gameTrace = [];

        this.ai1 = new UltraAI();
        this.ai2 = new UltraAI();

        this.initializeGame();
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

    initializeGame() {
        this.pouch = this.createAllTiles();
        this.shuffle(this.pouch);

        for (let i = 0; i < 14; i++) {
            this.rack1.push(this.pouch.pop());
            this.rack2.push(this.pouch.pop());
        }
    }

    createStateView(player) {
        return {
            computerRack: player === 1 ? this.rack1 : this.rack2,
            playerRack: player === 1 ? this.rack2 : this.rack1,
            runs: this.runs,
            groups: this.groups,
            computerHasMelded: player === 1 ? this.melded1 : this.melded2,
            playerHasMelded: player === 1 ? this.melded2 : this.melded1,
            pouch: this.pouch,
            initialMeldRequirement: INITIAL_MELD_REQUIREMENT
        };
    }

    async playTurn(player, ai) {
        const stateView = this.createStateView(player);
        const move = await ai.makeMove(stateView);

        const rack = player === 1 ? this.rack1 : this.rack2;
        const rackBefore = rack.length;
        let action = move.action;
        let tilesPlayed = 0;

        if (move.action === 'totalRebuild') {
            const handTilesBefore = rack.length;

            this.runs = Array(10).fill(null).map(() => []);
            this.groups = Array(16).fill(null).map(() => []);

            for (const set of move.newSets) {
                const handTiles = set.filter(t => rack.find(r => r.instanceId === t.instanceId));
                tilesPlayed += handTiles.length;

                handTiles.forEach(tile => {
                    const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                    if (index !== -1) {
                        rack.splice(index, 1);
                    }
                });

                const isRun = RummikubRules.isValidRun(set);
                if (isRun) {
                    const emptyIndex = this.runs.findIndex(r => r.length === 0);
                    if (emptyIndex !== -1) {
                        this.runs[emptyIndex] = set;
                    }
                } else {
                    const emptyIndex = this.groups.findIndex(g => g.length === 0);
                    if (emptyIndex !== -1) {
                        this.groups[emptyIndex] = set;
                    }
                }
            }

            if (player === 1) this.melded1 = true;
            else this.melded2 = true;

            if (rack.length === 0) {
                this.gameOver = true;
                this.winner = player;
            }
        } else if (move.action === 'multiSetRearrange') {
            for (const op of move.operations) {
                if (op.type === 'clearRuns') {
                    op.indices.forEach(idx => this.runs[idx] = []);
                } else if (op.type === 'clearGroups') {
                    op.indices.forEach(idx => this.groups[idx] = []);
                } else if (op.type === 'addNewSets') {
                    for (const set of op.sets) {
                        const handTiles = set.filter(t => rack.find(r => r.instanceId === t.instanceId));
                        tilesPlayed += handTiles.length;

                        handTiles.forEach(tile => {
                            const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                            if (index !== -1) {
                                rack.splice(index, 1);
                            }
                        });

                        const isRun = RummikubRules.isValidRun(set);
                        if (isRun) {
                            const emptyIndex = this.runs.findIndex(r => r.length === 0);
                            if (emptyIndex !== -1) {
                                this.runs[emptyIndex] = set;
                            }
                        } else {
                            const emptyIndex = this.groups.findIndex(g => g.length === 0);
                            if (emptyIndex !== -1) {
                                this.groups[emptyIndex] = set;
                            }
                        }
                    }
                }
            }

            if (player === 1) this.melded1 = true;
            else this.melded2 = true;

            if (rack.length === 0) {
                this.gameOver = true;
                this.winner = player;
            }
        } else if (move.action === 'playMultiple') {
            if (move.manipulations) {
                for (const manip of move.manipulations) {
                    tilesPlayed += manip.tiles.length;
                    manip.tiles.forEach(tile => {
                        const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                        if (index !== -1) {
                            rack.splice(index, 1);
                        }
                    });

                    if (manip.type === 'extendRun') {
                        this.runs[manip.targetIndex].push(...manip.tiles);
                        this.runs[manip.targetIndex].sort((a, b) => a.number - b.number);
                    } else if (manip.type === 'addToGroup') {
                        this.groups[manip.targetIndex].push(...manip.tiles);
                    }
                }
            }

            if (move.sets) {
                for (const set of move.sets) {
                    tilesPlayed += set.length;
                    set.forEach(tile => {
                        const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                        if (index !== -1) {
                            rack.splice(index, 1);
                        }
                    });

                    const isRun = RummikubRules.isValidRun(set);
                    if (isRun) {
                        const emptyIndex = this.runs.findIndex(r => r.length === 0);
                        if (emptyIndex !== -1) {
                            this.runs[emptyIndex] = set;
                        }
                    } else {
                        const emptyIndex = this.groups.findIndex(g => g.length === 0);
                        if (emptyIndex !== -1) {
                            this.groups[emptyIndex] = set;
                        }
                    }
                }
            }

            if (player === 1) this.melded1 = true;
            else this.melded2 = true;

            if (rack.length === 0) {
                this.gameOver = true;
                this.winner = player;
            }
        } else if (move.action === 'draw') {
            const tile = this.pouch.pop();
            if (tile) rack.push(tile);
        }

        return { action, rackBefore, rackAfter: rack.length, tilesPlayed };
    }

    async play() {
        const maxTurns = 500;

        this.ai1.delay = async () => {};
        this.ai2.delay = async () => {};

        while (!this.gameOver && this.turnCount < maxTurns) {
            this.turnCount++;

            const p1Move = await this.playTurn(1, this.ai1);
            this.gameTrace.push({
                turn: this.turnCount,
                player: 1,
                ...p1Move,
                pouch: this.pouch.length
            });

            if (this.gameOver) break;

            const p2Move = await this.playTurn(2, this.ai2);
            this.gameTrace.push({
                turn: this.turnCount,
                player: 2,
                ...p2Move,
                pouch: this.pouch.length
            });
        }

        return {
            winner: this.winner,
            turns: this.turnCount,
            finalRack1: this.rack1.length,
            finalRack2: this.rack2.length,
            pouchRemaining: this.pouch.length,
            trace: this.gameTrace
        };
    }
}

// Run experiments
async function runExperiments() {
    const numGames = 50;
    const results = [];
    let decisiveGames = 0;
    let totalTurns = 0;
    let totalDraws = 0;
    let totalMoves = 0;

    console.log('='.repeat(60));
    console.log('ULTRA AI vs ULTRA AI - EXPERIMENT');
    console.log('='.repeat(60));
    console.log(`Running ${numGames} games...\n`);

    for (let i = 0; i < numGames; i++) {
        const game = new DetailedTournamentGame();
        const result = await game.play();
        results.push(result);

        if (result.winner) {
            decisiveGames++;
        }

        totalTurns += result.turns;
        totalDraws += result.trace.filter(t => t.action === 'draw').length;
        totalMoves += result.trace.length;

        if ((i + 1) % 10 === 0) {
            process.stdout.write('.');
        }
    }

    console.log(' Done!\n');

    // Statistics
    console.log('='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));
    console.log(`Total games: ${numGames}`);
    console.log(`Decisive games: ${decisiveGames} (${(decisiveGames/numGames*100).toFixed(1)}%)`);
    console.log(`Non-decisive: ${numGames - decisiveGames} (${((numGames-decisiveGames)/numGames*100).toFixed(1)}%)`);
    console.log(`Average turns: ${(totalTurns/numGames).toFixed(1)}`);
    console.log(`Draw rate: ${(totalDraws/totalMoves*100).toFixed(1)}%`);

    // Analyze non-decisive games
    const nonDecisive = results.filter(r => !r.winner);
    if (nonDecisive.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('NON-DECISIVE GAME ANALYSIS');
        console.log('='.repeat(60));

        console.log(`\nAnalyzing ${Math.min(5, nonDecisive.length)} non-decisive games:\n`);

        for (let i = 0; i < Math.min(5, nonDecisive.length); i++) {
            const game = nonDecisive[i];
            console.log(`Game ${i + 1}:`);
            console.log(`  Final state: P1=${game.finalRack1} tiles, P2=${game.finalRack2} tiles, Pouch=${game.pouchRemaining}`);
            console.log(`  Total turns: ${game.turns}`);

            // Last 20 moves
            const lastMoves = game.trace.slice(-20);
            const lastDraws = lastMoves.filter(m => m.action === 'draw').length;
            console.log(`  Last 20 moves: ${lastDraws} draws (${(lastDraws/20*100).toFixed(0)}%)`);

            // Check if stuck in draw loop
            const last50Moves = game.trace.slice(-50);
            const last50Draws = last50Moves.filter(m => m.action === 'draw').length;
            console.log(`  Last 50 moves: ${last50Draws} draws (${(last50Draws/50*100).toFixed(0)}%)`);

            // Rack size progression in endgame
            const endgameMoves = game.trace.slice(-100);
            const p1Racks = endgameMoves.filter(m => m.player === 1).map(m => m.rackAfter);
            const p2Racks = endgameMoves.filter(m => m.player === 2).map(m => m.rackAfter);

            if (p1Racks.length > 0) {
                const p1Min = Math.min(...p1Racks);
                const p1Max = Math.max(...p1Racks);
                const p2Min = Math.min(...p2Racks);
                const p2Max = Math.max(...p2Racks);
                console.log(`  Endgame rack range: P1=[${p1Min}-${p1Max}], P2=[${p2Min}-${p2Max}]`);
            }

            // Check if pouch was exhausted
            if (game.pouchRemaining === 0) {
                console.log(`  ⚠️  Pouch exhausted - players stuck with unplayable tiles`);
            }

            console.log();
        }

        // Pattern analysis
        console.log('='.repeat(60));
        console.log('PATTERN ANALYSIS');
        console.log('='.repeat(60));

        let pouchExhausted = 0;
        let smallRacks = 0; // Both players < 10 tiles
        let asymmetric = 0; // One player much smaller rack

        nonDecisive.forEach(game => {
            if (game.pouchRemaining === 0) pouchExhausted++;
            if (game.finalRack1 < 10 && game.finalRack2 < 10) smallRacks++;
            if (Math.abs(game.finalRack1 - game.finalRack2) > 10) asymmetric++;
        });

        console.log(`Pouch exhausted: ${pouchExhausted}/${nonDecisive.length} (${(pouchExhausted/nonDecisive.length*100).toFixed(0)}%)`);
        console.log(`Both players <10 tiles: ${smallRacks}/${nonDecisive.length} (${(smallRacks/nonDecisive.length*100).toFixed(0)}%)`);
        console.log(`Asymmetric endgame: ${asymmetric}/${nonDecisive.length} (${(asymmetric/nonDecisive.length*100).toFixed(0)}%)`);
    }

    // Save detailed trace of one non-decisive game
    if (nonDecisive.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('DETAILED TRACE OF ONE NON-DECISIVE GAME');
        console.log('='.repeat(60));

        const detailedGame = nonDecisive[0];
        console.log(`\nShowing last 100 moves:\n`);

        const last100 = detailedGame.trace.slice(-100);
        last100.forEach((move, i) => {
            const playerStr = `P${move.player}`;
            const actionStr = move.action === 'draw' ? 'DRAW' :
                            move.action === 'totalRebuild' ? 'REBUILD' :
                            move.action === 'multiSetRearrange' ? 'REARRANGE' :
                            `PLAY(${move.tilesPlayed})`;

            const rackStr = `${move.rackBefore}→${move.rackAfter}`;
            console.log(`  Turn ${move.turn} ${playerStr}: ${actionStr.padEnd(12)} Rack:${rackStr.padEnd(8)} Pouch:${move.pouch}`);
        });
    }
}

runExperiments().catch(console.error);
