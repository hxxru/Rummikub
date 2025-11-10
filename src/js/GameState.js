import { Tile } from './Tile.js';
import { RummikubRules } from './RummikubRules.js';

/**
 * Manages the game state
 */
export class GameState {
    constructor(aiPlayer = null) {
        this.pouch = [];
        this.playerRack = [];
        this.computerRack = [];
        this.runs = Array(10).fill(null).map(() => []); // 10 run slots
        this.groups = Array(16).fill(null).map(() => []); // 16 group slots (2x8 layout)
        this.currentTurn = 'player'; // 'player' or 'computer'
        this.playerHasMelded = false; // Has player made initial 30+ meld?
        this.computerHasMelded = false;
        this.turnStartState = null; // For undo
        this.gameOver = false;
        this.winner = null;
        this.aiPlayer = aiPlayer; // AI strategy to use for computer player

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
    sortRack(rack, byNumber = false) {
        const colorOrder = { black: 0, blue: 1, orange: 2, red: 3 };
        if (byNumber) {
            // Sort by number first, then color (good for spotting groups)
            rack.sort((a, b) => {
                if (a.number !== b.number) {
                    return a.number - b.number;
                }
                return colorOrder[a.color] - colorOrder[b.color];
            });
        } else {
            // Sort by color first, then number (good for spotting runs)
            rack.sort((a, b) => {
                if (a.color !== b.color) {
                    return colorOrder[a.color] - colorOrder[b.color];
                }
                return a.number - b.number;
            });
        }
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
            runs: this.runs.map(run => [...run]),
            groups: this.groups.map(group => [...group]),
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

        this.runs = this.turnStartState.runs.map(run => [...run]);
        this.groups = this.turnStartState.groups.map(group => [...group]);
        this.playerRack = [...this.turnStartState.playerRack];
        this.computerRack = [...this.turnStartState.computerRack];
        this.pouch = [...this.turnStartState.pouch];

        return true;
    }

    /**
     * Validate current table state
     */
    validateTable() {
        // Check all runs
        for (const run of this.runs) {
            if (run.length > 0 && !RummikubRules.isValidRun(run)) {
                return false;
            }
        }
        // Check all groups
        for (const group of this.groups) {
            if (group.length > 0 && !RummikubRules.isValidGroup(group)) {
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
            const allSets = [
                ...this.runs.filter(run => run.length > 0),
                ...this.groups.filter(group => group.length > 0)
            ];
            if (allSets.length > 0) {
                if (!RummikubRules.isValidInitialMeld(allSets)) {
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
    endPlayerTurn() {
        const validation = this.validatePlayerMove();

        if (!validation.valid) {
            // Invalid move - must undo and draw
            this.undoTurn();
            this.drawTile('player');
            this.playerDrewThisTurn = true;
            return { success: false, message: validation.reason + ' - Drew a card instead' };
        }

        // Check if player made any changes to the table
        const madeTableChanges = this.hasTableChanged();

        // If no table changes and didn't draw, must draw a card
        if (!madeTableChanges && !this.playerDrewThisTurn) {
            return { success: false, message: 'You must either make a play or draw a card' };
        }

        // Check win condition
        if (this.playerRack.length === 0) {
            this.gameOver = true;
            this.winner = 'player';
            if (this.aiPlayer) {
                this.aiPlayer.recordGame(false); // AI lost
            }
            return { success: true, winner: 'player' };
        }

        // Switch turn
        this.currentTurn = 'computer';
        this.turnStartState = null;

        return { success: true };
    }

    /**
     * Check if table has changed since start of turn
     */
    hasTableChanged() {
        if (!this.turnStartState) return false;

        // Compare current runs with saved runs
        for (let i = 0; i < this.runs.length; i++) {
            if (this.runs[i].length !== this.turnStartState.runs[i].length) return true;
            for (let j = 0; j < this.runs[i].length; j++) {
                if (this.runs[i][j].id !== this.turnStartState.runs[i][j].id) return true;
            }
        }

        // Compare current groups with saved groups
        for (let i = 0; i < this.groups.length; i++) {
            if (this.groups[i].length !== this.turnStartState.groups[i].length) return true;
            for (let j = 0; j < this.groups[i].length; j++) {
                if (this.groups[i][j].id !== this.turnStartState.groups[i][j].id) return true;
            }
        }

        return false;
    }

    /**
     * Switch to player turn
     */
    startPlayerTurn() {
        this.currentTurn = 'player';
        this.playerDrewThisTurn = false; // Track if player drew a card
        this.saveTurnState();
    }

    /**
     * Computer AI turn
     */
    async computerTurn() {
        if (!this.aiPlayer) {
            throw new Error('No AI player configured');
        }

        // Get move from AI strategy
        const move = await this.aiPlayer.makeMove(this);

        let tilesPlayed = 0;

        if (move.action === 'play') {
            // Execute the play move
            const { tiles, targetType, targetIndex } = move;
            tilesPlayed = tiles.length;

            // Remove tiles from rack
            tiles.forEach(tile => {
                const index = this.computerRack.findIndex(t => t.instanceId === tile.instanceId);
                if (index !== -1) {
                    this.computerRack.splice(index, 1);
                }
            });

            // Add to appropriate slot
            if (targetType === 'run') {
                this.runs[targetIndex] = tiles;
                // Auto-sort runs
                this.runs[targetIndex].sort((a, b) => a.number - b.number);
            } else if (targetType === 'group') {
                this.groups[targetIndex] = tiles;
            }

            this.computerHasMelded = true;

            // Check win
            if (this.computerRack.length === 0) {
                this.gameOver = true;
                this.winner = 'computer';
                this.aiPlayer.recordMove(tilesPlayed);
                this.aiPlayer.recordGame(true);
                return { played: true, winner: 'computer' };
            }
        } else if (move.action === 'manipulate') {
            // Execute table manipulation move
            const { manipulationType, targetIndex, tilesToAdd } = move;
            tilesPlayed = tilesToAdd.length;

            // Remove tiles from rack
            tilesToAdd.forEach(tile => {
                const index = this.computerRack.findIndex(t => t.instanceId === tile.instanceId);
                if (index !== -1) {
                    this.computerRack.splice(index, 1);
                }
            });

            // Apply manipulation
            if (manipulationType === 'extendRun') {
                // Add tiles to existing run and re-sort
                this.runs[targetIndex].push(...tilesToAdd);
                this.runs[targetIndex].sort((a, b) => a.number - b.number);
            } else if (manipulationType === 'addToGroup') {
                // Add tiles to existing group
                this.groups[targetIndex].push(...tilesToAdd);
            }

            // Check win
            if (this.computerRack.length === 0) {
                this.gameOver = true;
                this.winner = 'computer';
                this.aiPlayer.recordMove(tilesPlayed);
                this.aiPlayer.recordGame(true);
                return { played: true, winner: 'computer' };
            }
        } else if (move.action === 'draw') {
            // Draw a card
            this.drawTile('computer');
        }

        // Record move stats
        this.aiPlayer.recordMove(tilesPlayed);

        this.currentTurn = 'player';
        this.startPlayerTurn();

        return { played: move.action === 'play' || move.action === 'manipulate' };
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
        const runCount = this.runs.filter(run => run.length > 0).length;
        const groupCount = this.groups.filter(group => group.length > 0).length;
        return {
            playerTileCount: this.playerRack.length,
            computerTileCount: this.computerRack.length,
            pouchCount: this.pouch.length,
            tableSetCount: runCount + groupCount
        };
    }
}
