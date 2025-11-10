import { Tile } from './Tile.js';
import { RummikubRules } from './RummikubRules.js';

/**
 * Manages the game state
 */
export class GameState {
    constructor() {
        this.pouch = [];
        this.playerRack = [];
        this.computerRack = [];
        this.table = []; // Array of sets
        this.currentTurn = 'player'; // 'player' or 'computer'
        this.playerHasMelded = false; // Has player made initial 30+ meld?
        this.computerHasMelded = false;
        this.turnStartState = null; // For undo
        this.gameOver = false;
        this.winner = null;

        this.initializeGame();
    }

    /**
     * Create all 106 tiles and shuffle
     */
    initializeGame() {
        this.pouch = this.createAllTiles();
        this.shuffle(this.pouch);

        // Deal 14 tiles to each player
        for (let i = 0; i < 14; i++) {
            this.playerRack.push(this.pouch.pop());
            this.computerRack.push(this.pouch.pop());
        }

        // Sort player's rack
        this.sortRack(this.playerRack);
    }

    /**
     * Create all 106 tiles (2 sets of 1-13 in 4 colors + 2 jokers)
     * For now, without jokers
     */
    createAllTiles() {
        const tiles = [];
        // Use one row per color: 1=black, 2=blue, 3=orange, 4=red
        const rows = ['1', '2', '3', '4'];

        // Create 2 sets of each tile (4 colors × 13 numbers × 2 = 104 tiles)
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

    /**
     * Shuffle array in place
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Sort rack by color then number
     */
    sortRack(rack) {
        const colorOrder = { black: 0, blue: 1, orange: 2, red: 3 };
        rack.sort((a, b) => {
            if (a.color !== b.color) {
                return colorOrder[a.color] - colorOrder[b.color];
            }
            return a.number - b.number;
        });
    }

    /**
     * Draw a tile from the pouch
     */
    drawTile(player = 'player') {
        if (this.pouch.length === 0) return null;

        const tile = this.pouch.pop();
        if (player === 'player') {
            this.playerRack.push(tile);
            this.sortRack(this.playerRack);
        } else {
            this.computerRack.push(tile);
            this.sortRack(this.computerRack);
        }

        return tile;
    }

    /**
     * Save current state for undo
     */
    saveTurnState() {
        this.turnStartState = {
            table: this.table.map(set => [...set]),
            playerRack: [...this.playerRack],
            computerRack: [...this.computerRack],
            pouch: [...this.pouch]
        };
    }

    /**
     * Restore saved state (undo)
     */
    undoTurn() {
        if (!this.turnStartState) return false;

        this.table = this.turnStartState.table.map(set => [...set]);
        this.playerRack = [...this.turnStartState.playerRack];
        this.computerRack = [...this.turnStartState.computerRack];
        this.pouch = [...this.turnStartState.pouch];

        return true;
    }

    /**
     * Validate current table state
     */
    validateTable() {
        // Check each set on table
        for (const set of this.table) {
            if (set.length > 0 && !RummikubRules.isValidSet(set)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if player's move is valid
     */
    validatePlayerMove() {
        // If player hasn't melded yet, check for 30+ initial meld
        if (!this.playerHasMelded) {
            const newSets = this.table.filter(set => set.length > 0);
            if (newSets.length > 0) {
                if (!RummikubRules.isValidInitialMeld(newSets)) {
                    return { valid: false, reason: 'Initial meld must be 30+ points' };
                }
                this.playerHasMelded = true;
            }
        }

        // Validate table state
        if (!this.validateTable()) {
            return { valid: false, reason: 'Invalid sets on table' };
        }

        return { valid: true };
    }

    /**
     * End player turn
     */
    endPlayerTurn(drewCard = false) {
        const validation = this.validatePlayerMove();

        if (!validation.valid) {
            // Invalid move - must draw a card and reset
            if (!drewCard) {
                this.undoTurn();
                this.drawTile('player');
            }
            return { success: false, message: validation.reason };
        }

        // Check win condition
        if (this.playerRack.length === 0) {
            this.gameOver = true;
            this.winner = 'player';
            return { success: true, winner: 'player' };
        }

        // Switch turn
        this.currentTurn = 'computer';
        this.turnStartState = null;

        return { success: true };
    }

    /**
     * Switch to player turn
     */
    startPlayerTurn() {
        this.currentTurn = 'player';
        this.saveTurnState();
    }

    /**
     * Computer AI turn
     */
    async computerTurn() {
        // Simple AI: try to play any valid sets, otherwise draw
        await this.delay(1000); // Simulate thinking

        const possibleSets = RummikubRules.findPossibleSets(this.computerRack);

        if (possibleSets.length > 0 && (this.computerHasMelded || RummikubRules.calculateValue(possibleSets[0]) >= 30)) {
            // Play first valid set
            const setToPlay = possibleSets[0];

            // Remove tiles from rack
            setToPlay.forEach(tile => {
                const index = this.computerRack.findIndex(t => t.id === tile.id);
                if (index !== -1) {
                    this.computerRack.splice(index, 1);
                }
            });

            // Add to table
            this.table.push(setToPlay);
            this.computerHasMelded = true;

            // Check win
            if (this.computerRack.length === 0) {
                this.gameOver = true;
                this.winner = 'computer';
                return { played: true, winner: 'computer' };
            }
        } else {
            // Draw a card
            this.drawTile('computer');
        }

        this.currentTurn = 'player';
        this.startPlayerTurn();

        return { played: possibleSets.length > 0 };
    }

    /**
     * Helper delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get tile by ID from any location
     */
    findTile(tileId) {
        const allTiles = [...this.playerRack, ...this.computerRack, ...this.pouch];
        this.table.forEach(set => allTiles.push(...set));
        return allTiles.find(tile => tile.id === tileId);
    }

    /**
     * Remove tile from rack
     */
    removeTileFromRack(tileId, player = 'player') {
        const rack = player === 'player' ? this.playerRack : this.computerRack;
        const index = rack.findIndex(tile => tile.id === tileId);
        if (index !== -1) {
            return rack.splice(index, 1)[0];
        }
        return null;
    }

    /**
     * Add tile to rack
     */
    addTileToRack(tile, player = 'player') {
        const rack = player === 'player' ? this.playerRack : this.computerRack;
        rack.push(tile);
        this.sortRack(rack);
    }

    /**
     * Get game statistics
     */
    getStats() {
        return {
            playerTileCount: this.playerRack.length,
            computerTileCount: this.computerRack.length,
            pouchCount: this.pouch.length,
            tableSetCount: this.table.filter(set => set.length > 0).length
        };
    }
}
