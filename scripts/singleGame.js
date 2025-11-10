#!/usr/bin/env node

/**
 * Run a single game with verbose logging
 */

import { Tile } from '../src/js/Tile.js';
import { RummikubRules } from '../src/js/RummikubRules.js';
import { RandomAI } from '../src/js/ai/RandomAI.js';
import { GreedyAI } from '../src/js/ai/GreedyAI.js';

class VerboseGame {
    constructor(ai1, ai2) {
        this.ai1 = ai1;
        this.ai2 = ai2;
        this.pouch = this.createAllTiles();
        this.shuffle(this.pouch);

        this.rack1 = [];
        this.rack2 = [];

        for (let i = 0; i < 14; i++) {
            this.rack1.push(this.pouch.pop());
            this.rack2.push(this.pouch.pop());
        }

        this.runs = Array(10).fill(null).map(() => []);
        this.groups = Array(16).fill(null).map(() => []);
        this.melded1 = false;
        this.melded2 = false;
        this.gameOver = false;
        this.winner = null;
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

    createStateView(player) {
        return {
            computerRack: player === 1 ? this.rack1 : this.rack2,
            runs: this.runs,
            groups: this.groups,
            computerHasMelded: player === 1 ? this.melded1 : this.melded2,
            pouch: this.pouch
        };
    }

    async playTurn(player, ai) {
        const stateView = this.createStateView(player);
        const move = await ai.makeMove(stateView);

        if (move.action === 'play') {
            const rack = player === 1 ? this.rack1 : this.rack2;
            move.tiles.forEach(tile => {
                const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                if (index !== -1) {
                    rack.splice(index, 1);
                }
            });

            if (move.targetType === 'run') {
                this.runs[move.targetIndex] = move.tiles;
                this.runs[move.targetIndex].sort((a, b) => a.number - b.number);
            } else {
                this.groups[move.targetIndex] = move.tiles;
            }

            if (player === 1) {
                this.melded1 = true;
            } else {
                this.melded2 = true;
            }

            console.log(`Player ${player} melded! Played ${move.tiles.length} tiles`);

            if (rack.length === 0) {
                this.gameOver = true;
                this.winner = player;
            }

            return true;
        } else {
            this.drawTile(player);
            return false;
        }
    }

    async play() {
        let turnCount = 0;
        const maxTurns = 50; // Lower limit for debugging

        this.ai1.delay = async () => {};
        this.ai2.delay = async () => {};

        console.log('Starting game...');
        console.log(`Player 1 (${this.ai1.name}) rack size: ${this.rack1.length}`);
        console.log(`Player 2 (${this.ai2.name}) rack size: ${this.rack2.length}`);
        console.log(`Pouch size: ${this.pouch.length}`);
        console.log();

        while (!this.gameOver && turnCount < maxTurns) {
            turnCount++;

            const played1 = await this.playTurn(1, this.ai1);
            if (!played1 && turnCount % 10 === 0) {
                console.log(`Turn ${turnCount}: Player 1 drew (rack: ${this.rack1.length}, pouch: ${this.pouch.length})`);
            }
            if (this.gameOver) break;

            const played2 = await this.playTurn(2, this.ai2);
            if (!played2 && turnCount % 10 === 0) {
                console.log(`Turn ${turnCount}: Player 2 drew (rack: ${this.rack2.length}, pouch: ${this.pouch.length})`);
            }
        }

        console.log();
        console.log(`Game ended after ${turnCount} turns`);
        console.log(`Player 1 melded: ${this.melded1}`);
        console.log(`Player 2 melded: ${this.melded2}`);
        console.log(`Winner: ${this.winner || 'none'}`);
        console.log(`Final rack sizes: P1=${this.rack1.length}, P2=${this.rack2.length}`);
        console.log(`Final pouch size: ${this.pouch.length}`);
    }
}

async function main() {
    const ai1 = new RandomAI();
    const ai2 = new GreedyAI();

    const game = new VerboseGame(ai1, ai2);
    await game.play();
}

main().catch(console.error);
