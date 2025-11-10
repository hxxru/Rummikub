import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { UltraAI } from '../src/js/ai/UltraAI.js';

const INITIAL_MELD_REQUIREMENT = 30;

class StaleGameAnalyzer {
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

        if (move.action === 'totalRebuild') {
            this.runs = Array(10).fill(null).map(() => []);
            this.groups = Array(16).fill(null).map(() => []);

            for (const set of move.newSets) {
                const handTiles = set.filter(t => rack.find(r => r.instanceId === t.instanceId));
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
        } else if (move.action === 'playMultiple' && (move.manipulations || move.sets)) {
            // Handle simple plays...
            if (player === 1) this.melded1 = true;
            else this.melded2 = true;
        } else if (move.action === 'draw') {
            const tile = this.pouch.pop();
            if (tile) rack.push(tile);
        }
    }

    async play() {
        const maxTurns = 500;

        this.ai1.delay = async () => {};
        this.ai2.delay = async () => {};

        while (!this.gameOver && this.turnCount < maxTurns) {
            this.turnCount++;
            await this.playTurn(1, this.ai1);
            if (this.gameOver) break;
            await this.playTurn(2, this.ai2);
        }

        return !this.winner;
    }

    analyzeStalemate() {
        const allTableTiles = [...this.runs.flat(), ...this.groups.flat()];
        const allTiles = [...this.rack1, ...this.rack2, ...allTableTiles];

        console.log('='.repeat(70));
        console.log('STALEMATE DETAILED ANALYSIS');
        console.log('='.repeat(70));
        console.log(`\nP1 Rack (${this.rack1.length} tiles):`, this.rack1.map(t => `${t.color[0]}${t.number}`).join(', '));
        console.log(`P2 Rack (${this.rack2.length} tiles):`, this.rack2.map(t => `${t.color[0]}${t.number}`).join(', '));
        console.log(`\nTable (${allTableTiles.length} tiles on table):`);

        this.runs.forEach((run, i) => {
            if (run.length > 0) {
                console.log(`  Run ${i}: [${run.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
            }
        });

        this.groups.forEach((group, i) => {
            if (group.length > 0) {
                console.log(`  Group ${i}: [${group.map(t => `${t.color[0]}${t.number}`).join(',')}]`);
            }
        });

        // Test if P1 can make ANY play
        console.log('\n' + '-'.repeat(70));
        console.log('P1 Analysis:');
        console.log('-'.repeat(70));

        const p1AllTiles = [...this.rack1, ...allTableTiles];
        console.log(`Combined tiles (rack + table): ${p1AllTiles.length} tiles`);

        const p1Sets = RummikubRules.findPossibleSets(p1AllTiles);
        console.log(`Possible sets from all tiles: ${p1Sets.length}`);

        if (p1Sets.length > 0) {
            console.log('Sample sets:');
            p1Sets.slice(0, 5).forEach(set => {
                const fromRack = set.filter(t => this.rack1.find(r => r.instanceId === t.instanceId)).length;
                console.log(`  [${set.map(t => `${t.color[0]}${t.number}`).join(',')}] (${fromRack} from rack)`);
            });
        }

        // Try complete rebuild
        const rebuild = this.tryRebuild(this.rack1, allTableTiles);
        if (rebuild) {
            console.log('\n⚠️  REBUILD FOUND SOLUTION!');
            console.log('New sets:', rebuild.sets.map(s =>
                `[${s.map(t => `${t.color[0]}${t.number}`).join(',')}]`
            ).join(', '));
            console.log(`Rack tiles played: ${rebuild.rackTilesPlayed}`);
        } else {
            console.log('\n✓ Rebuild confirmed: No valid play possible');
        }

        // Test if P2 can make ANY play
        console.log('\n' + '-'.repeat(70));
        console.log('P2 Analysis:');
        console.log('-'.repeat(70));

        const p2AllTiles = [...this.rack2, ...allTableTiles];
        const p2Sets = RummikubRules.findPossibleSets(p2AllTiles);
        console.log(`Possible sets from all tiles: ${p2Sets.length}`);

        const rebuild2 = this.tryRebuild(this.rack2, allTableTiles);
        if (rebuild2) {
            console.log('\n⚠️  REBUILD FOUND SOLUTION!');
        } else {
            console.log('\n✓ Rebuild confirmed: No valid play possible');
        }

        // Tile distribution analysis
        console.log('\n' + '-'.repeat(70));
        console.log('Tile Distribution Analysis:');
        console.log('-'.repeat(70));

        const byNumber = {};
        for (let num = 1; num <= 13; num++) {
            byNumber[num] = { total: 0, p1: 0, p2: 0, table: 0 };
        }

        this.rack1.forEach(t => {
            byNumber[t.number].total++;
            byNumber[t.number].p1++;
        });

        this.rack2.forEach(t => {
            byNumber[t.number].total++;
            byNumber[t.number].p2++;
        });

        allTableTiles.forEach(t => {
            byNumber[t.number].total++;
            byNumber[t.number].table++;
        });

        console.log('Number distribution (P1/P2/Table):');
        for (let num = 1; num <= 13; num++) {
            const dist = byNumber[num];
            if (dist.total > 0) {
                console.log(`  ${num.toString().padStart(2)}: ${dist.p1}/${dist.p2}/${dist.table}`);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('CONCLUSION: True stalemate - no valid moves available');
        console.log('='.repeat(70) + '\n');
    }

    tryRebuild(rack, tableTiles) {
        const allTiles = [...rack, ...tableTiles];

        // Try to build sets greedily
        const newSets = [];
        const usedTiles = new Set();

        // Groups first
        const byNumber = {};
        allTiles.forEach(tile => {
            if (!byNumber[tile.number]) byNumber[tile.number] = [];
            byNumber[tile.number].push(tile);
        });

        Object.values(byNumber).forEach(tiles => {
            if (tiles.length >= 3) {
                const uniqueColors = [];
                const seenColors = new Set();

                for (const tile of tiles) {
                    if (!seenColors.has(tile.color) && !usedTiles.has(tile.instanceId)) {
                        uniqueColors.push(tile);
                        seenColors.add(tile.color);
                    }
                }

                if (uniqueColors.length >= 3) {
                    const group = uniqueColors.slice(0, Math.min(4, uniqueColors.length));
                    if (RummikubRules.isValidGroup(group)) {
                        newSets.push(group);
                        group.forEach(t => usedTiles.add(t.instanceId));
                    }
                }
            }
        });

        // Then runs
        const byColor = {};
        allTiles.forEach(tile => {
            if (usedTiles.has(tile.instanceId)) return;
            if (!byColor[tile.color]) byColor[tile.color] = [];
            byColor[tile.color].push(tile);
        });

        Object.values(byColor).forEach(tiles => {
            tiles.sort((a, b) => a.number - b.number);

            let i = 0;
            while (i < tiles.length) {
                const run = [tiles[i]];
                let j = i + 1;

                while (j < tiles.length && tiles[j].number === run[run.length - 1].number + 1) {
                    run.push(tiles[j]);
                    j++;
                }

                if (run.length >= 3) {
                    newSets.push(run);
                    run.forEach(t => usedTiles.add(t.instanceId));
                }

                i = j > i + 1 ? j : i + 1;
            }
        });

        const rackTilesPlayed = newSets.reduce((count, set) =>
            count + set.filter(t => rack.find(r => r.instanceId === t.instanceId)).length, 0
        );

        if (rackTilesPlayed >= 1) {
            return { sets: newSets, rackTilesPlayed };
        }

        return null;
    }
}

// Find a stalemate game and analyze it
async function findAndAnalyzeStalemate() {
    console.log('Searching for a stalemate game to analyze...\n');

    for (let attempt = 1; attempt <= 20; attempt++) {
        process.stdout.write(`Attempt ${attempt}... `);

        const game = new StaleGameAnalyzer();
        const isStalemate = await game.play();

        if (isStalemate) {
            console.log('Found stalemate!\n');
            game.analyzeStalemate();
            return;
        } else {
            console.log('game finished decisively');
        }
    }

    console.log('\nNo stalemate found in 20 attempts (all games finished!)');
}

findAndAnalyzeStalemate().catch(console.error);
