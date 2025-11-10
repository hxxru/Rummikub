import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { AdvancedAI } from '../src/js/ai/AdvancedAI.js';
import { ValueAI } from '../src/js/ai/ValueAI.js';

const INITIAL_MELD_REQUIREMENT = 30;

class DetailedGame {
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

        this.ai1 = new AdvancedAI();
        this.ai2 = new ValueAI();

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

        console.log('=== GAME START ===');
        console.log(`AdvancedAI vs ValueAI`);
        console.log(`P1 (AdvancedAI): ${this.rack1.length} tiles`);
        console.log(`P2 (ValueAI): ${this.rack2.length} tiles`);
        console.log(`Pouch: ${this.pouch.length} tiles\n`);
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

        if (move.action === 'complexManipulation') {
            console.log(`  Complex manipulation:`);
            let tilesPlayed = 0;

            for (const op of move.operations) {
                if (op.type === 'modifyRun') {
                    this.runs[op.runIndex] = op.newTiles;
                    console.log(`    Modify run ${op.runIndex}`);
                } else if (op.type === 'modifyGroup') {
                    this.groups[op.groupIndex] = op.newTiles;
                    console.log(`    Modify group ${op.groupIndex}`);
                } else if (op.type === 'splitRun') {
                    this.runs[op.runIndex] = op.left;
                    const emptyIndex = this.runs.findIndex(r => r.length === 0);
                    if (emptyIndex !== -1) {
                        this.runs[emptyIndex] = op.right;
                    }
                    console.log(`    Split run ${op.runIndex}`);
                } else if (op.type === 'playSet') {
                    tilesPlayed += op.set.length;
                    op.set.forEach(tile => {
                        const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                        if (index !== -1) {
                            rack.splice(index, 1);
                        }
                    });

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

                    console.log(`    Play set: [${op.set.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
                }
            }

            if (player === 1) {
                this.melded1 = true;
            } else {
                this.melded2 = true;
            }

            console.log(`  Rack: ${rackBefore} → ${rack.length} (-${tilesPlayed})`);

            if (rack.length === 0) {
                this.gameOver = true;
                this.winner = player;
                console.log(`  *** P${player} WINS! ***`);
            }
        } else if (move.action === 'playMultiple') {
            let totalPlayed = 0;

            if (move.sets) {
                for (const set of move.sets) {
                    totalPlayed += set.length;

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

            if (move.manipulations) {
                for (const manip of move.manipulations) {
                    totalPlayed += manip.tiles.length;

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

            if (player === 1) {
                this.melded1 = true;
            } else {
                this.melded2 = true;
            }

            console.log(`  Played ${totalPlayed} tiles, Rack: ${rackBefore} → ${rack.length}`);

            if (rack.length === 0) {
                this.gameOver = true;
                this.winner = player;
                console.log(`  *** P${player} WINS! ***`);
            }
        } else {
            const tile = this.pouch.pop();
            if (tile) rack.push(tile);
            console.log(`  Drew, Rack: ${rackBefore} → ${rack.length}`);
        }
    }

    async play() {
        const maxTurns = 500;

        this.ai1.delay = async () => {};
        this.ai2.delay = async () => {};

        while (!this.gameOver && this.turnCount < maxTurns) {
            this.turnCount++;

            if (this.turnCount <= 30 || this.turnCount % 50 === 0) {
                console.log(`\nTurn ${this.turnCount}: P1=${this.rack1.length}tiles, P2=${this.rack2.length}tiles, Pouch=${this.pouch.length}`);

                console.log(`P1 (AdvancedAI, melded=${this.melded1})`);
                await this.playTurn(1, this.ai1);
                if (this.gameOver) break;

                console.log(`P2 (ValueAI, melded=${this.melded2})`);
                await this.playTurn(2, this.ai2);
            } else {
                // Silent mode for middle turns
                await this.playTurn(1, this.ai1);
                if (this.gameOver) break;
                await this.playTurn(2, this.ai2);
            }
        }

        console.log(`\n=== GAME OVER ===`);
        console.log(`Turns: ${this.turnCount}`);
        console.log(`Winner: ${this.winner ? `P${this.winner}` : 'None (hit limit)'}`);
        console.log(`P1 rack: ${this.rack1.length} tiles`);
        console.log(`P2 rack: ${this.rack2.length} tiles`);
        console.log(`Pouch: ${this.pouch.length} tiles remaining`);
    }
}

const game = new DetailedGame();
await game.play();
