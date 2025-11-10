import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { ValueAI } from '../src/js/ai/ValueAI.js';

const INITIAL_MELD_REQUIREMENT = 30;

class TracedGame {
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

        this.ai1 = new ValueAI();
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
        console.log(`P1 rack (${this.rack1.length}): ${this.rack1.map(t => `${t.color[0]}${t.number}`).join(', ')}`);
        console.log(`P2 rack (${this.rack2.length}): ${this.rack2.map(t => `${t.color[0]}${t.number}`).join(', ')}`);
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

        if (move.action === 'playMultiple') {
            let totalValue = 0;

            // Play all sets
            for (const set of move.sets) {
                const value = RummikubRules.calculateValue(set);
                totalValue += value;

                // Remove from rack
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
                    }
                } else {
                    const emptyIndex = this.groups.findIndex(g => g.length === 0);
                    if (emptyIndex !== -1) {
                        this.groups[emptyIndex] = set;
                    }
                }

                console.log(`  Set: [${set.map(t => `${t.color[0]}${t.number}`).join(',')}] = ${value} pts`);
            }

            const wasFirstMeld = (player === 1 && !this.melded1) || (player === 2 && !this.melded2);

            if (player === 1) {
                this.melded1 = true;
            } else {
                this.melded2 = true;
            }

            console.log(`  ${wasFirstMeld ? 'FIRST MELD!' : 'Played'} Total: ${totalValue} pts, Rack: ${rackBefore} → ${rack.length}`);

            if (rack.length === 0) {
                this.gameOver = true;
                this.winner = player;
                console.log(`  *** P${player} WINS! ***`);
            }
        } else {
            const tile = this.pouch.pop();
            if (tile) rack.push(tile);
            console.log(`  Drew tile, Rack: ${rackBefore} → ${rack.length}`);
        }
    }

    async play() {
        const maxTurns = 100; // Shorter limit for trace

        // Disable delays
        this.ai1.delay = async () => {};
        this.ai2.delay = async () => {};

        while (!this.gameOver && this.turnCount < maxTurns) {
            this.turnCount++;
            console.log(`\nTurn ${this.turnCount}:`);

            console.log(`P1 (melded=${this.melded1}, rack=${this.rack1.length})`);
            await this.playTurn(1, this.ai1);
            if (this.gameOver) break;

            console.log(`P2 (melded=${this.melded2}, rack=${this.rack2.length})`);
            await this.playTurn(2, this.ai2);
        }

        console.log(`\n=== GAME OVER ===`);
        console.log(`Turns: ${this.turnCount}`);
        console.log(`Winner: ${this.winner ? `P${this.winner}` : 'None (hit limit)'}`);
        console.log(`P1 rack: ${this.rack1.length} tiles`);
        console.log(`P2 rack: ${this.rack2.length} tiles`);
        console.log(`Pouch: ${this.pouch.length} tiles remaining`);
    }
}

const game = new TracedGame();
await game.play();
